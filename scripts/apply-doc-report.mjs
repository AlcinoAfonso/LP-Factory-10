// scripts/apply-doc-report.mjs
// Executor v1: aplica reports JSON (Actions-ready) em arquivos .md do repo.
// Suporta ops: replace_section, insert_after_section, insert_after_heading.
// Regras: fail-fast (âncora ausente, alvo ausente, match ambíguo, seção já existe em insert).

import fs from "node:fs/promises";
import path from "node:path";

function die(msg) {
  console.error(`\n[doc-agent] ERROR: ${msg}\n`);
  process.exit(1);
}

function warn(msg) {
  console.warn(`[doc-agent] WARN: ${msg}`);
}

function ok(msg) {
  console.log(`[doc-agent] ${msg}`);
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeNewlines(s) {
  // manter como está; apenas garantir \n finais quando necessário
  return s.replace(/\r\n/g, "\n");
}

function ensureEndsWithNewline(s) {
  return s.endsWith("\n") ? s : s + "\n";
}

function toPosix(p) {
  return p.split(path.sep).join("/");
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function parseSectionIdFromContentBlock(content) {
  // primeira linha deve começar com "X.Y..." (ex: "3.4.1 Workflows ...")
  const firstLine = content.split("\n")[0] ?? "";
  const m = firstLine.match(/^\s*(\d+(?:\.\d+)*)\b/);
  return m?.[1] ?? null;
}

function sectionStartRegex(sectionId) {
  // início de linha + sectionId + boundary (evita 3.1 casar com 3.10)
  return new RegExp(`^\\s*${escapeRegExp(sectionId)}\\b`, "m");
}

function anySectionLineRegex() {
  // linha iniciando com numeração tipo 1, 1.2, 3.4.1 etc.
  return /^\s*\d+(?:\.\d+)*\b/m;
}

function splitLinesKeepEOL(text) {
  // preserva quebras de linha no final de cada linha
  // (para facilitar recomposição sem reformatar)
  const lines = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\n") {
      lines.push(text.slice(start, i + 1));
      start = i + 1;
    }
  }
  if (start < text.length) lines.push(text.slice(start));
  return lines;
}

function findAllMatches(lines, regex) {
  const idxs = [];
  for (let i = 0; i < lines.length; i++) {
    if (regex.test(lines[i])) idxs.push(i);
  }
  return idxs;
}

function sectionLevel(sectionId) {
  return sectionId.split(".").length;
}

function findSectionRange(lines, sectionId) {
  // retorna {startIdx, endIdxExclusive} do bloco da seção (inclui subseções)
  const startRe = sectionStartRegex(sectionId);
  const startMatches = findAllMatches(lines, startRe);

  if (startMatches.length === 0) return null;
  if (startMatches.length > 1) {
    return { error: `Match ambíguo para seção ${sectionId} (encontrei ${startMatches.length}).` };
  }

  const startIdx = startMatches[0];
  const targetLevel = sectionLevel(sectionId);

  // procurar o próximo heading numérico com nível <= targetLevel e diferente da própria seção
  let endIdxExclusive = lines.length;

  for (let i = startIdx + 1; i < lines.length; i++) {
    const m = lines[i].match(/^\s*(\d+(?:\.\d+)*)\b/);
    if (!m) continue;

    const foundId = m[1];
    if (foundId === sectionId) continue;

    const foundLevel = sectionLevel(foundId);

    if (foundLevel <= targetLevel) {
      endIdxExclusive = i;
      break;
    }
  }

  return { startIdx, endIdxExclusive };
}

function insertAt(lines, index, content) {
  const block = ensureEndsWithNewline(normalizeNewlines(content));
  const blockLines = splitLinesKeepEOL(block);
  return [...lines.slice(0, index), ...blockLines, ...lines.slice(index)];
}

function replaceRange(lines, startIdx, endIdxExclusive, content) {
  const block = ensureEndsWithNewline(normalizeNewlines(content));
  const blockLines = splitLinesKeepEOL(block);
  return [...lines.slice(0, startIdx), ...blockLines, ...lines.slice(endIdxExclusive)];
}

