import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

export function loadProjectEnv() {
  const envPath = path.join(process.cwd(), ".env");
  const envLocalPath = path.join(process.cwd(), ".env.local");
  const result = dotenv.config({ path: envPath });

  if (result.error && result.error.code !== "ENOENT") {
    throw result.error;
  }

  return {
    hasEnvLocal: fs.existsSync(envLocalPath),
    loadedEnv: !result.error,
  };
}

export function printEnvSource(envInfo, log = console.log) {
  log(envInfo.loadedEnv ? "Ambiente carregado de .env." : "Ambiente carregado das variaveis do sistema.");
  if (envInfo.hasEnvLocal) log("Observacao: .env.local existe, mas foi ignorado por este script.");
}
