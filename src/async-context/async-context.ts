import type {
  AsyncContextLike,
  AsyncContextMode,
  Callable,
  Snapshot,
  Variable,
  VariableInit,
} from './async-context.types.ts'

type Mapping = Map<symbol, unknown>

let current: Mapping = new Map()

class FallbackVariable<T> implements Variable<T> {
  readonly name: string
  readonly #key: symbol
  readonly #defaultValue: T | undefined

  constructor(init?: VariableInit<T>) {
    this.name = init?.name ?? ''
    this.#key = Symbol(this.name)
    this.#defaultValue = init?.defaultValue
  }

  get(): T | undefined {
    return current.has(this.#key) ? (current.get(this.#key) as T) : this.#defaultValue
  }

  run<R>(value: T, fn: Callable<R>, ...args: unknown[]): R {
    const previous = current
    const next: Mapping = new Map(previous)

    next.set(this.#key, value)
    current = next

    try {
      return fn(...args)
    } finally {
      current = previous
    }
  }
}

class FallbackSnapshot implements Snapshot {
  readonly #mapping: Mapping

  constructor() {
    this.#mapping = current
  }

  run<R>(fn: Callable<R>, ...args: unknown[]): R {
    const previous = current

    current = this.#mapping

    try {
      return fn(...args)
    } finally {
      current = previous
    }
  }
}

const fallback: AsyncContextLike = {
  Variable: FallbackVariable,
  Snapshot: FallbackSnapshot,
}

function resolveNative(): AsyncContextLike | null {
  const candidate = (globalThis as { AsyncContext?: AsyncContextLike }).AsyncContext

  return candidate?.Variable && candidate.Snapshot ? candidate : null
}

const native = resolveNative()

export const AsyncContext: AsyncContextLike = native ?? fallback

export const asyncContextMode: AsyncContextMode = native ? 'native' : 'fallback'
