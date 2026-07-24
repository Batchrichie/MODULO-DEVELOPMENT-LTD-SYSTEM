# CAREMS — UI/UX & Interaction Standard (v1.0)
**Attach this alongside:** `CAREMS_Frontend_Engineering_Standard.md`, `Master_Plan.md`, `CAREMS_Wireframes.html`.

**Purpose:** The Frontend Engineering Standard locks the tech stack and data rules (RPC-only, three states, no hardcoded colors). It does not say what the interface should *look and feel* like, so left alone the app will default to a generic admin-dashboard template. This document is that missing piece — it's opinionated on purpose. Treat it as non-negotiable unless the Instructor changes it, same as the Engineering Standard.

The wireframes (`CAREMS_Wireframes.html`) define **layout and content** — which fields go where. This document defines **how those layouts behave and are styled**. Where the two conflict on content/fields, the wireframe wins; where the topic is visual or interaction design, this document wins.

---

## 1. Visual identity — design tokens (do not deviate)

This is a working construction/architecture/rental business, not a SaaS marketing site. The interface should read as **precise, trustworthy, and industrial-modern** — closer to a cockpit instrument panel than a consumer app. Avoid the generic "AI dashboard" look (soft pastel cards on white with a single purple accent) and avoid decorative flourishes; every visual choice should earn its place by helping someone read numbers and act on them faster.

### Color (define as CSS custom properties — no component may hardcode a color)

| Token | Light mode | Dark mode | Use |
|---|---|---|---|
| `--bg-canvas` | `#F6F7F8` | `#12161C` | Page background |
| `--bg-surface` | `#FFFFFF` | `#1B2028` | Cards, panels, modals |
| `--bg-surface-sunken` | `#EEF0F2` | `#0D1015` | Table stripes, input backgrounds |
| `--border` | `#DDE1E6` | `#2A313C` | Hairline borders, dividers |
| `--text-primary` | `#1A1F26` | `#EDEFF2` | Headings, key values |
| `--text-secondary` | `#5B6572` | `#9AA4B2` | Labels, captions, muted text |
| `--accent` | `#D9631E` | `#E8763A` | Primary actions, active nav, focus rings — a construction-safety amber/orange, used sparingly |
| `--success` | `#1E8E5A` | `#3BAE7A` | Posted, on-track, compliant |
| `--warning` | `#C98A00` | `#E0A421` | Over-budget flags, filing due soon |
| `--danger` | `#C4372B` | `#E0564A` | Validation errors, rejected, overdue |
| `--info` | `#2B6CB0` | `#5B9BD9` | Informational banners, "pending backend" notices |

Rules:
- **`--accent` is used for exactly one thing per screen at a time** — the single primary action (e.g. "Approve," "Post Invoice"). Everything else uses neutral tones. If a screen has more than one orange element competing for attention, that's a bug, not a style choice.
- Status colors (`success`/`warning`/`danger`) are reserved for actual system state (posted vs. pending, on-budget vs. over) — never used as decoration.

### Typography

- **UI/body face:** Inter (or system-ui fallback stack) — a clean grotesque, set at 14px base for dense data screens, 16px for forms and self-service.
- **Numeric/tabular face:** the same family's tabular-figure variant (`font-variant-numeric: tabular-nums`) for every column of money, quantities, or account codes, so digits align vertically in tables. This matters more here than a distinctive display face — an accounting app lives or dies on whether numbers line up.
- **No separate display/headline face.** This isn't a marketing page; use one family, varying only weight (600 for headings, 400 for body, 500 for labels/buttons) and size. A second typeface would add personality this product doesn't need and inconsistency it can't afford.

### Signature element

One deliberate touch, used consistently: **a 3px left-edge accent bar in `--accent`** on the active nav item and on the primary KPI card of whichever dashboard is open (Cash Position on the CEO dashboard, Net Salary total on a payslip, etc.) — a small, consistent way of saying "this number is the headline of this screen" without decorating everything.

---

## 2. Pop-up (modal) forms — when and how

**Default rule: creating or editing a single record opens in a modal, not a new page or route.** Navigating away from a list to a separate "New Invoice" page loses context and is exactly the kind of friction this system should design out. Full-page views are reserved for genuinely page-sized content (Reports, the Trial Balance, the full Audit Log).

### When to use a modal
- Any `create_record` / `update_record` action (new customer, edit supplier, deactivate account).
- Any transactional entry: new Expense, new Invoice, new Payroll Run, Completion Assessment submission.
- Confirmation of a consequential action (approve, reject, dispose an asset) — as a smaller confirmation modal, not the full form modal.

