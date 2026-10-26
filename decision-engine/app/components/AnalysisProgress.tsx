'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Target, GitBranch, Scale } from 'lucide-react'
import { cn } from '../lib/utils'

interface AnalysisStep {
  id: string
  icon: React.ReactNode
  label: string
  description: string
}

const steps: AnalysisStep[] = [
  {
    id: 'intent',
    icon: <Target className="w-5 h-5" />,
    label: 'Understanding Intent',
    description: 'Parsing your goal...',
  },
  {
    id: 'complexity',
    icon: <GitBranch className="w-5 h-5" />,
    label: 'Analyzing Complexity',
    description: 'Evaluating task structure...',
  },
  {
    id: 'options',
    icon: <Scale className="w-5 h-5" />,
    label: 'Comparing Approaches',
    description: 'Simulating outcomes...',
  },
  {
    id: 'recommend',
    icon: <Sparkles className="w-5 h-5" />,
    label: 'Generating Recommendation',
    description: 'Finalizing best approach...',
  },
]

export default function AnalysisProgress() {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, 800)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full max-w-2xl mx-auto py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 mb-4">
          <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
          <span className="text-sm font-medium text-primary-700">
            Decision Engine is analyzing...
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const isActive = index === currentStep
          const isCompleted = index < currentStep
          const isPending = index > currentStep

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-500",
                isCompleted && "bg-primary-50 border-primary-200 opacity-70",
                isActive && "bg-white border-primary-400 shadow-lg shadow-primary-100 scale-105",
                isPending && "bg-slate-50 border-slate-200 opacity-50"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                  isCompleted && "bg-primary-500 text-white",
                  isActive && "bg-gradient-to-br from-primary-500 to-accent-500 text-white animate-pulse-slow",
                  isPending && "bg-slate-200 text-slate-400"
                )}
              >
                {isCompleted ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.icon
                )}
              </div>
              <div className="flex-1">
                <h4 className={cn(
                  "font-semibold transition-colors",
                  isActive ? "text-slate-800" : "text-slate-600"
                )}>
                  {step.label}
                </h4>
                <p className="text-sm text-slate-500">{step.description}</p>
              </div>
              {isActive && (
                <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
