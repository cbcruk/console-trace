import type { SourceLocation } from './trace-log.types.ts'

const INTERNAL_MARKERS = [
  'async-context',
  'async-awaiter',
  'trace-log',
  'trace-overlay',
  'vite-plugin-trace',
]

const FRAME_PATTERN = /(?:\(|@|\s)((?:[a-z]+:\/\/|\/)[^\s()]+?):(\d+):(\d+)\)?$/i

interface ParsedFrame {
  url: string
  line: number
  column: number
}

function parseFrame(frame: string): ParsedFrame | null {
  const match = FRAME_PATTERN.exec(frame.trim())

  if (!match) {
    return null
  }

  return {
    url: match[1] as string,
    line: Number(match[2]),
    column: Number(match[3]),
  }
}

function isInternal(url: string): boolean {
  return INTERNAL_MARKERS.some((marker) => url.includes(marker))
}

function toPathname(url: string): string {
  const schemeIndex = url.indexOf('://')

  if (schemeIndex === -1) {
    return url
  }

  const afterScheme = url.slice(schemeIndex + 3)
  const slash = afterScheme.indexOf('/')
  const pathname = slash === -1 ? '/' : afterScheme.slice(slash)
  const query = pathname.indexOf('?')

  return query === -1 ? pathname : pathname.slice(0, query)
}

function toHref(
  pathname: string,
  line: number,
  column: number,
  projectRoot: string | null,
): string | null {
  if (!projectRoot) {
    return null
  }

  const root = projectRoot.replace(/\/+$/, '')

  return `vscode://file${root}${pathname}:${line}:${column}`
}

export function captureSource(projectRoot: string | null): SourceLocation | null {
  const stack = new Error().stack

  if (!stack) {
    return null
  }

  const lines = stack.split('\n').slice(1)

  for (const raw of lines) {
    const parsed = parseFrame(raw)

    if (!parsed || isInternal(parsed.url)) {
      continue
    }

    const pathname = toPathname(parsed.url)
    const label = `${pathname}:${parsed.line}:${parsed.column}`

    return {
      file: pathname,
      line: parsed.line,
      column: parsed.column,
      label,
      href: toHref(pathname, parsed.line, parsed.column, projectRoot),
    }
  }

  return null
}
