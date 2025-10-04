// sdk.ts
import { Shell, type ShellApiVHost } from "jsr:@xlsoftware/smartshell-sdk";
import { loadDotEnvIfExists, getConfig } from "./config.ts";

await loadDotEnvIfExists();
const cfg = getConfig();

// ✅ Добавляем await перед new Shell()
export const shell = await new Shell({
  host: cfg.host as ShellApiVHost,
  credentials: (cfg.login && cfg.password) ? { login: cfg.login, password: cfg.password } : undefined,
  anonymous: false, // ✅ Явно указываем что не анонимный режим
  club: cfg.clubId ? parseInt(cfg.clubId) : undefined, // ✅ Добавляем club ID если есть
});

shell.catch = (errs) => {
  console.error("[SmartShell SDK ERROR]", errs);
};

console.log("[SDK] host:", cfg.host, "| login:", !!cfg.login ? "(provided)" : "(not provided)");