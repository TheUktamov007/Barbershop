import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getTelegramWebApp } from "./telegram-client";
import {
  getMyLoyaltyFn,
  setMyBirthdayFn,
  setMyPhoneFn,
  type LoyaltyView,
} from "./loyalty-fn";

export type { LoyaltyView };

function useInitData(): string {
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

export function useMyLoyalty(): {
  data: LoyaltyView | null;
  isLoading: boolean;
  refetch: () => void;
} {
  const initData = useInitData();
  const q = useQuery({
    queryKey: ["loyalty", "mine"],
    queryFn: () => getMyLoyaltyFn({ data: { initData } }),
    enabled: !!initData,
    staleTime: 30_000,
  });
  return {
    data: q.data ?? null,
    isLoading: q.isLoading,
    refetch: () => q.refetch(),
  };
}

export function useSetMyBirthday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (birthday: string | null) => {
      const initData = getTelegramWebApp()?.initData ?? "";
      return setMyBirthdayFn({ data: { initData, birthday } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["loyalty"] }),
  });
}

export function useSetMyPhone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (phone: string) => {
      const initData = getTelegramWebApp()?.initData ?? "";
      return setMyPhoneFn({ data: { initData, phone } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["loyalty"] }),
  });
}
