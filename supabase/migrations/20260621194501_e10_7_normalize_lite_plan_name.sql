begin;

update public.plans
set name = 'Lite'
where name = 'Light';

commit;
