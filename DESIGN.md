---
name: HORYZONT
description: Premium Gdynia real estate; the Latarnia Orłowo tower shown through a day of light and weather.
colors:
  night: "#0a0f1a"
  night-2: "#0f1624"
  panel: "#141c2c"
  line: "#263248"
  brass: "#c9a46a"
  brass-hi: "#dcbd88"
  text: "#ece6da"
  muted: "#a7afbd"
  status-free: "#7fc29b"
  status-held: "#e0b45e"
  status-sold: "#8a93a3"
  error: "#ff9b86"
  footer-night: "#070b13"
  plan-ground: "#0d1422"
  scrim: "#060910"
  scene-text: "#f1ece2"
  scene-text-dim: "#e3dccf"
  brass-ink: "#3b2e18"
  header-glass: "rgba(10, 15, 26, .78)"
  header-rule: "rgba(201, 164, 106, .22)"
  brass-rule: "rgba(201, 164, 106, .55)"
  brass-border-hover: "rgba(201, 164, 106, .6)"
  brass-wash: "rgba(201, 164, 106, .08)"
  brass-wash-strong: "rgba(201, 164, 106, .16)"
  brass-plan-fill: "rgba(201, 164, 106, .06)"
  terrace-fill: "rgba(127, 194, 155, .08)"
  ghost-fill: "rgba(10, 15, 26, .35)"
  ghost-border: "rgba(236, 230, 218, .7)"
  hud-dim: "rgba(236, 230, 218, .7)"
  hud-hint: "rgba(236, 230, 218, .75)"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(36px, 5vw, 74px)"
    fontWeight: 700
    lineHeight: 1
    fontVariation: "'wdth' 125"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(30px, 4vw, 54px)"
    fontWeight: 600
    lineHeight: 1.05
    fontVariation: "'wdth' 125"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.25
    fontVariation: "'wdth' 125"
  figure:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(34px, 4vw, 48px)"
    fontWeight: 600
    lineHeight: 1
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 125"
  hud-clock:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(44px, 5vw, 76px)"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-.01em"
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 125"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.65
  lead:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(17px, 1.4vw, 20px)"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    letterSpacing: ".08em"
  button:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: ".06em"
    fontVariation: "'wdth' 125"
rounded:
  none: "0"
  sharp: "2px"
  dot: "50%"
spacing:
  chip-gap: "8px"
  field-gap: "16px"
  grid-gap: "22px"
  column-gap: "24px"
  split-gap: "clamp(32px, 6vw, 96px)"
  section-y: "clamp(72px, 9vw, 130px)"
  wrap-max: "1280px"
  wrap-inset: "20px"
components:
  button-primary:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.night}"
    typography: "{typography.button}"
    rounded: "{rounded.sharp}"
    padding: "14px 26px"
    height: "52px"
  button-primary-hover:
    backgroundColor: "{colors.brass-hi}"
    textColor: "{colors.night}"
  button-ghost:
    backgroundColor: "{colors.ghost-fill}"
    textColor: "{colors.text}"
    typography: "{typography.button}"
    rounded: "{rounded.sharp}"
    padding: "14px 26px"
    height: "52px"
  button-ghost-hover:
    backgroundColor: "{colors.text}"
    textColor: "{colors.night}"
  button-large:
    padding: "16px 30px"
    height: "58px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.sharp}"
    padding: "8px 16px"
    height: "42px"
  chip-on:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.night}"
  input:
    backgroundColor: "{colors.night}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.sharp}"
    padding: "13px 14px"
    height: "54px"
  segment:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
    padding: "8px"
    height: "50px"
  segment-checked:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.night}"
  card-panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
    padding: "20px 22px 24px"
  table-head:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.muted}"
    padding: "14px 16px"
  table-row-selected:
    backgroundColor: "{colors.brass-wash-strong}"
    textColor: "{colors.brass-hi}"
  header:
    backgroundColor: "{colors.header-glass}"
    textColor: "{colors.text}"
    height: "76px"
  fab:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.night}"
    typography: "{typography.button}"
    height: "54px"
---

# Design System: HORYZONT

## Overview

**Creative North Star: "The Architect's Night Sheet"**

HORYZONT is a dark spec sheet laid over a live sky. The page opens on a full-viewport procedural canvas: the Latarnia Orłowo tower over Gdańsk Bay, scrubbed by scroll through five conditions (dawn, noon, golden hour, rain, night). Everything below the scene reads like an architect's drawing set: night navy grounds, thin brass rules, wide uppercase Archivo, tabular figures, sharp corners. Density is medium; sections alternate between two navies to separate chapters without decoration.

Brass is the only accent and it does real work: primary buttons, selected states, rules that open a data block, key figures (price, monthly payment, chapter facts). The warm white text and the brass together read as lamplight on a dark facade, which is the same palette the canvas uses for lit windows at night.

