import React, { useState, useEffect, useRef } from 'react'
import { Bot, Sparkles, Send, Info, ChevronRight, MessageSquare, Lock, Camera, Mic, Paperclip, X, Trash2, StopCircle, RefreshCcw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { askGemini } from '../../lib/ai'
import { C, PLANS } from '../../constants'

export function AIView({ carList, historyList, userProfile, onUpdateAIUsage, onGoPlans }) {
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
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-gray-800 lg:rounded-t-[3rem] shadow-2xl shadow-indigo-500/10 border-x border-t border-gray-100 dark:border-gray-700">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#5C3EFE] flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white leading-none mb-1">AI Mechanic <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/40 text-indigo-500 px-2 py-0.5 rounded-full uppercase ml-2 tracking-widest border border-indigo-100 dark:border-indigo-800/50">Pro v2</span></h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Visual & Voice Active</p>
            </div>
          </div>
        </div>
        <button onClick={onGoPlans} className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-[#5C3EFE] transition-all">
          <RefreshCcw size={14}/> {usage} / {activePlan.aiLimit}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 no-scrollbar relative">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
             <div className={`flex flex-col gap-2 max-w-[85%] sm:max-w-[70%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                {m.media && (
                  <div className="relative group rounded-[2rem] overflow-hidden border-2 border-indigo-500/20 shadow-2xl">
                    {m.media.type === 'image' 
                      ? <img src={m.media.preview} className="max-w-full h-auto object-cover" />
                      : <div className="bg-indigo-600 p-6 flex items-center gap-4 text-white">
                          <Mic size={32} className="animate-pulse" />
                          <div className="flex flex-col"><span className="text-xs font-black uppercase tracking-widest">Voice Message</span><span className="text-[10px] opacity-70">Analyzed by AI</span></div>
                        </div>
                    }
                  </div>
                )}
                {m.role === 'bot' && (
                  <div className="bg-white dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/50 rounded-[2rem] rounded-tl-none px-6 py-5 text-sm text-gray-900 dark:text-gray-100 shadow-sm backdrop-blur-md shadow-indigo-500/5">
                    <ReactMarkdown className="markdown-content">{m.text}</ReactMarkdown>
                    {(m.text.toLowerCase().includes('запис') || m.text.toLowerCase().includes('сто')) && (
                       <button className="mt-4 flex items-center gap-2 px-6 py-3 bg-[#5C3EFE] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-indigo-500/30">
                         📅 Записатись на СТО
                       </button>
                    )}
                  </div>
                )}
                {m.role === 'user' && m.text && (
                  <div className="px-6 py-4 rounded-[2rem] rounded-tr-none text-sm text-white shadow-xl shadow-indigo-500/10" style={{ background: C }}>
                    {m.text}
                  </div>
                )}
             </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-none px-6 py-4 shadow-sm flex gap-1 items-center">
              {[0, 150, 300].map(d => <div key={d} className="w-2.5 h-2.5 rounded-full animate-bounce bg-indigo-400" style={{ animationDelay: `${d}ms` }} />)}
            </div>
          </div>
        )}
        <div ref={ref} />
      </div>

      {/* TOOLS BAR (ALWAYS VISIBLE) */}
      <div className="px-6 py-3 bg-gray-50/80 dark:bg-gray-950/40 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3 backdrop-blur-sm">
         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">Інструменти:</p>
         <label className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${media?.type === 'image' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-100 dark:border-gray-700 hover:border-indigo-300'}`}>
            <Camera size={16} /> <span>Фото</span>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
         </label>
         <button 
           onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}
           className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : media?.type === 'audio' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-100 dark:border-gray-700 hover:border-indigo-300'}`}
         >
            {isRecording ? <StopCircle size={16} /> : <Mic size={16} />} <span>{isRecording ? `Запис ${recordTime}с` : 'Голос'}</span>
         </button>
         {media && <button onClick={() => setMedia(null)} className="ml-auto text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16}/></button>}
      </div>

      {/* Input */}
      <div className="p-6 pt-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md shrink-0">
        <div className="relative flex items-center">
          <input 
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} 
            placeholder={media ? "Додайте коментар до файлу..." : "Опишіть проблему або запитайте..."} 
            className="w-full px-8 py-5 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-[2rem] text-sm focus:outline-none focus:ring-4 focus:ring-[#5C3EFE]/10 focus:border-[#5C3EFE] transition-all text-gray-900 dark:text-white placeholder-gray-400 pr-16" 
          />
          <button 
            onClick={send} disabled={(!input.trim() && !media) || typing}
            className="absolute right-2 w-12 h-12 rounded-2xl flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-30 shadow-xl shadow-indigo-500/20" style={{ background: C }}
          >
            <Send size={20} />
          </button>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Info size={12}/> AI може помилятися. Перевіряйте критичні несправності у СТО.</p>
           {isLimited && usage > 0 && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full">Ліміт плану вичерпано</p>}
        </div>
      </div>
    </div>
  )
}
