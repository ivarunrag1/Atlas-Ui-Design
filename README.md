# QuoteAI — Deal Detail (v2)

Redesigned **Deal Detail** screen for the ATLAS CRM / QuoteAI case study
(freight-forwarding, AI-first pipeline). Rebuilt from a timeline-first record
into an **email-first view with an agent audit trail**.

## Why this layout

Freight forwarders live in their inbox, so the conversation is the center of
gravity; the agents (Katrina / Rachel) work *around* it and their actions are
auditable in a side rail — which is the product's trust model (*humans monitor
& correct after the fact*).

```
┌── Sidebar ──┬──────── Center column ─────────┬─ Agent activity ─┐
│             │  TopBar: breadcrumb + CTAs     │  (full height,   │
│             ├────────────────────────────────┤   collapsible)   │
│             │  ① Top pane — deal + customer  │                  │
│             │     (editable) + key facts     │   audit timeline │
│             │     + linked-records strip     │   of agent /     │
│             ├────────────────────────────────┤   system actions │
│             │  ② Tabs: Email·Documents·      │                  │
│             │     Comments                   │  ◀ collapses to  │
│             │     Email = thread + inline    │     a 56px rail  │
│             │     pending draft composer     │                  │
└─────────────┴────────────────────────────────┴──────────────────┘
```

**Key design rule — no double-reporting:** the thread holds *customer-facing
messages only*; the rail holds *agent/system actions* (flag, draft, stage move,
enrichment). Rail items link to the message they produced via `linkedMessageId`.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production bundle
```

## Stack

- React 19 + TypeScript (Vite)
- Tailwind CSS v4 — semantic design tokens live in `src/index.css` (`@theme`).
  Currently a **dark** theme; because every component uses the tokens
  (`bg-surface`, `text-ink`, `border-line`, …), swapping the `@theme` values
  re-themes the whole app. Font: **Inter**.
- Full-bleed app shell (sidebar · center · activity rail), panels divided by
  borders rather than floating cards.
- `lucide-react` icons

## Structure

| File | Role |
| --- | --- |
| `src/App.tsx` | View switch (`pipeline` ↔ `deal`): sidebar + DealsView, or sidebar · deal-detail center · agent chat |
| `src/components/DealsView.tsx` | **Pipeline view** — Kanban/List toggle; compact neutral cards (company, contact, trade lane, deal value, updated, alert icon). Cards open the deal detail. |
| `src/data/deals.ts` | Pipeline rows (`deals`) + `stages` — the Kanban columns |
| `src/data/deal.ts` | **Mock data** (single deal detail) — `messages` · `documents` · `comments` · `activity` · `agentChat` |
| `src/components/TopBar.tsx` | Breadcrumb + Open drafts / Send follow-up / Send quote |
| `src/components/DealHeader.tsx` | Top pane: identity, **editable customer**, key-facts band, linked strip |
| `src/components/DealTabs.tsx` | Mid-section tab bar + panel switch (Enquiry / Email / Documents / Comments / Activity) |
| `src/components/EnquiryTab.tsx` | **First tab** — 5-step quote workflow. Two-pane body: **email thread (left)** + step working area (right). Step 1 (Search rates) is an **editable form** (origin, destination, carrier, equipment, mode, sailing); steps 2–5 read-only detail. Stepper + manual-mode approve/continue footer. |
| `src/components/EmailThread.tsx` | Email tab: messages, attribution, attachments, inline draft |
| `src/components/DocumentsTab.tsx` | Documents tab: file list with kind, receipts, upload |
| `src/components/CommentsTab.tsx` | Comments tab: internal notes + composer (⌘↵ to post) |
| `src/components/ActivityTab.tsx` | Activity tab: the full audit timeline (reads the shared `log`) |
| `src/components/activity.tsx` | Shared activity rendering — `ActivityItem`, `StepList`, `ActivityTimeline`. Used by the Activity tab **and** the agent chat so responses look identical. |
| `src/components/AgentChat.tsx` | Right pane (chat-only, **collapsible** 420px). Agent replies render in the activity style (`ActivityItem` + steps) and are recorded to the shared log via `onRecord`. |
| `src/components/ui.tsx` | Primitives: `Avatar`, `Chip`, `TempSignal`, actor colours |

The activity `log` is lifted to `App.tsx` (seeded from `activity`); the mid-section
Activity tab displays it and the agent chat appends to it — one source of truth.

## Wiring to a backend

All copy/state is static mock data in `src/data/deal.ts`. Replace with API
responses; the component props map 1:1 to the `Deal`, `Message`, `DealDocument`,
`Comment`, and `Activity` types already defined there. Interactive bits wired
with local `useState` (persist to the API): customer edit (Save/Cancel), draft
Preview & edit, posting a comment, tab switching, and rail collapse. Stubbed
(no handler yet): Send now, Pause, Upload, document preview/download, reply box.
