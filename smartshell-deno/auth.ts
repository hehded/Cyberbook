// auth.ts
import { shell } from "./sdk.ts";

export async function login(login: string, password: string): Promise<{ success: boolean; token?: string; userId?: number; error?: string }> {
  console.log("[auth] Попытка входа:", login);

  const mutation = `
    mutation {
      clientLogin(input: {
        login: "${login}"
        password: "${password}"
      }) {
        access_token
        token_type
        expires_in
        refresh_token
      }
    }
  `;

  try {
    const res: any = await shell.call(mutation as any);

    if (res?.errors && Array.isArray(res.errors) && res.errors.length) {
      console.error("[auth] Ошибка входа:", res.errors[0].message);
      return { success: false, error: res.errors[0].message || "Неверный логин или пароль" };
    }

    const authData = res?.data?.clientLogin ?? res?.clientLogin;
    
    if (!authData?.access_token) {
      return { success: false, error: "Неверный логин или пароль" };
    }

    console.log("[auth] Успешный вход, токен получен");
    return { 
      success: true, 
      token: authData.access_token,
      userId: 1
    };
  } catch (err: any) {
    console.error("[auth] Критическая ошибка:", err?.message ?? err);
    return { success: false, error: "Ошибка сервера" };
  }
}

export function verifyToken(token: string): boolean {
  return token && token.length > 10;
}

export async function getCurrentUser(phone: string): Promise<{ id: number; nickname?: string; phone?: string; deposit?: number; bonus?: number } | null> {
  console.log("[auth] Получение данных пользователя:", phone);

  const query = `
    query {
      clients(input: { q: "${phone}" }) {
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

  try {
    const res: any = await shell.call(query as any);

    if (res?.errors?.length) {
      console.error("[auth] Ошибка получения пользователя:", res.errors[0].message);
      return null;
    }

    const clients = res?.data?.clients?.data ?? res?.clients?.data ?? [];
    
    if (clients.length > 0) {
      const user = clients[0];
      console.log("[auth] Пользователь найден:", user.id, user.nickname);
      return {
        id: user.id,
        nickname: user.nickname || user.login || user.phone,
        phone: user.phone,
        deposit: user.deposit || 0,
        bonus: user.bonus || 0
      };
    }

    return null;
  } catch (err: any) {
    console.error("[auth] Ошибка:", err?.message ?? err);
    return null;
  }
}