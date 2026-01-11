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
  console.log(`[doc-agent] OK: ${msg}`);
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
  const head = normalizeNewlines(String(content ?? "")).split("\n")[0] ?? "";
  const m = head.match(/^\s*(\d+(?:\.\d+)*)\b/);
  return m ? m[1] : null;
}

function sectionStartRegex(sectionId) {
  // início de linha + sectionId, garantindo:
  // - pai não casa filho (3.4 não casa 3.4.1)
  // - permite títulos com pontuação colada (ex.: "3.4:", "3.4—", "3.4)")
  // Regra: após o número da seção, NÃO pode haver ".<dígito>".
  // E deve haver whitespace, fim de linha, ou pontuação comum (inclui "." para headings como "2. Título").
  return new RegExp(
    `^\\s*${escapeRegExp(sectionId)}(?!\\.\\d)(?=\\s|$|[.:;—–\\-\\)\\]\\}])`,
    "m"
  );
}

function anySectionLineRegex(sectionIdPrefix) {
  // qualquer linha que comece com "3.4" ou "3.4.1" etc.
  return new RegExp(`^\\s*${escapeRegExp(sectionIdPrefix)}(?:\\.|\\b)`, "m");
}

function splitLinesKeepEOL(text) {
  // mantém \n como parte da linha (mais fácil de reconstituir sem reformatar)
  const s = normalizeNewlines(text);
  const parts = s.split("\n");
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    const isLast = i === parts.length - 1;
    out.push(isLast ? parts[i] : parts[i] + "\n");
  }
  return out;
}

function findAllMatches(lines, re) {
  const idxs = [];
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) idxs.push(i);
    re.lastIndex = 0;
  }
  return idxs;
}

function sectionLevel(sectionId) {
  return sectionId.split(".").length;
}

function isSectionIdLike(s) {
  return typeof s === "string" && /^\s*\d+(?:\.\d+)*\s*$/.test(s);
}

function isDescendantSection(childId, parentId) {
  if (!childId || !parentId) return false;
  return childId.startsWith(parentId + ".");
}

function normalizeReplaceMode(mode) {
  if (!mode) return "subtree";
  const m = String(mode).trim().toLowerCase();
  if (m === "subtree" || m === "shallow") return m;
  die(`mode inválido em replace_section: "${mode}". Use "subtree" ou "shallow".`);
}

function getOpDocPath(op, report) {
  return toPosix(op.doc_path ?? report.meta.target_doc);
}

function getSectionRefsForOp(op) {
  // (mantido para uso futuro; não é obrigatório para a validação atual)
  const refs = [];
  if (!op || typeof op !== "object") return refs;

  if (op.op === "replace_section") {
    const target = typeof op.target === "string" ? op.target.trim() : null;
    if (target && isSectionIdLike(target)) refs.push(target);
    return refs;
  }

  if (op.op === "insert_after_section") {
    const anchor = typeof op.anchor === "string" ? op.anchor.trim() : null;
    if (anchor && isSectionIdLike(anchor)) refs.push(anchor);

    if (typeof op.content === "string") {
      const newId = parseSectionIdFromContentBlock(op.content);
      if (newId && isSectionIdLike(newId)) refs.push(newId.trim());
    }
    return refs;
  }

  return refs;
}

