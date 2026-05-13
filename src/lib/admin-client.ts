import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminAuthPayload } from "./admin-creds";
import {
  createAdminBookingFn,
  listCustomersFn,
  getCustomerDetailFn,
  setCustomerNoteFn,
  adminSetBookingStatusFn,
} from "./admin-fn";
import type { CustomerProfile } from "./server/customer-db";

export type { CustomerProfile };

export function useAdminCustomers() {
  const q = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: () => listCustomersFn({ data: adminAuthPayload() }),
    staleTime: 30_000,
  });
  return { data: q.data ?? [], isLoading: q.isLoading, refetch: q.refetch };
}

export function useAdminCustomerDetail(tgUserId: number | null) {
  return useQuery({
    queryKey: ["admin", "customer", tgUserId],
    queryFn: () =>
      getCustomerDetailFn({ data: { ...adminAuthPayload(), tgUserId: tgUserId! } }),
    enabled: !!tgUserId,
    staleTime: 30_000,
  });
}

export function useSetCustomerNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tgUserId, note }: { tgUserId: number; note: string | null }) =>
      setCustomerNoteFn({ data: { ...adminAuthPayload(), tgUserId, note } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "customers"] });
      qc.invalidateQueries({ queryKey: ["admin", "customer"] });
    },
  });
}

export function useCreateAdminBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      customerName?: string;
      customerPhone?: string;
      serviceTitle: string;
      serviceIds?: string[];
      masterId?: string;
      masterName: string;
      branchId?: string;
      branchName: string;
      startAt: string;
      durationMin: number;
      price: number;
    }) => createAdminBookingFn({ data: { ...adminAuthPayload(), ...input } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });
}

export function useAdminSetBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      cancelReason,
    }: {
      id: string;
      status: "upcoming" | "confirmed" | "completed" | "cancelled" | "no_show";
      cancelReason?: string;
    }) =>
      adminSetBookingStatusFn({
        data: { ...adminAuthPayload(), id, status, cancelReason },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });
}
