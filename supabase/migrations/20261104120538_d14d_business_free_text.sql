-- D14D: only 1.3, 1.5 and 1.6 change from items to text.
-- Authorized disposable fixture: QA E10.9 PB1 20260921 / offers.
-- Inventory: ["Manutenção periódica de jardins","Poda leve e limpeza de canteiros"].
-- The complete stored section has MD5 0272e7ea509dd871d9957491431ed1ca.
-- Abort on any new or changed incompatible content; never convert or backfill.
begin;
lock table public.communication_base_sections, public.account_communication_bases in share row exclusive mode;

do $$
begin
  if (select count(*) from public.communication_base_sections
      where section_key in ('offers','proof','materials') and category='business'
        and format in ('items','text')) <> 3 then
    raise exception 'D14D catalog differs from the reviewed inventory';
  end if;
  if exists (
    select 1 from public.account_communication_bases b
    cross join lateral jsonb_each(b.sections_json) s(key, value)
    where s.key in ('offers','proof','materials')
      and not (s.value->>'format' is not distinct from 'text'
        and jsonb_typeof(s.value->'value') is not distinct from 'string')
      and not (b.account_id='a041aa68-02b3-443b-bd12-9ab96109a3ff'::uuid
        and s.key='offers' and md5(s.value::text)='0272e7ea509dd871d9957491431ed1ca')
  ) then
    raise exception 'D14D incompatible content differs from the authorized QA inventory';
  end if;
end;
$$;

update public.account_communication_bases
set sections_json=sections_json-'offers', version=version+1, updated_at=clock_timestamp()
where account_id='a041aa68-02b3-443b-bd12-9ab96109a3ff'::uuid
  and md5((sections_json->'offers')::text)='0272e7ea509dd871d9957491431ed1ca';

update public.communication_base_sections set format='text'
where section_key in ('offers','proof','materials') and category='business' and format='items';
commit;
