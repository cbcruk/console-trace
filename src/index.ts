import { configure, getRoot, subscribe } from './trace-log/trace-log.ts'
import type { Span } from './trace-log/trace-log.types.ts'
import { mountOverlay, replayToConsole } from './trace-overlay/trace-overlay.ts'
import { installTransport } from './trace-transport/trace-transport.ts'
import type { Transport } from './trace-transport/trace-transport.types.ts'

declare const __TRACE_PROJECT_ROOT__: string | undefined

export interface SetupTraceOptions {
  enabled?: boolean
  projectRoot?: string | null
  overlay?: boolean
  replayOnRootEnd?: boolean
  retain?: boolean
  transport?: Transport
}

function injectedProjectRoot(): string | null {
  return typeof __TRACE_PROJECT_ROOT__ !== 'undefined' ? __TRACE_PROJECT_ROOT__ : null
}

export function setupTrace(options: SetupTraceOptions = {}): () => void {
  const enabled = options.enabled ?? true
  const projectRoot = options.projectRoot ?? injectedProjectRoot()
  const overlay = options.overlay ?? typeof document !== 'undefined'
  const replayOnRootEnd = options.replayOnRootEnd ?? true
  const retain = options.retain ?? true

  configure({ enabled, projectRoot, retain })

  const cleanups: Array<() => void> = []

  if (!enabled) {
    return (): void => {}
  }

  if (options.transport) {
    cleanups.push(installTransport(options.transport))
  }

  if (overlay) {
    const handle = mountOverlay()
    cleanups.push((): void => handle.unmount())
  }

  if (replayOnRootEnd) {
    const root = getRoot()
    const unsubscribe = subscribe((event) => {
      if (event.type === 'span:end' && event.span.parent === root) {
        replayToConsole(event.span)
      }
    })
    cleanups.push(unsubscribe)
  }

  return (): void => {
    for (const cleanup of cleanups) {
      cleanup()
    }
  }
}

export {
  configure,
  getConfig,
  getRoot,
  log,
  logger,
  resetTrace,
  subscribe,
  trace,
} from './trace-log/trace-log.ts'
export { mountOverlay, replayToConsole } from './trace-overlay/trace-overlay.ts'
export type { OverlayHandle } from './trace-overlay/trace-overlay.ts'
export { AsyncContext, asyncContextMode } from './async-context/async-context.ts'
export { runAsync } from './async-awaiter/async-awaiter.ts'
export { installTransport, toWideEvent } from './trace-transport/trace-transport.ts'
export type { Transport, WideEvent, WideEventLog } from './trace-transport/trace-transport.types.ts'
export { tracePlugin } from './vite-plugin-trace/vite-plugin-trace.ts'
export type {
  LogEntry,
  Logger,
  LogLevel,
  SourceLocation,
  Span,
  SpanStatus,
  TraceConfig,
  TraceEvent,
  TraceListener,
} from './trace-log/trace-log.types.ts'
export type {
  AsyncContextLike,
  AsyncContextMode,
  Snapshot,
  Variable,
} from './async-context/async-context.types.ts'
export type {
  TracePlugin,
  TracePluginOptions,
} from './vite-plugin-trace/vite-plugin-trace.types.ts'

export type { Span as TraceSpan }
