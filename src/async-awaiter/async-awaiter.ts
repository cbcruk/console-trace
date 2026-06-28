import { AsyncContext } from '../async-context/async-context.ts'

type GeneratorFactory = () => Generator<unknown, unknown, unknown>

export function runAsync<T>(
  thisArg: unknown,
  args: ArrayLike<unknown>,
  promiseCtor: PromiseConstructorLike | undefined,
  factory: GeneratorFactory,
): Promise<T> {
  const P: PromiseConstructorLike = promiseCtor ?? Promise

  return new P<T>((resolve, reject) => {
    const snapshot = new AsyncContext.Snapshot()
    const generator = factory.apply(thisArg, args as never)

    const resume = (input: () => IteratorResult<unknown>): void => {
      try {
        snapshot.run(() => step(input()))
      } catch (error) {
        reject(error)
      }
    }

    const fulfilled = (value: unknown): void => resume(() => generator.next(value))

    const rejected = (value: unknown): void => resume(() => generator.throw(value))

    function step(result: IteratorResult<unknown>): void {
      if (result.done) {
        resolve(result.value as T)
        return
      }

      Promise.resolve(result.value).then(fulfilled, rejected)
    }

    resume(() => generator.next())
  }) as Promise<T>
}
