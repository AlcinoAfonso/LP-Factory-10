with checks as (
  select
    'stripe_webhook_events_exists'::text as check_name,
    case
      when to_regclass('public.stripe_webhook_events') is not null then 'ok'
      else 'missing'
    end as check_status,
    jsonb_build_object(
      'regclass',
      to_regclass('public.stripe_webhook_events')::text
    ) as details

  union all

  select
    'stripe_webhook_events_duplicate_blocked',
    case
      when exists (
        select 1
        from pg_constraint
        where conrelid = 'public.stripe_webhook_events'::regclass
          and conname = 'stripe_webhook_events_event_id_uidx'
          and contype = 'u'
      ) then 'ok'
      else 'missing'
    end,
    jsonb_build_object('constraint', 'stripe_webhook_events_event_id_uidx')

  union all

  select
    'stripe_webhook_events_rls_enabled',
    case
      when exists (
        select 1
        from pg_class
        join pg_namespace on pg_namespace.oid = pg_class.relnamespace
        where pg_namespace.nspname = 'public'
          and pg_class.relname = 'stripe_webhook_events'
          and pg_class.relrowsecurity = true
      ) then 'ok'
      else 'missing'
    end,
    jsonb_build_object('table', 'public.stripe_webhook_events')

  union all

  select
    'stripe_webhook_events_not_granted_to_anon_or_authenticated',
    case
      when not exists (
        select 1
        from information_schema.role_table_grants
        where table_schema = 'public'
          and table_name = 'stripe_webhook_events'
          and grantee in ('anon', 'authenticated')
      ) then 'ok'
      else 'unexpected_grant'
    end,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('grantee', grantee, 'privilege', privilege_type)
          order by grantee, privilege_type
        )
        from information_schema.role_table_grants
        where table_schema = 'public'
          and table_name = 'stripe_webhook_events'
          and grantee in ('anon', 'authenticated')
      ),
      '[]'::jsonb
    )

  union all

  select
    'stripe_invoice_paid_event_registered',
    case
      when exists (
        select 1
        from public.stripe_webhook_events
        where provider = 'stripe'
          and event_type = 'invoice.paid'
      ) then 'ok'
      else 'no_rows_yet'
    end,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'event_id', event_id,
            'processing_status', processing_status,
            'account_id', account_id,
            'external_reference', external_reference,
            'entitlement_id', entitlement_id
          )
          order by received_at desc
        )
        from (
          select event_id, processing_status, account_id, external_reference, entitlement_id, received_at
          from public.stripe_webhook_events
          where provider = 'stripe'
            and event_type = 'invoice.paid'
          order by received_at desc
          limit 10
        ) recent_invoice_paid
      ),
      '[]'::jsonb
    )

  union all

  select
    'stripe_invoice_paid_entitlement_created_or_updated',
    case
      when exists (
        select 1
        from public.account_commercial_entitlements
        where origin = 'plano_pago_confirmado'
          and status = 'ativo'
          and external_provider = 'stripe'
          and external_reference is not null
          and idempotency_key is not null
      ) then 'ok'
      else 'no_rows_yet'
    end,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'account_id', account_id,
            'plan_key', plan_key,
            'origin', origin,
            'status', status,
            'external_provider', external_provider,
            'external_reference_present', external_reference is not null,
            'idempotency_key_present', idempotency_key is not null,
            'metadata_keys', (
              select jsonb_agg(key order by key)
              from jsonb_object_keys(metadata_json) as key
            )
          )
          order by updated_at desc
        )
        from (
          select *
          from public.account_commercial_entitlements
          where origin = 'plano_pago_confirmado'
            and external_provider = 'stripe'
          order by updated_at desc
          limit 10
        ) recent_entitlements
      ),
      '[]'::jsonb
    )

  union all

  select
    'checkout_session_completed_does_not_create_entitlement',
    case
      when not exists (
        select 1
        from public.stripe_webhook_events events
        join public.account_commercial_entitlements entitlements
          on entitlements.idempotency_key = events.event_id
        where events.provider = 'stripe'
          and events.event_type = 'checkout.session.completed'
      ) then 'ok'
      else 'unexpected_entitlement'
    end,
    jsonb_build_object('rule', 'checkout.session.completed is ignored')

  union all

  select
    'redirect_success_does_not_create_entitlement',
    case
      when not exists (
        select 1
        from public.account_commercial_entitlements
        where external_provider = 'stripe'
          and (
            metadata_json ? 'checkout_success'
            or metadata_json ? 'checkout_redirect'
            or idempotency_key ilike '%checkout%success%'
          )
      ) then 'ok'
      else 'unexpected_redirect_entitlement'
    end,
    jsonb_build_object('rule', 'only webhook invoice.paid can persist entitlement')

  union all

  select
    'payload_raw_not_persisted',
    case
      when not exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name in ('stripe_webhook_events', 'account_commercial_entitlements')
          and (
            column_name ilike '%payload%'
            or column_name ilike '%raw%'
            or column_name ilike '%body%'
            or column_name ilike '%card%'
            or column_name ilike '%secret%'
          )
      ) then 'ok'
      else 'unexpected_column'
    end,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('table', table_name, 'column', column_name)
          order by table_name, column_name
        )
        from information_schema.columns
        where table_schema = 'public'
          and table_name in ('stripe_webhook_events', 'account_commercial_entitlements')
          and (
            column_name ilike '%payload%'
            or column_name ilike '%raw%'
            or column_name ilike '%body%'
            or column_name ilike '%card%'
            or column_name ilike '%secret%'
          )
      ),
      '[]'::jsonb
    )
)
select check_name, check_status, details
from checks
order by check_name
