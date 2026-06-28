import { HELPER_NAME, transformAsync } from '../transform/async-transform.ts'
import type {
  ResolvableConfig,
  TracePlugin,
  TracePluginOptions,
  TransformOutput,
} from './vite-plugin-trace.types.ts'

const TRANSFORMABLE = /\.[jt]sx?$/

function shouldTransform(id: string): boolean {
  return TRANSFORMABLE.test(id) && !id.includes('node_modules')
}

export function tracePlugin(options: TracePluginOptions = {}): TracePlugin {
  const transformEnabled = options.transform ?? false
  const importSource = options.importSource ?? 'console-trace'

  return {
    name: 'vite-plugin-trace',
    enforce: 'pre',
    config(config: ResolvableConfig) {
      const root = options.projectRoot ?? config.root ?? process.cwd()

      return {
        define: {
          __TRACE_PROJECT_ROOT__: JSON.stringify(root),
        },
      }
    },
    async transform(code: string, id: string): Promise<TransformOutput | null> {
      if (!transformEnabled || !shouldTransform(id) || !code.includes('async')) {
        return null
      }

      const result = await transformAsync(code, id)

      if (!result?.transformed) {
        return null
      }

      const importLine = `import { runAsync as ${HELPER_NAME} } from '${importSource}'`

      return {
        code: `${importLine}\n${result.code}`,
        map: null,
      }
    },
  }
}
