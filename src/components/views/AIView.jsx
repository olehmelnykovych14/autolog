import React, { useState, useEffect, useRef } from 'react'
import { Bot, Sparkles, Send, Info, ChevronRight, MessageSquare, Lock, Camera, Mic, Paperclip, X, Trash2, StopCircle, RefreshCcw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { askGemini } from '../../lib/ai'
import { C, PLANS } from '../../constants'

export function AIView({ carList, historyList, userProfile, onUpdateAIUsage, onGoPlans, onGoBookings, onMenu, onBack }) {
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState([
    { role: 'bot', text: 'Привіт! Я ваш **AutoLog AI Mechanic** 🤖. \n\nЯ можу допомогти проаналізувати стан вашого авто через фото, голос або текст. Щоб я почав, виберіть інструмент нижче.' }
  ])
  const [typing, setTyping] = useState(false)
  const [media, setMedia] = useState(null) // { data: base64, type: 'image' | 'audio', preview: url }
  const [isRecording, setIsRecording] = useState(false)
  const [recordTime, setRecordTime] = useState(0)
  
  const ref = useRef(null)
  const mediaRecorder = useRef(null)
  const timerRef = useRef(null)

  const activePlan = PLANS.find(p => p.id === (userProfile?.plan || 'Free')) || PLANS[0]
  const usage = userProfile?.aiUsage || 0
  const isLimited = usage >= activePlan.aiLimit

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, typing])

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setMedia({
        data: reader.result.split(',')[1],
        mimeType: file.type,
        preview: reader.result,
        type: 'image'
      })
    }
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
        reader.onload = () => {
          setMedia({
            data: reader.result.split(',')[1],
            mimeType: 'audio/mp3',
            preview: URL.createObjectURL(blob),
            type: 'audio'
          })
        }
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

  const send = async () => {
    if ((!input.trim() && !media) || typing) return
    const txt = input.trim()
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
      setMsgs(p => [...p, { role: 'bot', text: 'Вибачте, сталася помилка при з\'єднанні з AI. Перевірте ліміти або ключ.' }])
    } finally { setTyping(false) }
  }

  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2, '0')}`

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-gray-800 shadow-2xl shadow-indigo-500/10">
      {/* Dynamic Header (Topbar Replacement) */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onMenu} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-indigo-500 transition-colors">
            <X size={20} className="rotate-45" /> {/* Simple Menu Toggle Icon */}
          </button>
          <div className="hidden sm:flex w-10 h-10 rounded-xl bg-[#5C3EFE] items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Bot size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-gray-900 dark:text-white leading-none">AI Mechanic</h2>
              <span className="text-[8px] bg-indigo-50 dark:bg-indigo-900/40 text-indigo-500 px-1.5 py-0.5 rounded-full uppercase tracking-widest border border-indigo-100 dark:border-indigo-800/50">v2.1</span>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1"></span> Visual Active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={onGoPlans} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl text-[9px] font-bold text-gray-500 uppercase tracking-widest hover:text-[#5C3EFE] transition-all">
             <RefreshCcw size={12}/> {usage} / {activePlan.aiLimit}
           </button>
           <button onClick={onBack} className="p-2 text-gray-400 hover:text-indigo-500 transition-colors">
             <Info size={18} />
           </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 no-scrollbar relative">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
             <div className={`flex flex-col gap-2 max-w-[90%] sm:max-w-[70%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                {m.media && (
                  <div className="relative group rounded-[1.5rem] overflow-hidden border-2 border-indigo-500/20 shadow-xl max-w-[280px]">
                    {m.media.type === 'image' 
                      ? <img src={m.media.preview} className="w-full h-auto block" />
                      : <div className="bg-indigo-600 p-4 flex items-center gap-3 text-white">
                          <Mic size={24} className="animate-pulse" />
                          <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest">Voice</span></div>
                        </div>
                    }
                  </div>
                )}
                {m.role === 'bot' && (
                  <div className="bg-white dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700/50 rounded-[1.5rem] rounded-tl-none px-5 py-4 text-sm text-gray-900 dark:text-gray-100 shadow-sm backdrop-blur-md">
                    <ReactMarkdown className="markdown-content">{m.text}</ReactMarkdown>
                    {(m.text.toLowerCase().includes('запис') || m.text.toLowerCase().includes('сто')) && (
                       <button 
                         onClick={onGoBookings}
                         className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-[#5C3EFE] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-indigo-500/30"
                       >
                         📅 Записатись на СТО
                       </button>
                    )}
                  </div>
                )}
                {m.role === 'user' && m.text && (
                  <div className="px-5 py-3 rounded-[1.5rem] rounded-tr-none text-sm text-white shadow-lg" style={{ background: C }}>
                    {m.text}
                  </div>
                )}
             </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-700 rounded-xl rounded-tl-none px-4 py-3 shadow-sm flex gap-1 items-center">
              {[0, 150, 300].map(d => <div key={d} className="w-2 h-2 rounded-full animate-bounce bg-indigo-400" style={{ animationDelay: `${d}ms` }} />)}
            </div>
          </div>
        )}
        <div ref={ref} />
      </div>

      {/* Media Preview Bubble (FIX FOR "NOT SHOWING AS UPLOADED") */}
      {media && (
        <div className="px-6 py-2 -mb-2 z-10 animate-in slide-in-from-bottom-4 duration-300">
           <div className="inline-flex items-center gap-3 p-2 bg-indigo-50/90 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl shadow-xl backdrop-blur-md">
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-indigo-200 dark:border-indigo-700 relative">
                 {media.type === 'image' 
                   ? <img src={media.preview} className="w-full h-full object-cover" />
                   : <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white"><Mic size={18}/></div>
                 }
                 <button onClick={() => setMedia(null)} className="absolute top-0 right-0 p-0.5 bg-red-500 text-white rounded-bl-lg shadow-lg">
                    <X size={10} />
                 </button>
              </div>
              <div className="pr-4">
                 <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tight">{media.type === 'image' ? 'Файл обрано' : 'Запис готовий'}</p>
                 <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest">Натисніть надіслати</p>
              </div>
           </div>
        </div>
      )}

      {/* Tools & Input */}
      <div className="p-4 sm:p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-t border-gray-100 dark:border-gray-700">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
             <label className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${media?.type === 'image' ? 'bg-indigo-600 text-white' : 'bg-gray-50 dark:bg-gray-900 text-gray-500 border border-gray-100 dark:border-gray-700 hover:border-indigo-200'}`}>
                <Camera size={14} /> <span>Фото</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
             </label>
             <button 
               onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}
               className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : media?.type === 'audio' ? 'bg-indigo-600 text-white' : 'bg-gray-50 dark:bg-gray-900 text-gray-500 border border-gray-100 dark:border-gray-700 hover:border-indigo-200'}`}
             >
                {isRecording ? <StopCircle size={14} /> : <Mic size={14} />} <span>{isRecording ? recordTime + 'c' : 'Голос'}</span>
             </button>
          </div>

          <div className="relative flex items-center">
            <input 
              value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} 
              placeholder={media ? "Коментар..." : "Напишіть нам..."} 
              className="w-full px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#5C3EFE]/10 focus:border-[#5C3EFE] transition-all text-gray-900 dark:text-white placeholder-gray-400 pr-14" 
            />
            <button 
              onClick={send} disabled={(!input.trim() && !media) || typing}
              className="absolute right-2 w-10 h-10 rounded-xl flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-30 shadow-lg" style={{ background: C }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
        <p className="mt-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center flex items-center justify-center gap-1.5"><Info size={10}/> Перевіряйте критичні несправності у СТО.</p>
      </div>
    </div>
  )
}
