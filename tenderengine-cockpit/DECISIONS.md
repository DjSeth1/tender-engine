# Scaffolding Decisions

Written by the scaffolding pass on 2026-04-21. Override any of these by
editing the listed files or telling me to change them.

## Open questions from the handoff

### 1. Auth model
**Decision:** Single-operator stub. Hardcoded user (`Haarnav Mehta`, initials
`HM`) in [`lib/store.ts`](lib/store.ts). No login screen.
**Why:** Phase 1 is a solo-operator cockpit. Anything more is Phase 2.
**To change:** edit `user` in the store, or wire Google SSO if sharing the
cockpit becomes real.

### 2. MCP server topology
**Decision:** Next.js App Router route handlers under `/api/*` own the
server-side integration layer. The browser never speaks to Notion or Drive
directly.
**Why:** The "never fire Notion calls in parallel" rule from
[SKILL.md](../design_handoff_operator_cockpit/SKILL.md) needs to be enforced
somewhere the operator can't bypass it — the route handler is that spot.
**To change:** swap the handler bodies to forward to a separate Node service
if the integration layer needs to live outside the Next.js process.

### 3. Agent execution transport
**Decision:** Server-Sent Events. One-way, agent→UI, auto-reconnecting, and
it maps cleanly to a Next.js route returning a `ReadableStream`.
**Why:** We never need client→agent duplex over the same channel; actions
like Approve / Cancel / Re-run go via POST route handlers. WebSockets buys
us nothing here and adds failure modes.
**To change:** a polling endpoint would work if SSE proxy quirks show up in
production (e.g. behind some corporate proxies).

### 4. File upload staging
**Decision:** Stage uploads locally under `/tmp/uploads/<tender-id>/` first,
then push to Drive once the Notion tender row and Drive folder tree exist.
**Why:** The Drive folder doesn't exist until Triage assigns a reference and
name, and we don't want to drop the operator's files if Drive is flaky.
**To change:** swap the staging directory for S3 or similar once this is
deployed somewhere that isn't a single workstation.

### 5. Chat-bar intent parsing
**Decision:** Haiku-4.5 classifier on the server at `/api/chat/classify`
returning `{ intent, params }`. Unknown intents fall through to Sonnet-4.6
scoped to the active tender.
**Why:** Haiku is cheap, fast, and structured-tool-use is reliable enough
for the 8–10 intent shapes we need. Sonnet catches the long tail.
**To change:** pre-bake a rules-based parser if the Anthropic bill is a
concern, or push the whole thing to Sonnet if classification quality matters
more than cost.

## Build-time decisions I made for you

- **Package manager:** npm. `pnpm` isn't installed on this machine; `bun` is
  but Next 14 + shadcn has the smoothest path with npm.
- **Git:** skipped. `create-next-app` initialised a local repo automatically.
  Nothing pushed anywhere.
- **Default theme:** light. Dark works via the toggle in the top bar
  (`☀ / ☾` next to the avatar). Persisted to `localStorage` under `te-theme`.
- **Initial active tender:** urgency-sorted, first in rail. Today's seed
  surfaces `T26/10 — Property Management Services` (Belroy Property, 2 days
  to deadline) at the top.
- **Nav tabs (`Tenders` / `Clients` / `Library`):** rendered as dead text
  for now, matching the A5 mock. Wire routes when those views exist.
- **Top-bar status chip:** skipped. The mock doesn't show it in the default
  state, and there's no real MCP behind it yet.
- **Main-panel body:** labeled stub boxes for now — `HERO` values are live,
  `PIPELINE` / `SECTIONS` / `LIVE DRAFT` / `AGENT FEED` are placeholders
  with accurate bounding boxes. Next pass fills them in.
- **Data source:** real snapshot of 10 current tenders pulled from the
  TenderEngine Notion workspace via MCP on 2026-04-21. Lives in
  [`lib/mock-data.ts`](lib/mock-data.ts). When `NOTION_TOKEN` is set in
  `.env.local`, the `/api/tenders` route switches to live queries — the
  plumbing is in place, the property-value mapping lands in Phase 1.5.
- **Shadcn:** not initialised yet. Will run `npx shadcn@latest init` in
  the next pass when the Dialog / Sheet / Select components are first
  needed (New Tender modal, Fill Placeholder side sheet, client dropdown).

## Notion database IDs (for reference)

- **Tenders DB:** `46c68bde-f73c-442c-96f7-04a0fe271564`
  - Data source: `576d097c-a3d4-4e4e-a952-3a644d2f6a79`
- **Clients DB:** `e9c538de-1608-4360-a8c0-2cef11bdcffe`
  - Data source: `7a44b517-8683-4e08-b1cd-fdc6cdc2af81`

## What's NOT built yet

Explicitly scoped out of this pass:

- Agent card grid with live state machine
- Sections list, inline blocker resolver
- Live draft pane with clickable placeholders
- Agent feed with event list
- New Tender modal, Fill Placeholder side sheet
- `/api/chat/*` intent classifier + SSE agent stream
- Live Notion property mapping (plumbing is there, mapping isn't)
- Drive integration routes
- Keyboard shortcuts (⌘K palette, card focus + Enter-to-approve)

Each of these shows up in the todo list in the next session.
