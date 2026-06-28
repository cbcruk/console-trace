import type {
  ResolvableConfig,
  TracePlugin,
  TracePluginOptions,
} from './vite-plugin-trace.types.ts'

export function tracePlugin(options: TracePluginOptions = {}): TracePlugin {
  return {
    name: 'vite-plugin-trace',
    config(config: ResolvableConfig) {
      const root = options.projectRoot ?? config.root ?? process.cwd()

      return {
        define: {
          __TRACE_PROJECT_ROOT__: JSON.stringify(root),
        },
      }
    },
  }
}
