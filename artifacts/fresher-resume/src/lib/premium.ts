// Free vs. Premium gating — shared across Dashboard, Builder Preview, and the
// backend (kept in sync manually since this is a small, fixed list).
//
// 3 templates free, the other 7 (the more visually elaborate ones) require Premium.
export const FREE_TEMPLATE_IDS = [1, 2, 5] as const;
export const ALL_TEMPLATE_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const PREMIUM_TEMPLATE_IDS = ALL_TEMPLATE_IDS.filter(id => !(FREE_TEMPLATE_IDS as readonly number[]).includes(id));

export function isTemplatePremium(templateId: number): boolean {
  return !(FREE_TEMPLATE_IDS as readonly number[]).includes(templateId);
}

// 3 fonts free, the rest require Premium.
export const FREE_FONTS = ["Inter", "Georgia", "Roboto"] as const;

export function isFontPremium(font: string): boolean {
  return !(FREE_FONTS as readonly string[]).includes(font);
}
