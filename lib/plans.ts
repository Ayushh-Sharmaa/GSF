export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    tierLevel: 0,
    features: ["community_access", "basic_profile"],
  },
  builder: {
    id: "builder",
    name: "Builder",
    tierLevel: 1,
    features: ["community_access", "basic_profile", "connect_calls", "list_ventures"],
  },
  founder: {
    id: "founder",
    name: "Founder",
    tierLevel: 2,
    features: [
      "community_access",
      "basic_profile",
      "connect_calls",
      "list_ventures",
      "investor_intros",
      "dedicated_advisor",
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;
