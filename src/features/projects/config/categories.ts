export const PROJECT_CATEGORIES = {
  SALES: { label: "Sales", variant: "info" as const },
  MANAGEMENT: { label: "Management", variant: "outline" as const },
  OTHER: { label: "Other", variant: "outline" as const },
};

export type ProjectCategory = keyof typeof PROJECT_CATEGORIES;

export const VALID_CATEGORIES = Object.keys(
  PROJECT_CATEGORIES,
) as ProjectCategory[];
