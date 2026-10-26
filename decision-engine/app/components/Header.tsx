'use client'

import { Brain, Sparkles } from 'lucide-react'
import Navigation from './Navigation'

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold gradient-text">
                Decision Engine
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 hidden sm:block">AI Decision Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center space-x-2 text-sm text-slate-600">
              <Sparkles className="w-4 h-4 text-accent-500" />
              <span>Pre-execution Decision Layer</span>
            </div>
            <Navigation />
          </div>
        </div>
      </div>
    </header>
  )
}
