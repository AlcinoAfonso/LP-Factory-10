# Pipeline de Plano Base

## 1. Roteamento

- `Light` → `$lp-factory-executar-plano`
- `Complexa` → `$lp-factory-conduzir-plano-completo`
- `Semiautomático` → Estrategista Original
- `Autônomo` → `$lp-factory-estrategista-autonomo`

Execução e supervisão são eixos independentes.

## 2. Limite

O Pipeline apenas roteia. As demais regras pertencem aos contratos competentes.
