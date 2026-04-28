# Kid Cloud Landing Page Frontend Spec

This document captures the **frontend-only landing page** for `Kid Cloud` so it can be recreated in another app.

It covers:
- sections and layout
- text/copy
- images
- colors and visual style
- buttons and interactions
- spacing, typography, and UI treatment

## Brand

- Product name: `Kid Cloud`
- Brand mark:
  - icon/mark only: `public/brand/kid-cloud-mark.png`
  - full logo: `public/brand/kid-cloud-logo.png`

## Overall Style

Design direction:
- modern EdTech / SaaS landing page
- soft premium look
- bright and friendly, not dark or corporate-heavy
- rounded cards, subtle glass effects, soft gradients
- lots of white / near-white space
- strong headline contrast
- bold display typography for headings
- light shadows, not harsh shadows

Core feel:
- trustworthy
- clean
- family-friendly
- polished
- high-end but simple

## Page Background and Color Language

Main page base:
- page background: `#F8FAFC`
- text primary: dark slate
- section alternation uses white and light slate

Accent palette currently used on landing page:
- indigo / blue for trust and structure
- fuchsia / pink for energy and emphasis
- teal in the hero glow background

Important visible color patterns:
- headline gradient:
  - `from-indigo-600 to-fuchsia-600`
- hero background glows:
  - indigo / fuchsia blob
  - blue / teal blob
- CTA band:
  - dark indigo/fuchsia background

If rebuilding in plain CSS instead of Tailwind, use approximately:

```css
--bg-page: #F8FAFC;
--text-main: #0f172a;
--text-soft: #475569;
--surface: #ffffff;
--border-soft: #e2e8f0;
--brand-indigo: #4f46e5;
--brand-indigo-dark: #4338ca;
--brand-fuchsia: #c026d3;
--brand-fuchsia-dark: #a21caf;
--brand-blue-soft: #60a5fa;
--brand-teal-soft: #2dd4bf;
```

## Typography

Visual hierarchy:
- Top headings: extra bold, large, display-style
- Section labels/eyebrows: uppercase, small, spaced letters
- Body text: medium weight, soft slate
- Buttons: bold

Recommended structure:
- `H1`: bold / extra bold, hero scale
- `H2/H3`: bold display style
- body: clean sans-serif, medium or normal
- small labels: uppercase, tracking/wide letter spacing

## Max Width and Layout

Main container width:
- `max-w-7xl`

Horizontal padding:
- mobile: `px-4` to `px-6`
- desktop: `px-6`

Layout pattern:
- hero: centered
- stats: 4-column grid
- features: 2-column card grid on desktop
- partner section: 2-column image/text split
- CTA band: centered
- footer: simple row layout with nav links

## Landing Page Structure

### 1. Sticky-style Header / Top Bar

Structure:
- logo mark on left
- product name next to it
- language switcher on right
- secondary login button
- primary register button

Current UI treatment:
- absolute at top
- transparent / floating over hero
- logo icon inside rounded square
- login button uses soft white glass look
- register button uses bold gradient fill

Header content:
- left text: `Kid Cloud`
- buttons:
  - `Zum Dashboard`
  - `Einrichtung registrieren`

### 2. Hero Section

#### Hero badge
Text:
- `Die Plattform für Kita & Elementarbereich`

Style:
- pill badge
- white translucent background
- soft border
- small indigo dot
- indigo text

#### Hero headline
Text:
- line 1: `Gemeinsam stark mit dem`
- line 2: `Kita-Verwaltungssystem`

Style:
- centered
- very large
- heavy font weight
- second line uses indigo-to-fuchsia gradient text

#### Hero subtitle
Text:
- `Verwaltung vereinfachen, Teams und Eltern verbinden und den Fokus auf die Kinder legen.`

#### Hero CTAs
Buttons:
- primary:
  - text: `Einrichtung registrieren`
  - with right arrow icon
  - gradient fill
- secondary:
  - text: `Zum Dashboard`
  - white / glass style

#### Hero image
Current source:
- `https://www.kinderpedia.co/media/yootheme/cache/29/student_information_system_1280px-290d7e79.webp`

Alt:
- `Dashboard-Ansicht der Kita-Verwaltung`

Visual treatment:
- large framed screenshot
- rounded outer container
- white background frame
- soft border
- strong soft shadow

### 3. Stats Section

Background:
- white
- top and bottom border

Grid:
- 4 items

Stats content:
1. `2500+` / `Kitas & Einrichtungen`
2. `300k+` / `zufriedene Eltern`
3. `80k+` / `Fachkräfte`
4. `99%` / `Zufriedenheit`

Style:
- centered
- bold large number
- softer label text
- subtle separators

### 4. Features / Modules Section

Section eyebrow:
- `Alles aus einer Hand`

Section title:
- line 1: `Alles, was Ihre Einrichtung braucht —`
- line 2: `an einem Ort.`

Layout:
- 2-column responsive card grid

Each card contains:
- colored icon block
- title
- description
- screenshot/image preview

#### Feature cards

1. Verwaltung
- title: `Verwaltung`
- description: `Anwesenheit, Abrechnung und Organisation – alles aus einem Dashboard.`
- image:
  - `https://www.kinderpedia.co/media/yootheme/cache/29/student_information_system_1280px-290d7e79.webp`

2. Eltern einbinden
- title: `Eltern einbinden`
- description: `Aktuelle Infos, Fotos und Tagesberichte direkt aus der Gruppe.`
- image:
  - `https://www.kinderpedia.co/media/yootheme/cache/66/parent_teacher_communication_app_1280-66b0e1d7.webp`

