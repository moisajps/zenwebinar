#!/usr/bin/env node
// check.mjs — Verifica se a máquina tem o necessário para rodar o projeto.
// Obrigatórios: Node.js e git. Claude Code é opcional (pode usar o app desktop).
// Imprime instruções por sistema operacional para o que faltar.
// >>> Trocar placeholder: Webinar ao Vivo
import { execFileSync } from "node:child_process";

const isWin = process.platform === "win32";

function check(cmd, label) {
  try {
    // execFileSync (sem shell): comandos são constantes fixas, sem input do usuário.
    const out = execFileSync(cmd, ["--version"], { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim()
      .split("\n")[0];
    console.log(`  ✅ ${label}: ${out}`);
    return true;
  } catch {
    console.log(`  ❌ ${label}: nao encontrado`);
    return false;
  }
}

console.log("=".repeat(56));
console.log("\u{1f50d} Verificando pre-requisitos do Webinar ao Vivo");
console.log("=".repeat(56) + "\n");

const hasNode = check("node", "Node.js");
const hasGit = check("git", "git");
const hasClaude = check("claude", "Claude Code (CLI)");

const missing = [];
if (!hasNode) missing.push("node");
if (!hasGit) missing.push("git");

const HINTS = {
  node: {
    win: "winget install OpenJS.NodeJS.LTS",
    mac: "brew install node   (ou baixe o LTS em https://nodejs.org)",
  },
  git: {
    win: "winget install Git.Git",
    mac: "brew install git   (ou https://git-scm.com/download/mac)",
  },
};

if (missing.length) {
  console.log("\n" + "=".repeat(56));
  console.log("❌ Falta instalar: " + missing.join(", "));
  console.log("=".repeat(56));
  for (const m of missing) {
    console.log(`\n\u{1f4e6} ${m}:`);
    console.log("  " + (isWin ? HINTS[m].win : HINTS[m].mac));
  }
  console.log("\nDepois de instalar, feche e reabra o terminal e rode de novo:");
  console.log("  node setup/check.mjs\n");
  process.exit(1);
}

if (!hasClaude) {
  console.log(
    "\nℹ️  Claude Code CLI nao detectado — tudo bem se voce usa o APP do Claude Code."
  );
}

console.log("\n" + "=".repeat(56));
console.log("✅ Pre-requisitos OK! Pode seguir o setup.");
console.log("=".repeat(56) + "\n");
process.exit(0);
