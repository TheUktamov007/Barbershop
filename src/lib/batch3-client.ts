import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminAuthPayload } from "./admin-creds";
import {
  listAllReviewsFn,
  moderateReviewFn,
  replyToReviewFn,
  masterEarningsFn,
} from "./batch3-fn";

export function useAllReviewsAdmin() {
  return useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: () => listAllReviewsFn({ data: adminAuthPayload() }),
    staleTime: 30_000,
  });
}

export function useModerateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "published" | "hidden" }) =>
      moderateReviewFn({ data: { ...adminAuthPayload(), id, status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
      qc.invalidateQueries({ queryKey: ["reviews"] });
      qc.invalidateQueries({ queryKey: ["catalog"] });
    },
  });
}

export function useReplyToReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) =>
      replyToReviewFn({ data: { ...adminAuthPayload(), id, reply } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

export function useMasterEarnings(period: "7d" | "30d" | "ytd" | "all") {
  return useQuery({
    queryKey: ["admin", "earnings", period],
    queryFn: () => masterEarningsFn({ data: { ...adminAuthPayload(), period } }),
    staleTime: 30_000,
  });
}