function validateNoOverlappingSectionOps(report) {
  // Evita operações sobrepostas quando um replace_section está em mode "subtree".
  //
  // Proibido (subtree default):
  // - replace_section 3.4
  // - replace_section 3.4.1
  //
  // Permitido:
  // - replace_section 3.4 (mode: "shallow")
  // - replace_section 3.4.1
  //
  // Observação: insert_after_section com anchor == pai (ex.: anchor 3.4 para inserir 3.5)
  // é permitido, desde que a nova seção NÃO seja descendente do pai.
  const byDoc = new Map(); // docPath -> entries

  for (const op of report.ops) {
    const docPath = getOpDocPath(op, report);
    const list = byDoc.get(docPath) ?? [];
    list.push({
      op,
      opId: op?.id ?? "(sem id)",
      docPath,
    });
    byDoc.set(docPath, list);
  }

  for (const [docPath, entries] of byDoc.entries()) {
    const replaceOps = entries
      .filter((e) => e.op?.op === "replace_section")
      .map((e) => ({
        opId: e.opId,
        target: typeof e.op.target === "string" ? e.op.target.trim() : "",
        mode: normalizeReplaceMode(e.op?.mode),
      }))
      .filter((r) => isSectionIdLike(r.target));

    // duplicadas (mesmo target)
    const seen = new Map();
    for (const r of replaceOps) {
      if (seen.has(r.target)) {
        die(
          `Ops duplicadas em ${docPath}: replace_section ${r.target} aparece em ${seen.get(r.target)} e ${r.opId}.`
        );
      }
      seen.set(r.target, r.opId);
    }

    // overlap: apenas quando o pai estiver em subtree
    for (const parent of replaceOps) {
      if (parent.mode !== "subtree") continue;

      const parentId = parent.target;

      for (const e of entries) {
        if (e.opId === parent.opId) continue;

        const opType = e.op?.op;

        if (opType === "replace_section") {
          const childTarget = typeof e.op.target === "string" ? e.op.target.trim() : "";
          if (isDescendantSection(childTarget, parentId)) {
            die(
              `Ops sobrepostas em ${docPath}: ${parent.opId} replace_section ${parentId} (mode=subtree) conflita com ${e.opId} replace_section ${childTarget}. ` +
                `Use mode:"shallow" no pai, ou remova as ops do subtree e mova o conteúdo para dentro do bloco do pai.`
            );
          }
          continue;
        }

        if (opType === "insert_after_section") {
          const anchor = typeof e.op.anchor === "string" ? e.op.anchor.trim() : "";
          const newId = typeof e.op.content === "string" ? parseSectionIdFromContentBlock(e.op.content) : null;

          // inserir depois de um nó dentro da subárvore é conflito
          if (isDescendantSection(anchor, parentId)) {
            die(
              `Ops sobrepostas em ${docPath}: ${parent.opId} replace_section ${parentId} (mode=subtree) conflita com ${e.opId} insert_after_section anchor ${anchor}. ` +
                `Use mode:"shallow" no pai, ou mova a inserção para fora da subárvore.`
            );
          }

          // inserir uma nova seção descendente do pai (ex.: 3.4.2) enquanto substitui a subárvore também é conflito
          if (newId && isDescendantSection(newId, parentId)) {
            die(
              `Ops sobrepostas em ${docPath}: ${parent.opId} replace_section ${parentId} (mode=subtree) conflita com ${e.opId} insert_after_section (nova seção ${newId}). ` +
                `Use mode:"shallow" no pai, ou inclua a nova seção dentro do bloco do replace_section ${parentId}.`
            );
          }

          continue;
        }

        // insert_after_heading não é validado por overlap (âncora textual pode estar em qualquer lugar).
      }
    }
  }
}

function findSectionRange(lines, sectionId, mode = "subtree") {
  // retorna {startIdx, endIdxExclusive} do bloco da seção
  // mode:
  // - "subtree" (default): inclui subseções (X.Y.*)
  // - "shallow": apenas o corpo do pai (X.Y), sem tocar filhas (para antes de X.Y.1)
  const startRe = sectionStartRegex(sectionId);
  const startMatches = findAllMatches(lines, startRe);

  if (startMatches.length === 0) return null;
  if (startMatches.length > 1) {
    return { error: `Match ambíguo para seção ${sectionId} (encontrei ${startMatches.length}).` };
  }

  const startIdx = startMatches[0];
  const targetLevel = sectionLevel(sectionId);

  // procurar o próximo heading numérico que define o fim do range
  let endIdxExclusive = lines.length;

  for (let i = startIdx + 1; i < lines.length; i++) {
    const m = lines[i].match(/^\s*(\d+(?:\.\d+)*)\b/);
    if (!m) continue;

    const foundId = m[1];
    if (foundId === sectionId) continue;

    // shallow: termina antes do primeiro filho/descendente (X.Y.*)
    if (mode === "shallow") {
      if (isDescendantSection(foundId, sectionId)) {
        endIdxExclusive = i;
        break;
      }
      const foundLevel = sectionLevel(foundId);
      if (foundLevel <= targetLevel) {
        endIdxExclusive = i;
        break;
      }
      continue;
    }

    // subtree (default): termina no próximo heading com nível <= targetLevel
    const foundLevel = sectionLevel(foundId);
    if (foundLevel <= targetLevel) {
      endIdxExclusive = i;
      break;
    }
  }

  return { startIdx, endIdxExclusive };
}

function insertAt(lines, idx, content) {
  const block = splitLinesKeepEOL(ensureEndsWithNewline(normalizeNewlines(content)));
  const out = lines.slice(0, idx).concat(block).concat(lines.slice(idx));
  return out;
}

function replaceRange(lines, startIdx, endIdxExclusive, content) {
  const block = splitLinesKeepEOL(ensureEndsWithNewline(normalizeNewlines(content)));
  const out = lines.slice(0, startIdx).concat(block).concat(lines.slice(endIdxExclusive));
  return out;
}

function findHeadingLineIndex(lines, heading) {
  const re = new RegExp(`^\\s*${escapeRegExp(heading)}\\b`, "m");
  const matches = findAllMatches(lines, re);
  if (matches.length === 0) return null;
  if (matches.length > 1) return { error: `Match ambíguo para heading "${heading}" (encontrei ${matches.length}).` };
  return matches[0];
}

