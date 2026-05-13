import { createServerFn } from "@tanstack/react-start";
import { validateInitData, type TelegramUser } from "./telegram-server";
import { isAdminId } from "./server/admin-auth";

export type AuthResult = {
  ok: boolean;
  user: TelegramUser | null;
  isAdmin: boolean;
};

export const verifyTelegramFn = createServerFn({ method: "POST" })
  .inputValidator((data: { initData: string }) => data)
  .handler(async ({ data }): Promise<AuthResult> => {
    const botToken =
      (typeof process !== "undefined" && process.env?.BOT_TOKEN) || "";

    if (!botToken) {
      return { ok: false, user: null, isAdmin: false };
    }

    const user = await validateInitData(data.initData ?? "", botToken);
    if (!user) return { ok: false, user: null, isAdmin: false };

    return {
      ok: true,
      user,
      isAdmin: isAdminId(user.id),
    };
  });