3. Pädagogik & Alltag
- title: `Pädagogik & Alltag`
- description: `Planen, Fortschritt dokumentieren und Entwicklung beobachten.`
- image:
  - `https://www.kinderpedia.co/media/yootheme/cache/4a/classroom_management_software_1280px-4ab4ef11.webp`

4. Gebühren & Finanzen
- title: `Gebühren & Finanzen`
- description: `Rechnungen, Zahlungen und Finanzüberblick mit weniger Aufwand.`
- image:
  - `https://www.kinderpedia.co/media/yootheme/cache/c6/childcare_billing_software_1280px-c6312ec2.webp`

Card styling:
- white background
- rounded `24px+`
- subtle border
- hover lift
- stronger shadow on hover
- image at bottom in rounded inner frame

### 5. Parents / Benefits Section

Layout:
- left: large lifestyle image
- right: section text and bullet-style benefits

Eyebrow:
- `Eltern als Partner`

Headline:
- `Näher an Bildung und Entwicklung Ihrer Kinder`

Benefits:
1. `Nachrichten und Ankündigungen in Echtzeit`
2. `Gemeinsamer Kalender für Feiertage und Termine`
3. `Tagesberichte und Wohlbefinden im Blick`

Current image:
- `https://www.kinderpedia.co/media/yootheme/cache/59/gradinita-bergman-05cf8571-593ee558.webp`

Alt:
- `Kinder in der Kita`

Visual treatment:
- tall rounded image
- white border frame
- dark top-to-bottom overlay gradient
- icon circles next to each benefit

### 6. Final CTA Band

Background:
- dark indigo/fuchsia gradient band

Headline:
- `Bereit für den nächsten Schritt?`

Subtitle:
- `Schließen Sie sich Einrichtungen an, die Verwaltung vereinfachen und Familien begeistern.`

Button:
- `Jetzt registrieren`

Button style:
- white filled button
- dark indigo text
- larger than normal

### 7. Footer

Left:
- small logo tile
- `Kid Cloud`

Center/right links:
- `Datenschutz`
- `Impressum`
- `Sicherheit`
- `AVV / DPA`

Bottom copyright:
- `© [current year] Kid Cloud Plattform. Alle Rechte vorbehalten.`

## Images Used

### Local assets
- `/brand/kid-cloud-mark.png`
- `/brand/kid-cloud-logo.png`

### External marketing images currently used
- `https://www.kinderpedia.co/media/yootheme/cache/29/student_information_system_1280px-290d7e79.webp`
- `https://www.kinderpedia.co/media/yootheme/cache/66/parent_teacher_communication_app_1280-66b0e1d7.webp`
- `https://www.kinderpedia.co/media/yootheme/cache/4a/classroom_management_software_1280px-4ab4ef11.webp`
- `https://www.kinderpedia.co/media/yootheme/cache/c6/childcare_billing_software_1280px-c6312ec2.webp`
- `https://www.kinderpedia.co/media/yootheme/cache/59/gradinita-bergman-05cf8571-593ee558.webp`

If you want the new app to be independent, download and host these locally instead of hotlinking.

## Button System

### Primary CTA
- gradient fill
- white text
- bold
- rounded pill / rounded-xl
- light lift on hover
- optional shadow glow

### Secondary CTA
- white or translucent white background
- indigo text
- thin soft border
- blur/glass optional

### Final CTA button
- white background
- dark indigo text
- larger padding

## Radius / Shadow / Border Rules

Use these consistently:

- small controls: `12px to 16px`
- medium cards: `24px`
- hero image shell: `32px to 40px`
- buttons: `16px to 20px`

Shadows:
- soft, spread shadows
- avoid harsh black drops
- use layered depth more than opacity

Borders:
- very light slate borders
- mostly `1px`
- use borders to define structure gently

## Motion / Interaction

Visible motion in current page:
- hero blobs pulse slowly
- buttons have hover transitions
- hero CTA arrow slides slightly right
- cards lift and image scales on hover

Keep animation:
- smooth
- slow-medium
- polished
- not flashy

## Rebuild Notes

If rebuilding in another app/framework:

1. Keep section order the same.
2. Preserve headline gradient treatment.
3. Preserve white/soft-slate layout rhythm.
4. Keep strong rounded corners everywhere.
5. Use the same text unless you intentionally rewrite copy.
6. Replace remote images with local hosted copies if needed.
7. Use the logo mark in navbar/footer and full logo only where larger branding is needed.

## Quick Content Export

### Header Buttons
- `Zum Dashboard`
- `Einrichtung registrieren`

### Hero
- Badge: `Die Plattform für Kita & Elementarbereich`
- Lead: `Gemeinsam stark mit dem`
- Accent: `Kita-Verwaltungssystem`
- Subtitle: `Verwaltung vereinfachen, Teams und Eltern verbinden und den Fokus auf die Kinder legen.`

### Stats
- `2500+` / `Kitas & Einrichtungen`
- `300k+` / `zufriedene Eltern`
- `80k+` / `Fachkräfte`
- `99%` / `Zufriedenheit`

### Modules
- Eyebrow: `Alles aus einer Hand`
- Title: `Alles, was Ihre Einrichtung braucht —`
- Title line 2: `an einem Ort.`

### Feature Titles
- `Verwaltung`
- `Eltern einbinden`
- `Pädagogik & Alltag`
- `Gebühren & Finanzen`

### Partner Section
- Eyebrow: `Eltern als Partner`
- Title: `Näher an Bildung und Entwicklung Ihrer Kinder`

### CTA Band
- Title: `Bereit für den nächsten Schritt?`
- Subtitle: `Schließen Sie sich Einrichtungen an, die Verwaltung vereinfachen und Familien begeistern.`
- Button: `Jetzt registrieren`

## Source Reference

Main implementation source:
- `src/app/page.tsx`

Primary German copy source:
- `src/i18n/core.ts`
