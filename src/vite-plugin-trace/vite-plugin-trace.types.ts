export interface TracePluginOptions {
  projectRoot?: string
}

export interface ResolvableConfig {
  root?: string
}

export interface TracePlugin {
  name: string
  config(config: ResolvableConfig): {
    define: Record<string, string>
  }
}
