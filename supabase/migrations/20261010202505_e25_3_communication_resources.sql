-- PB1: additive catalog and dedicated private image bucket. No account content rewrite.
begin;
create table public.communication_base_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  category text not null check (category in ('business','materials','intelligence')),
  format text not null check (format in ('text','items','faq','material_items')),
  label text not null check (length(btrim(label)) between 1 and 120),
  sort_order integer not null check (sort_order > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint communication_section_format_category check (
    (category = 'materials' and format = 'material_items') or
    (category in ('business','intelligence') and format in ('text','items','faq'))
  )
);
alter table public.communication_base_sections enable row level security;
revoke all on public.communication_base_sections from public, anon, authenticated, ai_readonly, service_role;
grant select, insert on public.communication_base_sections to service_role;
grant update (label,sort_order) on public.communication_base_sections to service_role;

insert into public.communication_base_sections(section_key,category,format,label,sort_order) values
('business_name','business','text','Identificação e dados do negócio',1),
('business_context','business','text','Atuação',2),
('offers','business','items','Ofertas',3),
('service','business','text','Atendimento, horários, contatos e agendamento',4),
('proof','business','items','Provas, credenciais e resultados',5),
('materials','business','items','Materiais e identidade',6),
('preferences','business','text','Preferências e limites',7),
('about','intelligence','text','Quem somos',1),
('audience','intelligence','text','Público e contexto',2),
('market_insights','intelligence','items','Dores, desejos, crenças e objeções',3),
('value_proposition','intelligence','text','Proposta de valor',4),
('benefits','intelligence','items','Benefícios',5),
('differentiators','intelligence','items','Diferenciais',6),
('faq','intelligence','faq','Perguntas frequentes',7),
('visual_identity','materials','material_items','Identidade visual',1),
('media_library','materials','material_items','Fotos, vídeos e áudios',2),
('testimonials','materials','material_items','Depoimentos e provas sociais',3);

create function public.touch_communication_base_section() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := clock_timestamp(); return new; end;
$$;
revoke all on function public.touch_communication_base_section() from public,anon,authenticated,ai_readonly;
create trigger communication_base_section_updated before update on public.communication_base_sections
for each row execute function public.touch_communication_base_section();

-- Serializes global reorders; stale drafts must refresh instead of overwriting a newer label/order.
create function public.save_communication_base_section(
  p_id uuid, p_category text, p_label text, p_position integer, p_expected_updated_at timestamptz
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid; v_count integer; v_old public.communication_base_sections%rowtype;
begin
  if p_category not in ('business','materials','intelligence') or p_category is null
    or p_label is null or length(btrim(p_label)) not between 1 and 120 or p_position is null then
    raise exception 'Invalid section' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(253,1);
  select count(*) into v_count from public.communication_base_sections where category=p_category;
  if p_id is null then
    if (select count(*) from public.communication_base_sections) >= 150 or p_position < 1 or p_position > v_count+1 then
      raise exception 'Invalid section position or limit' using errcode='22023';
    end if;
    v_id:=gen_random_uuid();
    update public.communication_base_sections set sort_order=sort_order+1 where category=p_category and sort_order>=p_position;
    insert into public.communication_base_sections(id,section_key,category,format,label,sort_order)
      values(v_id,'custom_'||replace(v_id::text,'-',''),p_category,
        case when p_category='materials' then 'material_items' else 'text' end,btrim(p_label),p_position);
  else
    select * into v_old from public.communication_base_sections where id=p_id;
    if not found or v_old.category<>p_category or p_expected_updated_at is null or v_old.updated_at<>p_expected_updated_at then
      perform public.raise_postgrest_safe_conflict_v1('Section changed');
    end if;
    if p_position < 1 or p_position > v_count then raise exception 'Invalid position' using errcode='22023'; end if;
    update public.communication_base_sections set sort_order=sort_order+
      case when p_position<v_old.sort_order then 1 else -1 end
      where category=p_category and id<>p_id and (
        (p_position<v_old.sort_order and sort_order>=p_position and sort_order<v_old.sort_order) or
        (p_position>v_old.sort_order and sort_order>v_old.sort_order and sort_order<=p_position));
    update public.communication_base_sections set label=btrim(p_label),sort_order=p_position where id=p_id;
    v_id:=p_id;
  end if;
  return v_id;
end;
$$;
revoke all on function public.save_communication_base_section(uuid,text,text,integer,timestamptz) from public,anon,authenticated,ai_readonly;
grant execute on function public.save_communication_base_section(uuid,text,text,integer,timestamptz) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('communication-base-assets','communication-base-assets',false,4194304,array['image/png','image/jpeg','image/webp']);
-- No Storage policy for clients: all reads/uploads are authorized server-side per account/item.
commit;
