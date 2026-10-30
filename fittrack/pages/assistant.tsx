import React, { useState, useRef, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useApp } from '@/context/AppContext'
import { getAssistantResponse } from '@/lib/assistantEngine'
import { generateId } from '@/lib/utils'
import { ChatMessage } from '@/lib/types'
import { Bot, User, Send, Trash2, Sparkles } from 'lucide-react'

const SUGGESTED = [
  'How many workouts did I complete this week?',
  'How many calories did I burn?',
  'What workouts did I do recently?',
  'How am I progressing toward my goals?',
  'What should I focus on today?',
  'Show me my fitness stats',
]

function formatContent(content: string) {
  // Render **bold** and \n as line breaks
  const parts = content.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        return part.split('\n').map((line, j) => (
          <React.Fragment key={`${i}-${j}`}>
            {j > 0 && <br />}
            {line}
          </React.Fragment>
        ))
      })}
    </>
  )
}

export default function AssistantPage() {
  const { workouts, goals, profile } = useApp()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: generateId(),
      role: 'assistant',
      content: `Hey ${profile.name.split(' ')[0] || 'there'}! 👋 I'm your FitTrack AI Assistant. Ask me anything about your workouts, goals, or progress — or pick a suggested question below.`,
      timestamp: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    }

    setMessages(m => [...m, userMsg])
    setInput('')
    setTyping(true)

    // Simulate a brief typing delay for realism
    setTimeout(() => {
      const response = getAssistantResponse(trimmed, {
        workouts,
        goals,
        profileName: profile.name,
      })
      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      }
      setMessages(m => [...m, assistantMsg])
      setTyping(false)
    }, 600 + Math.random() * 400)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function clearChat() {
    setMessages([{
      id: generateId(),
      role: 'assistant',
      content: `Chat cleared! I'm still here to help. Ask me anything about your fitness journey.`,
      timestamp: new Date().toISOString(),
    }])
  }

  return (
    <AppLayout title="AI Fitness Assistant">
      <div className="max-w-3xl mx-auto flex flex-col gap-4" style={{ height: 'calc(100vh - 180px)', minHeight: 500 }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-brand-600 shadow-sm">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Fitness Assistant</h2>
              <p className="text-xs text-emerald-500 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Online · powered by FitTrack AI</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={clearChat} title="Clear chat">
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        </div>

        {/* Chat window */}
        <Card padding="none" className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  msg.role === 'assistant'
                    ? 'bg-gradient-to-br from-violet-500 to-brand-600 text-white'
                    : 'bg-brand-600 text-white'
                }`}>
                  {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                {/* Bubble */}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-sm'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-tl-sm'
                }`}>
                  {formatContent(msg.content)}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-brand-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggested questions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-3 border-t border-slate-100 dark:border-slate-700 pt-3">
              <p className="text-xs text-slate-400 mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Suggested questions</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED.map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex gap-3 items-end">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your fitness data… (Enter to send)"
              className="flex-1 resize-none rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 max-h-32"
              style={{ minHeight: 40 }}
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || typing}
              size="md"
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
