import React, { useState, useEffect, useRef } from 'react'
import { Bot, Sparkles, Send, Info, ChevronRight, MessageSquare } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { askGemini } from '../../lib/ai'
import { C } from '../../constants'

export function AIView({ carList, historyList }) {
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState([
    { role: 'bot', text: 'Привіт! Я ваш **AutoLog AI Mechanic** 🤖. \n\nЯ можу допомогти проаналізувати стан вашого авто, дати пораду щодо ремонту або нагадати про ТО. Що вас цікавить?' }
  ])
  const [typing, setTyping] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, typing])

  const send = async () => {
    if (!input.trim() || typing) return
    const txt = input.trim()
    setInput('')
    setMsgs(p => [...p, { role: 'user', text: txt }])
    setTyping(true)

    try {
      const res = await askGemini(txt, carList, historyList)
      setMsgs(p => [...p, { role: 'bot', text: res }])
    } catch (e) {
      setMsgs(p => [...p, { role: 'bot', text: 'Вибачте, сталася помилка при з\'єднанні з AI. Перевірте з\'єднання.' }])
    } finally {
      setTyping(false)
    }
  }

  const samples = [
    "Коли мені наступного разу міняти масло?",
    "Чому може стукати щось підвісці?",
    "Як підготувати авто до літнього сезону?",
    "Скільки я витратив на ремонт цього року?"
  ]

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-gray-800 lg:rounded-t-[3rem] shadow-2xl shadow-indigo-500/10 border-x border-t border-gray-100 dark:border-gray-700">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-[#5C3EFE] shadow-inner">
            <Bot size={22} />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white leading-none mb-1">AI Механік</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Онлайн</p>
            </div>
          </div>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-[#5C3EFE] transition-all">
          <Sparkles size={14}/> Оновити до Pro
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 no-scrollbar">
        {msgs.length === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {samples.map(s => (
              <button key={s} onClick={() => setInput(s)} className="p-4 text-left bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all group">
                <div className="flex items-center gap-2 text-indigo-500 mb-1">
                  <MessageSquare size={14}/>
                  <span className="text-[10px] font-black uppercase tracking-widest">Спробуйте запитати</span>
                </div>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 leading-snug group-hover:text-gray-900 dark:group-hover:text-white">{s}</p>
              </button>
            ))}
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
            {m.role === 'bot' 
              ? <div className="flex items-start gap-3 max-w-[85%] sm:max-w-[75%]">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-[#5C3EFE] shrink-0 border border-indigo-100 dark:border-indigo-800/50">
                    <Bot size={16} />
                  </div>
                  <div className="bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-900 dark:text-gray-100 shadow-sm backdrop-blur-sm shadow-indigo-500/5">
                    <div className="markdown-content">
                      <ReactMarkdown>{m.text}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              : <div className="max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm text-white shadow-lg shadow-indigo-500/10" style={{ background: C }}>{m.text}</div>
            }
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
              {[0, 150, 300].map(d => <div key={d} className="w-2 h-2 rounded-full animate-bounce bg-gray-400" style={{ animationDelay: `${d}ms` }} />)}
            </div>
          </div>
        )}
        <div ref={ref} />
      </div>

      <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-700 flex gap-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md shrink-0">
        <div className="flex-1 relative flex items-center">
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && send()} 
            placeholder="Запитайте про ваше авто..." 
            className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#5C3EFE]/10 focus:border-[#5C3EFE] transition-all text-gray-900 dark:text-white placeholder-gray-400 pr-14" 
          />
          <button 
            onClick={send} 
            disabled={!input.trim() || typing}
            className="absolute right-2 w-11 h-11 rounded-xl flex items-center justify-center text-white hover:opacity-90 active:scale-90 transition-all shrink-0 disabled:opacity-30 shadow-lg shadow-indigo-500/10" 
            style={{ background: C }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
