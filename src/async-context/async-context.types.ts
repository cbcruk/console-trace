export type Callable<R> = (...args: unknown[]) => R

export interface VariableInit<T> {
  name?: string
  defaultValue?: T
}

export interface Variable<T> {
  readonly name: string
  get(): T | undefined
  run<R>(value: T, fn: Callable<R>, ...args: unknown[]): R
}

export interface Snapshot {
  run<R>(fn: Callable<R>, ...args: unknown[]): R
}

export interface VariableConstructor {
  new <T>(init?: VariableInit<T>): Variable<T>
}

export interface SnapshotConstructor {
  new (): Snapshot
}

export interface AsyncContextLike {
  Variable: VariableConstructor
  Snapshot: SnapshotConstructor
}

export type AsyncContextMode = 'native' | 'fallback'
