import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getTelegramWebApp } from "./telegram-client";
import { adminAuthPayload } from "./admin-creds";
import {
  broadcastFn,
  claimReferralFn,
  exportBookingsCsvFn,
  exportCustomersCsvFn,
  getMyReferralFn,
  toggleFavoriteFn,
} from "./batch2-fn";

// --- Client: referrals ---
export function useMyReferral() {
  const [initData, setInitData] = useState("");
  useEffect(() => {
    let cancelled = false;
    let tries = 0;
    const poll = () => {
      if (cancelled) return;
      const v = getTelegramWebApp()?.initData ?? "";
      if (v) setInitData(v);
      else if (tries++ < 60) setTimeout(poll, 50);
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, []);
  return useQuery({
    queryKey: ["referral", "mine"],
    queryFn: () => getMyReferralFn({ data: { initData } }),
    enabled: !!initData,
    staleTime: 60_000,
  });
}

export function useClaimReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (refCode: string) => {
      const initData = getTelegramWebApp()?.initData ?? "";
      return claimReferralFn({ data: { initData, refCode } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referral"] });
      qc.invalidateQueries({ queryKey: ["loyalty"] });
    },
  });
}

// --- Client: favorites ---
export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (masterId: string) => {
      const initData = getTelegramWebApp()?.initData ?? "";
      return toggleFavoriteFn({ data: { initData, masterId } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loyalty"] });
    },
  });
}

// --- Admin: broadcast ---
export function useBroadcast() {
  return useMutation({
    mutationFn: (text: string) =>
      broadcastFn({ data: { ...adminAuthPayload(), text } }),
  });
}

// --- Admin: CSV exports ---
export function useExportBookings() {
  return useMutation({
    mutationFn: () => exportBookingsCsvFn({ data: adminAuthPayload() }),
  });
}
export function useExportCustomers() {
  return useMutation({
    mutationFn: () => exportCustomersCsvFn({ data: adminAuthPayload() }),
  });
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
