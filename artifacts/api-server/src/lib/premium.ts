// Mirrors artifacts/fresher-resume/src/lib/premium.ts — kept in sync manually
// since this is a small, fixed list. Server-side enforcement exists as
// defense-in-depth: the frontend already hides/locks these, but a client
// could otherwise call the API directly to bypass that.
export const FREE_TEMPLATE_IDS = [1, 2, 5];
export const FREE_FONTS = ["Inter", "Georgia", "Roboto"];

export function isTemplatePremium(templateId: number): boolean {
  return !FREE_TEMPLATE_IDS.includes(templateId);
}

export function isFontPremium(font: string): boolean {
  return !FREE_FONTS.includes(font);
}
