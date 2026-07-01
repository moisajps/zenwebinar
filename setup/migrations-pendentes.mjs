#!/usr/bin/env node
// migrations-pendentes.mjs — Lista as migrations que ainda NÃO foram aplicadas
// no banco do cliente, comparando os arquivos em supabase/migrations/ com a
// tabela schema_migrations. Usado pelo comando /atualizar para aplicar só o novo.
//
// Uso: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node setup/migrations-pendentes.mjs
// Saída: JSON { schemaMigrationsExiste, pendentes: [arquivos] }
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.");
  process.exit(1);
}

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "supabase", "migrations");
const arquivos = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data, error } = await sb.from("schema_migrations").select("version");

// Tabela inexistente = instalação anterior ao registro → tudo é pendente (aplicar a
// partir da 006, que faz o backfill das anteriores). O Postgres cru dá 42P01, mas via
// PostgREST (supabase-js) vem PGRST205 / "Could not find the table".
const tabelaInexistente =
  error &&
  (error.code === "42P01" ||
    error.code === "PGRST205" ||
    /could not find the table|schema cache/i.test(error.message ?? ""));
if (tabelaInexistente) {
  // Instalação anterior ao registro: as 001–005 JÁ foram aplicadas no setup
  // (as tabelas existem). Pendente = a 006 (cria o registro + backfill das
  // anteriores) e qualquer migration POSTERIOR a ela. Nunca reaplicar 001–005.
  const pend = arquivos.filter((f) => f >= "006_schema_migrations.sql");
  console.log(JSON.stringify({ schemaMigrationsExiste: false, pendentes: pend }, null, 2));
  process.exit(0);
}
if (error) {
  console.error("Erro ao consultar schema_migrations:", error.message);
  process.exit(1);
}

const aplicadas = new Set((data ?? []).map((r) => r.version));
const pendentes = arquivos.filter((f) => !aplicadas.has(f));
console.log(JSON.stringify({ schemaMigrationsExiste: true, pendentes }, null, 2));
