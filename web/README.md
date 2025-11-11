# Call Analytics Web

React + Next.js dashboard visualizing analytics from `../analytics/*.json`.

## Getting Started

1. Ensure analytics exists at the repository root (sibling to `web/`):
   - `button_tree.all.json`
   - `call_paths.all.json`
   - and files in `analytics/` directory (e.g., `summary.json`, `top_intents.json`, ...)

2. Install dependencies:

```bash
npm install
```

3. Develop:

```bash
npm run dev
```

4. Build:

```bash
npm run build && npm start
```

## Architecture

- Uses App Router (`/app`) with a sidebar layout.
- Server routes read JSON files directly from `../analytics` using Node `fs`.
- Client charts are rendered with `recharts`.
- TailwindCSS for styling; shadcn-like UI primitives (`Card`) are vendored in `components/ui`.

## Notes

- If files are missing, pages will render empty states.
- For large JSONs, only top slices are shown in some pages to keep UI responsive.



