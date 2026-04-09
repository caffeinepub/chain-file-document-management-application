# Design Brief: Chain File Remix

## Tone
Minimalist luxury, architectural, high-contrast. Refined productivity app that prioritizes clarity over decoration.

## Differentiation
Solid elevated cards with strong borders, warm amber accents used sparingly for key actions, restrained shadow hierarchy, crisp type pairing (bold geometric display + clean body). Moves away from glassmorphism and neon blue toward professional warmth.

## Color Palette (Dark-first)

| Token | Light | Dark | Usage |
| --- | --- | --- | --- |
| Background | `0.98 0.01 240` | `0.1 0.01 240` | Page/surface foundation |
| Foreground | `0.12 0.01 240` | `0.96 0.015 240` | Primary text |
| Card | `0.96 0.015 240` | `0.16 0.02 240` | Elevated surfaces |
| Muted | `0.3 0.02 240` | `0.22 0.02 240` | Secondary/disabled state |
| **Primary (Amber)** | `0.9 0.02 60` | `0.85 0.18 60` | Subtle background tint |
| **Accent (Warm Gold)** | `0.55 0.22 60` | `0.55 0.22 60` | CTAs, active states, highlights |
| Secondary | `0.6 0.04 240` | `0.5 0.03 240` | Accents, moderation |
| Destructive | `0.62 0.2 15` | `0.65 0.22 15` | Error/warning states |
| Border | `0.25 0.03 240` | `0.22 0.03 240` | 1px structural dividers |

## Typography

| Layer | Font | Weight | Size | Usage |
| --- | --- | --- | --- | --- |
| Display | Bricolage Grotesque | 700 | 2.25–3.5rem | Headlines, hero title |
| Heading | Bricolage Grotesque | 600 | 1.25–1.875rem | Section heads, tabs |
| Body | DM Sans | 400–500 | 0.875–1rem | Body copy, form text, labels |
| Mono | Geist Mono | 400 | 0.75–0.875rem | Hash values, code, timestamps |

## Component Aesthetic
Solid elevated cards with 1px borders, crisp `0.25rem` border-radius, real depth via shadow hierarchy (sm/md/lg/xl), no blur/glassmorphism. Buttons use warm gold accent with minimal hover lift. Tabs have clean underline indicator, no background fill. File lists and tables use light dividers and consistent grid spacing.

## Structural Zones

| Zone | Surface | Border | Treatment |
| --- | --- | --- | --- |
| Header | Card (`0.16 0.02 240` dark) | 1px border-bottom | Slim, minimal, strong branding |
| Hero/Banner | Background + gradient accent | None | Clean linear gradient, large headline |
| Main Content | Background | None | Grid-based whitespace, breathing room |
| Tab Container | Card | 1px all sides | Subtle elevation, clear visual separation |
| File Cards | Card | 1px + hover border lift | Hover brightens border, lifts shadow |
| Action Area (Upload) | Muted background | 2px dashed border | Spacious, inviting drag-drop zone |
| Footer | Muted background | 1px border-top | Light text, secondary actions |

## Shadow Hierarchy
- `shadow-sm`: 0 1px 2px rgba(0,0,0,0.16) — micro elevation for small UI
- `shadow-md`: 0 4px 8px rgba(0,0,0,0.2) — standard card elevation
- `shadow-lg`: 0 12px 24px rgba(0,0,0,0.25) — prominent hover/modal state
- `shadow-xl`: 0 20px 40px rgba(0,0,0,0.3) — deep backdrop/overlay

## Spacing & Rhythm
Responsive grid: 12px base unit. Sections use 2–4rem vertical breathing room. Tab/list items use 0.75–1rem padding for readable density. Forms and upload zones favor generous whitespace over compact layouts.

## Component Patterns
- **Buttons**: Warm gold accent fill (`--accent`), white text, `rounded-full` (0.5rem), shadow-md hover. Secondary buttons use card background + border, no fill.
- **Inputs**: Dark field (`--input`), 1px subtle border, `rounded-sm` (0.5rem), focus ring is accent glow (0 0 0 2px).
- **Tabs**: Clean underline indicator (no background), muted text → bold + accent color on active, smooth underline transition.
- **Cards**: Flat or elevated variant. Flat = card bg + 1px border. Elevated = shadow-md + hover lift.
- **Badges**: Small pill-shaped labels, muted background + foreground. Accent variant uses background + accent text.

## Motion
Minimal, purposeful. Transitions use `all 0.2s ease`. Hover lift on cards (translateY -4px), shadow brightens. No shimmer, pulse, or float animations in production — reserved for loading states only.

## Constraints
- No full-page gradients or decorative blur effects.
- Accent color used only on primary CTAs, active tab indicators, and critical highlights.
- Border radius consistent: `0.25rem` for cards, `0.5rem` for buttons/inputs, full for badges.
- All text must meet AA+ contrast on dark background (L difference ≥ 0.7).
- No arbitrary color overrides; use semantic tokens exclusively.

## Signature Detail
**Warm amber accent bar** on highlighted content (e.g., recent files, active upload task) — 3px left border in `--accent` color with matching text highlight, creating a cohesive accent system that ties the interface together while maintaining minimalist restraint.
