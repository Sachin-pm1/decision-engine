'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Send, Sparkles, Zap, MessageSquare, Plus, Play, Clock, Coins, 
  Gauge, Brain, BarChart3, Target, Lightbulb, ChevronRight,
  CheckCircle2, XCircle, AlertCircle, Loader2, Terminal
} from 'lucide-react'
import { useAuth } from '@/app/lib/auth-context'
import { api, HistoryItem, HistoryItemDetail, Recommendation, Execution } from '@/app/lib/api'
import { ws } from '@/app/lib/websocket'
import { AppSidebar } from '@/app/components/AppSidebar'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  analysisData?: AnalysisDisplayData
}

interface AnalysisDisplayData {
  intent: string
  complexity: string
  category: string
  recommended: string
  options: Recommendation[]
}

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, user, loading: authLoading } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisDisplayData | null>(null)
  const [sidebarKey, setSidebarKey] = useState(0)
  const [executions, setExecutions] = useState<Record<string, Execution>>({})
  const [executingApproach, setExecutingApproach] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setCurrentAnalysis(null)

    try {
      const intent = await api.createIntent(input)
      const analysisStart = await api.startAnalysis(intent.id)

      console.log('Analysis start response:', analysisStart)
      if (!analysisStart?.analysisId) {
        console.error('No analysisId in response:', analysisStart)
        throw new Error('No analysisId returned from server')
      }

      ws.subscribe(analysisStart.analysisId)

      ws.onProgress((data: any) => {
        setProgress(data.percentage)
      })

      ws.onComplete(async (data: any) => {
        ws.removeAllListeners()
        ws.disconnect()

        const recommendations = await api.getRecommendations(analysisStart.analysisId)

        const analysisData: AnalysisDisplayData = {
          intent: input,
          complexity: data.result.complexity,
          category: data.result.category,
          recommended: data.result.recommendedOption,
          options: recommendations
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Analysis complete! Based on your intent "${input}", I recommend using the **${data.result.recommendedOption}** approach.\n\nThis task has been classified as **${data.result.complexity} complexity** in the **${data.result.category}** category.`,
          timestamp: new Date(),
          analysisData
        }

        setMessages(prev => [...prev, assistantMessage])
        setCurrentAnalysis(analysisData)
        setIsLoading(false)
        setSidebarKey(prev => prev + 1) // Refresh sidebar history
      })

      ws.onError((data: any) => {
        console.error('Analysis error received:', data)
        ws.removeAllListeners()
        ws.disconnect()

        // Extract error message from various possible structures
        let errorMsg = 'Unknown error occurred'
        
        if (typeof data === 'string') {
          errorMsg = data
        } else if (data?.error) {
          // Error could be a string or a JSON string
          if (typeof data.error === 'string') {
            // Try to parse as JSON
            try {
              const parsed = JSON.parse(data.error)
              errorMsg = parsed.error?.message || parsed.message || data.error
            } catch {
              errorMsg = data.error
            }
          } else if (data.error.message) {
            errorMsg = data.error.message
          }
        } else if (data?.message) {
          errorMsg = data.message
        }
        
        // Show cleaner message for quota/rate limit errors
        if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
          errorMsg = 'AI service quota exceeded. No API credits available. Please check your billing or try again later.'
        }

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Sorry, I encountered an error: ${errorMsg}. Please try again.`,
          timestamp: new Date()
        }

        setMessages(prev => [...prev, errorMessage])
        setIsLoading(false)
      })

    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const startNewChat = () => {
    setMessages([])
    setInput('')
    setCurrentAnalysis(null)
    setExecutions({})
    setExecutingApproach(null)
  }

  const handleHistorySelect = async (item: HistoryItem) => {
    // Load history item into current view
    const historyMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: item.intent,
      timestamp: new Date(item.date)
    }
    setMessages([historyMessage])

    // Fetch full history item details with recommendations
    try {
      const fullItem = await api.getHistoryItem(item.id)
      if (fullItem && fullItem.options) {
        const analysisData: AnalysisDisplayData = {
          intent: item.intent,
          complexity: item.complexity,
          category: item.category,
          recommended: item.recommended,
          options: fullItem.options
        }
        setCurrentAnalysis(analysisData)
        
        // Load existing executions into state to prevent re-execution
        if (fullItem.executions && fullItem.executions.length > 0) {
          const executionMap: Record<string, Execution> = {}
          fullItem.executions.forEach(ex => {
            executionMap[ex.approach] = {
              id: ex.id,
              analysisId: item.id,
              approach: ex.approach,
              intentText: item.intent,
              status: ex.status as any,
              result: ex.result,
              metadata: ex.metadata,
              createdAt: ex.createdAt,
              updatedAt: ex.createdAt,
            }
          })
          setExecutions(executionMap)
          console.log('Loaded executions from history:', executionMap)
        } else {
          // Clear executions if none exist for this history item
          setExecutions({})
        }
      }
    } catch (error) {
      console.error('Failed to load history item details:', error)
    }
  }

  const handleExecute = async (approach: string) => {
    if (!currentAnalysis) return
    
    console.log('Starting execution for approach:', approach)
    setExecutingApproach(approach)
    
    try {
      // Find the analysisId from the current analysis
      const historyItem = await api.getHistory()
      console.log('History items:', historyItem)
      
      const currentItem = historyItem.find(item => item.intent === currentAnalysis.intent)
      console.log('Current item:', currentItem)
      
      if (!currentItem) {
        throw new Error('Could not find analysis for current intent')
      }
      
      // Get the full history item to find the analysisId
      const fullItem = await api.getHistoryItem(currentItem.id)
      console.log('Full item:', fullItem)
      
      const analysisId = fullItem.options?.[0]?.analysisId || currentItem.id
      console.log('Using analysisId:', analysisId)
      
      // Create execution
      console.log('Creating execution with:', { analysisId, approach, intentText: currentAnalysis.intent })
      const execution = await api.createExecution(
        analysisId,
        approach,
        currentAnalysis.intent
      )
      console.log('Execution created:', execution)
      
      // Set initial execution state
      setExecutions(prev => ({
        ...prev,
        [approach]: execution
      }))
      
      // Poll for execution status every 2 seconds
      let pollCount = 0
      const pollInterval = setInterval(async () => {
        pollCount++
        console.log(`Polling execution #${pollCount}:`, execution.id)
        try {
          const updatedExecution = await api.getExecution(execution.id)
          console.log('Poll response:', updatedExecution)
          
          setExecutions(prev => ({
            ...prev,
            [approach]: updatedExecution
          }))
          
          // Stop polling if execution is complete or failed
          if (updatedExecution.status === 'completed' || updatedExecution.status === 'failed') {
            console.log('Execution finished:', updatedExecution.status)
            clearInterval(pollInterval)
            setExecutingApproach(null)
          }
        } catch (error) {
          console.error('Error polling execution:', error)
        }
      }, 2000)
      
      // Stop polling after 5 minutes (300 seconds) to prevent infinite polling
      setTimeout(() => {
        console.log('Stopping poll after timeout')
        clearInterval(pollInterval)
      }, 300000)
      
    } catch (error) {
      console.error('Failed to start execution:', error)
      alert('Failed to start execution. Please try again.')
      setExecutingApproach(null)
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center animate-pulse">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div className="w-8 h-8 rounded-full border-2 border-indigo-100 border-t-indigo-500 animate-spin" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect immediately
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-100 border-t-indigo-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-auto bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <AppSidebar 
        key={sidebarKey}
        onHistorySelect={handleHistorySelect}
        onNewChat={startNewChat}
      />
      
      <SidebarInset className="flex flex-col w-full">
        {/* Premium Header - Mobile Optimized */}
        <header className="flex h-14 sm:h-16 items-center justify-between border-b border-slate-200/60 bg-white/80 backdrop-blur-md px-3 sm:px-4 lg:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <SidebarTrigger className="lg:hidden -ml-1" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Decision Engine
                </h1>
                <p className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">AI-Powered Analysis</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={startNewChat}
              className="gap-1.5 sm:gap-2 bg-white hover:bg-slate-50 border-slate-200 h-8 sm:h-9 px-2 sm:px-3"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-500" />
              <span className="hidden sm:inline">New Analysis</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </header>

        {/* Chat Area - Mobile Optimized */}
        <ScrollArea className="flex-1 px-3 sm:px-4 lg:px-8">
          <div className="mx-auto max-w-3xl py-4 sm:py-8 space-y-4 sm:space-y-6">
            {messages.length === 0 && !currentAnalysis ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] space-y-6 sm:space-y-10 animate-fade-in px-2">
                {/* Hero Section - Mobile Optimized */}
                <div className="text-center space-y-3 sm:space-y-4">
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs sm:text-sm font-medium mb-2">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">AI-Powered Decision Assistant</span>
                    <span className="sm:hidden">AI Assistant</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-800">
                    What would you like to{' '}
                    <span className="gradient-text">analyze?</span>
                  </h2>
                  <p className="text-slate-500 text-sm sm:text-base lg:text-lg max-w-lg mx-auto px-2">
                    Describe your task or goal, and I'll recommend the best AI approach for optimal results.
                  </p>
                </div>
                
                {/* Suggestion Cards - Mobile Optimized Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-2xl px-1 sm:px-0">
                  {[
                    { icon: Sparkles, text: 'Write a marketing blog post about AI trends', desc: 'Content generation', color: 'from-violet-500 to-purple-600' },
                    { icon: Zap, text: 'Build an automated workflow for data processing', desc: 'Process automation', color: 'from-amber-500 to-orange-600' },
                    { icon: BarChart3, text: 'Create a customer support chatbot', desc: 'System design', color: 'from-emerald-500 to-teal-600' },
                    { icon: Target, text: 'Analyze quarterly sales data and create insights', desc: 'Data analysis', color: 'from-rose-500 to-pink-600' },
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(suggestion.text)}
                      className="group flex flex-col items-start gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl bg-white border border-slate-200/60 p-3.5 sm:p-5 text-left transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:border-indigo-200/60 hover:-translate-y-1"
                    >
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${suggestion.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <suggestion.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="space-y-0.5 sm:space-y-1">
                        <span className="text-xs sm:text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {suggestion.text}
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-400 block">{suggestion.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Trust Indicators - Mobile Optimized */}
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] sm:text-xs text-slate-400 pt-2 sm:pt-4">
                  <span className="flex items-center gap-1 sm:gap-1.5">
                    <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />
                    Real-time
                  </span>
                  <span className="flex items-center gap-1 sm:gap-1.5">
                    <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />
                    AI Approaches
                  </span>
                  <span className="flex items-center gap-1 sm:gap-1.5">
                    <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />
                    Smart AI
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 animate-slide-up ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <Avatar className="h-10 w-10 shrink-0 ring-2 ring-white shadow-md">
                      {message.role === 'user' ? (
                        <>
                          <AvatarImage src={user?.image || ''} alt={user?.name || user?.email} />
                          <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white font-medium">
                            {user?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </>
                      ) : (
                        <>
                          <AvatarImage src="/ai-avatar.png" alt="AI" />
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                            <Brain className="w-5 h-5" />
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    <div className={`space-y-1 max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`rounded-2xl px-5 py-3 text-sm shadow-sm ${
                        message.role === 'user' 
                          ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white' 
                          : 'bg-white border border-slate-200/60 text-slate-700'
                      }`}>
                        {message.content}
                      </div>
                      <span className="text-[11px] text-slate-400 px-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Loading State - Mobile Optimized */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 space-y-3 sm:space-y-4 animate-fade-in">
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center animate-pulse">
                    <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white border-2 border-indigo-100 flex items-center justify-center">
                    <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-500 animate-spin" />
                  </div>
                </div>
                <div className="text-center space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-600">Analyzing your request...</p>
                  <p className="text-[10px] sm:text-xs text-slate-400">This may take a few moments</p>
                </div>
                <div className="w-36 sm:w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full animate-pulse" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {/* Inline Results Display - Premium Redesign */}
            {currentAnalysis && (
              <div className="mt-10 space-y-6 animate-slide-up">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Analysis Results</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                </div>
                
                {/* Analysis Summary Card */}
                <Card className="border-slate-200/60 shadow-lg shadow-slate-200/20 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                          <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-slate-800">Analysis Complete</CardTitle>
                          <p className="text-xs text-slate-500">Task complexity evaluated</p>
                        </div>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={`capitalize ${
                          currentAnalysis.complexity === 'low' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          currentAnalysis.complexity === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          'bg-rose-50 text-rose-600 border-rose-200'
                        }`}
                      >
                        {currentAnalysis.complexity} Complexity
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                        {currentAnalysis.category}
                      </Badge>
                      <Badge className="bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100">
                        <Lightbulb className="w-3 h-3 mr-1" />
                        Recommended: {currentAnalysis.recommended}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Approach Options - Premium Cards */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-500" />
                    Available Approaches
                  </h3>
                  {currentAnalysis.options.map((option, index) => (
                    <Card 
                      key={index} 
                      className={`card-hover border-slate-200/60 overflow-hidden ${
                        option.isRecommended ? 'ring-2 ring-indigo-500/20 border-indigo-300/50' : ''
                      }`}
                    >
                      {option.isRecommended && (
                        <div className="h-1 bg-gradient-to-r from-emerald-400 to-emerald-500" />
                      )}
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-slate-800">{option.name}</h4>
                              {option.isRecommended && (
                                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Recommended
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed">{option.description}</p>
                            
                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                                <Clock className="h-4 w-4 text-slate-400" />
                                <div>
                                  <p className="text-[10px] text-slate-400 uppercase">Time</p>
                                  <p className="text-xs font-medium text-slate-600">{option.estimatedTime}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                                <Coins className="h-4 w-4 text-slate-400" />
                                <div>
                                  <p className="text-[10px] text-slate-400 uppercase">Tokens</p>
                                  <p className="text-xs font-medium text-slate-600">{option.tokenUsage.toLocaleString()}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                                <Gauge className="h-4 w-4 text-slate-400" />
                                <div>
                                  <p className="text-[10px] text-slate-400 uppercase">Quality</p>
                                  <p className="text-xs font-medium text-slate-600 capitalize">{option.quality}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                                <Sparkles className="h-4 w-4 text-slate-400" />
                                <div>
                                  <p className="text-[10px] text-slate-400 uppercase">Confidence</p>
                                  <p className="text-xs font-medium text-slate-600">{option.confidence}%</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => handleExecute(option.approachType)}
                          disabled={executingApproach === option.approachType}
                          className={`mt-5 w-full ${
                            option.isRecommended 
                              ? 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25' 
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                          variant={option.isRecommended ? 'default' : 'outline'}
                          size="default"
                        >
                          {executingApproach === option.approachType ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Executing...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Execute with {option.approachType}
                              <ChevronRight className="h-4 w-4 ml-auto" />
                            </>
                          )}
                        </Button>
                        
                        {/* Execution Result Display */}
                        {executions[option.approachType]?.result && (
                          <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Execution Result:</h4>
                            <pre className="text-xs text-slate-600 whitespace-pre-wrap overflow-auto max-h-60">
                              {executions[option.approachType].result}
                            </pre>
                            {executions[option.approachType].metadata && (
                              <div className="mt-2 flex gap-4 text-[10px] text-slate-400">
                                <span>Tokens: {executions[option.approachType].metadata?.tokenUsage?.toLocaleString()}</span>
                                <span>Time: {executions[option.approachType].metadata?.executionTime}ms</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {executions[option.approachType]?.error && (
                          <div className="mt-4 p-4 rounded-lg bg-rose-50 border border-rose-200">
                            <p className="text-xs text-rose-600">Error: {executions[option.approachType].error}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Premium Input Area - Mobile Optimized */}
        <div className="border-t border-slate-200/60 bg-white/90 backdrop-blur-md p-3 sm:p-4 lg:px-8 safe-area-pb">
          <div className="mx-auto max-w-3xl">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-xl sm:rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -m-0.5 sm:-m-1 pointer-events-none" />
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you want to accomplish..."
                className="relative z-10 min-h-[60px] sm:min-h-[80px] resize-none pr-12 sm:pr-14 rounded-xl bg-white border-slate-200/60 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 text-sm sm:text-base text-slate-700 placeholder:text-slate-400 cursor-text caret-indigo-500"
              />
              <Button
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="absolute right-2 sm:right-3 bottom-2 sm:bottom-3 h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:shadow-none transition-all duration-300"
              >
                <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
            <p className="text-[10px] sm:text-xs text-center text-slate-400 mt-2 sm:mt-3 hidden sm:block">
              Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-sans">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-sans">Shift</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-sans">Enter</kbd> for new line
            </p>
          </div>
        </div>
      </SidebarInset>
    </div>
  )
}
