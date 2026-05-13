import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getTelegramWebApp } from "./telegram-client";
import { adminAuthPayload } from "./admin-creds";
import {
  cancelBookingFn,
  createBookingFn,
  listAllBookingsFn,
  listBookingsFn,
  rescheduleBookingFn,
  setBookingStatusFn,
  type CreateBookingFnInput,
} from "./bookings-fn";
import type {
  BookingStatus,
  ClientBooking,
} from "./server/booking-db";

export type { BookingStatus, ClientBooking };

function useInitData(): string {
  // initData isn't available until the Telegram SDK loads. Re-render once it
  // appears so React Query picks up the right key + can make the call.
  const [v, setV] = useState<string>("");
  useEffect(() => {
    let cancelled = false;
    let tries = 0;
    const poll = () => {
      if (cancelled) return;
      const id = getTelegramWebApp()?.initData ?? "";
      if (id) setV(id);
      else if (tries++ < 60) setTimeout(poll, 50);
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, []);
  return v;
}

export function useAllBookingsAdmin(): {
  data: ClientBooking[];
  isLoading: boolean;
  refetch: () => void;
} {
  // Admin can come in via Telegram (initData) OR browser password (adminPass).
  // We always include both — server picks whichever is valid.
  const initData = useInitData();
  const q = useQuery({
    queryKey: ["bookings", "admin"],
    queryFn: () =>
      listAllBookingsFn({
        data: adminAuthPayload(),
      }),
    // Run regardless of initData presence so the browser-password flow works
    // even without Telegram.
    enabled: true,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
  return {
    data: q.data ?? [],
    isLoading: q.isLoading,
    refetch: () => q.refetch(),
  };
}

export function useMyBookings(): {
  data: ClientBooking[];
  isLoading: boolean;
  refetch: () => void;
} {
  const initData = useInitData();
  const q = useQuery({
    queryKey: ["bookings", "mine", !!initData],
    queryFn: () => listBookingsFn({ data: { initData } }),
    enabled: !!initData,
    staleTime: 30_000,
  });
  return {
    data: q.data ?? [],
    isLoading: q.isLoading,
    refetch: () => q.refetch(),
  };
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<CreateBookingFnInput, "initData">) => {
      const initData = getTelegramWebApp()?.initData ?? "";
      return createBookingFn({ data: { ...input, initData } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      return cancelBookingFn({
        data: { ...adminAuthPayload(), id },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useSetBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) => {
      return setBookingStatusFn({
        data: { ...adminAuthPayload(), id, status },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useRescheduleBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newStartAt }: { id: string; newStartAt: string }) => {
      const initData = getTelegramWebApp()?.initData ?? "";
      return rescheduleBookingFn({ data: { initData, id, newStartAt } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
