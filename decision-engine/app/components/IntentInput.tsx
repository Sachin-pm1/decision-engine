'use client'

import { useState } from 'react'
import { Send, Mic, Lightbulb, Zap, Workflow, Bot } from 'lucide-react'
import { cn } from '../lib/utils'

interface IntentInputProps {
  onSubmit: (intent: string) => void
  isAnalyzing: boolean
}

const examples = [
  "Analyze this dataset and create a sales report",
  "Write a Python script to automate file organization",
  "Summarize 50 research papers on climate change",
  "Build a customer support chatbot",
]

export default function IntentInput({ onSubmit, isAnalyzing }: IntentInputProps) {
  const [intent, setIntent] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (intent.trim() && !isAnalyzing) {
      onSubmit(intent)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-3">
          What do you want to accomplish?
        </h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Describe your goal and our Decision Engine will recommend the best approach 
          — whether it&apos;s a simple prompt, workflow, or agent-based solution.
        </p>
      </div>

      {/* Quick approach indicators */}
      <div className="flex justify-center gap-4 mb-8">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100">
          <Zap className="w-4 h-4 text-primary-500" />
          <span className="text-sm text-primary-700">Simple Prompt</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent-50 border border-accent-100">
          <Workflow className="w-4 h-4 text-accent-500" />
          <span className="text-sm text-accent-700">Workflow</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border border-purple-100">
          <Bot className="w-4 h-4 text-purple-500" />
          <span className="text-sm text-purple-700">Agent</span>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <textarea
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="I want to..."
            className={cn(
              "w-full px-6 py-5 pr-32 rounded-2xl border-2 border-slate-200",
              "bg-white text-slate-800 placeholder-slate-400",
              "focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100",
              "transition-all duration-200 resize-none",
              "text-lg shadow-sm",
              isAnalyzing && "opacity-50 cursor-not-allowed"
            )}
            rows={3}
            disabled={isAnalyzing}
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <button
              type="button"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              disabled={isAnalyzing}
            >
              <Mic className="w-5 h-5" />
            </button>
            <button
              type="submit"
              disabled={!intent.trim() || isAnalyzing}
              className={cn(
                "px-4 py-2 rounded-lg font-medium flex items-center gap-2",
                "transition-all duration-200",
                intent.trim() && !isAnalyzing
                  ? "bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg hover:shadow-xl hover:scale-105"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Analyze
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Examples */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3 text-slate-500">
          <Lightbulb className="w-4 h-4" />
          <span className="text-sm font-medium">Try an example:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => setIntent(example)}
              className="px-4 py-2 text-sm rounded-full bg-white border border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200"
              disabled={isAnalyzing}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
