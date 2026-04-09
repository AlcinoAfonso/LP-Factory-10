--- a/supabase/rollbacks/20260409__e10_5_2_base_bd.rollback.sql
+++ b/supabase/rollbacks/20260409__e10_5_2_base_bd.rollback.sql
@@
+-- E10.5.2 — rollback da etapa "Criar a base do BD"
+-- Escopo: remove apenas as 8 tabelas criadas nesta etapa.
+-- Regra: sem CASCADE para evitar apagar dependências de etapas posteriores.
+
 BEGIN;
 
-DROP TABLE IF EXISTS public.taxon_message_guides CASCADE;
-DROP TABLE IF EXISTS public.taxon_market_research_items CASCADE;
-DROP TABLE IF EXISTS public.taxon_market_research CASCADE;
-DROP TABLE IF EXISTS public.content_template_taxons CASCADE;
-DROP TABLE IF EXISTS public.content_templates CASCADE;
-DROP TABLE IF EXISTS public.account_taxonomy CASCADE;
-DROP TABLE IF EXISTS public.business_taxon_aliases CASCADE;
-DROP TABLE IF EXISTS public.business_taxons CASCADE;
+DROP TABLE IF EXISTS public.taxon_message_guides;
+DROP TABLE IF EXISTS public.taxon_market_research_items;
+DROP TABLE IF EXISTS public.taxon_market_research;
+DROP TABLE IF EXISTS public.content_template_taxons;
+DROP TABLE IF EXISTS public.content_templates;
+DROP TABLE IF EXISTS public.account_taxonomy;
+DROP TABLE IF EXISTS public.business_taxon_aliases;
+DROP TABLE IF EXISTS public.business_taxons;
 
 COMMIT;
