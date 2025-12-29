// backend/api.ts
import { fetchBookings, fetchHosts } from "./hosts.ts";
import { shell } from "../sdk.ts";
import { tokenManager } from "../token-manager.ts";
import { SecurityUtils, loginRateLimiter, apiRateLimiter } from "../security.ts";
import { getConfig } from "../config.ts";

function cors(h = new Headers()) {
  const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";
  h.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  h.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  h.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  return h;
}

function createResponse(data: any, status = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: cors(new Headers({ "Content-Type": "application/json" })),
    },
  );
}

const config = getConfig();
const CLUB_ID = config.clubIds[0] ? Number(config.clubIds[0]) : 6242;

function validateSession(
  authHeader: string | null,
  req?: Request,
): { valid: boolean; user?: any; clientToken?: string | null } {
  console.log("[SECURITY] Session validation attempt");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("[SECURITY] Invalid auth header format");
    return { valid: false };
  }

  const token = authHeader.slice(7);
  console.log("[SECURITY] Token length:", token.length, "First 3 chars:", token.substring(0, 3));
  
  // Получаем IP и User-Agent для дополнительной безопасности
  const ip = req?.headers.get("x-forwarded-for") || "unknown";
  const userAgent = req?.headers.get("user-agent") || "unknown";
  
  const result = tokenManager.validateSession(token, ip, userAgent);
  
  if (!result.valid) {
    console.log("[SECURITY] Session validation failed:", result.error);
    return { valid: false };
  }

  console.log("[SECURITY] Session validated successfully for user:", result.sessionData?.userId);
  return {
    valid: true,
    user: result.sessionData?.user,
    clientToken: result.sessionData?.clientToken
  };
}

async function handleLogin(req: Request): Promise<Response> {
  const clientIP = req.headers.get("x-forwarded-for") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  console.log("[SECURITY] Login attempt from IP:", clientIP);
  
  try {
    const { login, password } = await req.json();
    console.log("[SECURITY] Login attempt for user:", login, "from IP:", clientIP);

    if (!login || !password) {
      SecurityUtils.logSecurityEvent('LOGIN_MISSING_CREDENTIALS', { ip: clientIP }, 'medium');
      return createResponse({ error: "Login and password required" }, 400);
    }

    // Fallback - demo авторизация (Check early to avoid unnecessary API calls)
    if (login === "demo" && password === "demo") {
      const demoUser = {
        id: "demo",
        nickname: "Demo User",
        phone: "+371 Demo",
        deposit: 15.50,
        bonus: 3.25,
        login: login,
      };

      const sessionId = tokenManager.createSession(
        "demo",
        demoUser,
        undefined,
        clientIP,
        userAgent
      );

      return createResponse({ success: true, sessionId, user: demoUser });
    }

    // Rate limiting
    const rateLimitResult = loginRateLimiter(clientIP);
    if (!rateLimitResult.allowed) {
      SecurityUtils.logSecurityEvent('LOGIN_RATE_LIMIT_EXCEEDED', {
        ip: clientIP,
        resetIn: rateLimitResult.resetIn
      }, 'high');
      const headers = cors(new Headers({ "Content-Type": "application/json", "Retry-After": String(rateLimitResult.resetIn) }));
      return new Response(JSON.stringify({ error: "Too many login attempts. Try again later." }), { status: 429, headers });
    }

    // Валидация входных данных
    const sanitizedLogin = SecurityUtils.sanitizeInput(login);
    if (!sanitizedLogin || sanitizedLogin !== login) {
      SecurityUtils.logSecurityEvent('LOGIN_INVALID_INPUT', {
        ip: clientIP,
        login: login.substring(0, 3) + "..."
      }, 'high');
      return createResponse({ error: "Invalid login format" }, 400);
    }

    const escapedPassword = password.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    try {
      // Сначала пытаемся авторизоваться
      const loginMutation = `
        mutation {
          clientLogin(input: {
            login: "${sanitizedLogin}"
            password: "${escapedPassword}"
          }) {
            access_token
            token_type
            expires_in
          }
        }
      `;

      const loginResult: any = await shell.call(loginMutation as any);

      if (loginResult?.errors?.length) {
        SecurityUtils.logSecurityEvent('LOGIN_FAILED', {
          login: sanitizedLogin,
          ip: clientIP,
          error: loginResult.errors[0].message
        }, 'medium');
        return createResponse({ success: false, error: "Неверный логин или пароль" }, 401);
      }

      if (!loginResult?.clientLogin?.access_token) {
        return createResponse({ success: false, error: "Неверный логин или пароль" }, 401);
      }
      const clientToken = loginResult.clientLogin.access_token;

      // Теперь получаем данные пользователя
      const clientQuery = `
        query {
          clients(input: { q: "${sanitizedLogin}" }) {
            data {
              id
              nickname
              phone
              login
              deposit
              bonus
            }
          }
        }
      `;

      const clientResult: any = await shell.call(clientQuery as any);

      if (clientResult?.errors?.length) {
        console.error("Client fetch error:", clientResult.errors);
      }

      const clients = clientResult?.clients?.data ?? [];
      let client = null;

      if (clients.length > 0) {
        // Ищем клиента с точным совпадением логина/телефона
        client = clients.find((c: any) =>
          c.login === login || c.phone === login
        ) || clients[0];
      }

      // Создаем сессию с использованием нового менеджера токенов
      const userData = client
        ? {
          id: client.id,
          nickname: client.nickname || client.login || login,
          phone: client.phone || login,
          deposit: client.deposit || 0,
          bonus: client.bonus || 0,
          login: login,
        }
        : {
          id: "temp",
          nickname: login,
          phone: login,
          deposit: 0,
          bonus: 0,
          login: login,
        };

      const sessionId = tokenManager.createSession(
        client?.id || "temp",
        userData,
        clientToken,
        clientIP,
        userAgent
      );

      console.log("[SECURITY] Login successful for user:", login, "ID:", userData.id, "from IP:", clientIP);
      return createResponse({ success: true, sessionId, user: userData });
    } catch (apiError) {
      console.error("SmartShell API error:", apiError);
      return createResponse({ success: false, error: "Ошибка сервера авторизации" }, 500);
    }
  } catch (err) {
    console.error("Login error:", err);
    return createResponse({ success: false, error: "Ошибка обработки запроса" }, 500);
  }
}

