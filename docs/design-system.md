# Design System — LP Factory (Caso 6.4)

## Status da identidade visual
A identidade visual da LP Factory está consolidada nesta fase de forma **leve, aditiva e de baixo risco**, com foco em remapeamento semântico e aplicação nas superfícies compartilhadas centrais (header, menus e área admin).

## Status do asset oficial de logo
Até esta entrega, **não há asset oficial de logo evidenciado no repositório**.

## Uso provisório de marca
Enquanto o asset oficial não estiver versionado no repo, o produto utiliza **wordmark textual temporário**: `LP Factory`.

> Observação: esse wordmark textual é apenas provisório e **não substitui** a logo oficial definida fora do repositório.

## Paleta LP Factory (ativa nesta fase)
Baseada nos tokens já existentes em `tailwind.config.ts`:

- `brand.50`, `brand.500`, `brand.600`, `brand.700`, `brand.dark.800`, `brand.dark.900`
- `ink.800`, `ink.900`
- `graytech.200`, `graytech.300`, `graytech.500`, `graytech.600`
- `surface.base`, `surface.app`, `surface.border`
- `state.success`, `state.warning`, `state.error`

## Tipografia global
A tipografia global do dashboard permanece **Inter** (já aplicada globalmente no app).

## Tokens semânticos usados nesta fase
Remapeamento contido em `app/globals.css`, priorizando:

- `--primary`
- `--ring`
- `--border`
- `--accent`

Sem redesign amplo de `--background`, `--foreground` e `--card`.

## Regras básicas de uso (fase atual)
- Priorizar tokens semânticos (`primary`, `accent`, `border`, `ring`) em vez de cores hardcoded.
- Preservar comportamento e acessibilidade das superfícies existentes.
- Evitar expansão de escopo para telas de auth nesta fase.
- Não criar branding por cliente/multi-tenant nesta camada base.
