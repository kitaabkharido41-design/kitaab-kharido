'use client'

import { useState } from 'react'
import { AGENTS, AgentPersona } from '@/lib/ai/agents'
import { AgentChat } from './agent-chat'
import { ArrowLeft, Menu, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import Link from 'next/link'

export function GrowthDashboard() {
  const [activeAgent, setActiveAgent] = useState<AgentPersona>('ceo')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const agentList = Object.values(AGENTS)

  const sidebarNav = (onClick?: () => void) => (
    <nav className="flex flex-col gap-1 px-3 mt-4">
      <div className="px-4 text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-3">AI Growth Team</div>
      {agentList.map(agent => (
        <button
          key={agent.id}
          onClick={() => { setActiveAgent(agent.id); onClick?.() }}
          className={`group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeAgent === agent.id
              ? 'bg-indigo-500/10 text-indigo-400 shadow-sm border border-indigo-500/20'
              : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
          }`}
        >
          <div className={`flex items-center justify-center w-8 h-8 rounded-lg text-lg transition-transform duration-200 ${
            activeAgent === agent.id ? 'scale-110' : 'group-hover:scale-110'
          }`}>
            {agent.avatar}
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="font-semibold">{agent.name}</span>
            <span className={`text-[10px] font-normal leading-tight hidden md:block mt-0.5 ${
               activeAgent === agent.id ? 'text-indigo-400/70' : 'text-white/40 group-hover:text-white/60'
            }`}>
              {agent.role}
            </span>
          </div>
        </button>
      ))}
    </nav>
  )

  return (
    <div className="h-screen flex bg-[#060d1f] overflow-hidden text-white font-sans selection:bg-indigo-500/30">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-72 flex-shrink-0 flex-col bg-[#040a18] border-r border-white/5 relative z-10">
        <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-gradient-to-b from-indigo-500/5 to-transparent">
          <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400 shadow-inner border border-indigo-500/30">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Growth<span className="text-indigo-400">Team</span></h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Powered by AI</p>
          </div>
        </div>
        <div className="flex-1 py-4 overflow-y-auto custom-scrollbar">
          {sidebarNav()}
        </div>
        <div className="p-4 border-t border-white/5 space-y-2 bg-[#040a18]">
          <Link href="/admin" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors px-3 py-2.5 rounded-lg hover:bg-white/5 font-medium border border-transparent hover:border-white/10">
            <ArrowLeft className="size-4" /> Back to Core Admin
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col h-screen relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#060d1f] to-[#060d1f]">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none"></div>
        
        <header className="sticky top-0 z-30 bg-[#060d1f]/80 backdrop-blur-xl border-b border-white/5 px-4 h-16 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden text-white/60 hover:text-white" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="size-5" />
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-2xl drop-shadow-md">{AGENTS[activeAgent].avatar}</span>
              <div className="flex flex-col justify-center">
                <h2 className="text-sm font-semibold text-white tracking-wide">{AGENTS[activeAgent].name}</h2>
                <p className="text-[11px] text-indigo-400/80 font-medium">{AGENTS[activeAgent].role}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative">
          <AgentChat agentId={activeAgent} key={activeAgent} />
        </main>
      </div>

      {/* Mobile Drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="bg-[#040a18] border-r border-white/5 w-[300px] p-0 flex flex-col">
          <SheetHeader className="p-6 border-b border-white/5 text-left bg-gradient-to-b from-indigo-500/5 to-transparent relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-4 right-4 text-white/40 hover:text-white" 
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="size-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400 border border-indigo-500/30">
                <Sparkles className="size-5" />
              </div>
              <div>
                <SheetTitle className="text-lg font-bold tracking-tight text-white m-0 p-0">Growth<span className="text-indigo-400">Team</span></SheetTitle>
                <SheetDescription className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5 m-0 p-0">Powered by AI</SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="flex-1 py-4 overflow-y-auto">
            {sidebarNav(() => setMobileMenuOpen(false))}
          </div>
          <div className="p-4 border-t border-white/5">
            <Link href="/admin" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors px-3 py-2.5 rounded-lg hover:bg-white/5 w-full">
              <ArrowLeft className="size-4" /> Back to Admin
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
