export interface TracePluginOptions {
  projectRoot?: string
  transform?: boolean
  importSource?: string
}

export interface ResolvableConfig {
  root?: string
}

export interface TransformOutput {
  code: string
  map: null
}

export interface TracePlugin {
  name: string
  enforce?: 'pre' | 'post'
  config(config: ResolvableConfig): {
    define: Record<string, string>
  }
  transform?(code: string, id: string): Promise<TransformOutput | null> | TransformOutput | null
}
