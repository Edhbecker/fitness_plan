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

const storageProvider = (process.env.STORAGE_PROVIDER ?? "local").trim().toLowerCase();
if (!["local", "r2"].includes(storageProvider)) errors.push("STORAGE_PROVIDER deve ser local ou r2.");

if (storageProvider === "local") {
  warnings.push("STORAGE_PROVIDER esta como local; em producao, imagens enviadas podem nao persistir na hospedagem.");
}

if (storageProvider === "r2") {
  for (const key of ["R2_BUCKET", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"]) {
    if (!process.env[key]?.trim()) errors.push(`${key} nao esta configurada para o Cloudflare R2.`);
  }

  const r2Endpoint = process.env.R2_ENDPOINT?.trim();
  const r2AccountId = process.env.R2_ACCOUNT_ID?.trim();
  if (!r2Endpoint && !r2AccountId) errors.push("Defina R2_ENDPOINT ou R2_ACCOUNT_ID para conectar ao Cloudflare R2.");

  if (r2Endpoint) {
    try {
      const url = new URL(r2Endpoint);
      if (url.protocol !== "https:") errors.push("R2_ENDPOINT deve usar https.");
    } catch {
      errors.push("R2_ENDPOINT nao e uma URL valida.");
    }
  }
}

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
