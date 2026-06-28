import type { LogLevel, SpanStatus } from '../trace-log/trace-log.types.ts'

export interface WideEventLog {
  level: LogLevel
  message: string
  source: string | null
}

export interface WideEvent {
  trace_id: string
  span_id: string
  parent_id: string | null
  name: string
  status: SpanStatus
  start: number
  duration: number
  logs: WideEventLog[]
}

export type Transport = (event: WideEvent) => void