async function handleCreateBooking(req: Request): Promise<Response> {
  const clientIP = req.headers.get("x-forwarded-for") || "unknown";
  
  try {
    // Проверяем авторизацию
    const authResult = validateSession(req.headers.get("Authorization"), req);
    if (!authResult.valid) {
      return createResponse({ error: "Unauthorized" }, 401);
    }

    const { phone, from, duration, hostIds, comment } = await req.json();

    // Валидация входных данных
    if (!from || !duration || !hostIds || !Array.isArray(hostIds) || hostIds.length === 0) {
      SecurityUtils.logSecurityEvent('BOOKING_MISSING_FIELDS', {
        ip: clientIP,
        hasFrom: !!from,
        hasDuration: !!duration,
        hasHostIds: !!hostIds
      }, 'medium');
      return createResponse({ error: "Missing required fields" }, 400);
    }

    // Валидация ID хостов
    for (const hostId of hostIds) {
      if (!SecurityUtils.isValidId(hostId)) {
        SecurityUtils.logSecurityEvent('BOOKING_INVALID_HOST_ID', {
          ip: clientIP,
          hostId
        }, 'high');
        return createResponse({ error: "Invalid host ID" }, 400);
      }
    }

    // Валидация duration
    const durationNum = Number(duration);
    if (!Number.isInteger(durationNum) || durationNum < 1 || durationNum > 24) {
      SecurityUtils.logSecurityEvent('BOOKING_INVALID_DURATION', {
        ip: clientIP,
        duration
      }, 'medium');
        return createResponse({ error: "Duration must be between 1 and 24 hours" }, 400);
    }

    // Валидация даты
    const bookingFromDate = new Date(from);
    if (isNaN(bookingFromDate.getTime()) || bookingFromDate < new Date()) {
      SecurityUtils.logSecurityEvent('BOOKING_INVALID_DATE', {
        ip: clientIP,
        from
      }, 'medium');
        return createResponse({ error: "Invalid booking date" }, 400);
    }

    // Санитизация комментария
    const sanitizedComment = comment ? SecurityUtils.sanitizeHTML(comment) : "";

    // Функция для форматирования времени в рижском часовом поясе
    function formatToRigaTime(date: Date): string {
      return date.toLocaleString("sv-SE", {
        timeZone: "Europe/Riga",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).replace("T", " ");
    }

    const toDate = new Date(bookingFromDate.getTime() + duration * 3600 * 1000);

    // Добавляем минимальный отступ времени
    const now = new Date();
    const minTime = new Date(now.getTime() + 15 * 60 * 1000); // +15 минут

    if (bookingFromDate < minTime) {
      bookingFromDate.setTime(minTime.getTime());
      toDate.setTime(bookingFromDate.getTime() + duration * 3600 * 1000);
    }

    // Используем ID клиента из сессии
    const clientId = authResult.user.id;

    const bookingMutation = `
      mutation {
        createBooking(input: {
          client: ${clientId}
          from: "${formatToRigaTime(bookingFromDate)}"
          to: "${formatToRigaTime(toDate)}"
          hosts: [${hostIds.join(", ")}]
          comment: "${sanitizedComment}"
        }) {
          id
          status
          from
          to
        }
      }
    `;

    const result: any = await shell.call(bookingMutation as any);

    if (result?.errors?.length) {
      console.error(`Booking error:`, result.errors);
      return createResponse({ error: result.errors[0].message }, 400);
    }

    if (result?.createBooking) {
      return createResponse({
        success: true,
        id: result.createBooking.id,
        booking: result.createBooking,
      });
    }

    return createResponse({ error: "Failed to create booking" }, 500);
  } catch (err) {
    console.error("Create booking error:", err);
    return createResponse({ error: "Server error" }, 500);
  }
}

async function handleGetHosts(req: Request): Promise<Response> {
  try {
    const hosts = await fetchHosts();
    return createResponse(hosts);
  } catch (err) {
    console.error("Get hosts error:", err);
    return createResponse({ error: "Failed to fetch hosts" }, 500);
  }
}
async function handleGetShortcuts(req: Request): Promise<Response> {
  try {
    const shortcutsQuery = `
      query {
        shortcuts {
          id
          title
          path
          popular
          type
          main_picture
          icon_path
          group {
            id
            title
            groupType
          }
          game_account_group {
            id
            title
            launcher
          }
          age_rating
          free_run
        }
      }
    `;

    const result: any = await shell.call(shortcutsQuery as any);

    if (result?.errors?.length) {
      console.error("Shortcuts error:", result.errors);
      return createResponse({ error: "Failed to fetch shortcuts" }, 500);
    }

    const shortcuts = result?.shortcuts || result?.data?.shortcuts || [];
    return createResponse(shortcuts);
  } catch (err) {
    console.error("Get shortcuts error:", err);
    return createResponse({ error: "Server error" }, 500);
  }
}
async function handleGetBookings(req: Request): Promise<Response> {
  try {
    const bookings = await fetchBookings();
    return createResponse(bookings);
  } catch (err) {
    console.error("Get bookings error:", err);
    return createResponse({ error: "Failed to fetch bookings" }, 500);
  }
}

async function handleGetClientPayments(req: Request): Promise<Response> {
  try {
    const authHeader = req.headers.get("Authorization");
    const authResult = validateSession(authHeader, req);

    if (!authResult.valid || !authResult.user) {
      return createResponse({ total: 0, bonus: 0, count: 0 }, 401);
    }

    const clientLogin = authResult.user.login || authResult.user.phone;

    // Получаем UUID клиента
    const clientQuery = `
      query {
        clients(input: { q: "${clientLogin}" }) {
          data {
            id
            uuid
          }
        }
      }
    `;

    const clientResult: any = await shell.call(clientQuery as any);

    if (clientResult?.errors?.length) {
      console.error("Client UUID fetch error:", clientResult.errors);
      return createResponse({ total: 0, bonus: 0, count: 0 });
    }

    const clients = clientResult?.clients?.data || [];
    const client = clients[0];

    if (!client?.uuid) {
      console.error("Client UUID not found");
      return createResponse({ total: 0, bonus: 0, count: 0 });
    }

    // Собираем все платежи с page-based пагинацией
    let allPayments: any[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const query = `
        query {
          getPaymentsByClientId(
            uuid: "${client.uuid}"
            page: ${currentPage}
            first: 100
          ) {
            data {
              created_at
              sum
              bonus
              is_refunded
              paymentMethod
            }
            paginatorInfo {
              currentPage
              lastPage
              total
            }
          }
        }
      `;

      const result: any = await shell.call(query as any);

      if (result?.errors?.length) {
        console.error("Payments error page", currentPage, ":", result.errors);
        break;
      }

      const paymentsData = result?.getPaymentsByClientId?.data || [];
      const paginatorInfo = result?.getPaymentsByClientId?.paginatorInfo;

      allPayments = allPayments.concat(paymentsData);

      console.log(`[Payments] Page ${currentPage}/${paginatorInfo?.lastPage || '?'}, fetched ${paymentsData.length}, total so far: ${allPayments.length}`);

      // Проверяем, есть ли ещё страницы
      if (paginatorInfo && currentPage < paginatorInfo.lastPage) {
        currentPage++;
      } else {
        hasMore = false;
      }

      // Защита от бесконечного цикла
      if (currentPage > 100) {
        console.warn('[Payments] Stopping after 100 pages');
        break;
      }
    }

    console.log(`[Payments] Total fetched: ${allPayments.length} payments`);

    // Фильтруем с сентября 2024, только CASH и CARD
    const septemberStart = new Date('2024-09-01T00:00:00Z');
    
    const validPayments = allPayments.filter((p: any) => {
      if (p.is_refunded) return false;
      
      const paymentDate = new Date(p.created_at);
      if (paymentDate < septemberStart) return false;
      
      // Проверяем метод оплаты (учитываем разные варианты написания)
      const method = p.paymentMethod?.toUpperCase();
      return method === 'CASH' || method === 'CARD';
    });
    
    console.log(`[Payments] After filtering (Sep 2024+, no refunds, CASH/CARD only): ${validPayments.length} payments`);

    // Считаем суммы
    const totalSum = validPayments.reduce((acc: number, p: any) => acc + (p.sum || 0), 0);
    const totalBonus = validPayments.reduce((acc: number, p: any) => acc + (p.bonus || 0), 0);

    return createResponse({
      total: totalSum.toFixed(2),
      bonus: totalBonus.toFixed(2),
      count: validPayments.length,
      average: validPayments.length > 0 ? (totalSum / validPayments.length).toFixed(2) : '0.00'
    });
  } catch (err) {
    console.error("Get payments error:", err);
    return createResponse({ total: 0, bonus: 0, count: 0 }, 500);
  }
}


async function handleGetLeaderboard(req: Request): Promise<Response> {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const from = new Date(year, month, 1);
    const to = new Date(year, month + 1, 0, 23, 59, 59);

    // Форматируем в Y-m-d H:i:s
    const formatDate = (date: Date) => {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${
        pad(date.getDate())
      } ${pad(date.getHours())}:${pad(date.getMinutes())}:${
        pad(date.getSeconds())
      }`;
    };

    const fromStr = formatDate(from);
    const toStr = formatDate(to);

    const query = `
      query {
        leaderboard(companyId: ${CLUB_ID}, from: "${fromStr}", to: "${toStr}") {
          userId
          nickname
          name
          avatarUrl
          totalTime
        }
      }
    `;

    const result: any = await shell.call(query as any);

    if (result?.errors?.length) {
      console.error("Leaderboard error:", result.errors);
      return createResponse([]);
    }

    const leaderboard = result?.leaderboard || [];

    return createResponse({
      month: month + 1,
      year: year,
      leaders: leaderboard,
    });
  } catch (err) {
    console.error("Get leaderboard error:", err);
    return createResponse([], 500);
  }
}

async function handleCancelBooking(req: Request): Promise<Response> {
  try {
    const authHeader = req.headers.get("Authorization");
    const authResult = validateSession(authHeader, req);

    if (!authResult.valid || !authResult.user) {
      return createResponse({ error: "Unauthorized" }, 401);
    }

    const { bookingId } = await req.json();

    if (!bookingId) {
      return createResponse({ error: "Booking ID required" }, 400);
    }

    const mutation = `
      mutation {
        setBookingStatus(id: ${bookingId}, status: CANCELED) {
          id
          status
        }
      }
    `;

    const result: any = await shell.call(mutation as any);

    if (result?.errors?.length) {
      console.error("Cancel booking error:", result.errors);
      return createResponse({ error: result.errors[0].message }, 400);
    }

    return createResponse({ success: true, booking: result.setBookingStatus });
  } catch (err) {
    console.error("Cancel booking error:", err);
    return createResponse({ error: "Server error" }, 500);
  }
}

async function handleGetAchievements(req: Request): Promise<Response> {
  try {
    const authResult = validateSession(req.headers.get("Authorization"), req);

    if (!authResult.valid || !authResult.clientToken) {
      return createResponse([], 401);
    }

    // Используем существующий shell с токеном клиента
    const query = `
      query {
        myClub(id: ${CLUB_ID}) {
          achievements {
            single {
              id name icon_url has progress
              conditions { name value }
              rewards { name value }
            }
            continuous {
              id name icon_url has progress
              conditions { name value }
              rewards { name value }
            }
          }
        }
      }
    `;

    // Передаём токен клиента вторым параметром
    const result: any = await shell.call(query as any, authResult.clientToken);

    if (result?.errors?.length) {
      console.error("Achievements error:", result.errors);
      return createResponse([]);
    }

    const achievements = result?.myClub?.achievements;

    if (!achievements) {
      return createResponse([]);
    }

    const allAchievements = [
      ...(achievements.single || []),
      ...(achievements.continuous || []),
    ];

    return createResponse(allAchievements);
  } catch (err) {
    console.error("Get achievements error:", err);
    return createResponse([], 500);
  }
}

export async function handleApiRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const method = req.method;
  const clientIP = req.headers.get("x-forwarded-for") || "unknown";

  // Rate limiting для всех API запросов
  const rateLimitResult = apiRateLimiter(clientIP);
  if (!rateLimitResult.allowed) {
    SecurityUtils.logSecurityEvent('API_RATE_LIMIT_EXCEEDED', {
      ip: clientIP,
      path: pathname,
      method
    }, 'medium');
    return new Response(
      JSON.stringify({ error: "Too many requests. Try again later." }),
      {
        status: 429,
        headers: cors(new Headers({
          "Content-Type": "application/json",
          "Retry-After": String(rateLimitResult.resetIn || 60)
        })),
      },
    );
  }

  // Handle OPTIONS requests for CORS
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: cors(),
    });
  }

  // API Routes
  switch (true) {
    case method === "POST" && pathname === "/api/login":
      return handleLogin(req);

    case method === "POST" && pathname === "/api/bookings":
      return handleCreateBooking(req);

    case method === "GET" && pathname === "/api/hosts":
      return handleGetHosts(req);

    case method === "GET" && pathname === "/api/bookings":
      return handleGetBookings(req);

    case method === "GET" && pathname === "/api/shortcuts":
      return handleGetShortcuts(req);

    case method === "GET" && pathname === "/api/achievements":
      return handleGetAchievements(req);

    case method === "GET" && pathname === "/api/leaderboard":
      return handleGetLeaderboard(req);
    case method === "GET" && pathname === "/api/payments": // ← НОВЫЙ РОУТ
      return handleGetClientPayments(req);
    
    case method === "DELETE" && pathname.startsWith("/api/bookings/"):
      const bookingId = pathname.split("/").pop();
      return handleCancelBooking(req);

    default:
      return createResponse({ error: "Not found" }, 404);
  }
}
