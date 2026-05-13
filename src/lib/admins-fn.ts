import { createServerFn } from "@tanstack/react-start";
import {
  createAdmin,
  deleteAdmin,
  ensureSuperAdmin,
  listAdmins,
  loginAdmin,
  logoutAdmin,
  updateAdmin,
  type Admin,
  type AdminRole,
} from "./server/admin-db";
import { checkAdmin } from "./server/admin-auth";

/** Login by login + password. Returns a session token on success. */
export const adminLoginFn = createServerFn({ method: "POST" })
  .inputValidator((data: { login: string; password: string }) => data)
  .handler(
    async ({
      data,
    }): Promise<
      | { ok: true; token: string; admin: Admin }
      | { ok: false; error: string }
    > => {
      try {
        await ensureSuperAdmin();
      } catch {}
      const res = await loginAdmin(data.login.trim(), data.password);
      if (!res) return { ok: false, error: "Неверный логин или пароль" };
      return { ok: true, token: res.token, admin: res.admin };
    },
  );

export const adminLogoutFn = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    await logoutAdmin(data.token);
    return { ok: true };
  });

/** Returns the currently logged-in admin (session token or TG initData). */
export const meAdminFn = createServerFn({ method: "POST" })
  .inputValidator((data: { sessionToken?: string; initData?: string }) => data)
  .handler(async ({ data }) => {
    const auth = await checkAdmin({
      sessionToken: data.sessionToken,
      initData: data.initData,
    });
    if (!auth.ok || !auth.isAdmin) return { ok: false as const };
    return {
      ok: true as const,
      admin: auth.admin ?? null,
      // For env-only admins (legacy), expose a synthetic role.
      role: (auth.admin?.role ?? "super") as AdminRole,
      masterId: auth.admin?.masterId ?? null,
    };
  });

/** Super-admin only: list everyone. */
export const listAdminsFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { sessionToken?: string; initData?: string; adminPass?: string }) =>
      data,
  )
  .handler(async ({ data }): Promise<Admin[]> => {
    const auth = await checkAdmin(data);
    if (!auth.ok || !auth.isAdmin) return [];
    // Master role must not see the admin list.
    if (auth.admin && auth.admin.role !== "super") return [];
    return await listAdmins();
  });

/** Super-admin only: create new master/super admin. */
export const createAdminFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      sessionToken?: string;
      initData?: string;
      adminPass?: string;
      login: string;
      password: string;
      role: AdminRole;
      masterId?: string | null;
      tgUserId?: number | null;
      displayName?: string | null;
    }) => data,
  )
  .handler(
    async ({
      data,
    }): Promise<{ ok: boolean; admin?: Admin; error?: string }> => {
      const auth = await checkAdmin(data);
      if (!auth.ok || !auth.isAdmin) return { ok: false, error: "forbidden" };
      if (auth.admin && auth.admin.role !== "super") {
        return { ok: false, error: "only super admin" };
      }
      if (!data.login.trim() || data.password.length < 4) {
        return { ok: false, error: "login обязателен, пароль ≥ 4 символов" };
      }
      try {
        const admin = await createAdmin({
          login: data.login.trim(),
          password: data.password,
          role: data.role,
          masterId: data.masterId ?? null,
          tgUserId: data.tgUserId ?? null,
          displayName: data.displayName ?? null,
        });
        return { ok: true, admin };
      } catch (e) {
        const msg = (e as Error)?.message ?? String(e);
        if (msg.includes("UNIQUE")) {
          return { ok: false, error: "Логин уже занят" };
        }
        return { ok: false, error: msg };
      }
    },
  );

export const updateAdminFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      sessionToken?: string;
      initData?: string;
      adminPass?: string;
      id: string;
      login?: string;
      password?: string;
      role?: AdminRole;
      masterId?: string | null;
      tgUserId?: number | null;
      displayName?: string | null;
    }) => data,
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const auth = await checkAdmin(data);
    if (!auth.ok || !auth.isAdmin) return { ok: false, error: "forbidden" };
    if (auth.admin && auth.admin.role !== "super") {
      return { ok: false, error: "only super admin" };
    }
    await updateAdmin({
      id: data.id,
      login: data.login,
      password: data.password,
      role: data.role,
      masterId: data.masterId,
      tgUserId: data.tgUserId,
      displayName: data.displayName,
    });
    return { ok: true };
  });

export const deleteAdminFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      sessionToken?: string;
      initData?: string;
      adminPass?: string;
      id: string;
    }) => data,
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const auth = await checkAdmin(data);
    if (!auth.ok || !auth.isAdmin) return { ok: false, error: "forbidden" };
    if (auth.admin && auth.admin.role !== "super") {
      return { ok: false, error: "only super admin" };
    }
    await deleteAdmin(data.id);
    return { ok: true };
  });