function findHeadingLineIndex(lines, heading) {
  // heading literal deve aparecer no início da linha (padrão do seu docs/base-tecnica.md: "8. Changelog")
  const re = new RegExp(`^\\s*${escapeRegExp(heading)}\\b`, "m");
  const matches = findAllMatches(lines, re);
  if (matches.length === 0) return null;
  if (matches.length > 1) {
    return { error: `Match ambíguo para heading "${heading}" (encontrei ${matches.length}).` };
  }
  return { index: matches[0] };
}

function validateReportShape(report) {
  if (!report || typeof report !== "object") die("Report JSON inválido (não é objeto).");
  if (!report.meta || typeof report.meta !== "object") die("Report sem meta.");
  if (!Array.isArray(report.ops)) die("Report sem ops (array).");
  if (!report.meta.target_doc || typeof report.meta.target_doc !== "string") {
    die("meta.target_doc ausente (ex: docs/base-tecnica.md).");
  }

  // default rules (fail-fast por padrão)
  const rules = report.rules && typeof report.rules === "object" ? report.rules : {};
  return {
    fail_if_anchor_missing: rules.fail_if_anchor_missing !== false,
    fail_if_target_missing: rules.fail_if_target_missing !== false,
    fail_if_section_already_exists_on_insert: rules.fail_if_section_already_exists_on_insert !== false,
    fail_if_ambiguous_match: rules.fail_if_ambiguous_match !== false,
    no_renumber: rules.no_renumber !== false,
    no_reformat: rules.no_reformat !== false,
    no_out_of_scope_changes: rules.no_out_of_scope_changes !== false,
  };
}

