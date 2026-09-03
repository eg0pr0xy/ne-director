# NE / DIRECTOR frontend baseline audit

Audit date: 2026-09-03. Scope: downloaded local frontend only; no backend, authentication, or AI integration was added.

## Reproducibility

- Repository root: `/mnt/d/code/ne-director` (`D:\code\ne-director`)
- Branch / HEAD: `main` / `35bc30c3c6e0458dfc0695da599e1a95ea60c485`
- Package manager: npm, pinned by `package-lock.json`; Node `v22.22.3`, npm `10.9.8` used for this audit.
- Framework: Vite 6 + React 19 + TypeScript + Tailwind CSS 4. The only state service is `MockChiefOfStaffService`; it returns cloned static mock data and makes no network request.
- `npm ci`: passed (`101` packages, `0` vulnerabilities reported by npm).
- `npm run lint`: passed (`tsc --noEmit`).
- `npm run build`: passed. The only build warning is Vite's output-size warning: the minified JS bundle is 547.92 kB (153.70 kB gzip).

## Repository and dependency state

The working tree was clean before this audit. `.gitignore` ignores `node_modules`, `dist`, logs, coverage, and all `.env*` files. The runtime dependencies are `clsx`, `date-fns`, `lucide-react`, `motion`, `react`, `react-dom`, and `tailwind-merge`; Vite/Tailwind plugin packages are also currently declared under `dependencies`. Development dependencies are TypeScript, Tailwind, Autoprefixer, Node types, and Vite.

The authoritative npm lockfile contains no Gemini, Google AI Studio, Firebase, Supabase, Google Cloud, or hosted-agent runtime dependency. The frontend has no `fetch`, XHR, WebSocket, OAuth, or other application API client. It does load Google Fonts plus remote image placeholders from Unsplash and `pravatar.cc`; those are presentation assets, not application services.

Removed export residue that contradicted the local-only baseline:

- `.env.example` advertised a Gemini key and Cloud Run URL.
- `metadata.json` declared a server-side Gemini capability.
- `bun.lock` described a different dependency graph containing `@google/genai`, Express, dotenv, and Google authentication packages while `package.json` and npm lockfile did not.

No actual secret or credential file was present. Values were not logged. The `.env*` ignore rule remains so any future local secret cannot be tracked accidentally.

## Actual route architecture

Routing is an in-memory `currentPage` switch in `src/App.tsx`, not URL routing. Therefore deep links and refresh-stable paths do not exist. Implemented workspace selections are TODAY, ATTENTION, PROJECTS (with a component-local project detail), PEOPLE (with a component-local person detail), TIMELINE, SEARCH, CHAT, SETTINGS, and PROFILE. The command bar is global rather than a route.

- TODAY, ATTENTION, SEARCH, project/person detail, TIMELINE, SETTINGS, and PROFILE render populated UI from state or local form data.
- CHAT is **PARTIAL**: it is an otherwise empty prompt directing the user to the global mock command bar. It is not a conversation workspace and must not be represented as one.
- Project, People, and Timeline filter controls are **FIXTURE** controls: their inputs/selects do not alter results.
- The command bar is **FIXTURE** pattern matching, not a Chief-of-Staff service.

There are no literal `coming soon` or `in development` route strings, but the CHAT caveat above is a real empty-primary-workspace exception.

## Canonical mock-state and Location B flow

`AppStore` is the sole React Context store. It hydrates cloned mock data into `todayState`, `attentionItems`, `projects`, `people`, and `allTimeline`. Approval updates all of these state projections in one action.

The Location B fixture is associated with HARBOUR and Anna Meyer. The repair replaced the previous Jonas-only association and removed hard-coded Location B copies from HARBOUR and person-detail views. Those views now derive their decision and recent-change content from the shared store.

After `approveDecision('a1', 'LOCATION B')`, source-level execution proves:

1. TODAY and the sidebar count remove the item from `needsYou`.
2. ATTENTION changes the shared item status to `resolved`.
3. HARBOUR decrements `needsYouCount`; its detail no longer renders Location B among open decisions.
4. Anna Meyer's `openItemsCount` decrements; her detail has no stale open Location B decision.
5. The shared timeline gains the human approval, a Chief-of-Staff producer-notification entry, and an ORDO dependency-resolution entry.

This is in-memory only: refresh resets the decision. The event timestamps are client-generated, the follow-up is automatically simulated, and no human notification or ORDO/NARRATE write occurs. Browser interaction was not executed because no installed compatible browser was available; this is source-level and build proof, not an authenticated UI/end-to-end acceptance result.

## Settings, profile, theme, and responsive assessment

Black, White, and System theme selection is real and persisted in `localStorage`; the root theme class changes the defined semantic tokens. Profile edits and preferred address are persisted under a separate local-storage key and affect the greeting/profile control. There is no authentication, user session, logout button, or false logout flow.

Density, reduced motion, Chief-of-Staff preferences, attention preferences, autonomy, Focus Modes, notification preferences, audit, privacy, memory, and Connected Services are mostly **PARTIAL/FIXTURE**. Their settings commonly persist, but only theme has a verified runtime consumer. Memory cards hold component-local data; Connected Services only display unconnected rows; privacy toggles are hard-coded checked; autonomy does not govern actions; reduced motion and density do not modify rendering. No business behavior should be inferred from their UI controls.

The two hard-coded dark alert panel backgrounds and the HTML body's dark color were changed to semantic theme tokens so White theme does not retain large dark blocks outside the intended status color. Remaining hard-coded colors are status/accent, image-overlay, or shadow treatment. A real visual browser pass at 1920, 1440, 1280, and 1024 could not be completed in this host (no compatible Chromium/Chrome/Edge binary; Playwright cannot supply Chromium for this Ubuntu 26.04 environment). Responsive behavior is therefore **PARTIAL**, supported only by source inspection: the sidebar changes at Tailwind `lg` (1024px), grids at `md`/`lg`/`xl`, and fixed-width controls may be tight at 1024px.

## Honest terminal verdict

**PARTIAL baseline accepted for local static development.** It is reproducibly installable, type-safe, buildable, free of AI Studio/Gemini/Firebase/Supabase runtime integration and actual secrets, and its critical mock Location B state now has a single coherent in-memory projection. It is not ready to claim production behavior, URL routing, durable decisions, real notification/integration behavior, complete settings semantics, or visual responsive acceptance.

Before backend/agent work begins, preserve the mock-only boundary and address the remaining UI baseline gaps with browser evidence: make CHAT a non-empty local transcript surface or explicitly remove its workspace claim, implement or remove inert filters/settings, and capture Black/White desktop screenshots at the requested widths.