function validateReportShape(report) {
  if (!report || typeof report !== "object") die("Report inválido (não é objeto).");
  if (!report.meta || typeof report.meta !== "object") die("meta ausente.");
  if (!Array.isArray(report.ops)) die("ops ausente (array).");

  const targetDoc = report.meta.target_doc;
  if (targetDoc != null && typeof targetDoc !== "string") die("meta.target_doc inválido.");

  const rules = report.rules ?? {};
  if (rules && typeof rules !== "object") die("rules inválidas.");

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

  // validação estrutural: evita overlap de ops em subárvore (pai+filho) quando mode=subtree
  validateNoOverlappingSectionOps(report);

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
    const doc = getDoc(toPosix(docPath)) ?? (await loadDoc(docPath));

    const opType = op.op;
    if (typeof opType !== "string") die(`Op ${opId}: op ausente.`);

    if (opType === "replace_section") {
      const target = op.target;
      const content = op.content;
      if (!target || typeof target !== "string") die(`Op ${opId}: target ausente (ex: "2.1").`);
      if (typeof content !== "string") die(`Op ${opId}: content ausente.`);

      // Guard (compat + segurança):
      // Se mode NÃO foi fornecido e a seção alvo tem subseções no documento, evitamos apagar
      // subseções por acidente. Permitimos seguir em "subtree" somente quando o content inclui
      // explicitamente headings descendentes (ex.: 3.4.1) — caso contrário, falha pedindo
      // mode:"shallow" ou inclusão das subseções no content.
      const explicitModeProvided =
        op.mode != null && String(op.mode).trim().length > 0;

      if (!explicitModeProvided) {
        const targetTrim = String(target).trim();

        const hasDescendantsInDoc = doc.lines.some((line) => {
          const m = line.match(/^\s*(\d+(?:\.\d+)*)\b/);
          if (!m) return false;
          return isDescendantSection(m[1], targetTrim);
        });

        if (hasDescendantsInDoc) {
          const contentLines = splitLinesKeepEOL(normalizeNewlines(content));
          const hasDescendantsInContent = contentLines.some((line) => {
            const m = line.match(/^\s*(\d+(?:\.\d+)*)\b/);
            if (!m) return false;
            return isDescendantSection(m[1], targetTrim);
          });

          if (!hasDescendantsInContent) {
            die(
              `Op ${opId}: replace_section ${targetTrim} afeta uma seção com subseções. ` +
                `Defina mode:"shallow" (para alterar só o pai) ou inclua as subseções no bloco de content (para substituir a árvore).`
            );
          }
        }
      }

      const mode = normalizeReplaceMode(op.mode);

      const range = findSectionRange(doc.lines, target, mode);
      if (!range) {
        const msg = `Op ${opId}: seção alvo ${target} não encontrada em ${doc.path}.`;
        if (rules.fail_if_target_missing) die(msg);
        report.meta.warnings.push(msg);
        warn(msg);
        continue;
      }
      ensureNotAmbiguous(range);
      if (range.error) {
        report.meta.warnings.push(range.error);
        continue;
      }

      doc.lines = replaceRange(doc.lines, range.startIdx, range.endIdxExclusive, content);
      touchedDocs.add(doc.path);
      ok(`Op ${opId}: replace_section ${target} (mode=${mode}) em ${doc.path}`);
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
        report.meta.warnings.push(range.error);
        continue;
      }

      // inserir após o bloco da âncora
      doc.lines = insertAt(doc.lines, range.endIdxExclusive, content);
      touchedDocs.add(doc.path);
      ok(`Op ${opId}: insert_after_section após ${anchor} em ${doc.path}`);
      continue;
    }

    if (opType === "insert_after_heading") {
      const heading = op.heading;
      const content = op.content;
      if (!heading || typeof heading !== "string") die(`Op ${opId}: heading ausente.`);
      if (typeof content !== "string") die(`Op ${opId}: content ausente.`);

      const idx = findHeadingLineIndex(doc.lines, heading);
      if (idx == null) {
        const msg = `Op ${opId}: heading "${heading}" não encontrado em ${doc.path}.`;
        if (rules.fail_if_anchor_missing) die(msg);
        report.meta.warnings.push(msg);
        warn(msg);
        continue;
      }
      ensureNotAmbiguous(idx);
      if (idx.error) {
        report.meta.warnings.push(idx.error);
        continue;
      }

      // inserir logo após a linha do heading
      doc.lines = insertAt(doc.lines, idx + 1, content);
      touchedDocs.add(doc.path);
      ok(`Op ${opId}: insert_after_heading "${heading}" em ${doc.path}`);
      continue;
    }

    die(`Op ${opId}: op "${opType}" não suportada. Use (replace_section, insert_after_section, insert_after_heading).`);
  }

  // gravar docs alterados
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
