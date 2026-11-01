-- D14D Rodada 3: only the two superseded initial titles. Preserve Admin custom
-- labels, identity/category/format/order, and all customer content.
begin;
select pg_advisory_xact_lock(253, 1);
update public.communication_base_sections
set label = case section_key
  when 'business_name' then 'Identificação do negócio'
  when 'materials' then 'Referências institucionais'
end
where (section_key = 'business_name' and label = 'Identificação e dados do negócio')
   or (section_key = 'materials' and label = 'Materiais e identidade');
commit;
