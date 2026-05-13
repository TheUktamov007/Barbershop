import { createServerFn } from "@tanstack/react-start";
import {
  listBranches,
  listMasters,
  listPromos,
  listServices,
  upsertBranch,
  upsertService,
  upsertMaster,
  upsertPromo,
  deleteBranch,
  deleteService,
  deleteMaster,
  deletePromo,
  tryLockSlot,
  refreshLockServer,
  releaseLockServer,
  confirmLockServer,
  getLocksFor,
  getBookedSlotKeys,
  type Branch,
  type Service,
  type Master,
  type Promo,
} from "./server/catalog-db";

export type { Branch, Service, Master, Promo };

// ---------- Public reads ----------
export const listCatalogFn = createServerFn({ method: "POST" })
  .inputValidator(() => ({}))
  .handler(
    async (): Promise<{
      branches: Branch[];
      services: Service[];
      masters: Master[];
      promos: Promo[];
    }> => {
      const [branches, services, masters, promos] = await Promise.all([
        listBranches(),
        listServices(),
        listMasters(),
        listPromos(),
      ]);
      return { branches, services, masters, promos };
    },
  );

// ---------- Admin auth helper (TG initData OR adminPass) ----------
import { checkAdmin } from "./server/admin-auth";
async function requireAdmin(
  initData?: string,
  adminPass?: string,
): Promise<{ ok: boolean }> {
  const a = await checkAdmin({ initData, adminPass });
  return { ok: a.isAdmin };
}

// ---------- Admin: upsert/delete ----------
type AdminBase = { initData?: string; adminPass?: string };

export const upsertBranchFn = createServerFn({ method: "POST" })
  .inputValidator((data: AdminBase & { branch: Branch }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.initData, data.adminPass);
    if (!auth.ok) return { ok: false, error: "admin only" };
    await upsertBranch(data.branch);
    return { ok: true };
  });

export const deleteBranchFn = createServerFn({ method: "POST" })
  .inputValidator((data: AdminBase & { id: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.initData, data.adminPass);
    if (!auth.ok) return { ok: false, error: "admin only" };
    await deleteBranch(data.id);
    return { ok: true };
  });

export const upsertServiceFn = createServerFn({ method: "POST" })
  .inputValidator((data: AdminBase & { service: Service }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.initData, data.adminPass);
    if (!auth.ok) return { ok: false, error: "admin only" };
    await upsertService(data.service);
    return { ok: true };
  });

export const deleteServiceFn = createServerFn({ method: "POST" })
  .inputValidator((data: AdminBase & { id: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.initData, data.adminPass);
    if (!auth.ok) return { ok: false, error: "admin only" };
    await deleteService(data.id);
    return { ok: true };
  });

export const upsertMasterFn = createServerFn({ method: "POST" })
  .inputValidator((data: AdminBase & { master: Master }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.initData, data.adminPass);
    if (!auth.ok) return { ok: false, error: "admin only" };
    await upsertMaster(data.master);
    return { ok: true };
  });

export const deleteMasterFn = createServerFn({ method: "POST" })
  .inputValidator((data: AdminBase & { id: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.initData, data.adminPass);
    if (!auth.ok) return { ok: false, error: "admin only" };
    await deleteMaster(data.id);
    return { ok: true };
  });

export const upsertPromoFn = createServerFn({ method: "POST" })
  .inputValidator((data: AdminBase & { promo: Promo }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.initData, data.adminPass);
    if (!auth.ok) return { ok: false, error: "admin only" };
    await upsertPromo(data.promo);
    return { ok: true };
  });

export const deletePromoFn = createServerFn({ method: "POST" })
  .inputValidator((data: AdminBase & { id: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.initData, data.adminPass);
    if (!auth.ok) return { ok: false, error: "admin only" };
    await deletePromo(data.id);
    return { ok: true };
  });

// ---------- Slot locks ----------
export const getSlotStateFn = createServerFn({ method: "POST" })
  .inputValidator((data: { branchId: string; date: string }) => data)
  .handler(
    async ({
      data,
    }): Promise<{
      locks: Array<{ key: string; sessionId: string; expiresAt: number }>;
      booked: string[];
    }> => {
      const [locks, booked] = await Promise.all([
        getLocksFor(data.branchId, data.date),
        getBookedSlotKeys(data.branchId, data.date),
      ]);
      return {
        locks: Array.from(locks.entries()).map(([key, v]) => ({
          key,
          sessionId: v.sessionId,
          expiresAt: v.expiresAt,
        })),
        booked: Array.from(booked),
      };
    },
  );

export const acquireSlotLockFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      branchId: string;
      masterId: string;
      date: string;
      time: string;
      sessionId: string;
      prevKey?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    return await tryLockSlot(
      data.branchId,
      data.masterId,
      data.date,
      data.time,
      data.sessionId,
      data.prevKey,
    );
  });

export const refreshSlotLockFn = createServerFn({ method: "POST" })
  .inputValidator((data: { key: string; sessionId: string }) => data)
  .handler(async ({ data }) => {
    const ok = await refreshLockServer(data.key, data.sessionId);
    return { ok };
  });

export const releaseSlotLockFn = createServerFn({ method: "POST" })
  .inputValidator((data: { key: string; sessionId: string }) => data)
  .handler(async ({ data }) => {
    await releaseLockServer(data.key, data.sessionId);
    return { ok: true };
  });

export const confirmSlotLockFn = createServerFn({ method: "POST" })
  .inputValidator((data: { key: string; sessionId: string }) => data)
  .handler(async ({ data }) => {
    const ok = await confirmLockServer(data.key, data.sessionId);
    return { ok };
  });