**Key Characteristics:**
- Full-bleed scroll-driven canvas scene with a HUD (clock, weather, five-stop rail) and chapter copy on the left.
- Night navy tonal layering (night, night-2, panel) instead of shadows.
- Brass as the single accent; status colours only in the units table and plan.
- Archivo at 125% width, uppercase, for every heading and every key number.
- 2px or square corners everywhere; 1px hairlines in line or brass.

## Colors

A one-accent night palette: three stepped navies, one hairline colour, brass in two strengths, warm white text.

### Primary
- **Lamp Brass** (brass): primary buttons, selected chips and segments, the top rule of spec and result blocks, plan outlines, form focus border, logo stroke, range and checkbox accent.
- **Lit Brass** (brass-hi): hover for brass buttons, links, key figures (plan price, monthly payment, chapter fact numbers), selected table row text, active HUD rail dot, focus ring, footer column headings.

### Neutral
- **Night Navy** (night): page ground, scene ground, input fields, table body, alternate sections.
- **Deep Harbour** (night-2): alternating section ground (units, calculator, contact).
- **Chart Panel** (panel): cards, plan, calculator box, form, testimonials, agent card, sticky table head.
- **Drafting Line** (line): every 1px border, divider, row rule, chip/segment/input stroke.
- **Warm Paper** (text): body text; inverted fill for ghost button hover.
- **Fog Grey** (muted): leads, labels, meta, table headers, captions.
- **Secondary grounds:** footer-night (footer only, the darkest step), plan-ground (inside the SVG floor plan), scrim (base of the scene shade gradients, used at .84/.55/.45/.9 alpha).
- **Scene text:** scene-text for chapter paragraphs and scene-text-dim for HUD weather and chapter facts; slightly warmer than text so copy holds over the bright noon sky.
- **Overlays:** header-glass with header-rule bottom border; brass-wash (row hover) and brass-wash-strong (selected row); brass-rule (chapter fact top border); brass-border-hover (offer card hover); brass-plan-fill and terrace-fill inside the plan; ghost-fill/ghost-border for the line button over the canvas; hud-dim and hud-hint for inactive HUD text.
- **Brass Ink** (brass-ink): caption text on the brass lead testimonial only.

### Status
- **Free** (status-free), **Held** (status-held), **Sold** (status-sold): dot + label in the units table and plan header. Free also strokes terrace outlines (dashed) in the plan. **Error** (error): field border and message.

### Named Rules
**The One Lamp Rule.** Brass is the only accent. No second hue enters the UI chrome; status colours stay inside unit data.

**The Night Sky Exception Rule.** The canvas scene owns its own sky palette (see sidecar `sceneKeyframes`); those blues, mauves and ambers never leak into UI surfaces.

## Typography

**Display Font:** Archivo (with system-ui, sans-serif), width 125
**Body Font:** Archivo (with system-ui, sans-serif), width 100

**Character:** One variable family split by width: wide, uppercase, tight-leaded for headings and numbers; normal width for reading. Feels like lettering on an architectural title block.

### Hierarchy
- **Display** (700, clamp 36-74px, 1.0, uppercase): the scene h1 only.
- **Headline** (600, clamp 30-54px, 1.05, uppercase, balanced): section h2; scene chapter h2 at clamp 28-50px.
- **Title** (600, 20-22px, uppercase for plan/done headings): plan head, offer titles (sentence case), done state (30px).
- **Figure** (600, wide, tabular): monthly payment (clamp 34-48px), plan price 28px, chapter fact 30px, offer price and spec values 20-26px.
- **HUD Clock** (500, clamp 44-76px, tabular, -.01em): scene clock only.
- **Body** (400, 17px / 16px under 640px, 1.65); leads clamp 17-20px in muted, max 46ch.
- **Label** (13px, .08em, uppercase, muted): spec terms, filter label, result labels, table head (12.5px, 600), offer location (brass-hi), footer headings (600, brass-hi).
- **Button** (600, 14px, wide, .06em, uppercase).

### Named Rules
**The Wide Numbers Rule.** Every number that sells (price, rate, area, time) is set wide (125) and tabular.

**The Two Widths Rule.** Width 125 is for headings, brand, figures and buttons; running text stays at 100.

## Layout

Single column of full-width sections inside a 1280px wrap (20px side inset, 16px under 640px). Sections pad clamp(72px, 9vw, 130px) vertically and alternate night / night-2 grounds. Content sections use asymmetric two-column splits (.9fr/1.1fr, 1.2fr/.8fr, .8fr/1.2fr) with a clamp(32px, 6vw, 96px) gap; card grids use 22px gaps (offers 3 columns, voices 1.3fr/1fr/1fr). Section heads put the h2 left and a muted note or chip group right, bottom-aligned.

