import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTelegramWebApp } from "./telegram-client";
import { adminAuthPayload } from "./admin-creds";
import {
  adminCreateCertFn,
  adminCreatePackageFn,
  listCertsAdminFn,
  listPackagesAdminFn,
  lookupCertByCodeFn,
  myCertsFn,
  myPackagesFn,
  revokeCertFn,
  revokePackageFn,
} from "./batch4-fn";

export type { Certificate, Package } from "./batch4-fn";

function initData() {
  return getTelegramWebApp()?.initData ?? "";
}

// ===== Admin =====
export function useAdminCerts() {
  return useQuery({
    queryKey: ["admin", "certs"],
    queryFn: () => listCertsAdminFn({ data: adminAuthPayload() }),
    staleTime: 30_000,
  });
}
export function useCreateCert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      amount: number;
      ownerTgId?: number;
      note?: string;
      expiresAt?: string;
    }) => adminCreateCertFn({ data: { ...adminAuthPayload(), ...input } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "certs"] });
      qc.invalidateQueries({ queryKey: ["my", "certs"] });
    },
  });
}
export function useRevokeCert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      revokeCertFn({ data: { ...adminAuthPayload(), id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "certs"] }),
  });
}

export function useAdminPackages() {
  return useQuery({
    queryKey: ["admin", "packages"],
    queryFn: () => listPackagesAdminFn({ data: adminAuthPayload() }),
    staleTime: 30_000,
  });
}
export function useCreatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      ownerTgId: number;
      title: string;
      serviceId?: string;
      category?: string;
      totalVisits: number;
      expiresAt?: string;
    }) => adminCreatePackageFn({ data: { ...adminAuthPayload(), ...input } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "packages"] });
      qc.invalidateQueries({ queryKey: ["my", "packages"] });
    },
  });
}
export function useRevokePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      revokePackageFn({ data: { ...adminAuthPayload(), id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "packages"] }),
  });
}

// ===== Client =====
export function useMyCerts() {
  return useQuery({
    queryKey: ["my", "certs"],
    queryFn: () => myCertsFn({ data: { initData: initData() } }),
    enabled: typeof window !== "undefined",
    staleTime: 60_000,
  });
}
export function useMyPackages() {
  return useQuery({
    queryKey: ["my", "packages"],
    queryFn: () => myPackagesFn({ data: { initData: initData() } }),
    enabled: typeof window !== "undefined",
    staleTime: 60_000,
  });
}
export function useLookupCert() {
  return useMutation({
    mutationFn: (code: string) =>
      lookupCertByCodeFn({ data: { initData: initData(), code } }),
  });
}
