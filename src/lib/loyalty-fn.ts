import { createServerFn } from "@tanstack/react-start";
import { checkUser } from "./server/admin-auth";
import {
  cashbackPctFor,
  getCustomer,
  getOrCreateCustomer,
  nextTierGoal,
  setCustomerBirthday,
  setCustomerPhone,
  tierLabel,
  tierOf,
  type CustomerProfile,
  type Tier,
} from "./server/customer-db";

export type LoyaltyView = {
  ok: boolean;
  profile: CustomerProfile | null;
  tier: Tier;
  tierLabel: string;
  cashbackPct: number;
  nextTier: Tier | null;
  nextTierLabel: string | null;
  visitsToNextTier: number;
};

function emptyView(): LoyaltyView {
  return {
    ok: false,
    profile: null,
    tier: "bronze",
    tierLabel: "Bronze",
    cashbackPct: cashbackPctFor("bronze"),
    nextTier: "silver",
    nextTierLabel: "Silver",
    visitsToNextTier: 3,
  };
}

function viewFor(profile: CustomerProfile): LoyaltyView {
  const tier = tierOf(profile);
  const goal = nextTierGoal(tier, profile.visitsCount);
  return {
    ok: true,
    profile,
    tier,
    tierLabel: tierLabel(tier),
    cashbackPct: cashbackPctFor(tier),
    nextTier: goal.next,
    nextTierLabel: goal.next ? tierLabel(goal.next) : null,
    visitsToNextTier: goal.visitsToGo,
  };
}

export const getMyLoyaltyFn = createServerFn({ method: "POST" })
  .inputValidator((data: { initData: string }) => data)
  .handler(async ({ data }): Promise<LoyaltyView> => {
    const auth = await checkUser(data.initData);
    if (!auth.ok || !auth.user) return emptyView();
    // Auto-create on first call so the loyalty card always works.
    const profile = await getOrCreateCustomer({
      tgUserId: auth.user.id,
      firstName: auth.user.first_name,
      lastName: auth.user.last_name,
      username: auth.user.username,
    });
    return viewFor(profile);
  });

export const setMyBirthdayFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { initData: string; birthday: string | null }) => data,
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const auth = await checkUser(data.initData);
    if (!auth.ok || !auth.user) return { ok: false, error: "not authenticated" };
    // Light validation: empty string -> null, otherwise must be YYYY-MM-DD.
    let bd: string | null = data.birthday;
    if (bd === "" || bd == null) bd = null;
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(bd)) {
      return { ok: false, error: "invalid date" };
    }
    await getOrCreateCustomer({ tgUserId: auth.user.id });
    await setCustomerBirthday(auth.user.id, bd);
    return { ok: true };
  });

export const setMyPhoneFn = createServerFn({ method: "POST" })
  .inputValidator((data: { initData: string; phone: string }) => data)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const auth = await checkUser(data.initData);
    if (!auth.ok || !auth.user) return { ok: false, error: "not authenticated" };
    const phone = data.phone.trim();
    if (!phone || phone.length > 32) return { ok: false, error: "invalid phone" };
    await getOrCreateCustomer({ tgUserId: auth.user.id });
    await setCustomerPhone(auth.user.id, phone);
    return { ok: true };
  });
