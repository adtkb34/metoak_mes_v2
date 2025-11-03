export type ParameterType = 1 | 2

export type ParameterStatus = 1 | 2

export interface ParameterNode {
  id: string
  name: string
  description?: string
  unit?: string
  value?: string
  children?: ParameterNode[]
}

export interface ParameterConfig {
  id: string
  name: string
  type: ParameterType
  product: string
  process: string
  version: string
  description?: string
  status: ParameterStatus
  parameters: ParameterNode[]
}

export interface ParameterOptions {
  products: Array<{ label: string; value: string }>
  processes: Array<{ label: string; value: string }>
}