async function main() {
  const reportPathArg = process.argv[2];
  if (!reportPathArg) die("Uso: node scripts/apply-doc-report.mjs <reports/arquivo.json>");

  const reportPath = toPosix(reportPathArg);
  if (!(await fileExists(reportPath))) die(`Report não encontrado: ${reportPath}`);

  const raw = await fs.readFile(reportPath, "utf8");
  let report;
  try {
    report = JSON.parse(raw);
  } catch (e) {
    die(`Report não é JSON válido: ${e?.message ?? e}`);
  }

  const rules = validateReportShape(report);

  // warnings list
  if (!Array.isArray(report.meta.warnings)) report.meta.warnings = [];

  // carregar docs por doc_path (cache)
  const docCache = new Map(); // doc_path -> { originalText, lines }
  const touchedDocs = new Set();

  function getDoc(docPath) {
    if (docCache.has(docPath)) return docCache.get(docPath);
    return null;
  }

  async function loadDoc(docPath) {
    const p = toPosix(docPath);
    if (!(await fileExists(p))) die(`Doc alvo não encontrado: ${p}`);
    const text = normalizeNewlines(await fs.readFile(p, "utf8"));
    const lines = splitLinesKeepEOL(text);
    const entry = { path: p, originalText: text, lines };
    docCache.set(p, entry);
    return entry;
  }

  function ensureNotAmbiguous(resultObj) {
    if (!resultObj) return;
    if (resultObj.error) {
      if (rules.fail_if_ambiguous_match) die(resultObj.error);
      warn(resultObj.error);
    }
  }

  // aplicar ops na ordem
  for (const op of report.ops) {
    if (!op || typeof op !== "object") die("Op inválida (não é objeto).");
    const opId = op.id ?? "(sem id)";
    const docPath = op.doc_path ?? report.meta.target_doc;

    if (!docPath || typeof docPath !== "string") die(`Op ${opId}: doc_path ausente.`);
    const doc = (getDoc(toPosix(docPath)) ?? (await loadDoc(docPath)));

    const opType = op.op;
    if (typeof opType !== "string") die(`Op ${opId}: op ausente.`);

    if (opType === "replace_section") {
      const target = op.target;
      const content = op.content;
      if (!target || typeof target !== "string") die(`Op ${opId}: target ausente (ex: "2.1").`);
      if (typeof content !== "string") die(`Op ${opId}: content ausente.`);

      const range = findSectionRange(doc.lines, target);
      if (!range) {
        const msg = `Op ${opId}: seção alvo ${target} não encontrada em ${doc.path}.`;
        if (rules.fail_if_target_missing) die(msg);
        report.meta.warnings.push(msg);
        warn(msg);
        continue;
      }
      ensureNotAmbiguous(range);
      if (range.error) {
        const msg = `Op ${opId}: ${range.error}`;
        report.meta.warnings.push(msg);
        continue;
      }

      doc.lines = replaceRange(doc.lines, range.startIdx, range.endIdxExclusive, content);
      touchedDocs.add(doc.path);
      ok(`Op ${opId}: replace_section ${target} em ${doc.path}`);
      continue;
    }

    if (opType === "insert_after_section") {
      const anchor = op.anchor;
      const content = op.content;
      if (!anchor || typeof anchor !== "string") die(`Op ${opId}: anchor ausente (ex: "3.4").`);
      if (typeof content !== "string") die(`Op ${opId}: content ausente.`);

      // regra: não inserir se a seção já existir
      const newSectionId = parseSectionIdFromContentBlock(content);
      if (!newSectionId) {
        const msg = `Op ${opId}: não consegui extrair o número da nova seção do primeiro heading do content.`;
        die(msg);
      }

      if (rules.fail_if_section_already_exists_on_insert) {
        const existsRe = sectionStartRegex(newSectionId);
        const found = findAllMatches(doc.lines, existsRe);
        if (found.length > 0) {
          die(`Op ${opId}: nova seção ${newSectionId} já existe em ${doc.path} (não posso inserir).`);
        }
      }

      const range = findSectionRange(doc.lines, anchor);
      if (!range) {
        const msg = `Op ${opId}: âncora ${anchor} não encontrada em ${doc.path}.`;
        if (rules.fail_if_anchor_missing) die(msg);
        report.meta.warnings.push(msg);
        warn(msg);
        continue;
      }
      ensureNotAmbiguous(range);
      if (range.error) {
        const msg = `Op ${opId}: ${range.error}`;
        report.meta.warnings.push(msg);
        continue;
      }

      // inserir após o fim do bloco da âncora
      doc.lines = insertAt(doc.lines, range.endIdxExclusive, content);
      touchedDocs.add(doc.path);
      ok(`Op ${opId}: insert_after_section ${anchor} (inseriu ${newSectionId}) em ${doc.path}`);
      continue;
    }

    if (opType === "insert_after_heading") {
      const heading = op.heading;
      const content = op.content;
      if (!heading || typeof heading !== "string") die(`Op ${opId}: heading ausente (ex: "8. Changelog").`);
      if (typeof content !== "string") die(`Op ${opId}: content ausente.`);

      const h = findHeadingLineIndex(doc.lines, heading);
      if (!h) {
        const msg = `Op ${opId}: heading "${heading}" não encontrado em ${doc.path}.`;
        if (rules.fail_if_anchor_missing) die(msg);
        report.meta.warnings.push(msg);
        warn(msg);
        continue;
      }
      ensureNotAmbiguous(h);
      if (h.error) {
        const msg = `Op ${opId}: ${h.error}`;
        report.meta.warnings.push(msg);
        continue;
      }

      // inserir logo após a linha do heading
      doc.lines = insertAt(doc.lines, h.index + 1, content);
      touchedDocs.add(doc.path);
      ok(`Op ${opId}: insert_after_heading "${heading}" em ${doc.path}`);
      continue;
    }

    die(`Op ${opId}: op "${opType}" não suportada (v1 suporta replace_section, insert_after_section, insert_after_heading).`);
  }

  // gravar docs alterados
  if (touchedDocs.size === 0) {
    ok("Nenhuma alteração aplicada (0 docs tocados).");
    // Ainda assim, não falhar — permite PR vazio se desejado.
    return;
  }

  for (const docPath of touchedDocs) {
    const entry = docCache.get(docPath);
    if (!entry) continue;
    const outText = entry.lines.join("");
    await fs.writeFile(docPath, outText, "utf8");
    ok(`Escreveu ${docPath}`);
  }

  // salvar warnings de volta no report? (não altera report, apenas loga)
  if (report.meta.warnings?.length) {
    warn(`Report gerou warnings (${report.meta.warnings.length}).`);
    for (const w of report.meta.warnings) warn(`- ${w}`);
  }

  ok("Concluído.");
}

main().catch((e) => die(e?.stack ?? e?.message ?? String(e)));
