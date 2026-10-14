---
name: Calm Administrative System
colors:
  surface: '#fcf8ff'
  surface-dim: '#dcd8e5'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2ff'
  surface-container: '#f0ecf9'
  surface-container-high: '#eae6f4'
  surface-container-highest: '#e4e1ee'
  on-surface: '#1b1b24'
  on-surface-variant: '#464555'
  inverse-surface: '#302f39'
  inverse-on-surface: '#f3effc'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#7e3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#fcf8ff'
  on-background: '#1b1b24'
  surface-variant: '#e4e1ee'
  slate-50: '#f8fafc'
  slate-100: '#f1f5f9'
  slate-200: '#e2e8f0'
  slate-400: '#94a3b8'
  slate-500: '#64748b'
  slate-800: '#1e293b'
  slate-900: '#0f172a'
  indigo-400: '#818cf8'
  indigo-600: '#4f46e5'
  destructive: '#dc2626'
  destructive-dark: '#f87171'
  success: '#059669'
  success-dark: '#34d399'
  warning: '#d97706'
  warning-dark: '#fbbf24'
typography:
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  table-cell:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  table-header:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  meta:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-tablet: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

# Design Specification

UI and UX rules for the public landing page and the admin area. Built with Tailwind + shadcn/ui. The goal is a **clean, trustworthy, fast, and very readable** interface, because the content is a table of people and documents.

## 1. Principles

1. **Clarity first.** Data is the product. Strong hierarchy, generous spacing, no decoration that competes with the table.
2. **Calm and trustworthy.** Neutral palette with one accent color. This handles sensitive information, so no playful styling.
3. **Fast feeling.** Skeletons instead of spinners, instant client validation, visible progress for anything slow (compression, upload).
4. **Mobile-first.** Many users will open the public page on a phone.
5. **Accessible by default.** Keyboard navigable, visible focus, labeled inputs, WCAG AA contrast.
6. **Privacy visible.** Masked phones are shown as masked, not hidden, so users understand why.

## 2. Visual language

### Typography
- Font: **Geist Sans** (or Inter as a fallback) via `next/font`, no layout shift
- Numbers (serial, phone): `font-mono`, `tabular-nums`, so columns align

| Use | Style |
|---|---|
| Page title | 28/32px mobile, 32/40px desktop, semibold, tight tracking |
| Section heading | 20px, semibold |
| Body | 15 to 16px, regular |
| Table text | 14px |
| Meta / helper | 13px, muted color |

### Color tokens (shadcn CSS variables, light and dark)

| Token | Light | Dark | Use |
|---|---|---|---|
| `background` | white | near-black slate | Page |
| `foreground` | slate-900 | slate-50 | Text |
| `muted` | slate-100 | slate-800 | Table stripes, skeletons |
| `muted-foreground` | slate-500 | slate-400 | Helper text |
| `border` | slate-200 | slate-800 | Dividers, inputs |
| `primary` | indigo-600 | indigo-400 | Primary buttons, links, focus ring |
| `destructive` | red-600 | red-400 | Delete, errors |
| `success` | emerald-600 | emerald-400 | Compression savings, success toasts |
| `warning` | amber-600 | amber-400 | Storage meter above 80% |

Support light and dark through `prefers-color-scheme`. Check contrast for every pair.

### Shape and spacing
- Radius: `0.5rem` on inputs and buttons, `0.75rem` on cards and dialogs
- Spacing scale: 4px base. Page padding 16px mobile, 24px tablet, 32px desktop
- Content max width: `max-w-5xl` on the public page, `max-w-6xl` on the admin
- Borders over shadows. One subtle shadow level for dialogs and popovers only

## 3. Layouts

### Public landing page (`/`)

- Table at `md` and above. Cards below `md` (name as the title, serial and masked phone as rows).
- Record count shown next to the search.
- Footer note: "Phone numbers are partially hidden for privacy."
- No document control for visitors.

### Admin login (`/admin/login`)
- Centered card, max width 380px
- Username, password, "Sign in" button full width
- Inline error under the form (generic: "Invalid username or password")
- Rate limit message: "Too many attempts. Try again in a few minutes."

### Admin dashboard (`/admin`)
- File column: type badge (PDF / DOCX), size, and a View (PDF) or Download (DOCX) link
- Row actions in a menu: Edit, Delete
- Mobile: cards with an actions menu

### Add / Edit form (`/admin/new`, `/admin/[id]/edit`)
- Single column, max width 560px, in a card
- Field order: Name, Phone, Serial number, Document
- Sticky bottom action bar on mobile: Cancel, Save
