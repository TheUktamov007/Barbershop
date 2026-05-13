// Round 2: store is now a thin adapter over server-backed D1 data
// (via React Query). Public API kept the same so the rest of the app
// (admin CRUD UI, profile, booking flow) doesn't need to be rewritten.

import { useQueryClient } from "@tanstack/react-query";
import { useCatalog } from "./catalog-client";
import {
  upsertBranchFn,
  deleteBranchFn,
  upsertServiceFn,
  deleteServiceFn,
  upsertMasterFn,
  deleteMasterFn,
  upsertPromoFn,
  deletePromoFn,
} from "./catalog-fn";
import { adminAuthPayload } from "./admin-creds";
import {
  myBookings as initialMockBookings,
  type Booking,
} from "./mock";
import type {
  Branch,
  Service,
  Master,
  Promo,
} from "./catalog-fn";

export type { Branch, Service, Master, Promo, Booking };

let sharedQc: ReturnType<typeof useQueryClient> | null = null;

function invalidate() {
  sharedQc?.invalidateQueries({ queryKey: ["catalog"] });
  sharedQc?.invalidateQueries({ queryKey: ["bookings"] });
}

export function useStore(): {
  branches: Branch[];
  services: Service[];
  masters: Master[];
  promos: Promo[];
  bookings: Booking[];
  isLoading: boolean;
} {
  const qc = useQueryClient();
  sharedQc = qc;
  const c = useCatalog();
  return {
    branches: c.branches,
    services: c.services,
    masters: c.masters,
    promos: c.promos,
    bookings: initialMockBookings,
    isLoading: c.isLoading,
  };
}

export const branchActions = {
  async add(b: Omit<Branch, "id">) {
    await upsertBranchFn({
      data: { ...adminAuthPayload(), branch: { ...b, id: "" } as Branch },
    });
    invalidate();
  },
  async update(id: string, patch: Partial<Branch>) {
    const current = sharedQc?.getQueryData<{ branches: Branch[] }>(["catalog"]);
    const existing = current?.branches.find((x) => x.id === id);
    const merged: Branch = { ...(existing ?? ({ id } as Branch)), ...patch, id };
    await upsertBranchFn({ data: { ...adminAuthPayload(), branch: merged } });
    invalidate();
  },
  async remove(id: string) {
    await deleteBranchFn({ data: { ...adminAuthPayload(), id } });
    invalidate();
  },
};

export const serviceActions = {
  async add(s: Omit<Service, "id">) {
    await upsertServiceFn({
      data: { ...adminAuthPayload(), service: { ...s, id: "" } as Service },
    });
    invalidate();
  },
  async update(id: string, patch: Partial<Service>) {
    const current = sharedQc?.getQueryData<{ services: Service[] }>(["catalog"]);
    const existing = current?.services.find((x) => x.id === id);
    const merged: Service = { ...(existing ?? ({ id } as Service)), ...patch, id };
    await upsertServiceFn({ data: { ...adminAuthPayload(), service: merged } });
    invalidate();
  },
  async remove(id: string) {
    await deleteServiceFn({ data: { ...adminAuthPayload(), id } });
    invalidate();
  },
};

export const masterActions = {
  async add(m: Omit<Master, "id">) {
    await upsertMasterFn({
      data: { ...adminAuthPayload(), master: { ...m, id: "" } as Master },
    });
    invalidate();
  },
  async update(id: string, patch: Partial<Master>) {
    const current = sharedQc?.getQueryData<{ masters: Master[] }>(["catalog"]);
    const existing = current?.masters.find((x) => x.id === id);
    const merged: Master = { ...(existing ?? ({ id } as Master)), ...patch, id };
    await upsertMasterFn({ data: { ...adminAuthPayload(), master: merged } });
    invalidate();
  },
  async remove(id: string) {
    await deleteMasterFn({ data: { ...adminAuthPayload(), id } });
    invalidate();
  },
};

export const promoActions = {
  async add(p: Omit<Promo, "id">) {
    await upsertPromoFn({
      data: { ...adminAuthPayload(), promo: { ...p, id: "" } as Promo },
    });
    invalidate();
  },
  async update(id: string, patch: Partial<Promo>) {
    const current = sharedQc?.getQueryData<{ promos: Promo[] }>(["catalog"]);
    const existing = current?.promos.find((x) => x.id === id);
    const merged: Promo = { ...(existing ?? ({ id } as Promo)), ...patch, id };
    await upsertPromoFn({ data: { ...adminAuthPayload(), promo: merged } });
    invalidate();
  },
  async remove(id: string) {
    await deletePromoFn({ data: { ...adminAuthPayload(), id } });
    invalidate();
  },
};

export const bookingActions = {
  async add(_b: Omit<Booking, "id">) {
    console.warn("[store] bookingActions.add deprecated — use useCreateBooking()");
  },
  async setStatus(_id: string, _status: Booking["status"]) {
    console.warn("[store] bookingActions.setStatus deprecated — use useSetBookingStatus()");
  },
  async remove(_id: string) {
    console.warn("[store] bookingActions.remove deprecated — use useCancelBooking()");
  },
};

export function resetStore() {
  invalidate();
}
