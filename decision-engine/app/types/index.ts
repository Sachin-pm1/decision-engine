export type ApproachType = 'simple' | 'workflow' | 'agent'

export interface DecisionOption {
  type: ApproachType
  name: string
  description: string
  estimatedTime: string
  tokenUsage: number
  quality: 'low' | 'medium' | 'high' | 'excellent'
  confidence: number
  pros: string[]
  cons: string[]
  recommended: boolean
}

export interface AnalysisResult {
  intent: string
  complexity: 'low' | 'medium' | 'high'
  category: string
  options: DecisionOption[]
  recommendedOption: ApproachType
  steps: string[]
}

export interface UserIntent {
  text: string
  timestamp: Date
}
