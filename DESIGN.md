# Design Brief

## Tone & Purpose
High-tech cyberpunk terminal dashboard for threat detection and ML diagnostics. Brutalist, high-contrast, uncompromising in visual intensity.

## Palette

| Role | OKLCH | Usage |
| --- | --- | --- |
| Background | `0.05 0 0` | Pure black, CRT screen base |
| Text | `0.99 0 0` | White on black, maximum contrast |
| Safe/Ready | `0.75 0.32 142` | Terminal green, primary system state |
| Diagnostic Data | `0.82 0.18 195` | Electric cyan, ML readouts and panels |
| Threat/High-Risk | `0.54 0.28 29` | Vivid red, active blocking triggered |
| Card/UI Surface | `0.08 0 0` | Dark grey, subtle elevation |

## Typography
Display: JetBrains Mono (400). Body: JetBrains Mono (400). Mono: JetBrains Mono (400). All-monospace aesthetic for authenticity.

## Shape Language
Zero border-radius (pure square edges). Scanline effect overlay. Neon glow text-shadows on interactive elements. Thick 1px borders on cards.

## Structural Zones

| Zone | Background | Border | Text |
| --- | --- | --- | --- |
| Header | `--card` (0.08) | `--border` (0.10) | `--foreground` (0.99) |
| Main Scanner | `--background` (0.05) | None | `--foreground` (0.99) |
| Diagnostic Cards | `--card` (0.08) | `--border` (0.10) | Varies by state |
| Threat Alert | `--background` animated | `--destructive` | `--destructive` with glow |

## Spacing & Rhythm
Dense vertical rhythm: 0.5rem, 1rem, 1.5rem increments. Compact monospace creates tightness. Card gutters: 1.5rem padding. Header height: 4rem.

## Component Patterns
Buttons: black text on green background with cyan focus ring. Inputs: dark background with green placeholder text. Cards: dark surface with 1px green borders, glowing text on state change.

## Motion & Interaction
Threat detection: red glow pulse (0.6s). Scanline drift continuous. State transitions smooth (0.3s cubic-bezier). Probability updates live-animated.

## Signature Details
- Glowing green/cyan/red text with layered text-shadows (8px + 16px blur)
- Scanline overlay animation
- CRT terminal aesthetic: no shadows, pure geometric, monospace-only
- Threat state triggers full-screen red glow pulse and "SENDER QUARANTINED" message

## Constraints
- No rounded corners anywhere
- No gradients except scanline backdrop
- No drop shadows except text-glow
- Dark mode ONLY (cyberpunk 24/7)
- High contrast mandatory for readability

