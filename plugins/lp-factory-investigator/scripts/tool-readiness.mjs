#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const SECRET_STATUS = {
  PRESENT: "presente",
  MISSING: "ausente",
  INVALID_FORMAT: "valor com formato invalido",
  EXPECTED_FORMAT: "valor com formato esperado",
};

const checks = [
  {
    platform: "GitHub",
    kind: "cli",
    name: "gh",
    command: ["gh", "--version"],
    purpose: "ler PRs, branches, checks, Actions e arquivos quando autenticado",
  },
  {
    platform: "Vercel",
    kind: "cli",
    name: "vercel",
    command: ["vercel", "--version"],
    purpose: "ler projetos, deployments, env vars e logs quando autenticado",
  },
  {
    platform: "OpenAI",
    kind: "env",
    name: "OPENAI_API_KEY",
    purpose: "executar probes nao destrutivos contra APIs OpenAI autorizadas",
    validate(value) {
      return value.startsWith("sk-proj-") || value.startsWith("sk-");
    },
  },
  {
    platform: "OpenAI",
    kind: "env",
    name: "OPENAI_NICHE_RESOLVER_MODEL",
    purpose: "validar o modelo configurado no fluxo de resolucao de nicho",
    validate(value) {
      return /^[a-z0-9][a-z0-9._-]*$/i.test(value);
    },
  },
  {
    platform: "Supabase",
    kind: "env",
    name: "SUPABASE_DB_URL_READONLY",
    purpose: "executar SQL read-only para schema, RPCs, grants e dados minimos",
    validate(value) {
      return /^postgres(ql)?:\/\//i.test(value);
    },
  },
  {
    platform: "Supabase",
    kind: "env",
    name: "NEXT_PUBLIC_SUPABASE_URL",
    purpose: "comparar configuracao publica do app com o ambiente investigado",
    validate(value) {
      return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(value);
    },
  },
  {
    platform: "Vercel",
    kind: "env",
    name: "VERCEL_TOKEN",
    purpose: "permitir leitura via API quando conector/CLI estiver autenticado",
    validate(value) {
      return value.trim().length >= 20;
    },
  },
];

function cliStatus(command) {
  const [bin, ...args] = command;
  const result = spawnSync(bin, args, {
    encoding: "utf8",
    windowsHide: true,
    timeout: 10_000,
  });

  if (result.error) {
    return {
      status: "nao verificavel",
      detail: result.error.code === "ENOENT" ? "CLI ausente no PATH" : "falha ao executar CLI",
    };
  }

  if (result.status !== 0) {
    return {
      status: "nao verificavel",
      detail: `CLI retornou codigo ${result.status}`,
    };
  }

  return {
    status: "disponivel",
    detail: "CLI encontrada",
  };
}

function envStatus(check) {
  const value = process.env[check.name];

  if (typeof value !== "string" || value.trim() === "") {
    return {
      status: SECRET_STATUS.MISSING,
      detail: "variavel nao encontrada no ambiente local",
    };
  }

  if (check.validate && !check.validate(value.trim())) {
    return {
      status: SECRET_STATUS.INVALID_FORMAT,
      detail: "valor nao exibido",
    };
  }

  return {
    status: SECRET_STATUS.EXPECTED_FORMAT,
    detail: "valor nao exibido",
  };
}

const report = checks.map((check) => {
  const result = check.kind === "cli" ? cliStatus(check.command) : envStatus(check);

  return {
    platform: check.platform,
    name: check.name,
    kind: check.kind,
    status: result.status,
    detail: result.detail,
    purpose: check.purpose,
  };
});

const blockers = report.filter((item) => item.status === "ausente" || item.status === "nao verificavel");

console.log(
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      mode: "read-only",
      secretsPolicy: "valores de secrets nao sao exibidos",
      summary: {
        total: report.length,
        blockers: blockers.length,
      },
      checks: report,
    },
    null,
    2,
  ),
);
