# Design System

Warm, editorial aesthetic. All UI work must follow these conventions.

## Tokens

Colors are HSL tokens in `src/app/globals.css`. Never use raw hex/rgb or Tailwind color scales.

- **Background**: Warm parchment beige (`--background`), not white
- **Cards**: Slightly lighter (`--card`) for subtle depth
- **Foreground**: Near-black (`--foreground`), not pure black
- **Muted**: `--muted-foreground` for secondary text; `--border` for warm gray borders
- **Info/AI accent**: Purple (`--info`) used for AI-flagged elements (Sales badges, analysis banners). Only use via `--info`/`--info-foreground` tokens or the `info` Badge variant.
- No other saturated accent colors (no indigo, blue, etc.)

## Rules

- **Weight**: Base 300. Use `font-normal` (400) for headings/emphasis, `font-medium` (500) sparingly. Never `font-bold`/`font-semibold` on headings.
- **Radius**: `--radius: 6px`. Subtle rounding on cards, inputs, badges. Do not use large values like `rounded-xl` or `rounded-2xl`.
- **Shadows**: None. No `shadow-sm`, `shadow-md`, etc.
- **Gradients**: No `bg-gradient-to-*`. Page backgrounds use `APP_BACKGROUNDS` from `@/hooks/use-background-preference` — never inline gradient strings.
- **Hover**: `hover:border-foreground/20` or text color shift with `transition-colors duration-200`.

## Components

Use these instead of raw classes:

| Component | Import | Purpose |
|-----------|--------|---------|
| `<AppLayout>` | `@/components/layout/app-layout` | Wraps every authenticated page |
| `<PageHeader>` | `@/components/ui/page-header` | Page titles — never raw `h1` + `p` |
| `<SectionHeader>` | `@/components/ui/section-header` | Uppercase tracking labels |
| `<LoadingSpinner>` | `@/components/ui/loading-spinner` | Loading states — never inline `animate-spin` |
| `<StatCard>` | `@/components/ui/stat-card` | Label + value cards |
| `<Badge>` | `@/components/ui/badge` | Inline labels/tags — never raw `<span>` badges |

**Project categories** — centralized in `@/features/projects/config/categories`:

```tsx
import { PROJECT_CATEGORIES, type ProjectCategory } from "@/features/projects/config/categories";
// SALES → { label: "Sales", variant: "info" }       (purple — AI-flagged)
// MANAGEMENT → { label: "Management", variant: "outline" }
// OTHER → { label: "Other", variant: "outline" }
```

## Patterns

```tsx
// Links
<a className="text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-foreground">

// Table wrapper
<div className="w-full overflow-hidden border border-border bg-card">

// Icon container
<div className="bg-muted p-2.5 text-muted-foreground">
```
