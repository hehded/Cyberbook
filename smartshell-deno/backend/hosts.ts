// backend/hosts.ts
import { shell } from "../sdk.ts";

export type Booking = {
  id: number;
  from: string;
  to: string;
  status: string;
  client?: {
    id: number;
    nickname?: string;
    phone?: string;
  };
  hosts: Array<{ id: number; alias?: string }>;
};

export type Host = {
  id: number | string;
  alias?: string | null;
  ip_addr?: string | null;
  coord_x?: number | null;
  coord_y?: number | null;
  group?: { id: string; title?: string } | null;
  session?: {
    user: string | null;
    started_at: string | null;
    duration: number | null;
    elapsed: number | null;
    time_left: number | null;
  } | null;
};

const cache: Record<string, { ts: number; data: unknown }> = {};
const put = (k: string, data: unknown, ttl = 2000) => (cache[k] = { ts: Date.now() + ttl, data });
const getCached = (k: string) => (cache[k] && cache[k].ts > Date.now() ? cache[k].data : undefined);

export async function fetchHosts(clubId?: string): Promise<Host[]> {
  const cacheKey = `hosts:${clubId ?? "default"}`;
  const cached = getCached(cacheKey);
  if (cached) return cached as Host[];

  const q = `
    query {
      hosts {
        id
        alias
        ip_addr
        coord_x
        coord_y
        online
        in_service
        group { id title }
        client_sessions {
          id
          duration
          elapsed
          started_at
          finished_at
          time_left
          status
          client { nickname }
        }
      }
    }
  `;

  try {
    const res: any = await shell.call(q as any);
    if (res?.errors?.length) {
      console.warn("[fetchHosts] GraphQL ошибки:", res.errors);
      return (cached as Host[]) ?? [];
    }

    const raw = res?.data?.hosts ?? res?.hosts ?? [];
    if (!Array.isArray(raw)) return (cached as Host[]) ?? [];

    const hosts: Host[] = raw
      .filter(Boolean)
      .map((h: any) => {
        if (!h || typeof h !== "object") return null;

        let session = null;
        if (Array.isArray(h.client_sessions) && h.client_sessions.length > 0) {
          const active = h.client_sessions.find((s: any) =>
            s && (!s.finished_at || s.finished_at === null || s.status === "ACTIVE")
          );
          if (active) {
            session = {
              user: active.client?.nickname ?? null,
              started_at: active.started_at ?? null,
              duration: active.duration ?? null,
              elapsed: active.elapsed ?? null,
              time_left: active.time_left ?? null,
            };
          }
        }

        const gx = h.coord_x != null ? Number(h.coord_x) : undefined;
        const gy = h.coord_y != null ? Number(h.coord_y) : undefined;
        const group = h.group?.id
          ? { id: String(h.group.id), title: h.group.title ?? "" }
          : null;

        return {
          id: h.id,
          alias: h.alias ?? null,
          ip_addr: h.ip_addr ?? null,
          coord_x: Number.isFinite(gx as number) ? gx : undefined,
          coord_y: Number.isFinite(gy as number) ? gy : undefined,
          group,
          session,
        } as Host;
      })
      .filter(Boolean) as Host[];

    put(cacheKey, hosts, 3000);
    return hosts;
  } catch (err: any) {
    console.error("[fetchHosts] Ошибка:", err?.message ?? err);
    return (cached as Host[]) ?? [];
  }
}

export async function fetchBookings(): Promise<Booking[]> {
  const now = new Date();
  const inWeek = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  const formatDate = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };
  
  const q = `
    query {
      getBookings(
        from: "${formatDate(now)}"
        to: "${formatDate(inWeek)}"
        status: "ACTIVE"
      ) {
        data {
          id
          from
          to
          status
          client {
            id
            nickname
            phone
          }
          hosts
        }
      }
    }
  `;

  try {
    const res: any = await shell.call(q as any);
    
    if (res?.errors?.length) {
      console.warn("[fetchBookings] GraphQL ошибки:", res.errors);
      return [];
    }

    const bookingsData = res?.getBookings?.data ?? [];
    
    console.log('[fetchBookings] Raw API response count:', bookingsData.length);
    
    // Группируем по: время + клиент + отсортированный список хостов
    const groupKey = (b: any) => {
      const clientId = b.client?.id || 'guest';
      const sortedHosts = [...(b.hosts || [])].sort((a, b) => a - b).join(',');
      return `${b.from}_${b.to}_${clientId}_${sortedHosts}`;
    };
    
    const uniqueMap = new Map();
    for (const b of bookingsData) {
      const key = groupKey(b);
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, b);
      }
    }
    
    const uniqueBookingsData = Array.from(uniqueMap.values());
    console.log('[fetchBookings] After deduplication:', uniqueBookingsData.length);
    
    const allHosts = await fetchHosts();
    
    const bookings = uniqueBookingsData.map((b: any) => {
      const hostIds = Array.isArray(b.hosts) ? b.hosts : [b.hosts];
      
      const hostDetails = hostIds
        .filter((id: any) => id != null)
        .map((hostId: number) => {
          const host = allHosts.find(h => h.id == hostId);
          return {
            id: hostId,
            alias: host?.alias || `ПК ${hostId}`
          };
        });
      
      return {
        id: b.id,
        from: b.from,
        to: b.to,
        status: b.status,
        client: b.client,
        hosts: hostDetails
      };
    });
    
    console.log('[fetchBookings] Final bookings count:', bookings.length);
    
    return bookings;
    
  } catch (err: any) {
    console.error("[fetchBookings] Ошибка:", err?.message ?? err);
    return [];
  }
}