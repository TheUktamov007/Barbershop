import { createServerFn } from "@tanstack/react-start";
import { checkUser } from "./server/admin-auth";
import {
  createReview,
  getReviewForBooking,
  listReviewsForMaster,
  type Review,
} from "./server/reviews-db";

export type { Review };

export const createReviewFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      initData: string;
      bookingId: string;
      masterId?: string;
      serviceId?: string;
      rating: number;
      text?: string;
    }) => data,
  )
  .handler(
    async ({ data }): Promise<{ ok: boolean; review?: Review; error?: string }> => {
      const auth = await checkUser(data.initData);
      if (!auth.ok || !auth.user) return { ok: false, error: "not authenticated" };
      const customerName =
        [auth.user.first_name, auth.user.last_name].filter(Boolean).join(" ") ||
        auth.user.username;
      return await createReview({
        tgUserId: auth.user.id,
        customerName,
        bookingId: data.bookingId,
        masterId: data.masterId,
        serviceId: data.serviceId,
        rating: data.rating,
        text: data.text,
      });
    },
  );

export const listMasterReviewsFn = createServerFn({ method: "POST" })
  .inputValidator((data: { masterId: string }) => data)
  .handler(async ({ data }) => {
    return await listReviewsForMaster(data.masterId, 10);
  });

export const getMyReviewFn = createServerFn({ method: "POST" })
  .inputValidator((data: { initData: string; bookingId: string }) => data)
  .handler(async ({ data }): Promise<Review | null> => {
    const auth = await checkUser(data.initData);
    if (!auth.ok || !auth.user) return null;
    const r = await getReviewForBooking(data.bookingId);
    if (!r || r.tgUserId !== auth.user.id) return null;
    return r;
  });
