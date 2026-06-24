import { loadProjectEnv } from "./load-env.mjs";

const envInfo = loadProjectEnv();

const required = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "AUTH_SECRET",
  "AUTH_URL",
];
const errors = [];
const warnings = [];

for (const key of required) {
  if (!process.env[key]?.trim()) errors.push(`${key} nao esta configurada.`);
}

if ((process.env.AUTH_SECRET?.length ?? 0) < 32) errors.push("AUTH_SECRET deve ter pelo menos 32 caracteres.");
if (process.env.AUTH_TRUST_HOST !== "true") warnings.push('Defina AUTH_TRUST_HOST="true" na hospedagem.');
if (process.env.AUTH_URL?.includes("localhost")) warnings.push("AUTH_URL ainda aponta para localhost.");
if (envInfo.hasEnvLocal) warnings.push(".env.local existe, mas este check usa .env para simular a producao.");

for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
  try {
    const url = new URL(process.env[key] ?? "");
    if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") errors.push(`${key} nao e uma URL PostgreSQL.`);
  } catch {
    errors.push(`${key} nao e uma URL valida.`);
  }
}

if (warnings.length) {
  console.warn("Avisos de producao:");
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length) {
  console.error("Ambiente ainda nao esta pronto para producao:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Variaveis obrigatorias de producao estao configuradas.");
