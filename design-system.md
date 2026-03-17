# Design System

Warm, editorial aesthetic. All UI work must follow these conventions.

## Tokens

Colors are HSL tokens in `src/app/globals.css`. Never use raw hex/rgb or Tailwind color scales.

- **Background**: Warm parchment beige (`--background`), not white
- **Cards**: Slightly lighter (`--card`) for subtle depth
- **Foreground**: Near-black (`--foreground`), not pure black
- **Muted**: `--muted-foreground` for secondary text; `--border` for warm gray borders
- **No purple, indigo, or saturated accent colors**

## Rules

- **Weight**: Base 200. Use `font-light`/`font-normal` for emphasis, `font-medium` sparingly. Never `font-bold`/`font-semibold` on headings.
- **Radius**: `--radius: 0px`. No `rounded-*` on cards, tables, badges, containers.
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
// SALES → { label: "Sales", variant: "default" }
// MANAGEMENT → { label: "Management", variant: "secondary" }
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
