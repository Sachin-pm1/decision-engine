'use client'

import Header from '../../components/Header'
import { Brain, Zap, Workflow, Bot, TrendingUp, Shield, Globe, Users } from 'lucide-react'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Header />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 mb-6">
              <Brain className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-primary-700">AI Decision Intelligence</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
              Decide How to Use AI Before You Use It
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Claude Decision Engine is a pre-execution decision layer that helps you choose the optimal AI approach — Simple Prompt, Workflow, or Agent — before spending tokens and time.
            </p>
          </div>

          {/* Problem Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">The Problem</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-red-50 border border-red-100">
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">Wasted Tokens</h3>
                <p className="text-sm text-slate-600">Users jump straight into execution without considering the best approach, wasting tokens on mismatched methods.</p>
              </div>
              <div className="p-6 rounded-xl bg-orange-50 border border-orange-100">
                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">Poor Quality</h3>
                <p className="text-sm text-slate-600">Wrong approach leads to suboptimal results, requiring multiple iterations and more token consumption.</p>
              </div>
              <div className="p-6 rounded-xl bg-yellow-50 border border-yellow-100">
                <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center mb-4">
                  <Workflow className="w-6 h-6 text-yellow-500" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">Trial & Error</h3>
                <p className="text-sm text-slate-600">No guidance on approach selection leads to inefficient workflows and wasted time.</p>
              </div>
            </div>
          </div>

          {/* Solution Section */}
          <div className="bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl p-8 mb-12 text-white">
            <h2 className="text-2xl font-bold mb-6">Our Solution</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Pre-Execution Decision Layer</h3>
                <p className="text-white/90 mb-4">
                  Like Google Maps showing you the best route before you drive, our Decision Engine shows you the optimal AI approach before you execute.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                    Intent analysis and complexity detection
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                    Multi-approach comparison (Simple, Workflow, Agent)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                    Token usage and time predictions
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                    Quality and confidence scoring
                  </li>
                </ul>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/20 rounded-xl p-4 text-center">
                  <Zap className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">Simple</p>
                </div>
                <div className="bg-white/20 rounded-xl p-4 text-center">
                  <Workflow className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">Workflow</p>
                </div>
                <div className="bg-white/20 rounded-xl p-4 text-center">
                  <Bot className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">Agent</p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Key Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <Brain className="w-8 h-8 text-primary-500 mb-4" />
                <h3 className="font-semibold text-slate-800 mb-2">Intent Understanding</h3>
                <p className="text-sm text-slate-600">Parse and categorize user goals with AI-powered analysis.</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <Workflow className="w-8 h-8 text-accent-500 mb-4" />
                <h3 className="font-semibold text-slate-800 mb-2">Step-by-Step Plan</h3>
                <p className="text-sm text-slate-600">Get a clear execution roadmap before starting.</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <TrendingUp className="w-8 h-8 text-green-500 mb-4" />
                <h3 className="font-semibold text-slate-800 mb-2">What-If Comparison</h3>
                <p className="text-sm text-slate-600">Compare tradeoffs between different approaches.</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <Shield className="w-8 h-8 text-purple-500 mb-4" />
                <h3 className="font-semibold text-slate-800 mb-2">Confidence Scoring</h3>
                <p className="text-sm text-slate-600">Know how confident the system is in its recommendation.</p>
              </div>
            </div>
          </div>

          {/* Architecture Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Architecture</h2>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <div className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700">Intent Input</div>
              <div className="text-slate-400">→</div>
              <div className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700">Intent Understanding</div>
              <div className="text-slate-400">→</div>
              <div className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700">Decision Engine</div>
              <div className="text-slate-400">→</div>
              <div className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700">Simulation Layer</div>
              <div className="text-slate-400">→</div>
              <div className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700">Prediction</div>
              <div className="text-slate-400">→</div>
              <div className="px-4 py-2 rounded-lg bg-primary-100 text-primary-700">Recommendation</div>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Technology Stack</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Frontend</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• Next.js 14 (App Router)</li>
                  <li>• React 18 + TypeScript</li>
                  <li>• Tailwind CSS</li>
                  <li>• Lucide Icons</li>
                </ul>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Backend</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• NestJS</li>
                  <li>• TypeORM + SQLite</li>
                  <li>• WebSocket (Socket.io)</li>
                  <li>• Class Validator</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-slate-500">
            <p>Built with ❤️ for better AI decision-making</p>
          </div>
        </div>
      </div>
    </main>
  )
}
