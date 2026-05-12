'use client'

import { useChat } from 'ai/react'
import { useRef, useEffect } from 'react'
import { AgentPersona, AGENTS } from '@/lib/ai/agents'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ReactMarkdown from 'react-markdown'

export function AgentChat({ agentId }: { agentId: AgentPersona }) {
  const agent = AGENTS[agentId]
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/ai/chat',
    body: { agentId },
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hi! I'm your **${agent.name}**. How can I help you grow Kitaab Kharido today?`
      }
    ]
  })

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="flex flex-col h-full relative z-10">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-40 custom-scrollbar scroll-smooth"
      >
        {messages.map(m => (
          <div key={m.id} className={`flex gap-4 max-w-4xl mx-auto ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-[#040a18] flex items-center justify-center text-lg md:text-xl flex-shrink-0 mt-1 shadow-sm border border-indigo-500/20">
                {agent.avatar}
              </div>
            )}
            <div className={`px-5 py-4 rounded-2xl max-w-[85%] sm:max-w-[80%] shadow-lg text-sm md:text-base ${
              m.role === 'user' 
                ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-tr-sm border border-indigo-400/30' 
                : 'bg-[#040a18]/80 backdrop-blur-sm border border-white/10 text-white/90 rounded-tl-sm prose prose-invert prose-p:leading-relaxed prose-headings:text-indigo-300 prose-a:text-indigo-400 prose-strong:text-white prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10'
            }`}>
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 max-w-4xl mx-auto justify-start animate-in fade-in">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-[#040a18] flex items-center justify-center text-lg md:text-xl flex-shrink-0 shadow-sm border border-indigo-500/20">
              {agent.avatar}
            </div>
            <div className="px-5 py-4 rounded-2xl bg-[#040a18]/80 backdrop-blur-sm border border-white/10 flex items-center gap-3">
              <Loader2 className="size-4 animate-spin text-indigo-400" />
              <span className="text-sm font-medium text-white/50 animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#060d1f] via-[#060d1f]/95 to-transparent pt-12 pb-6 px-4 md:px-8 pointer-events-none">
        <div className="max-w-4xl mx-auto relative pointer-events-auto">
          <form onSubmit={handleSubmit} className="relative flex items-center group">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder={`Ask the ${agent.name}...`}
              className="w-full bg-[#040a18]/90 backdrop-blur-md border-white/10 text-white placeholder:text-white/30 pl-6 pr-14 py-7 rounded-2xl shadow-2xl focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500/50 transition-all duration-300 group-hover:border-white/20 text-base"
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()} 
              size="icon"
              className="absolute right-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl h-11 w-11 disabled:opacity-50 transition-all shadow-md"
            >
              <Send className="size-4 ml-0.5" />
            </Button>
          </form>
          <div className="text-center mt-3">
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">AI agents can make mistakes. Verify important business decisions.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
