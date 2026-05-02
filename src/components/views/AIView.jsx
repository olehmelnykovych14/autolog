import React, { useState, useEffect, useRef } from 'react'
import { Bot, Sparkles, Send, Info, ChevronRight, Lock, Camera, Mic, X, Trash2, StopCircle, RefreshCcw, Zap, Car, MessageCircle, ArrowLeft } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { askGemini } from '../../lib/ai'
import { C, PLANS } from '../../constants'

const QUICK_PROMPTS = [
  { icon: '🔧', text: 'Коли робити ТО?' },
  { icon: '⚠️', text: 'Діагностика помилки' },
  { icon: '💰', text: 'Скільки коштує ремонт?' },
  { icon: '📅', text: 'Записатись на СТО' },
]

export function AIView({ carList, historyList, userProfile, onUpdateAIUsage, onGoPlans, onGoBookings, onMenu, onBack }) {
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState([
    {
      role: 'bot',
      text: `Привіт! Я ваш **AutoLog AI Mechanic** 🤖\n\nАналізую телеметрію вашого авто в реальному часі. Можу допомогти з діагностикою, розрахунком вартості ремонту або записом на СТО.\n\nЧим можу допомогти?`,
    }
  ])
  const [typing, setTyping] = useState(false)
  const [media, setMedia] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordTime, setRecordTime] = useState(0)

  const ref = useRef(null)
  const mediaRecorder = useRef(null)
  const timerRef = useRef(null)
  const inputRef = useRef(null)

  // SUBSCRIPTION: limits disabled for free launch
  // const activePlan = PLANS.find(p => p.id === (userProfile?.plan || 'Free')) || PLANS[0]
  // const currentMonth = new Date().toISOString().substring(0, 7)
  // let usage = userProfile?.aiUsage || 0
  // if (userProfile?.lastAiResetMonth !== currentMonth) usage = 0
  // const isLimited = usage >= activePlan.aiLimit
  // const usagePercent = Math.min((usage / activePlan.aiLimit) * 100, 100)
  const isLimited = false

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, typing])

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setMedia({ data: reader.result.split(',')[1], mimeType: file.type, preview: reader.result, type: 'image' })
    reader.readAsDataURL(file)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorder.current = recorder
      const chunks = []
      recorder.ondataavailable = e => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/mp3' })
        const reader = new FileReader()
        reader.onload = () => setMedia({ data: reader.result.split(',')[1], mimeType: 'audio/mp3', preview: URL.createObjectURL(blob), type: 'audio' })
        reader.readAsDataURL(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      recorder.start()
      setIsRecording(true)
      setRecordTime(0)
      timerRef.current = setInterval(() => setRecordTime(p => p + 1), 1000)
    } catch (e) { alert("Не вдалося отримати доступ до мікрофона.") }
  }

  const stopRecording = () => {
    if (mediaRecorder.current) mediaRecorder.current.stop()
    setIsRecording(false)
    clearInterval(timerRef.current)
  }

  const send = async (textOverride) => {
    const txt = (textOverride || input).trim()
    if ((!txt && !media) || typing) return

    if (isLimited) {
      setMsgs(p => [...p, {
        role: 'bot',
        text: '⚠️ **Ліміт запитів вичерпано!**\n\nОновіть тариф щоб продовжити.'
      }])
      return
    }

    const currentMedia = media
    setInput('')
    setMedia(null)
    setMsgs(p => [...p, {
      role: 'user',
      text: txt || (currentMedia?.type === 'image' ? "📸 [Фото надіслано]" : "🎤 [Голосове повідомлення]"),
      media: currentMedia
    }])
    setTyping(true)

    try {
      const res = await askGemini(txt, carList, historyList, currentMedia ? { data: currentMedia.data, mimeType: currentMedia.mimeType } : null)
      setMsgs(p => [...p, { role: 'bot', text: res }])
      if (onUpdateAIUsage) await onUpdateAIUsage()
    } catch (e) {
      setMsgs(p => [...p, { role: 'bot', text: 'Вибачте, сталася помилка. Спробуйте ще раз.' }])
    } finally {
      setTyping(false)
    }
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-[#060613] rounded-none">

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800/80 flex items-center justify-between shrink-0 bg-white dark:bg-[#0A0F1E]/90 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onMenu} className="lg:hidden p-2 -ml-1 text-gray-400 hover:text-indigo-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-[#5C3EFE] flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-gray-900 dark:text-white leading-none">AI Mechanic</h2>
              <span className="text-[8px] bg-indigo-50 dark:bg-indigo-900/40 text-[#5C3EFE] px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800/50">v2.1</span>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Online · Visual Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* SUBSCRIPTION: usage counter hidden for free launch */}
          {/* <button
            onClick={onGoPlans}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isLimited ? 'border-red-500/40 bg-red-500/10 text-red-400' : 'border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-[#5C3EFE]/40'}`}
          >
            <Zap size={11} className={isLimited ? 'text-red-400' : 'text-[#5C3EFE]'} />
            {usage}/{activePlan.aiLimit}
          </button> */}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5 no-scrollbar bg-gray-50/50 dark:bg-[#07070f]">

        {/* Quick prompts — shown when only welcome message */}
        {msgs.length === 1 && (
          <div className="flex flex-wrap gap-2 justify-center pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {QUICK_PROMPTS.map((qp, i) => (
              <button
                key={i}
                onClick={() => { setInput(qp.text); inputRef.current?.focus(); }}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:border-[#5C3EFE] hover:text-[#5C3EFE] transition-all shadow-sm"
              >
                <span>{qp.icon}</span> {qp.text}
              </button>
            ))}
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`flex gap-3 max-w-[92%] sm:max-w-[78%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end`}>

              {/* Avatar */}
              {m.role === 'bot' && (
                <div className="w-8 h-8 rounded-xl bg-[#5C3EFE] flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20 mb-1">
                  <Bot size={16} className="text-white" />
                </div>
              )}

              <div className={`flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Media */}
                {m.media && (
                  <div className="rounded-2xl overflow-hidden border-2 border-indigo-500/20 shadow-xl max-w-[240px]">
                    {m.media.type === 'image'
                      ? <img src={m.media.preview} className="w-full h-auto block" alt="uploaded" />
                      : <div className="bg-[#5C3EFE] p-4 flex items-center gap-3 text-white">
                          <Mic size={22} className="animate-pulse" />
                          <span className="text-xs font-black uppercase tracking-widest">Voice Message</span>
                        </div>
                    }
                  </div>
                )}

                {/* Bot message */}
                {m.role === 'bot' && (
                  <div className="bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-gray-800/80 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm max-w-full">
                    <ReactMarkdown
                      className="markdown-content text-sm text-gray-800 dark:text-gray-200 leading-relaxed"
                      components={{
                        a: ({ node, ...props }) => {
                          const isMarket = props.href?.includes('exist.ua') || props.href?.includes('avto.pro')
                          if (isMarket) return (
                            <a {...props} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-2 mr-2 bg-indigo-50 dark:bg-indigo-900/30 text-[#5C3EFE] border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-[#5C3EFE] hover:text-white transition-colors text-xs font-bold no-underline">
                              {props.children}
                            </a>
                          )
                          return <a {...props} className="text-[#5C3EFE] underline hover:opacity-80" target="_blank" rel="noopener noreferrer" />
                        },
                        table: ({ node, ...props }) => (
                          <div className="mt-3 overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
                            <table {...props} className="w-full text-xs" />
                          </div>
                        ),
                        thead: ({ node, ...props }) => (
                          <thead {...props} className="bg-indigo-50 dark:bg-indigo-900/30 text-[#5C3EFE] text-[10px] uppercase tracking-widest font-black" />
                        ),
                        tr: ({ node, ...props }) => (
                          <tr {...props} className="border-b border-gray-50 dark:border-gray-800" />
                        ),
                        td: ({ node, ...props }) => (
                          <td {...props} className="px-3 py-2 text-gray-700 dark:text-gray-300" />
                        ),
                        th: ({ node, ...props }) => (
                          <th {...props} className="px-3 py-2 text-left" />
                        ),
                      }}
                    >
                      {m.text}
                    </ReactMarkdown>

                    {/* Booking CTA */}
                    {(m.text.toLowerCase().includes('запис') || m.text.toLowerCase().includes('сто') || m.text.toLowerCase().includes('book')) && (
                      <button
                        onClick={onGoBookings}
                        className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#5C3EFE] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-indigo-500/25"
                      >
                        📅 Записатись на СТО <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                )}

                {/* User message */}
                {m.role === 'user' && m.text && (
                  <div
                    className="px-5 py-3.5 rounded-2xl rounded-br-md text-sm text-white shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #5C3EFE 0%, #7C5EFF 100%)' }}
                  >
                    {m.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div className="flex items-end gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#5C3EFE] flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-gray-800 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm">
              <div className="flex items-center gap-1">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={ref} />
      </div>

      {/* Media preview */}
      {media && (
        <div className="px-4 sm:px-6 py-2 -mb-1 z-10 bg-white dark:bg-[#0A0F1E] border-t border-gray-100 dark:border-gray-800">
          <div className="inline-flex items-center gap-3 p-2 bg-indigo-50/80 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700/60 rounded-2xl">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-indigo-200 dark:border-indigo-700 relative">
              {media.type === 'image'
                ? <img src={media.preview} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full bg-[#5C3EFE] flex items-center justify-center"><Mic size={16} className="text-white" /></div>
              }
              <button onClick={() => setMedia(null)} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center shadow">
                <X size={9} />
              </button>
            </div>
            <div className="pr-2">
              <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase">{media.type === 'image' ? 'Фото обрано' : 'Запис готовий'}</p>
              <p className="text-[9px] font-bold text-[#5C3EFE] uppercase tracking-widest">Натисніть надіслати</p>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 sm:p-5 bg-white dark:bg-[#0A0F1E] border-t border-gray-100 dark:border-gray-800/80">

        {/* Tool buttons */}
        <div className="flex items-center gap-2 mb-3">
          <label className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer ${media?.type === 'image' ? 'bg-[#5C3EFE] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-[#5C3EFE]'}`}>
            <Camera size={14} /> Фото
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </label>
          <button
            onMouseDown={startRecording} onMouseUp={stopRecording}
            onTouchStart={startRecording} onTouchEnd={stopRecording}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all select-none ${isRecording ? 'bg-red-500 text-white animate-pulse' : media?.type === 'audio' ? 'bg-[#5C3EFE] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-[#5C3EFE]'}`}
          >
            {isRecording ? <StopCircle size={14} /> : <Mic size={14} />}
            {isRecording ? formatTime(recordTime) : 'Голос'}
          </button>
          {msgs.length > 1 && (
            <button
              onClick={() => setMsgs([msgs[0]])}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <Trash2 size={13} /> Очистити
            </button>
          )}
        </div>

        {/* Input */}
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={media ? 'Додати коментар...' : 'Опишіть проблему з автомобілем...'}
            className={`w-full pl-5 pr-14 py-4 rounded-2xl text-sm focus:outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 ${isLimited ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40' : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 focus:border-[#5C3EFE] focus:ring-4 focus:ring-[#5C3EFE]/10'}`}
            disabled={isLimited}
          />
          <button
            onClick={() => send()}
            disabled={(!input.trim() && !media) || typing || isLimited}
            className="absolute right-2 w-10 h-10 rounded-xl flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-30 shadow-lg"
            style={{ background: C }}
          >
            <Send size={17} />
          </button>
        </div>

        <p className="mt-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center flex items-center justify-center gap-1.5">
          <Info size={10} /> Критичні несправності перевіряйте у СТО
        </p>
      </div>
    </div>
  )
}
