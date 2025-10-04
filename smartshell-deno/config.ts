// config.ts
// Небольшой .env loader (чтобы не зависеть от std/dotenv)
export async function loadDotEnvIfExists(path = ".env") {
  try {
    const raw = await Deno.readTextFile(path);
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      // strip optional surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      try {
        Deno.env.set(key, val);
      } catch {
        // ignore if not allowed
      }
    }
  } catch {
    // no .env — ignore
  }
}

export function getConfig() {
  const allowed = ["billing", "mobile-auth", "owner", "host"] as const;
  const hostRaw = Deno.env.get("SHELL_HOST") ?? "billing";
  const host = (allowed as readonly string[]).includes(hostRaw) ? (hostRaw as typeof allowed[number]) : "billing";
  return {
    host,
    login: Deno.env.get("SHELL_LOGIN") ?? "",
    password: Deno.env.get("SHELL_PASSWORD") ?? "",
    clubIds: (Deno.env.get("SHELL_CLUB_IDS") ?? "").split(",").map(s => s.trim()).filter(Boolean)
  };
}
