import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTelegramWebApp } from "./telegram-client";
import {
  createReviewFn,
  listMasterReviewsFn,
  type Review,
} from "./reviews-fn";

export type { Review };

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      bookingId: string;
      masterId?: string;
      serviceId?: string;
      rating: number;
      text?: string;
    }) => {
      const initData = getTelegramWebApp()?.initData ?? "";
      return createReviewFn({ data: { initData, ...input } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog"] });
      qc.invalidateQueries({ queryKey: ["reviews"] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useMasterReviews(masterId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", "master", masterId],
    queryFn: () => listMasterReviewsFn({ data: { masterId: masterId! } }),
    enabled: !!masterId,
    staleTime: 60_000,
  });
}
