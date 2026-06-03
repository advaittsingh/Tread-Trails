export type RecommendationEntry = {
  productSlug: string;
  rationale: string;
  badge?: string;
};

export type UpgradeStep = RecommendationEntry & { step: number };

export type ProductRecommendationsPayload = {
  forVehicle: RecommendationEntry[];
  alsoBought: RecommendationEntry[];
  upgradePath: {
    intro: string;
    steps: UpgradeStep[];
  };
};
