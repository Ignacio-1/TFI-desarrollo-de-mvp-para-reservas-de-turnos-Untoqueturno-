import type { Business } from "./types";

export function getSubscriptionState(business: Business) {
  const now = new Date();
  let status: "active" | "expired" | "trialing" = "active";
  let daysLeft = 0;

  if (business.subscription_status === "active") {
    status = "active";
  } else if (business.subscription_status === "inactive") {
    status = "expired";
  } else if (business.subscription_status === "trial") {
    if (!business.trial_ends_at) {
      status = "trialing"; // Fallback just in case
      daysLeft = 15;
    } else {
      const trialEndsAt = new Date(business.trial_ends_at);
      if (now > trialEndsAt) {
        status = "expired";
      } else {
        status = "trialing";
        const diffTime = Math.abs(trialEndsAt.getTime() - now.getTime());
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }
  }

  return { status, daysLeft };
}

export function isSubscriptionActive(business: Business) {
  const { status } = getSubscriptionState(business);
  return status === "active" || status === "trialing";
}
