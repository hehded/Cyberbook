// main.ts
import { shell } from "./sdk.ts";

async function main() {
  try {
    console.log("Smoke test: SDK init...");

    try {
      const club = await shell.api.currentClub();
      console.log("Club:", club?.name ?? "-", "ID:", club?.id ?? "-");
    } catch (e: any) {
      console.warn("currentClub failed:", e?.message ?? e);
    }

    try {
      const groups = await shell.api.hostGroups();
      console.log("Host groups:", groups.length);
      for (const g of groups) console.log(" -", g.title, `(ID: ${g.id})`);
    } catch (e: any) {
      console.warn("hostGroups failed:", e?.message ?? e);
    }

    try {
      const q = `
        query {
          hosts {
            id
            alias
            online
            in_service
            ip_addr
          }
        }
      `;
      const res: any = await shell.call(q as any);
      const hosts = res?.data?.hosts ?? res?.hosts ?? [];
      console.log("Hosts:", hosts.length);
    } catch (e: any) {
      console.warn("hosts call failed:", e?.message ?? e);
    }

    console.log("Smoke test finished.");
  } catch (err) {
    console.error(err);
  }
}

if (import.meta.main) await main();
