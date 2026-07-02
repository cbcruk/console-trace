# Roadmap / TODO

Future directions for console-trace. None are committed work — they are noted
here so the next session has context.

## Babel transform

- **Source maps.** The transform currently returns `map: null` in
  [vite-plugin-trace.ts](src/vite-plugin-trace/vite-plugin-trace.ts), so stack
  traces and the overlay's `source` point at transformed code. Generate a
  source map from Babel (`sourceMaps: true`) and thread it through the Vite
  `transform` result.
- **Async generators.** `async function*` is skipped today
  ([async-transform.ts](src/transform/async-transform.ts)). Decide whether to
  support it or keep it explicitly unsupported.
- **`for await...of`.** Currently rejected with a clear error. Lowering it to a
  manual iterator + `yield` would lift the restriction.

## Transport

- **Batching / sampling.** `installTransport`
  ([trace-transport.ts](src/trace-transport/trace-transport.ts)) fires one
  network-shaped call per span. Add a buffered transport (flush on interval /
  size) and head-based sampling by `trace_id`.
- **Span start events.** Only `span:end` is emitted. Some backends want a
  `span:start` event for long-running spans.

## Overlay

- **Search / filter by name.** Add a text filter over span names alongside the
  level filter.
- **Drag + resize, persisted.** Let the panel be moved/resized and persist its
  geometry next to the collapse/level state in
  [trace-overlay.storage.ts](src/trace-overlay/trace-overlay.storage.ts).

## Devtools

- **Browser-extension devtools panel.** The
  [devtools-panel example](examples/devtools-panel/) renders a
  TanStack-Devtools-style UI in-page on the public API. A natural extension is
  to move it into a real browser devtools panel (a `chrome.devtools`/WebExtension
  front-end that subscribes to the same span stream), so the trace tree lives in
  DevTools rather than overlaying the app. Deferred — not committed work.

## Validation

- Run the engine in a real app to confirm whether the `fallback` mode
  concurrency limit actually bites before investing further in the transform.
