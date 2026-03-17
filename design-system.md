# Design System

This project uses a warm, editorial aesthetic inspired by cedarfieldgroup.com. All UI work must follow these conventions.

## Color Palette

All colors are HSL tokens defined in `src/app/globals.css`. Never use raw hex/rgb values.

- **Background**: Warm parchment beige (`--background: 33 43% 94%`), not white
- **Cards/Popovers**: Slightly lighter than background (`30 30% 97%`) for subtle depth
- **Foreground/Primary**: Near-black (`0 0% 10%`), not pure black
- **Muted foreground**: `0 0% 35%` — dark enough for readability on the warm background
- **Borders**: Warm gray (`40 10% 88%`)
- **Accent/Secondary/Muted**: Neutral warm grays — no purple, no indigo, no saturated colors

## Typography

- Base font weight: **200** (extra-light). Use `font-light` (300) or `font-normal` (400) for emphasis, `font-medium` (500) sparingly.
- Never use `font-bold` or `font-semibold` for headings. Use `font-light` + size instead.
- Base letter spacing: `-0.01em`
- Section labels: `text-xs uppercase tracking-[0.15em] text-muted-foreground`
- Font stack: `system-ui, -apple-system, sans-serif` (no custom web fonts for body)
- Monospace: `JetBrains Mono`

## Geometry

- Border radius: **0px** everywhere (`--radius: 0px`). Sharp corners only.
- Never add `rounded-*` classes to cards, tables, badges, or containers.

## Effects and Interactions

- **No gradients** — no `bg-gradient-to-*` on any element
- **No shadows** on cards or containers (no `shadow-sm`, `shadow-md`, etc.)
- Hover states: subtle border color change (`hover:border-foreground/20`) or text color shift only
- Transitions: `transition-colors duration-200` — keep it understated

## Component Patterns

```tsx
// Stat card label
<p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Label</p>

// Stat card value
<p className="text-2xl font-light tracking-tight text-foreground">$49M</p>

// Section header
<h2 className="text-xs font-normal uppercase tracking-[0.15em] text-muted-foreground">Recent Deals</h2>

// Links
<a className="text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-foreground">

// Table wrapper — no rounding, no shadow
<div className="w-full overflow-hidden border border-border bg-card">

// Icon container
<div className="bg-muted p-2.5 text-muted-foreground">
```

## What to Avoid

- Purple, indigo, or any saturated accent colors
- `font-bold`, `font-semibold` on headings
- `rounded-xl`, `rounded-lg`, or any rounding classes
- `shadow-sm`, `shadow-md`, or any box shadows on cards
- Gradient overlays or colored backgrounds on sections
- `text-accent` for highlighting values (use `text-foreground font-medium` instead)
