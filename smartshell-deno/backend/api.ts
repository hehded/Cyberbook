// backend/api.ts
import { fetchBookings, fetchHosts } from "./hosts.ts";
import { shell } from "../sdk.ts";

// Простое хранилище сессий (в продакшене использовать Redis или базу данных)
const sessions = new Map<
  string,
  { userId: string; user: any; createdAt: number }
>();
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 часа

function cors(h = new Headers()) {
  const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";
  h.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  h.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  h.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  return h;
}

function generateSessionId(): string {
  return crypto.randomUUID();
}

function validateSession(
  authHeader: string | null,
): { valid: boolean; user?: any; clientToken?: string | null } {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false };
  }

  const token = authHeader.slice(7);
  const session = sessions.get(token);

  if (!session) {
    return { valid: false };
  }

  // Проверяем время жизни сессии
  if (Date.now() - session.createdAt > SESSION_TIMEOUT) {
    sessions.delete(token);
    return { valid: false };
  }

  return { valid: true, user: session.user, clientToken: session.clientToken };
}

async function handleLogin(req: Request): Promise<Response> {
  try {
    const { login, password } = await req.json();

    if (!login || !password) {
      return new Response(
        JSON.stringify({ error: "Login and password required" }),
        {
          status: 400,
          headers: cors(new Headers({ "Content-Type": "application/json" })),
        },
      );
    }

    try {
      // Сначала пытаемся авторизоваться
      const loginMutation = `
        mutation {
          clientLogin(input: {
            login: "${login}"
            password: "${password}"
          }) {
            access_token
            token_type
            expires_in
          }
        }
      `;

      const loginResult: any = await shell.call(loginMutation as any);

      if (loginResult?.errors?.length) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Неверный логин или пароль",
          }),
          {
            status: 401,
            headers: cors(new Headers({ "Content-Type": "application/json" })),
          },
        );
      }

      if (!loginResult?.clientLogin?.access_token) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Неверный логин или пароль",
          }),
          {
            status: 401,
            headers: cors(new Headers({ "Content-Type": "application/json" })),
          },
        );
      }
      const clientToken = loginResult.clientLogin.access_token;

      // Теперь получаем данные пользователя
      const clientQuery = `
        query {
          clients(input: { q: "${login}" }) {
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

      // Создаем сессию
      const sessionId = generateSessionId();
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

      sessions.set(sessionId, {
        userId: client?.id || "temp",
        user: userData,
        createdAt: Date.now(),
        clientToken: clientToken,
      });

      return new Response(
        JSON.stringify({
          success: true,
          sessionId,
          user: userData,
        }),
        {
          status: 200,
          headers: cors(new Headers({ "Content-Type": "application/json" })),
        },
      );
    } catch (apiError) {
      console.error("SmartShell API error:", apiError);

      // Fallback - демо авторизация
      if (login === "demo" && password === "demo") {
        const sessionId = generateSessionId();
        const demoUser = {
          id: "demo",
          nickname: "Demo User",
          phone: "+371 Demo",
          deposit: 15.50,
          bonus: 3.25,
          login: login,
        };

        sessions.set(sessionId, {
          userId: "demo",
          user: demoUser,
          createdAt: Date.now(),
        });

        return new Response(
          JSON.stringify({
            success: true,
            sessionId,
            user: demoUser,
          }),
          {
            status: 200,
            headers: cors(new Headers({ "Content-Type": "application/json" })),
          },
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: "Ошибка сервера авторизации",
        }),
        {
          status: 500,
          headers: cors(new Headers({ "Content-Type": "application/json" })),
        },
      );
    }
  } catch (err) {
    console.error("Login error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Ошибка обработки запроса",
      }),
      {
        status: 500,
        headers: cors(new Headers({ "Content-Type": "application/json" })),
      },
    );
  }
}

async function handleCreateBooking(req: Request): Promise<Response> {
  try {
    // Проверяем авторизацию
    const authResult = validateSession(req.headers.get("Authorization"));
    if (!authResult.valid) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: cors(new Headers({ "Content-Type": "application/json" })),
      });
    }

    const { phone, from, duration, hostIds, comment } = await req.json();

    if (
      !from || !duration || !hostIds || !Array.isArray(hostIds) ||
      hostIds.length === 0
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: cors(new Headers({ "Content-Type": "application/json" })),
        },
      );
    }

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

    const fromDate = new Date(from);
    const toDate = new Date(fromDate.getTime() + duration * 1000);

    // Добавляем минимальный отступ времени
    const now = new Date();
    const minTime = new Date(now.getTime() + 15 * 60 * 1000); // +15 минут

    if (fromDate < minTime) {
      fromDate.setTime(minTime.getTime());
      toDate.setTime(fromDate.getTime() + duration * 1000);
    }

    // Используем ID клиента из сессии
    const clientId = authResult.user.id;

    const bookingMutation = `
      mutation {
        createBooking(input: {
          client: ${clientId}
          from: "${formatToRigaTime(fromDate)}"
          to: "${formatToRigaTime(toDate)}"
          hosts: [${hostIds.join(", ")}]
          comment: "${comment || ""}"
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
      return new Response(
        JSON.stringify({
          error: result.errors[0].message,
        }),
        {
          status: 400,
          headers: cors(new Headers({ "Content-Type": "application/json" })),
        },
      );
    }

    if (result?.createBooking) {
      return new Response(
        JSON.stringify({
          success: true,
          id: result.createBooking.id,
          booking: result.createBooking,
        }),
        {
          status: 200,
          headers: cors(new Headers({ "Content-Type": "application/json" })),
        },
      );
    }

    return new Response(JSON.stringify({ error: "Failed to create booking" }), {
      status: 500,
      headers: cors(new Headers({ "Content-Type": "application/json" })),
    });
  } catch (err) {
    console.error("Create booking error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: cors(new Headers({ "Content-Type": "application/json" })),
    });
  }
}

