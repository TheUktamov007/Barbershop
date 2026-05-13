import { createServerFn } from "@tanstack/react-start";
import { checkAdmin, checkUser } from "./server/admin-auth";
import {
  createCertificate,
  listCertificatesAll,
  listCertificatesForUser,
  findCertByCode,
  spendCertificate,
  revokeCertificate,
  createPackage,
  listPackagesAll,
  listPackagesForUser,
  usePackageVisit,
  revokePackage,
  type Certificate,
  type Package,
} from "./server/cert-pkg-db";

type AdminAuth = { initData?: string; adminPass?: string };

// ===== Certificates =====

export const adminCreateCertFn = createServerFn({ method: "POST" })
  .inputValidator(
    (
      data: AdminAuth & {
        amount: number;
        ownerTgId?: number;
        note?: string;
        expiresAt?: string;
      },
    ) => data,
  )
  .handler(async ({ data }): Promise<{ ok: boolean; cert?: Certificate; error?: string }> => {
    const a = await checkAdmin(data);
    if (!a.isAdmin) return { ok: false, error: "admin only" };
    if (!data.amount || data.amount <= 0) return { ok: false, error: "invalid amount" };
    const cert = await createCertificate({
      amount: data.amount,
      ownerTgId: data.ownerTgId,
      note: data.note,
      expiresAt: data.expiresAt,
    });
    return { ok: true, cert };
  });

export const listCertsAdminFn = createServerFn({ method: "POST" })
  .inputValidator((data: AdminAuth) => data)
  .handler(async ({ data }): Promise<Certificate[]> => {
    const a = await checkAdmin(data);
    if (!a.isAdmin) return [];
    return await listCertificatesAll();
  });

export const revokeCertFn = createServerFn({ method: "POST" })
  .inputValidator((data: AdminAuth & { id: string }) => data)
  .handler(async ({ data }) => {
    const a = await checkAdmin(data);
    if (!a.isAdmin) return { ok: false, error: "admin only" };
    await revokeCertificate(data.id);
    return { ok: true };
  });

export const myCertsFn = createServerFn({ method: "POST" })
  .inputValidator((data: { initData: string }) => data)
  .handler(async ({ data }): Promise<Certificate[]> => {
    const a = await checkUser(data.initData);
    if (!a.ok || !a.user) return [];
    return await listCertificatesForUser(a.user.id);
  });

export const lookupCertByCodeFn = createServerFn({ method: "POST" })
  .inputValidator((data: { initData: string; code: string }) => data)
  .handler(
    async ({ data }): Promise<{ ok: boolean; cert?: Certificate; error?: string }> => {
      const a = await checkUser(data.initData);
      if (!a.ok || !a.user) return { ok: false, error: "not authenticated" };
      const cert = await findCertByCode(data.code);
      if (!cert) return { ok: false, error: "Сертификат не найден" };
      if (cert.status !== "active") return { ok: false, error: "Сертификат недействителен" };
      if (cert.amountBalance <= 0) return { ok: false, error: "Сертификат полностью использован" };
      if (cert.expiresAt && cert.expiresAt < new Date().toISOString().slice(0, 10)) {
        return { ok: false, error: "Сертификат истёк" };
      }
      return { ok: true, cert };
    },
  );

// ===== Packages =====

export const adminCreatePackageFn = createServerFn({ method: "POST" })
  .inputValidator(
    (
      data: AdminAuth & {
        ownerTgId: number;
        title: string;
        serviceId?: string;
        category?: string;
        totalVisits: number;
        expiresAt?: string;
      },
    ) => data,
  )
  .handler(
    async ({ data }): Promise<{ ok: boolean; pkg?: Package; error?: string }> => {
      const a = await checkAdmin(data);
      if (!a.isAdmin) return { ok: false, error: "admin only" };
      if (!data.totalVisits || data.totalVisits <= 0) {
        return { ok: false, error: "invalid totalVisits" };
      }
      const pkg = await createPackage(data);
      return { ok: true, pkg };
    },
  );

export const listPackagesAdminFn = createServerFn({ method: "POST" })
  .inputValidator((data: AdminAuth) => data)
  .handler(async ({ data }): Promise<Package[]> => {
    const a = await checkAdmin(data);
    if (!a.isAdmin) return [];
    return await listPackagesAll();
  });

export const revokePackageFn = createServerFn({ method: "POST" })
  .inputValidator((data: AdminAuth & { id: string }) => data)
  .handler(async ({ data }) => {
    const a = await checkAdmin(data);
    if (!a.isAdmin) return { ok: false, error: "admin only" };
    await revokePackage(data.id);
    return { ok: true };
  });

export const myPackagesFn = createServerFn({ method: "POST" })
  .inputValidator((data: { initData: string }) => data)
  .handler(async ({ data }): Promise<Package[]> => {
    const a = await checkUser(data.initData);
    if (!a.ok || !a.user) return [];
    return await listPackagesForUser(a.user.id);
  });

export type { Certificate, Package };
