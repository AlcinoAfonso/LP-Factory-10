CREATE INDEX IF NOT EXISTS accounts_name_gin_idx ON public.accounts USING gin (to_tsvector('portuguese', name));
