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

## Local core API (development only)

```bash
docker compose -f docker-compose.core.yml up -d
export DIRECTOR_DATABASE_URL='postgres://ne_director:ne_director_local_only@127.0.0.1:55434/ne_director'
TMPDIR=/tmp npm run core:migrate
TMPDIR=/tmp npm run core:dev
```

Set `VITE_DIRECTOR_RUNTIME_MODE=api` and `VITE_DIRECTOR_API_BASE_URL=http://127.0.0.1:4600/api/v1` to use the API service seam. `mock` remains explicit; API failure does not fall back to mock data.

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
