import type { LogLevel } from '../trace-log/trace-log.types.ts'

export interface OverlayState {
  collapsed: Record<string, boolean>
  levels: Record<LogLevel, boolean>
}

export interface OverlayHandle {
  unmount(): void
}
