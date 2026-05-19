/** Fixed height for homepage explore carousel cards (vehicle + brand). */
export const EXPLORE_CAROUSEL_CARD_H = "h-[21rem] sm:h-[22rem]" as const;

/** @deprecated Use EXPLORE_CAROUSEL_CARD_H */
export const EXPLORE_CAROUSEL_CARD_MIN_H = EXPLORE_CAROUSEL_CARD_H;

export const EXPLORE_CAROUSEL_SLIDE_CLASS =
  `flex h-full w-full flex-col ${EXPLORE_CAROUSEL_CARD_H}` as const;
