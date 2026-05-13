#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import ts from "typescript";

const IN_SCOPE_PREFIXES = [
  "src/",
  "packages/",
  "gsd-orchestrator/",
  "web/",
  "studio/",
  "extensions/",
  "vscode-extension/",
  "native/",
  "docs/",
  "scripts/",
  "tests/",
  "docker/",
  "pkg/",
];

const EXCLUDE_SUBSTRINGS = [
  "/node_modules/",
  "/dist/",
  "/dist-test/",
  "pkg/dist/",
  ".qogni/",
  ".qogni-agent-projection/",
];

const JS_TS_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

function normalizeInline(text) {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function isInScope(filePath) {
  if (!IN_SCOPE_PREFIXES.some((prefix) => filePath.startsWith(prefix))) return false;
  if (EXCLUDE_SUBSTRINGS.some((needle) => filePath.includes(needle))) return false;
  if (filePath.endsWith(".d.ts")) return false;
  return true;
}

function scriptKindForFile(filePath) {
  const ext = path.extname(filePath);
  switch (ext) {
    case ".ts":
      return ts.ScriptKind.TS;
    case ".tsx":
      return ts.ScriptKind.TSX;
    case ".jsx":
      return ts.ScriptKind.JSX;
    case ".js":
    case ".mjs":
    case ".cjs":
    default:
      return ts.ScriptKind.JS;
  }
}

function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function lineOf(sourceFile, pos) {
  const { line } = sourceFile.getLineAndCharacterOfPosition(pos);
  return line + 1;
}

function hasModifier(node, modifierKind) {
  return Boolean(node.modifiers?.some((m) => m.kind === modifierKind));
}

function isNodeExported(node) {
  if (hasModifier(node, ts.SyntaxKind.ExportKeyword)) return true;
  if (hasModifier(node, ts.SyntaxKind.DefaultKeyword)) return true;
  return false;
}

function isClassMemberPublic(member) {
  if (hasModifier(member, ts.SyntaxKind.PrivateKeyword)) return false;
  if (hasModifier(member, ts.SyntaxKind.ProtectedKeyword)) return false;
  if (hasModifier(member, ts.SyntaxKind.AbstractKeyword)) return false;
  if (hasModifier(member, ts.SyntaxKind.StaticKeyword)) return true; // treat as public unless private/protected
  if (hasModifier(member, ts.SyntaxKind.PublicKeyword)) return true;
  // Default is public for TS class members.
  return true;
}

function getText(sourceFile, node) {
  return sourceFile.text.slice(node.getStart(sourceFile), node.getEnd());
}

function getJSDocInfo(node) {
  const docs = node.jsDoc;
  if (!docs || docs.length === 0) return { has: false, description: "", tags: [] };
  const doc = docs[docs.length - 1];
  const description =
    typeof doc.comment === "string"
      ? doc.comment.trim()
      : Array.isArray(doc.comment)
        ? doc.comment.map((p) => (typeof p.text === "string" ? p.text : "")).join("").trim()
        : "";
  const tags =
    doc.tags?.map((t) => ({
      tagName: t.tagName.text,
      name: t.name?.getText?.() ?? "",
      comment: typeof t.comment === "string" ? t.comment.trim() : "",
    })) ?? [];
  return { has: true, description, tags };
}

function getParamNamesFromNode(node) {
  if (!("parameters" in node)) return [];
  const params = node.parameters ?? [];
  return params.map((p) => {
    if (ts.isIdentifier(p.name)) return p.name.text;
    return p.name.getText();
  });
}

function getReturnsExpected(node) {
  if (ts.isConstructorDeclaration(node)) return false;
  if (node.type) {
    const typeText = node.type.getText?.() ?? "";
    if (node.type.kind === ts.SyntaxKind.VoidKeyword || node.type.kind === ts.SyntaxKind.UndefinedKeyword) return false;
    if (/^Promise<\s*void\s*>$/.test(typeText.replace(/\s+/g, ""))) return false;
  }

  const body = node.body;
  if (!body) return true;

  let returnsValue = false;
  function visit(n) {
    if (ts.isReturnStatement(n)) {
      if (n.expression) returnsValue = true;
    }
    ts.forEachChild(n, visit);
  }
  visit(body);

  // Only require @returns when a value is returned.
  return returnsValue;
}

function getCallSignatureText(sourceFile, node) {
  if (ts.isClassDeclaration(node)) return `class ${node.name?.text ?? "(anonymous)"}`;
  if (ts.isConstructorDeclaration(node))
    return normalizeInline(`constructor(${node.parameters.map((p) => p.getText(sourceFile)).join(", ")})`);
  if ("parameters" in node) {
    const name =
      "name" in node && node.name
        ? ts.isIdentifier(node.name)
          ? node.name.text
          : node.name.getText(sourceFile)
        : "(anonymous)";
    const params = node.parameters.map((p) => p.getText(sourceFile)).join(", ");
    return normalizeInline(`${name}(${params})`);
  }
  return "(unknown)";
}

function tryInferSummary(sourceFile, node, fileText) {
  const truncate = (s, max = 180) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);
  // Prefer a concise "verb + object" based on nearby clues.
  const body = node.body;
  if (!body) return "Defines an API surface.";
  const bodyText = getText(sourceFile, body);
  if (/\bthrow\b/.test(bodyText) && /\bnew Error\b/.test(bodyText)) return "Validates inputs and throws on failure.";
  if (/\breturn\b/.test(bodyText) && /\bfetch\(|\bundici\b|\brequest\(/.test(bodyText)) return "Performs an HTTP request and returns a result.";
  if (/\bfs\./.test(bodyText) || /\breadFileSync\b|\bwriteFileSync\b|\bcreateReadStream\b/.test(bodyText))
    return "Performs filesystem I/O.";
  if (/\bspawn\(|\bexec\(|\bexecSync\(|\bspawnSync\(/.test(bodyText)) return "Executes a subprocess command.";
  if (/\bJSON\.parse\b/.test(bodyText)) return "Parses JSON input into a structured value.";
  if (/\bJSON\.stringify\b/.test(bodyText)) return "Serializes a value to JSON.";
  if (/\bmap\(|\bfilter\(|\breduce\(/.test(bodyText)) return "Transforms a collection into a derived result.";
  if (/\bnew Map\b|\bnew Set\b/.test(bodyText)) return "Builds an in-memory lookup structure.";
  if (/\bPromise\b|\basync\b/.test(getText(sourceFile, node))) return "Runs asynchronous logic and returns a promise.";
  if (/\bconsole\./.test(bodyText)) return "Logs diagnostic information.";

  // Fall back: use the first non-empty statement as a clue.
  const snippet = bodyText.slice(0, 240).replace(/\s+/g, " ").trim();
  return snippet ? truncate(`Implements logic starting with: ${snippet}`) : "Implements internal logic.";
}

function computeComplexityHeuristic(sourceFile, node) {
  const body = node.body;
  if (!body) return 0;
  let score = 0;
  function visit(n) {
    switch (n.kind) {
      case ts.SyntaxKind.IfStatement:
      case ts.SyntaxKind.ForStatement:
      case ts.SyntaxKind.ForInStatement:
      case ts.SyntaxKind.ForOfStatement:
      case ts.SyntaxKind.WhileStatement:
      case ts.SyntaxKind.DoStatement:
      case ts.SyntaxKind.CaseClause:
      case ts.SyntaxKind.ConditionalExpression:
      case ts.SyntaxKind.CatchClause:
      case ts.SyntaxKind.BinaryExpression: {
        if (ts.isBinaryExpression(n) && (n.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken || n.operatorToken.kind === ts.SyntaxKind.BarBarToken))
          score += 1;
        if (!ts.isBinaryExpression(n)) score += 1;
        break;
      }
      default:
        break;
    }
    ts.forEachChild(n, visit);
  }
  visit(body);
  // Add a small bump for size.
  const startLine = lineOf(sourceFile, body.getStart(sourceFile));
  const endLine = lineOf(sourceFile, body.getEnd());
  score += Math.min(10, Math.max(0, Math.floor((endLine - startLine) / 20)));
  return score;
}

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function estimateCallerFiles(record, allTextByFile) {
  const name = record.name;
  if (!name || name === "(anonymous)" || name === "default") return 0;

  let patterns = [];
  if (record.kind === "class" || record.kind === "constructor") {
    const className = name.includes(".") ? name.split(".")[0] : name;
    if (!className || className === "(anonymous)") return 0;
    const escaped = escapeRegex(className);
    patterns = [new RegExp(`\\bnew\\s+${escaped}\\b`), new RegExp(`\\bextends\\s+${escaped}\\b`)];
  } else if (record.kind === "function") {
    const short = name.includes(".") ? name.split(".").pop() : name;
    if (!short) return 0;
    patterns = [new RegExp(`\\b${escapeRegex(short)}\\s*\\(`)];
  } else if (record.kind === "method" || record.kind === "getter" || record.kind === "setter") {
    const short = name.split(".").pop()?.replace(/^get\s+/, "").replace(/^set\s+/, "");
    if (!short) return 0;
    patterns = [new RegExp(`\\.${escapeRegex(short)}\\s*\\(`)];
  } else {
    const short = name.includes(".") ? name.split(".").pop() : name;
    if (!short) return 0;
    patterns = [new RegExp(`\\b${escapeRegex(short)}\\s*\\(`)];
  }

  let fileCount = 0;
  for (const [fp, text] of allTextByFile.entries()) {
    if (fp === record.filePath) continue;
    if (patterns.some((p) => p.test(text))) fileCount += 1;
  }
  return fileCount;
}

function estimateImporterFiles(record, allTextByFile) {
  if (!record.exported) return 0;
  const name = record.name;
  const short =
    record.kind === "method" || record.kind === "getter" || record.kind === "setter"
      ? name.split(".").pop()?.replace(/^get\s+/, "").replace(/^set\s+/, "")
      : name.includes(".")
        ? name.split(".").pop()
        : name;
  if (!short || short === "(anonymous)" || short === "default") return 0;
  const escaped = escapeRegex(short);
  const patterns = [
    new RegExp(`\\bimport\\s*\\{[^}]*\\b${escaped}\\b[^}]*\\}\\s*from\\s*['"][^'"]+['"]`, "m"),
    new RegExp(`\\bexport\\s*\\{[^}]*\\b${escaped}\\b[^}]*\\}`, "m"),
    new RegExp(`\\brequire\\([^\\)]+\\)\\.\\s*${escaped}\\b`),
  ];
  let fileCount = 0;
  for (const [fp, text] of allTextByFile.entries()) {
    if (fp === record.filePath) continue;
    if (patterns.some((p) => p.test(text))) fileCount += 1;
  }
  return fileCount;
}

function classifyDocs(node, jsDocInfo) {
  if (!jsDocInfo.has) return { status: "undocumented", missing: ["jsdoc"] };
  const missing = [];
  if (!jsDocInfo.description) missing.push("description");
  const params = getParamNamesFromNode(node);
  const paramTags = new Set(
    jsDocInfo.tags
      .filter((t) => t.tagName === "param")
      .map((t) => (t.name ?? "").replace(/^\{[^}]+\}\s*/, "").trim())
      .filter(Boolean),
  );
  for (const p of params) if (!paramTags.has(p)) missing.push(`@param ${p}`);
  const wantsReturns = getReturnsExpected(node);
  if (wantsReturns) {
    const hasReturns = jsDocInfo.tags.some((t) => t.tagName === "returns" || t.tagName === "return");
    if (!hasReturns) missing.push("@returns");
  }
  if (missing.length === 0) return { status: "documented", missing: [] };
  return { status: jsDocInfo.description ? "partial" : "undocumented", missing };
}

function gatherExportNamesFromSourceFile(sourceFile) {
  const directExportNames = new Set();
  for (const stmt of sourceFile.statements) {
    if (ts.isExportDeclaration(stmt) && stmt.exportClause && ts.isNamedExports(stmt.exportClause)) {
      for (const element of stmt.exportClause.elements) {
        directExportNames.add((element.name ?? element.propertyName).getText(sourceFile));
      }
    }
  }
  return directExportNames;
}

function gatherModuleExportsAssignments(sourceFile) {
  // CommonJS: module.exports = { a, b }, exports.a = ...
  const assigned = new Set();
  function visit(n) {
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      const leftText = n.left.getText(sourceFile);
      if (leftText.startsWith("exports.") || leftText.startsWith("module.exports.")) {
        const name = leftText.split(".").slice(1).join(".");
        if (name) assigned.add(name.split(".")[0]);
      }
      if (leftText === "module.exports" || leftText === "exports") {
        // If assigning an object literal, collect keys.
        if (ts.isObjectLiteralExpression(n.right)) {
          for (const prop of n.right.properties) {
            if (ts.isPropertyAssignment(prop) || ts.isShorthandPropertyAssignment(prop)) {
              const key = prop.name?.getText(sourceFile) ?? prop.getText(sourceFile);
              assigned.add(key);
            }
          }
        }
      }
    }
    ts.forEachChild(n, visit);
  }
  visit(sourceFile);
  return assigned;
}

function isTestLikeFile(filePath) {
  if (filePath.includes("/tests/") || filePath.startsWith("tests/")) return true;
  if (/\btest\b/.test(filePath) && /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filePath)) {
    if (/\.(test|spec)\./.test(filePath)) return true;
  }
  return false;
}

function isConfigLikeFile(filePath) {
  return /(tsconfig|eslint|prettier|vite|webpack|rollup|jest|vitest|playwright|babel)\./i.test(filePath) || filePath.endsWith(".config.js") || filePath.endsWith(".config.ts");
}

function main() {
  const outPath = process.argv[2] ?? "docs-sprint/undocumented-report.md";
  const trackedFiles = execSync("git ls-files", { encoding: "utf8" })
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter(isInScope)
    .filter((fp) => JS_TS_EXTENSIONS.has(path.extname(fp)));

  const allTextByFile = new Map();
  for (const fp of trackedFiles) {
    const text = safeReadFile(fp);
    if (text != null) allTextByFile.set(fp, text);
  }

  const records = [];
  for (const [filePath, fileText] of allTextByFile.entries()) {
    const sourceFile = ts.createSourceFile(filePath, fileText, ts.ScriptTarget.Latest, true, scriptKindForFile(filePath));
    const exportNames = gatherExportNamesFromSourceFile(sourceFile);
    const cjsExportNames = gatherModuleExportsAssignments(sourceFile);

    function record(node, kind, name, signature, isExported, extra = {}) {
      const jsDocInfo = getJSDocInfo(node);
      const docs = classifyDocs(node, jsDocInfo);
      const complexity = computeComplexityHeuristic(sourceFile, node);
      const summary = tryInferSummary(sourceFile, node, fileText);
      const line = lineOf(sourceFile, node.getStart(sourceFile));
      records.push({
        filePath,
        line,
        kind,
        name,
        signature,
        exported: isExported,
        jsdoc: jsDocInfo.has,
        docStatus: docs.status,
        missingDocBits: docs.missing,
        summary,
        params: getParamNamesFromNode(node),
        complexity,
        isTest: isTestLikeFile(filePath),
        isConfig: isConfigLikeFile(filePath),
        ...extra,
      });
    }

    function visit(node, parentExportedClass = null) {
      // Top-level function declarations.
      if (ts.isFunctionDeclaration(node) && node.name) {
        const name = node.name.text;
        const exported = isNodeExported(node) || exportNames.has(name) || cjsExportNames.has(name);
        record(node, "function", name, getCallSignatureText(sourceFile, node), exported);
      }

      // Variable assigned arrow/function expressions.
      if (ts.isVariableStatement(node)) {
        const isExportStmt = isNodeExported(node);
        for (const decl of node.declarationList.declarations) {
          if (!ts.isIdentifier(decl.name)) continue;
            const name = decl.name.text;
            const init = decl.initializer;
            if (!init) continue;
            if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
              const exported = isExportStmt || exportNames.has(name) || cjsExportNames.has(name);
            record(init, "function", name, normalizeInline(`${name}(${init.parameters.map((p) => p.getText(sourceFile)).join(", ")})`), exported, {
              line: lineOf(sourceFile, decl.getStart(sourceFile)),
            });
          }
        }
      }

      // Export assignments: export default function() {}
      if (ts.isExportAssignment(node)) {
        if (ts.isIdentifier(node.expression)) {
          // Covered by exportNames lookups above.
        } else if (ts.isArrowFunction(node.expression) || ts.isFunctionExpression(node.expression)) {
          record(node.expression, "function", "default", getCallSignatureText(sourceFile, node.expression), true);
        }
      }

      // Classes and class members.
      if (ts.isClassDeclaration(node)) {
        const className = node.name?.text ?? "(anonymous)";
        const classExported = isNodeExported(node) || exportNames.has(className) || cjsExportNames.has(className);
        if (classExported) record(node, "class", className, `class ${className}`, true);

        for (const member of node.members) {
          if (!isClassMemberPublic(member)) continue;
          const memberExported = classExported;
          if (ts.isConstructorDeclaration(member)) {
            record(member, "constructor", `${className}.constructor`, `${className}.${getCallSignatureText(sourceFile, member)}`, memberExported);
          } else if (ts.isMethodDeclaration(member) && member.name) {
            const methodName = member.name.getText(sourceFile);
            const qualified = `${className}.${methodName}`;
            const sig = normalizeInline(`${qualified}(${member.parameters.map((p) => p.getText(sourceFile)).join(", ")})`);
            record(member, "method", qualified, sig, memberExported);
          } else if (ts.isGetAccessorDeclaration(member) && member.name) {
            const methodName = member.name.getText(sourceFile);
            const qualified = `${className}.get ${methodName}`;
            record(member, "getter", qualified, `${qualified}()`, memberExported);
          } else if (ts.isSetAccessorDeclaration(member) && member.name) {
            const methodName = member.name.getText(sourceFile);
            const qualified = `${className}.set ${methodName}`;
            record(member, "setter", qualified, normalizeInline(`${qualified}(${member.parameters.map((p) => p.getText(sourceFile)).join(", ")})`), memberExported);
          }
        }
      }

      // Named exports inside export {...}
      // Handled via exportNames set.

      ts.forEachChild(node, (child) => visit(child, parentExportedClass));
    }
    visit(sourceFile);
  }

  // Deduplicate by (file,line,signature) to reduce overlaps from initializer vs decl.
  const seen = new Set();
  const uniqueRecords = [];
  for (const r of records) {
    const key = `${r.filePath}:${r.line}:${r.signature}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueRecords.push(r);
  }

  // Stats.
  const totalFound = uniqueRecords.length;
  const undocumented = uniqueRecords.filter((r) => r.docStatus === "undocumented");
  const partial = uniqueRecords.filter((r) => r.docStatus === "partial");
  const documented = uniqueRecords.filter((r) => r.docStatus === "documented");
  const coveragePct = totalFound === 0 ? 100 : Math.round((documented.length / totalFound) * 1000) / 10;

  // Compute caller/importer proxy: number of other files that appear to call/use the symbol.
  const callerFiles = new Map();
  const importerFiles = new Map();
  for (const r of uniqueRecords) {
    callerFiles.set(r, estimateCallerFiles(r, allTextByFile));
    importerFiles.set(r, estimateImporterFiles(r, allTextByFile));
  }

  function impactScore(r) {
    const callers = callerFiles.get(r) ?? 0;
    const importers = importerFiles.get(r) ?? 0;
    const exportWeight = r.exported ? 100 : 0;
    const callersWeight = Math.min(40, callers * 2); // distinct call sites (heuristic)
    const importersWeight = Math.min(40, importers * 4); // imported usage is strong signal
    const complexityWeight = Math.min(30, r.complexity * 2);
    const multiParamWeight = Math.min(10, Math.max(0, (r.params?.length ?? 0) - 2) * 2);
    const penalty = (r.isTest ? 20 : 0) + (r.isConfig ? 10 : 0);
    return exportWeight + callersWeight + importersWeight + complexityWeight + multiParamWeight - penalty;
  }

  const priorityCandidates = uniqueRecords
    .filter((r) => r.docStatus !== "documented")
    .map((r) => ({
      ...r,
      callers: callerFiles.get(r) ?? 0,
      importers: importerFiles.get(r) ?? 0,
      score: impactScore(r),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  function groupByFile(list) {
    const map = new Map();
    for (const r of list) {
      const arr = map.get(r.filePath) ?? [];
      arr.push(r);
      map.set(r.filePath, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.line - b.line);
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }

  function formatRecordBullet(r) {
    const exported = r.exported ? "yes" : "no";
    const missing = r.missingDocBits?.length ? ` (missing: ${r.missingDocBits.join(", ")})` : "";
    return `- \`${r.filePath}:${r.line}\` — \`${r.signature}\` — exported: **${exported}** — ${r.summary}${missing}`;
  }

  const lines = [];
  const escapeTableCell = (s) => normalizeInline(s).replaceAll("|", "\\|");
  lines.push("# Documentation Coverage Report");
  lines.push("");
  lines.push("## Summary");
  lines.push(`- Total functions found: **${totalFound}**`);
  lines.push(`- Total undocumented: **${undocumented.length}**`);
  lines.push(`- Documentation coverage: **${coveragePct}%**`);
  lines.push("");
  lines.push("## Critical gaps");
  lines.push("Exported/public entries with no JSDoc at all, grouped by file.");
  lines.push("");
  const critical = undocumented.filter((r) => r.exported);
  if (critical.length === 0) {
    lines.push("- None found.");
  } else {
    for (const [filePath, list] of groupByFile(critical)) {
      lines.push(`### \`${filePath}\``);
      for (const r of list) lines.push(formatRecordBullet(r));
      lines.push("");
    }
  }
  lines.push("");
  lines.push("## Partial gaps");
  lines.push("Entries with some JSDoc but missing description, @param, or @returns.");
  lines.push("");
  if (partial.length === 0) {
    lines.push("- None found.");
  } else {
    for (const [filePath, list] of groupByFile(partial)) {
      lines.push(`### \`${filePath}\``);
      for (const r of list) lines.push(formatRecordBullet(r));
      lines.push("");
    }
  }
  lines.push("");
  lines.push("## Already documented");
  lines.push(`- Count of functions with complete JSDoc: **${documented.length}**`);
  lines.push("");
  lines.push("## Priority queue");
  lines.push("Top 20 most impactful entries to document first (higher score = more exported + more referenced + more complex).");
  lines.push("");
  lines.push("| Rank | File | Line | Signature | Exported | Importers | Caller-files | Complexity | Doc status | Why |");
  lines.push("| ---: | ---- | ---: | --------- | :------: | --------: | ----------: | ---------: | --------- | --- |");
  priorityCandidates.forEach((r, i) => {
    const whyParts = [];
    if (r.exported) whyParts.push("exported");
    if (r.importers > 0) whyParts.push(`${r.importers} importers`);
    if (r.callers > 0) whyParts.push(`${r.callers} caller-files`);
    if (r.complexity > 0) whyParts.push(`complexity ${r.complexity}`);
    if ((r.params?.length ?? 0) > 2) whyParts.push(`${r.params.length} params`);
    if (r.isTest) whyParts.push("test file");
    if (r.isConfig) whyParts.push("config file");
    const why = whyParts.join(", ") || "undocumented";
    const sig = escapeTableCell(r.signature);
    lines.push(
      `| ${i + 1} | \`${r.filePath}\` | ${r.line} | \`${sig}\` | ${r.exported ? "yes" : "no"} | ${r.importers} | ${r.callers} | ${r.complexity} | ${r.docStatus} | ${why} |`,
    );
  });
  lines.push("");
  lines.push("## Notes");
  lines.push("- Scope: tracked `.(js|jsx|ts|tsx|mjs|cjs)` under the requested directories, excluding `**/node_modules/**`, `**/dist/**`, `**/dist-test/**`, `pkg/dist/`, `.qogni/`, `.qogni-agent-projection/`, and `*.d.ts`.");
  lines.push("- Classification: documented = has description + all params tagged + @returns (when non-void); partial = has some JSDoc but missing required parts; undocumented = no JSDoc.");

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join("\n"), "utf8");
}

main();
