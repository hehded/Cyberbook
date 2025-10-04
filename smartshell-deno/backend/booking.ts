// backend/booking.ts
import { shell } from "../sdk.ts";

export type BookingInput = {
  phone: string;
  from?: string;
  duration: number;
  hostIds: number[];
  comment?: string;
};

function graphqlSafe(v: unknown) {
  return JSON.stringify(v);
}

export async function createBooking(input: BookingInput, clientId: number) {
  if (!Array.isArray(input.hostIds) || input.hostIds.length === 0) {
    throw new Error("hosts_required");
  }
  if (typeof input.duration !== "number" || input.duration <= 0) {
    throw new Error("invalid_duration");
  }
  if (!clientId) throw new Error("unauthorized");

  let fromDate: Date;
  if (input.from) {
    fromDate = new Date(input.from);
    if (isNaN(fromDate.getTime())) throw new Error("invalid_from_datetime");
  } else {
    const now = new Date();
    fromDate = new Date(now.getTime() + 5 * 60 * 1000);
  }

  const toDate = new Date(fromDate.getTime() + input.duration * 1000);

  const formatDateTime = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  const commentText = `Телефон: ${input.phone}${input.comment ? ". " + input.comment : ""}`;

  const mutation = `
    mutation {
      createBooking(input: {
        client: ${clientId}
        from: ${graphqlSafe(formatDateTime(fromDate))}
        to: ${graphqlSafe(formatDateTime(toDate))}
        hosts: ${graphqlSafe(input.hostIds)}
        comment: ${graphqlSafe(commentText)}
      }) {
        id
        from
        to
        status
      }
    }
  `;

  try {
    const res: any = await shell.call(mutation as any);
    if (res?.errors?.length) {
      console.warn("[createBooking] GraphQL errors:", res.errors);
      throw new Error(res.errors[0].message || "graphql_error");
    }

    const booking = res?.data?.createBooking ?? res?.createBooking;
    if (!booking) throw new Error("no_booking_returned");

    console.log("[createBooking] booking created, id:", booking.id, "for client:", clientId);
    return booking;
  } catch (err: any) {
    console.error("[createBooking] Ошибка:", err?.message ?? err);
    throw err;
  }
}