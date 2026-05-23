---
name: Kinetic Flow
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434656'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737688'
  outline-variant: '#c3c5d9'
  surface-tint: '#004ced'
  primary: '#003ec7'
  on-primary: '#ffffff'
  primary-container: '#0052ff'
  on-primary-container: '#dfe3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#5c5f61'
  on-secondary: '#ffffff'
  secondary-container: '#e0e3e5'
  on-secondary-container: '#626567'
  tertiary: '#464e64'
  on-tertiary: '#ffffff'
  tertiary-container: '#5e667d'
  on-tertiary-container: '#dde4ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001452'
  on-primary-fixed-variant: '#0038b6'
  secondary-fixed: '#e0e3e5'
  secondary-fixed-dim: '#c4c7c9'
  on-secondary-fixed: '#191c1e'
  on-secondary-fixed-variant: '#444749'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-margin: 20px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style

The design system is engineered for Demand Responsive Transport (DRT), focusing on reliability, punctuality, and a premium public service feel. The brand personality is **dependable yet energetic**, bridging the gap between traditional municipal transit and high-end tech services.

The design style follows a **Corporate / Modern** aesthetic with a heavy emphasis on **High-Contrast Accessibility**. It utilizes generous white space, structured information density, and soft geometric forms to reduce cognitive load for commuters. The emotional response should be one of "calm efficiency"—the user should feel that their transport is organized, tracked, and imminent.

## Colors

The palette is anchored by **Electric Blue**, a color that signals both digital innovation and institutional trust. 

- **Primary (#0052FF):** Used for action-oriented elements, active route paths, and brand touchpoints.
- **Surface & Backgrounds:** We use a "Clean Slate" approach. The primary background is Pure White (#FFFFFF), while secondary surfaces like cards and search bars use **Slate 50 (#F8FAFC)** to create subtle hierarchy.
- **Typography & Details:** **Slate 900 (#0F172A)** is used for high-contrast headers to ensure readability in outdoor lighting conditions. **Slate 500 (#64748B)** is reserved for secondary metadata and icons.
- **Status:** Success (Arrivals), Warning (Delays), and Error states use highly saturated tones to remain distinct from the primary blue.

## Typography

This design system utilizes **Inter** for its exceptional legibility at small sizes and its neutral, systematic character. It ensures that complex transit schedules remain scannable.

For technical data—such as vehicle IDs, ETAs, and platform numbers—**JetBrains Mono** is introduced as a utility font to provide a "functional/tracking" feel that distinguishes live data from static UI labels.

**Mobile Scaling:**
Headlines scale down by 15% on small devices, while body text maintains a minimum of 16px to ensure accessibility for users on the move.

## Layout & Spacing

The layout follows a **Fluid Grid** model optimized for thumb-reachability on mobile devices. 

- **Grid:** A 4-column mobile grid with 20px outer margins.
- **Rhythm:** An 8pt linear scale is used for most spacing, with 4px increments for tight component internals (labels to inputs).
- **Safe Areas:** Generous bottom padding is applied to all primary action buttons (like "Book Ride") to avoid interference with OS-level home indicators.
- **Information Density:** High-density lists are used for schedules, while low-density, centered layouts are used for ride-tracking and booking confirmations.

## Elevation & Depth

To maintain a premium feel without visual clutter, the design system uses **Tonal Layers** combined with **Ambient Shadows**.

1.  **Level 0 (Floor):** Pure White (#FFFFFF) or Slate 50.
2.  **Level 1 (Cards):** Elevated via a very soft, large-radius shadow (Blur: 20px, Y: 4px, Opacity: 4% Black). This is used for ride cards and map overlays.
3.  **Level 2 (Floating Actions):** Higher contrast shadows (Opacity: 8%) to indicate interactivity, such as the "Locate Me" button or primary booking bar.

Avoid heavy inner shadows or glows. Depth should feel natural and light, mimicking a physical card resting on a clean surface.

## Shapes

The shape language is defined by **Soft Roundedness**. 

- **Standard Elements:** Buttons and input fields use a **0.5rem (8px)** radius for a professional, stable appearance.
- **Containers:** Main UI cards and bottom sheets use a **1.5rem (24px)** radius on top corners to create a friendly, approachable "container" for the user's journey details.
- **Interactive Icons:** Small chips and status indicators use a full pill-shape (999px) to distinguish them from structural UI elements.

## Components

### Buttons
Primary buttons are solid Blue (#0052FF) with white text. They must span the full width of the container on mobile to maximize the hit area. Secondary buttons use a Slate 100 ghost style with Slate 900 text.

### Input Fields
Search bars for destinations use a Slate 50 background with a subtle 1px border (#E2E8F0). When focused, the border transitions to Primary Blue with a 2px stroke.

### Cards (Ride Details)
Ride cards are the core component. They feature a vertical "Route Line" on the left, connecting the pickup and drop-off points. Use high-contrast Slate 900 for addresses and Primary Blue for the "Vehicle Arriving" status.

### Transit Chips
Small, color-coded indicators for transport modes (e.g., "Shuttle", "Bus", "Train"). These use a background tint (10% opacity of the category color) with high-saturation text for maximum legibility.

### Bottom Sheets
All booking configurations (selecting seats, time, or passengers) occur in non-modal bottom sheets, allowing the user to keep the map in view for spatial context.