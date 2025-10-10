// sdk.ts
import { Shell, type ShellApiVHost } from "jsr:@xlsoftware/smartshell-sdk";
import { loadDotEnvIfExists, getConfig } from "./config.ts";

await loadDotEnvIfExists();
const cfg = getConfig();


export const shell = await new Shell({
  host: cfg.host as ShellApiVHost,
  credentials: (cfg.login && cfg.password) ? { login: cfg.login, password: cfg.password } : undefined,
  anonymous: false, 
  club: cfg.clubId ? parseInt(cfg.clubId) : undefined, 
});

shell.catch = (errs) => {
  console.error("[SmartShell SDK ERROR]", errs);
};

console.log("[SDK] host:", cfg.host, "| login:", !!cfg.login ? "(provided)" : "(not provided)");