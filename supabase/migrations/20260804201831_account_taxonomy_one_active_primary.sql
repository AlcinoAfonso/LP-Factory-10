do $$
declare
  duplicate_account_count bigint;
begin
  select count(*)
  into duplicate_account_count
  from (
    select account_id
    from public.account_taxonomy
    where is_primary = true
      and status = 'active'
    group by account_id
    having count(*) > 1
  ) duplicate_accounts;

  if duplicate_account_count > 0 then
    raise exception using
      errcode = '23505',
      message = format(
        'account_taxonomy has %s account(s) with more than one active primary link',
        duplicate_account_count
      ),
      detail = 'The account_taxonomy_one_active_primary_idx index was not created.',
      hint = 'Resolve the duplicate active primary links before applying this migration again.';
  end if;
end;
$$;

create unique index account_taxonomy_one_active_primary_idx
  on public.account_taxonomy (account_id)
  where is_primary = true
    and status = 'active';
