import { loadProjectEnv, printEnvSource } from "./load-env.mjs";

const envInfo = loadProjectEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  process.exit(1);
}

try {
  const response = await fetch(`${url}/auth/v1/settings`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });

  if (!response.ok) {
    console.error(`Supabase respondeu com status ${response.status}: ${await response.text()}`);
    process.exit(1);
  }

  console.log("Conexao publica com o Supabase confirmada.");
  console.log("Auth API acessivel com a chave publicavel.");
  printEnvSource(envInfo);
} catch (error) {
  console.error("Nao foi possivel alcancar o Supabase:", error.message);
  printEnvSource(envInfo, console.error);
  process.exit(1);
}