async function handleGetHosts(req: Request): Promise<Response> {
  try {
    const hosts = await fetchHosts();
    return new Response(JSON.stringify(hosts), {
      status: 200,
      headers: cors(new Headers({ "Content-Type": "application/json" })),
    });
  } catch (err) {
    console.error("Get hosts error:", err);
    return new Response(JSON.stringify({ error: "Failed to fetch hosts" }), {
      status: 500,
      headers: cors(new Headers({ "Content-Type": "application/json" })),
    });
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
      return new Response(
        JSON.stringify({ error: "Failed to fetch shortcuts" }),
        {
          status: 500,
          headers: cors(new Headers({ "Content-Type": "application/json" })),
        },
      );
    }

    const shortcuts = result?.shortcuts || result?.data?.shortcuts || [];
    return new Response(JSON.stringify(shortcuts), {
      status: 200,
      headers: cors(new Headers({ "Content-Type": "application/json" })),
    });
  } catch (err) {
    console.error("Get shortcuts error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: cors(new Headers({ "Content-Type": "application/json" })),
    });
  }
}
async function handleGetBookings(req: Request): Promise<Response> {
  try {
    const bookings = await fetchBookings();
    return new Response(JSON.stringify(bookings), {
      status: 200,
      headers: cors(new Headers({ "Content-Type": "application/json" })),
    });
  } catch (err) {
    console.error("Get bookings error:", err);
    return new Response(JSON.stringify({ error: "Failed to fetch bookings" }), {
      status: 500,
      headers: cors(new Headers({ "Content-Type": "application/json" })),
    });
  }
}

