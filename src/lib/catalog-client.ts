import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminAuthPayload } from "./admin-creds";
import {
  deleteBranchFn,
  deleteMasterFn,
  deletePromoFn,
  deleteServiceFn,
  listCatalogFn,
  upsertBranchFn,
  upsertMasterFn,
  upsertPromoFn,
  upsertServiceFn,
  type Branch,
  type Master,
  type Promo,
  type Service,
} from "./catalog-fn";

export type { Branch, Master, Promo, Service };

const EMPTY = {
  branches: [] as Branch[],
  services: [] as Service[],
  masters: [] as Master[],
  promos: [] as Promo[],
};

export function useCatalog() {
  const q = useQuery({
    queryKey: ["catalog"],
    queryFn: () => listCatalogFn({ data: {} }),
    staleTime: 60_000,
  });
  return {
    branches: q.data?.branches ?? EMPTY.branches,
    services: q.data?.services ?? EMPTY.services,
    masters: q.data?.masters ?? EMPTY.masters,
    promos: q.data?.promos ?? EMPTY.promos,
    isLoading: q.isLoading,
    refetch: () => q.refetch(),
  };
}

export function useAdminUpsertBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (branch: Branch) =>
      upsertBranchFn({ data: { ...adminAuthPayload(), branch } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog"] }),
  });
}
export function useAdminDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      deleteBranchFn({ data: { ...adminAuthPayload(), id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog"] }),
  });
}

export function useAdminUpsertService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (service: Service) =>
      upsertServiceFn({ data: { ...adminAuthPayload(), service } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog"] }),
  });
}
export function useAdminDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      deleteServiceFn({ data: { ...adminAuthPayload(), id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog"] }),
  });
}

export function useAdminUpsertMaster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (master: Master) =>
      upsertMasterFn({ data: { ...adminAuthPayload(), master } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog"] }),
  });
}
export function useAdminDeleteMaster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      deleteMasterFn({ data: { ...adminAuthPayload(), id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog"] }),
  });
}

export function useAdminUpsertPromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (promo: Promo) =>
      upsertPromoFn({ data: { ...adminAuthPayload(), promo } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog"] }),
  });
}
export function useAdminDeletePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      deletePromoFn({ data: { ...adminAuthPayload(), id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog"] }),
  });
}
