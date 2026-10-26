'use client'

import { useState } from 'react'
import { 
  Zap, 
  Workflow, 
  Bot, 
  Clock, 
  Coins, 
  TrendingUp,
  Check,
  X,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Play
} from 'lucide-react'
import { cn } from '../lib/utils'
import { type AnalysisResult, type DecisionOption, type ApproachType } from '../types'

interface RecommendationPanelProps {
  result: AnalysisResult
  onExecute: (approach: ApproachType) => void
}

const approachIcons = {
  simple: Zap,
  workflow: Workflow,
  agent: Bot,
}

const approachColors = {
  simple: {
    bg: 'bg-primary-50',
    border: 'border-primary-200',
    text: 'text-primary-700',
    icon: 'text-primary-500',
    badge: 'bg-primary-100 text-primary-700',
  },
  workflow: {
    bg: 'bg-accent-50',
    border: 'border-accent-200',
    text: 'text-accent-700',
    icon: 'text-accent-500',
    badge: 'bg-accent-100 text-accent-700',
  },
  agent: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    icon: 'text-purple-500',
    badge: 'bg-purple-100 text-purple-700',
  },
}

const qualityLabels = {
  low: 'Basic',
  medium: 'Good',
  high: 'High',
  excellent: 'Excellent',
}

function OptionCard({ 
  option, 
  isExpanded, 
  onToggle, 
  isRecommended 
}: { 
  option: DecisionOption
  isExpanded: boolean
  onToggle: () => void
  isRecommended: boolean
}) {
  const Icon = approachIcons[option.type]
  const colors = approachColors[option.type]

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 transition-all duration-300 overflow-hidden",
        isExpanded ? colors.border : "border-slate-200",
        isExpanded ? colors.bg : "bg-white",
        isRecommended && !isExpanded && "ring-2 ring-accent-400 ring-offset-2",
        "hover:shadow-md"
      )}
    >
      {/* Recommended Badge */}
      {isRecommended && (
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent-500 text-white text-xs font-medium">
            <Sparkles className="w-3 h-3" />
            Recommended
          </div>
        </div>
      )}

      <button
        onClick={onToggle}
        className="w-full p-5 text-left"
      >
        <div className="flex items-start gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
            colors.bg,
            colors.icon
          )}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={cn("font-bold text-lg", colors.text)}>
              {option.name}
            </h3>
            <p className="text-slate-600 text-sm mt-1 line-clamp-2">
              {option.description}
            </p>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1 text-slate-500">
                <Clock className="w-4 h-4" />
                <span>{option.estimatedTime}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <Coins className="w-4 h-4" />
                <span>~{option.tokenUsage.toLocaleString()} tokens</span>
              </div>
              <div className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                colors.badge
              )}>
                <TrendingUp className="w-3 h-3" />
                <span>{qualityLabels[option.quality]}</span>
              </div>
            </div>
          </div>
          <div className="shrink-0 pt-1">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-5 pb-5 animate-fade-in">
          <div className="pt-4 border-t border-slate-200/60">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Pros */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Advantages
                </h4>
                <ul className="space-y-1">
                  {option.pros.map((pro, i) => (
                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Cons */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <X className="w-4 h-4 text-red-500" />
                  Trade-offs
                </h4>
                <ul className="space-y-1">
                  {option.cons.map((con, i) => (
                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Confidence Meter */}
            <div className="mt-4 p-3 rounded-lg bg-white/50">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-600">Confidence Score</span>
                <span className="font-semibold text-slate-800">{option.confidence}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    option.confidence >= 80 ? "bg-green-500" :
                    option.confidence >= 60 ? "bg-yellow-500" : "bg-red-500"
                  )}
                  style={{ width: `${option.confidence}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RecommendationPanel({ result, onExecute }: RecommendationPanelProps) {
  const [expandedOption, setExpandedOption] = useState<ApproachType | null>(result.recommendedOption)
  const [selectedApproach, setSelectedApproach] = useState<ApproachType>(result.recommendedOption)

  return (
    <div className="w-full max-w-5xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-50 border border-accent-100 mb-4">
          <Sparkles className="w-4 h-4 text-accent-500" />
          <span className="text-sm font-medium text-accent-700">
            Analysis Complete
          </span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Here&apos;s my recommendation for you
        </h2>
        <p className="text-slate-600">
          Based on your goal: <span className="font-medium text-slate-800">&ldquo;{result.intent}&rdquo;</span>
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Step-by-Step Plan */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-24">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Workflow className="w-5 h-5 text-accent-500" />
              Step-by-Step Plan
            </h3>
            <div className="space-y-3">
              {result.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent-100 text-accent-600 flex items-center justify-center shrink-0 text-sm font-medium">
                    {index + 1}
                  </div>
                  <p className="text-sm text-slate-600 pt-0.5">{step}</p>
                </div>
              ))}
            </div>
            
            {/* Task Info */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Complexity</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full font-medium capitalize",
                  result.complexity === 'low' && "bg-green-100 text-green-700",
                  result.complexity === 'medium' && "bg-yellow-100 text-yellow-700",
                  result.complexity === 'high' && "bg-red-100 text-red-700",
                )}>
                  {result.complexity}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-slate-500">Category</span>
                <span className="font-medium text-slate-700">{result.category}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Approach Options */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-800 mb-4">
            Choose your approach
          </h3>
          
          {result.options.map((option) => (
            <OptionCard
              key={option.type}
              option={option}
              isExpanded={expandedOption === option.type}
              onToggle={() => setExpandedOption(
                expandedOption === option.type ? null : option.type
              )}
              isRecommended={result.recommendedOption === option.type}
            />
          ))}

          {/* Execute Button */}
          <div className="pt-4">
            <button
              onClick={() => onExecute(selectedApproach)}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
            >
              <Play className="w-5 h-5" />
              Execute with {result.options.find(o => o.type === selectedApproach)?.name}
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-center text-sm text-slate-500 mt-3">
              You can change your approach by clicking on the cards above
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