### When *not* to use a modal
- Multi-section record review (e.g. drilling into one project's full profitability + budget + documents) — this is page-sized; use a detail page or slide-over panel instead of stacking modal-on-modal.
- Reports and anything meant to be printed or shared — full page.

### Modal behavior (build these exactly — most "modal bugs" are these details, not the form fields)
- **Backdrop:** semi-transparent scrim (`rgba(0,0,0,0.4)` light / `rgba(0,0,0,0.6)` dark) behind the modal; clicking it closes the modal **only if the form is unedited** — if the user has typed anything, clicking outside shows a small "Discard changes?" confirmation instead of silently closing.
- **Escape key** closes the modal under the same rule as backdrop-click above.
- **Focus trap:** focus moves to the first field on open, Tab cycles only within the modal, focus returns to the triggering button on close. This is a real accessibility requirement, not a nice-to-have — several of this app's users (Accountant, Admin) will live inside these forms all day.
- **Size tiers:** `sm` (confirmations, ~360px) / `md` (single-section forms like "Add Customer," ~560px) / `lg` (multi-section forms like "New Invoice" with line items, ~800px). Pick the smallest tier that fits — don't default everything to `lg`.
- **Footer is sticky** with two actions max: a neutral "Cancel" (left or ghost-styled) and one primary action styled in `--accent` (right, e.g. "Save Customer," "Post Invoice"). The primary action's label is the specific verb, never generic "Submit" (per the Engineering Standard's field-naming discipline — same logic applies to button copy).
- **In-flight state:** primary button shows a spinner and disables (both buttons) the moment it's clicked, per the Engineering Standard's existing rule — this document doesn't change that, just confirms it applies inside modals too.
- **Multi-step forms** (e.g. Invoice with line items + tax flags, or Payroll Run covering multiple employees) use an in-modal stepper (numbered steps in the modal header, not a wizard that navigates away) — each step validates before advancing, and users can go back without losing entered data.

---

## 3. Navigation

The wireframe's sidebar structure (flat items for simple roles, grouped sections with children for the Accountant workspace) is correct and should be kept — this section governs its *styling and behavior*, not its content.

- **Active state:** the 3px accent bar (see §1) plus a subtle background tint (`--bg-surface-sunken`), never color-only — color-only active states fail for colorblind users and don't scan well on a 13" laptop in bright site-office light.
- **Icons:** every top-level nav item gets a simple line icon (16–20px) paired with its label — icon-only is not acceptable at desktop width, since several items ("Retention Payable," "Budget vs Actual") aren't guessable from an icon alone.
- **Collapse behavior:** sidebar collapses to icon-only on tablet (see breakpoints below), fully hides behind a hamburger/drawer on phone. Desktop sidebar can be manually collapsed by the user via a toggle at its bottom edge; remember the user's choice for the session (in-memory state, not localStorage per the Engineering Standard's browser-storage restriction — if persistence across reloads matters, that's a backend preference field, not client storage).
- **Breadcrumbs** (already in the wireframe, e.g. "Asset Management > Asset Register") stay as plain text, not clickable buttons, except the top-level segment which returns to that section's landing view.
- **Primary navigation buttons** (not sidebar — think "+ Add Asset," "Import," "Export" seen in the wireframe's Accountant screen) are a consistent button bar directly under the breadcrumb: primary action (`--accent`, filled) first, secondary actions (outlined, neutral) after. Never more than one filled `--accent` button in that bar.
- **Logout** lives in a persistent top-right user menu on every portal, not buried in a settings screen (per the Engineering Standard §4).

---

## 4. Responsive behavior

Breakpoints match the Engineering Standard exactly (desktop ≥1024px, tablet 768–1023px, phone <768px) — this section adds the interaction-level detail that standard doesn't cover.

| | Desktop (≥1024px) | Tablet (768–1023px) | Phone (<768px) |
|---|---|---|---|
| Sidebar | Full, labeled, user-collapsible | Icon-only, tap to flyout | Hidden; hamburger opens a full-height drawer |
| Modals | Centered overlay, sized per tier (§2) | Centered overlay, `lg` tier expands to ~90vw | **Full-screen sheet** sliding up from the bottom — not a centered box; on a phone a "modal" that's really a small centered box wastes most of the screen and makes line-item entry unusable |
| Data tables | Full table | Full table, horizontal scroll if needed | **Stacked cards**, one record per card, key fields only (label: value pairs); a "view full record" tap opens the detail |
| KPI grids (dashboards) | 4-across | 2-across | 1-across, stacked |
| Touch targets | N/A | Minimum 40px hit area on any tappable control | Minimum 44px hit area — accountants will use this on-site on a phone with gloves or in bright sun; undersized tap targets are a real usability failure here, not a style nitpick |
| Form field spacing | Comfortable, multi-column where it fits (e.g. two fields per row) | Single column | Single column, larger vertical spacing between fields |

**Every screen must actually be checked at all three breakpoints before a ticket is reported done** — this echoes the Engineering Standard's existing rule; it's restated here because it applies as much to *this* document's modal/nav rules as it does to layout.

---

## 5. A few things worth adding that weren't asked for directly, flagged as suggestions

These extend the existing "three states" and money-formatting rules already in the Engineering Standard — call them out if you'd rather defer any of them:

- **Loading state inside modals specifically:** when a modal's primary action is submitting, show the spinner *on the button*, not a full-modal overlay — a full-modal spinner hides validation errors that might come back from the server (e.g. `DUPLICATE_INVOICE`), which need to appear inline near the relevant field without the modal flashing closed and reopening.
- **Toasts for post-action feedback:** a brief, dismissible toast ("Invoice INV-2026-0088 posted") in the corner after a modal closes successfully, rather than relying on the list silently refreshing — people should get a clear, separate confirmation that something happened, especially for actions with financial consequences.
- **Reduced motion:** respect `prefers-reduced-motion` — modal open/close and any KPI-card transitions should drop to a simple fade instead of a slide/scale animation when the user has this set.
- **Empty-state illustrations stay simple, not decorative:** a one-line message plus the relevant action button (e.g. "No projects yet — Add Project") rather than a large illustration; this is a working tool, not a marketing empty state.

If you'd like, I can turn any of §1's tokens into an actual starter stylesheet or a short "component gallery" artifact (buttons, modal, nav item, KPI card) that Copilot can build directly from, instead of just this written spec.