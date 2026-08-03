import { subscribe } from '../trace-log/trace-log.ts'
import type { Span } from '../trace-log/trace-log.types.ts'
import type { Transport, WideEvent, WideEventLog } from './trace-transport.types.ts'

interface SpanIds {
  traceId: string
  spanId: string
}

const idCache = new WeakMap<Span, SpanIds>()

let traceCounter = 0
let spanCounter = 0

function isRoot(span: Span): boolean {
  return span.parent === null
}

function idsFor(span: Span): SpanIds {
  const cached = idCache.get(span)

  if (cached) {
    return cached
  }

  spanCounter += 1

  const parent = span.parent
  let traceId: string

  if (!parent || isRoot(parent)) {
    traceCounter += 1
    traceId = `t${traceCounter}`
  } else {
    traceId = idsFor(parent).traceId
  }

  const ids: SpanIds = { traceId, spanId: `s${spanCounter}` }

  idCache.set(span, ids)
  return ids
}

function stringify(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }

  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return String(value)
  }
}

function toWideLogs(span: Span): WideEventLog[] {
  return span.logs.map((entry) => ({
    level: entry.level,
    message: entry.args.map(stringify).join(' '),
    source: entry.source?.label ?? null,
  }))
}

/**
 * Flattens a span into a single wide event, folding its logs in as messages.
 *
 * Trace and span ids are assigned lazily and cached per span, so repeated
 * calls are stable. Every span under one top-level call shares a `trace_id`;
 * `parent_id` is `null` for that top-level span, since the synthetic root is
 * not itself an event.
 *
 * Log arguments are stringified here — the event is a wire payload, not a live
 * view of the tree.
 */
export function toWideEvent(span: Span): WideEvent {
  const { traceId, spanId } = idsFor(span)
  const parent = span.parent
  const parentId = !parent || isRoot(parent) ? null : idsFor(parent).spanId

  return {
    trace_id: traceId,
    span_id: spanId,
    parent_id: parentId,
    name: span.name,
    status: span.status,
    start: span.startTime,
    duration: span.endTime === null ? 0 : span.endTime - span.startTime,
    logs: toWideLogs(span),
  }
}

/**
 * Streams completed spans to `transport`, one {@link toWideEvent} per span.
 *
 * Events fire as each span ends, so a long-running parent is delivered after
 * its children. Delivery is unbatched and unsampled — wrap `transport` if you
 * need buffering or head-based sampling. Pair with `retain: false` in
 * production so events flow out without the tree growing.
 *
 * @returns A function that stops the stream.
 */
export function installTransport(transport: Transport): () => void {
  return subscribe((event) => {
    if (event.type === 'span:end') {
      transport(toWideEvent(event.span))
    }
  })
}
