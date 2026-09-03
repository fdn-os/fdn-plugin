# gb-template-dashboard

Foundational builders **dashboard** boilerplate (`/fdn:build` project type `dashboard`). Same stack as
`gb-template-app` (TanStack Router + Query + StyleX, Vite → static + `_worker.js`), plus a **bento
metric grid** and a **dependency-free StyleX SVG bar chart** (`src/components/bar-chart.tsx`) — data-viz
treated as part of the design system, no chart library. The worker serves `/api/metrics`.
See `../app/README.md` for the StyleX two-pass build notes.
