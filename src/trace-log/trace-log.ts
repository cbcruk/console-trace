import { AsyncContext } from '../async-context/async-context.ts'
import type {
  LogEntry,
  Logger,
  LogLevel,
  Span,
  TraceConfig,
  TraceEvent,
  TraceListener,
} from './trace-log.types.ts'
import { captureSource } from './trace-log.utils.ts'

const config: TraceConfig = {
  enabled: true,
  projectRoot: null,
  retain: true,
}

const listeners = new Set<TraceListener>()

let sequence = 0

function nextId(): number {
  sequence += 1
  return sequence
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

function createRoot(): Span {
  return {
    id: 0,
    name: 'root',
    parent: null,
    children: [],
    logs: [],
    startTime: now(),
    endTime: null,
    status: 'running',
    source: null,
  }
}

let rootSpan: Span = createRoot()

const currentSpan = new AsyncContext.Variable<Span>({
  name: 'trace-span',
})

function activeSpan(): Span {
  return currentSpan.get() ?? rootSpan
}

function emit(event: TraceEvent): void {
  for (const listener of listeners) {
    listener(event)
  }
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  )
}

export function configure(partial: Partial<TraceConfig>): void {
  Object.assign(config, partial)
}

export function getConfig(): Readonly<TraceConfig> {
  return config
}

export function subscribe(listener: TraceListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getRoot(): Span {
  return rootSpan
}

export function resetTrace(): void {
  rootSpan = createRoot()
}

export function trace<T>(name: string, fn: () => T): T {
  if (!config.enabled) {
    return fn()
  }

  const parent = activeSpan()
  const span: Span = {
    id: nextId(),
    name,
    parent,
    children: [],
    logs: [],
    startTime: now(),
    endTime: null,
    status: 'running',
    source: captureSource(config.projectRoot),
  }

  if (config.retain) {
    parent.children.push(span)
  }

  emit({ type: 'span:start', span })

  const finish = (status: Span['status']): void => {
    span.status = status
    span.endTime = now()
    emit({ type: 'span:end', span })
  }

  return currentSpan.run(span, () => {
    try {
      const result = fn()

      if (isThenable(result)) {
        return result.then(
          (value) => {
            finish('ok')
            return value
          },
          (error: unknown) => {
            finish('error')
            throw error
          },
        ) as T
      }

      finish('ok')
      return result
    } catch (error) {
      finish('error')
      throw error
    }
  })
}

export function log(level: LogLevel, ...args: unknown[]): void {
  if (!config.enabled) {
    return
  }

  const span = activeSpan()
  const entry: LogEntry = {
    id: nextId(),
    level,
    args,
    time: now(),
    source: captureSource(config.projectRoot),
  }

  span.logs.push(entry)
  emit({ type: 'log', span, entry })
}

export const logger: Logger = {
  debug: (...args: unknown[]): void => log('debug', ...args),
  info: (...args: unknown[]): void => log('info', ...args),
  warn: (...args: unknown[]): void => log('warn', ...args),
  error: (...args: unknown[]): void => log('error', ...args),
}
