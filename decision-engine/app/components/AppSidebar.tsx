'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Plus, MessageSquare, LogOut, User, Menu, Trash2, Brain,
  History, Settings, ChevronRight, Clock
} from 'lucide-react'
import { useAuth } from '@/app/lib/auth-context'
import { api, HistoryItem } from '@/app/lib/api'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface AppSidebarProps {
  onHistorySelect?: (item: HistoryItem) => void;
  onNewChat?: () => void;
}

export function AppSidebar({ onHistorySelect, onNewChat }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout, isAuthenticated } = useAuth()
  const [history, setHistory] = React.useState<HistoryItem[]>([])
  const [loading, setLoading] = React.useState(false)

  const loadHistory = React.useCallback(async () => {
    if (!isAuthenticated) return
    try {
      setLoading(true)
      const data = await api.getHistory()
      setHistory(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load history:', error)
      setHistory([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  React.useEffect(() => {
    if (isAuthenticated) {
      loadHistory()
    }
  }, [isAuthenticated, loadHistory])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const handleNewChat = () => {
    onNewChat?.()
    router.push('/')
  }

  const handleHistoryClick = (item: HistoryItem) => {
    onHistorySelect?.(item)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      console.log('Deleting history item:', id)
      await api.deleteHistoryItem(id)
      console.log('Successfully deleted history item:', id)
      setHistory(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error('Failed to delete history item:', error)
      alert('Failed to delete history item. Please try again.')
    }
  }

  return (
    <Sidebar variant="sidebar" collapsible="offcanvas" className="border-r border-slate-200/60 bg-white">
      {/* Premium Header - Mobile Optimized */}
      <SidebarHeader className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-base sm:text-lg leading-tight">Decision</h1>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium tracking-wide">ENGINE</p>
            </div>
          </div>
          <SidebarTrigger className="lg:hidden">
            <Menu className="h-4 w-4 text-slate-500" />
          </SidebarTrigger>
        </div>

        {/* New Analysis Button - Mobile Optimized */}
        <Button
          onClick={handleNewChat}
          className="mt-4 sm:mt-5 w-full justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 border-0 h-10 sm:h-11 rounded-xl font-medium text-sm sm:text-base"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          New Analysis
        </Button>
      </SidebarHeader>

      {/* History Section - Mobile Optimized */}
      <SidebarContent className="px-2 sm:px-3">
        <div className="flex items-center justify-between mb-2 sm:mb-3 px-2">
          <div className="flex items-center gap-2">
            <History className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent</span>
          </div>
          <Badge variant="secondary" className="text-[9px] sm:text-[10px] bg-slate-100 text-slate-500 border-0">
            {history.length}
          </Badge>
        </div>
        
        <ScrollArea className="flex-1 min-h-0">
          <SidebarMenu className="space-y-1">
            {loading ? (
              <div className="px-4 py-8 text-center">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-100 border-t-indigo-500 animate-spin mx-auto" />
                <p className="text-xs text-slate-400 mt-3">Loading history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="h-5 w-5 text-slate-300" />
                </div>
                <p className="text-xs text-slate-400">No analysis history yet</p>
                <p className="text-[10px] text-slate-300 mt-1">Start your first analysis</p>
              </div>
            ) : (
              history.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <div className="group flex items-center gap-1 rounded-xl hover:bg-slate-50 transition-colors duration-200 overflow-hidden">
                    <SidebarMenuButton
                      onClick={() => handleHistoryClick(item)}
                      className="flex-1 justify-start gap-2.5 sm:gap-3 min-w-0 h-auto py-2.5 sm:py-3 px-2.5 sm:px-3 rounded-xl overflow-hidden"
                      title={item.intent}
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0">
                        <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0 text-left overflow-hidden">
                        <span className="block text-xs sm:text-sm font-medium text-slate-700 truncate max-w-[140px] sm:max-w-[180px]">
                          {item.intent}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                      </div>
                    </SidebarMenuButton>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 sm:h-7 sm:w-7 shrink-0 mr-1 hover:bg-rose-50 hover:text-rose-500 transition-all opacity-60 sm:opacity-0 sm:group-hover:opacity-100"
                      onClick={(e) => handleDelete(e, item.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </Button>
                  </div>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>

      {/* Premium Footer */}
      <SidebarFooter className="p-4">
        <Separator className="mb-4 bg-slate-100" />
        
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
            <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
              <AvatarImage src={user.image || ''} alt={user.name || user.email} />
              <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white text-sm font-medium">
                {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate">{user.name || user.email}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 hover:bg-rose-50 hover:text-rose-500 transition-colors"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button 
            variant="outline" 
            className="w-full justify-center gap-2 h-11 rounded-xl border-slate-200 hover:bg-slate-50 hover:border-indigo-300"
            onClick={() => router.push('/login')}
          >
            <User className="h-4 w-4 text-indigo-500" />
            <span className="font-medium">Sign In</span>
            <ChevronRight className="h-4 w-4 text-slate-400 ml-auto" />
          </Button>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