The scene is 560vh (520vh on phones) with a sticky 100svh viewport; chapters bottom-left, HUD right. Fixed 76px header (64px on phones). Breakpoints: 1000px (burger nav, single-column splits, 2-col offers, sticky bottom FAB) and 640px (HUD moves above copy, rail collapses to dots, table rows become stacked cards, all grids single column, full-width CTAs).

## Elevation & Depth

Flat. Depth comes from tonal stepping (night, night-2, panel) and 1px line borders. The only blurs and shadows are functional: the frosted header (blur 14px, saturate 1.2), text shadows that keep scene copy legible over the canvas, and one soft shadow under the mobile FAB.

### Shadow Vocabulary
- **Scene copy** (`text-shadow: 0 2px 18px rgba(0,0,0,.45)`): chapter text over the canvas.
- **HUD** (`text-shadow: 0 2px 14px rgba(0,0,0,.5)`): clock, weather, rail.
- **FAB lift** (`box-shadow: 0 14px 30px -12px rgba(0,0,0,.7)`): mobile sticky CTA only.

### Named Rules
**The Tonal Step Rule.** Lift a surface by moving it one navy step and giving it a line border, never by adding a drop shadow.

## Shapes

Sharp. Buttons, chips, inputs at 2px; panels, cards, segments, table at 0. Circles only for status dots, HUD rail dots and the agent portrait. Borders are 1px hairlines for containers and 1.5px for interactive strokes (buttons, chips, segments, inputs). A solid brass 1px top rule opens data blocks (spec list, calculator result). The brand mark is a horizon line with a half sun, drawn in brass stroke; it reappears in the form success state.

## Components

### Buttons
- **Shape:** sharp (2px), min-height 52px (58px large), 1.5px border.
- **Primary:** brass fill, night text, wide uppercase 14px. Hover: brass-hi, lift 2px.
- **Ghost:** translucent night fill, warm white text and border at .7; hover inverts to text fill / night text. Used over the canvas and as secondary actions.
- **Disabled:** opacity .6, progress cursor.

### Chips
- **Style:** transparent, line stroke 1.5px, 600 14px, 42px tall. Hover stroke brass. On: brass fill, night text. Used for room and property-type filters (aria-pressed).

### Cards / Containers
- **Corner Style:** square.
- **Background:** panel with line border.
- **Offer card:** 4:3 photo, body 20/22/24px; hover lifts 4px, border to brass-border-hover, image scales 1.04.
- **Testimonial:** panel cards, the lead quote inverted to solid brass with night text.

### Inputs / Fields
- **Style:** night fill, 1.5px line stroke, 2px corners, 54px tall, brass caret; select with a brass chevron.
- **Focus:** border to brass (outline removed); global focus-visible is a 2px brass-hi outline at 3px offset.
- **Error:** error border and 14px error message below.
- **Segmented control:** three equal cells, 1.5px line stroke, checked = brass fill / night text.

### Navigation
Frosted night header with a faint brass bottom rule; brand mark + wide tracked HORYZONT; 15px links with a brass underline that grows from the left on hover; brass CTA. Under 1000px a burger opens a full-width night panel with ruled 17px links.

### Scene HUD (signature)
Right-aligned clock (wide, tabular), weather line, and a five-stop rail of text buttons each ending in a ringed dot; the active stop turns brass-hi with a filled dot. Chapters crossfade (opacity + 14px rise) per stop; facts sit under a brass-rule with a 30px brass-hi figure. Under 640px the rail becomes 44px dot targets showing only the active label.

### Units Table + Plan (signature)
Sticky panel table head, tabular rows, brass-wash hover, brass-wash-strong selection with brass-hi lot number; status as dot + label. Beside it a sticky plan panel: SVG floor plan on plan-ground with brass room outlines and dashed free-green terraces, a two-column room list, wide brass-hi price and a brass CTA.

### Mortgage Calculator
Panel box with four brass-accented range sliders (label left, tabular output right), then a brass top rule and a large brass-hi monthly payment.

## Do's and Don'ts

### Do:
- **Do** keep brass as the only UI accent; use brass-hi for numbers and active states.
- **Do** set headings, brand, buttons and key figures in Archivo at 125% width, uppercase for headings and buttons.
- **Do** separate sections with night / night-2 alternation and 1px line borders.
- **Do** keep corners at 2px (controls) or square (containers).
- **Do** keep scene copy on the scrim shade with its text shadows so it stays legible from dawn through noon.
- **Do** keep content readable with motion off; transitions collapse under prefers-reduced-motion.

### Don't:
- **Don't** add drop shadows to cards or panels; use the tonal step.
- **Don't** introduce rounded pill shapes beyond status dots, rail dots and portraits.
- **Don't** let the canvas sky colours into UI chrome.
- **Don't** set running text in the wide width or in uppercase.