async function handleGetClientPayments(req: Request): Promise<Response> {
  try {
    const authHeader = req.headers.get("Authorization");
    const authResult = validateSession(authHeader);

    if (!authResult.valid || !authResult.user) {
      return new Response(JSON.stringify({ total: 0, count: 0 }), {
        status: 401,
        headers: cors(new Headers({ "Content-Type": "application/json" })),
      });
    }

    const clientId = authResult.user.id;
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
      return new Response(JSON.stringify({ total: 0, count: 0 }), {
        status: 200,
        headers: cors(new Headers({ "Content-Type": "application/json" })),
      });
    }

    const clients = clientResult?.clients?.data || [];
    const client = clients.find((c: any) => c.id === clientId) || clients[0];

    if (!client?.uuid) {
      console.error("Client UUID not found");
      return new Response(JSON.stringify({ total: 0, count: 0 }), {
        status: 200,
        headers: cors(new Headers({ "Content-Type": "application/json" })),
      });
    }

    // Получаем платежи - правильные поля из документации
    const query = `
      query {
        getPaymentsByClientId(uuid: "${client.uuid}") {
          data {
            created_at
            title
            sum
            bonus
            card_sum
            cash_sum
            is_refunded
          }
        }
      }
    `;

    const result: any = await shell.call(query as any);

    if (result?.errors?.length) {
      console.error("Payments error:", result.errors);
      return new Response(JSON.stringify({ total: 0, count: 0 }), {
        status: 200,
        headers: cors(new Headers({ "Content-Type": "application/json" })),
      });
    }

    const payments = result?.getPaymentsByClientId?.data || [];

    // Считаем только не возвращённые платежи
    const validPayments = payments.filter((p: any) => !p.is_refunded);
    const totalSum = validPayments.reduce(
      (sum: number, p: any) => sum + (p.sum || 0),
      0,
    );
    // const totalBonus = validPayments.reduce((sum: number, p: any) => sum + (p.bonus || 0), 0);

    return new Response(
      JSON.stringify({
        total: totalSum.toFixed(2),
        // totalBonus: totalBonus.toFixed(2),
        count: validPayments.length,
        payments: validPayments,
      }),
      {
        status: 200,
        headers: cors(new Headers({ "Content-Type": "application/json" })),
      },
    );
  } catch (err) {
    console.error("Get payments error:", err);
    return new Response(JSON.stringify({ total: 0, count: 0 }), {
      status: 500,
      headers: cors(new Headers({ "Content-Type": "application/json" })),
    });
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
        leaderboard(companyId: 6242, from: "${fromStr}", to: "${toStr}") {
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
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: cors(new Headers({ "Content-Type": "application/json" })),
      });
    }

    const leaderboard = result?.leaderboard || [];

    return new Response(
      JSON.stringify({
        month: month + 1,
        year: year,
        leaders: leaderboard,
      }),
      {
        status: 200,
        headers: cors(new Headers({ "Content-Type": "application/json" })),
      },
    );
  } catch (err) {
    console.error("Get leaderboard error:", err);
    return new Response(JSON.stringify([]), {
      status: 500,
      headers: cors(new Headers({ "Content-Type": "application/json" })),
    });
  }
}

async function handleCancelBooking(req: Request): Promise<Response> {
  try {
    const authHeader = req.headers.get("Authorization");
    const authResult = validateSession(authHeader);

    if (!authResult.valid || !authResult.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: cors(new Headers({ "Content-Type": "application/json" })),
      });
    }

    const { bookingId } = await req.json();

    if (!bookingId) {
      return new Response(JSON.stringify({ error: "Booking ID required" }), {
        status: 400,
        headers: cors(new Headers({ "Content-Type": "application/json" })),
      });
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
      return new Response(
        JSON.stringify({ error: result.errors[0].message }),
        {
          status: 400,
          headers: cors(new Headers({ "Content-Type": "application/json" })),
        },
      );
    }

    return new Response(
      JSON.stringify({ success: true, booking: result.setBookingStatus }),
      {
        status: 200,
        headers: cors(new Headers({ "Content-Type": "application/json" })),
      },
    );
  } catch (err) {
    console.error("Cancel booking error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: cors(new Headers({ "Content-Type": "application/json" })),
    });
  }
}

async function handleGetAchievements(req: Request): Promise<Response> {
  try {
    const authResult = validateSession(req.headers.get("Authorization"));

    if (!authResult.valid || !authResult.clientToken) {
      return new Response(JSON.stringify([]), {
        status: 401,
        headers: cors(new Headers({ "Content-Type": "application/json" })),
      });
    }

    // Используем существующий shell с токеном клиента
    const query = `
      query {
        myClub(id: 6242) {
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
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: cors(new Headers({ "Content-Type": "application/json" })),
      });
    }

    const achievements = result?.myClub?.achievements;

    if (!achievements) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: cors(new Headers({ "Content-Type": "application/json" })),
      });
    }

    const allAchievements = [
      ...(achievements.single || []),
      ...(achievements.continuous || []),
    ];

    return new Response(JSON.stringify(allAchievements), {
      status: 200,
      headers: cors(new Headers({ "Content-Type": "application/json" })),
    });
  } catch (err) {
    console.error("Get achievements error:", err);
    return new Response(JSON.stringify([]), {
      status: 500,
      headers: cors(new Headers({ "Content-Type": "application/json" })),
    });
  }
}

export async function handleApiRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const method = req.method;

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

    case method === "DELETE" && pathname.startsWith("/api/bookings/"):
      const bookingId = pathname.split("/").pop();
      return handleCancelBooking(req);


    //  case method === "GET" && pathname === "/api/payments":  // ← НОВЫЙ РОУТ
    //   return handleGetClientPayments(req);

    default:
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: cors(new Headers({ "Content-Type": "application/json" })),
      });
  }
}
