# NE_DIRECTOR_FRONTEND_PROTOTYPE_001

> The first frozen frontend North Star for the NE Director Chief of Staff product.

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Architecture

This project is a React-based frontend prototype for the NE Director Chief of Staff application.

*   **Pages**: Found in `/src/pages/`, representing the primary workspace views (Today, Attention, Projects, People, Timeline, Search, Chat, Settings).
*   **Features**: Domain-specific UI modules (e.g., `/src/features/today/`).
*   **Components**: Reusable UI elements (e.g., CommandBar, ContextDrawer).
*   **Shared State**: Managed globally via `AppStore.tsx` using React Context.
*   **Mock Data**: Canonical state is initialized from `/src/data.ts`.
*   **Service Boundary**: The UI interfaces with `/src/services/api.ts` which currently resolves static mock data.

## Future backend

The current mock infrastructure is intended to be replaced by the **NE Director Chief of Staff API**, which will orchestrate:

*   **ORDO**: Production logistics platform.
*   **NARRATE**: Creative knowledge base.
*   **PRESENCE**: Real-time scheduling.
*   **MNEME**: Archival and references.
*   **IMPERIUM MENTIS**: Strategic decision engine.

*Do not implement these integrations in this repository at this phase.*
