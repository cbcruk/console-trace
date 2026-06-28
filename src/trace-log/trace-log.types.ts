export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type SpanStatus = 'running' | 'ok' | 'error'

export interface SourceLocation {
  file: string
  line: number
  column: number
  label: string
  href: string | null
}

export interface LogEntry {
  id: number
  level: LogLevel
  args: unknown[]
  time: number
  source: SourceLocation | null
}

export interface Span {
  id: number
  name: string
  parent: Span | null
  children: Span[]
  logs: LogEntry[]
  startTime: number
  endTime: number | null
  status: SpanStatus
  source: SourceLocation | null
}

export type TraceEvent =
  | { type: 'span:start'; span: Span }
  | { type: 'span:end'; span: Span }
  | { type: 'log'; span: Span; entry: LogEntry }

export type TraceListener = (event: TraceEvent) => void

export interface TraceConfig {
  enabled: boolean
  projectRoot: string | null
  retain: boolean
}

export interface Logger {
  debug(...args: unknown[]): void
  info(...args: unknown[]): void
  warn(...args: unknown[]): void
  error(...args: unknown[]): void
}
