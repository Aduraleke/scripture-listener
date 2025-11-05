'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'

/**
 * ScriptureListenerPro (TypeScript-ready)
 *
 * - Ensures speech recognition usage is typed and safe
 * - Adds types for references, notes, and state
 * - Provides safe stubs for omitted functions (replace with your original logic)
 */

/* --- Types --- */
type ReferenceItem = {
  id: string
  reference: string
  // other fields you might store (book, chapter, verseRange, rawText, etc.)
  book?: string
  chapter?: number
  verses?: string
}

// Define a safer type alias at the top
type SafeSpeechRecognitionEvent = {
  resultIndex: number
  results: SpeechRecognitionResultList
}


declare global {
  interface Window {
    webkitSpeechRecognition?: typeof SpeechRecognition
    SpeechRecognition?: typeof SpeechRecognition
  }
}

/* --- Component --- */
const ScriptureListenerPro: React.FC = () => {
  /* --- State --- */
  const [isListening, setIsListening] = useState<boolean>(false)
  const [transcript, setTranscript] = useState<string>('')
  const [references, setReferences] = useState<ReferenceItem[]>([])
  const [selectedReference, setSelectedReference] = useState<ReferenceItem | null>(null)
  const [verseText, setVerseText] = useState<string>('')
  const [, setLoading] = useState<boolean>(false)
  const [translation, setTranslation] = useState<string>('kjv')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isSupported, setIsSupported] = useState<boolean>(true)
  const [offlineMode, setOfflineMode] = useState<boolean>(false)
  const [fullscreen, setFullscreen] = useState<boolean>(false)
  const [showInsights, setShowInsights] = useState<boolean>(false)
  const [insights, setInsights] = useState<string>('')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [currentNote, setCurrentNote] = useState<string>('')
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false)
  const [sermonSummary, setSermonSummary] = useState<string>('')
  const [showSummary, setShowSummary] = useState<boolean>(false)
  const [highlightedTranscript, setHighlightedTranscript] = useState<string>('')

  /* --- Refs --- */
  const recognitionRef = useRef<SpeechRecognition | null>(null)


  /* --- Minimal data so the component compiles (replace with your full lists) --- */
  const translations = [
    { value: 'kjv', label: 'KJV' },
    { value: 'esv', label: 'ESV' },
  ]


  /* --- Speech recognition setup --- */


useEffect(() => {
  // ✅ Narrow the type of window to allow fallback but avoid `any`
  const SpeechRecognitionConstructor =
    window.SpeechRecognition || window.webkitSpeechRecognition

  if (SpeechRecognitionConstructor) {
    try {
      const recognition = new SpeechRecognitionConstructor()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setError('')
        setIsListening(true)
      }

      // ✅ Use proper event typing
      recognition.onresult = (event: SafeSpeechRecognitionEvent) => {
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart + ' '
            detectScriptureReferences(transcriptPart)
          }
        }

        if (finalTranscript) {
          setTranscript((prev) => {
            const newTranscript = prev + finalTranscript
            updateHighlightedTranscript(newTranscript)
            return newTranscript
          })
        }
      }

      recognition.onerror = (event: { error: string }) => {
        setIsListening(false)
        let errorMessage = ''
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try speaking again.'
            break
          case 'audio-capture':
            errorMessage =
              'No microphone found. Please check your microphone connection.'
            break
          case 'not-allowed':
            errorMessage =
              'Microphone permission denied. Please allow microphone access.'
            break
          case 'network':
            errorMessage =
              'Network error. Please check your internet connection or switch to offline mode.'
            break
          default:
            errorMessage = `Error: ${event.error}. Please try again.`
        }
        setError(errorMessage)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
      setIsSupported(true)
    } catch {
      setIsSupported(false)
      setError('Speech recognition initialization failed.')
    }
  } else {
    setIsSupported(false)
    setError(
      'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.'
    )
  }

  // cleanup on unmount
  return () => {
    try {
      recognitionRef.current?.stop?.()
    } catch {
      // ignore
    }
    recognitionRef.current = null
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])


  /* --- Helper functions (typed) --- */

  const updateHighlightedTranscript = (text: string) => {
    // Build a simple highlighted HTML string where references in `references` are marked
    let highlighted = text
    try {
      references.forEach((ref) => {
        // escape special chars
        const escaped = ref.reference.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi')
        highlighted = highlighted.replace(
          regex,
          `<mark class="bg-purple-500/30 px-1 rounded">$&</mark>`
        )
      })
    } catch {
      // fallback: raw text
      highlighted = text
    }
    setHighlightedTranscript(highlighted)
  }

  const detectScriptureReferences = (text: string) => {
    // TODO: replace this minimal stub with your original reference-detection logic
    // Minimal example: find simple patterns like "John 3:16" (very naive)
    const simpleRegex = /([A-Za-z]+)\s+(\d{1,3}):(\d{1,3})/g
    const matches = Array.from(text.matchAll(simpleRegex))
    if (matches.length > 0) {
      const newRefs: ReferenceItem[] = matches.map((m, idx) => {
        const refStr = `${m[1]} ${m[2]}:${m[3]}`
        return {
          id: `${Date.now()}-${idx}`,
          reference: refStr,
          book: m[1],
          chapter: Number(m[2]),
          verses: m[3],
        }
      })
      setReferences((prev) => {
        // avoid duplicates by reference string
        const merged = [...prev]
        newRefs.forEach((r) => {
          if (!merged.find((x) => x.reference.toLowerCase() === r.reference.toLowerCase())) {
            merged.push(r)
          }
        })
        updateHighlightedTranscript(transcript + ' ') // update highlight after adding refs
        return merged
      })
    }
  }


  const fetchVerse = async (ref: ReferenceItem) => {
    // TODO: fetch verse text from your API or Bible provider
    setLoading(true)
    try {
      // placeholder: set verseText to a fake string
      setVerseText(`${ref.reference} — (verse text would be loaded here for ${translation})`)
    } catch  {
      setError('Failed to fetch verse.')
    } finally {
      setLoading(false)
    }
  }

  const generateInsights = async (ref: ReferenceItem | null) => {
    // TODO: call your AI/service to generate insights
    if (!ref) return
    setLoading(true)
    try {
      setInsights(`Insights for ${ref.reference} (placeholder).`)
      setShowInsights(true)
    } finally {
      setLoading(false)
    }
  }

  const generateSermonSummary = async () => {
    // TODO: summarize current transcript or references using your AI
    if (references.length === 0) return
    setLoading(true)
    try {
      setSermonSummary(`Summary for ${references.map((r) => r.reference).join(', ')} (placeholder).`)
      setShowSummary(true)
    } finally {
      setLoading(false)
    }
  }

  const playVerseAudio = async () => {
    // Simple text-to-speech via SpeechSynthesis (browser)
    try {
      const text = verseText || selectedReference?.reference || 'No verse selected.'
      if (!text) return
      stopAudio()
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = 'en-US'
      utter.onstart = () => setAudioPlaying(true)
      utter.onend = () => setAudioPlaying(false)
      window.speechSynthesis.speak(utter)
    } catch {
      setError('Audio failed to play.')
    }
  }

  const stopAudio = () => {
    window.speechSynthesis.cancel()
    setAudioPlaying(false)
  }

  const toggleListening = () => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser.')
      return
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop()
      } catch {
        // ignore
      }
      setIsListening(false)
    } else {
      try {
        setError('')
        recognitionRef.current?.start()
        setIsListening(true)
      } catch  {
        setError('Failed to start listening. Please refresh and try again.')
        setIsListening(false)
      }
    }
  }

  const toggleFullscreen = async () => {
    if (!fullscreen) {
      try {
        await document.documentElement.requestFullscreen?.()
      } catch {
        // ignore
      }
    } else {
      try {
        await document.exitFullscreen?.()
      } catch {
        // ignore
      }
    }
    setFullscreen(!fullscreen)
  }

  const exportReferences = () => {
    // TODO: format references and trigger download
    if (references.length === 0) return
    const content = references.map((r) => `${r.reference}`).join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'references.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const shareReference = (ref: ReferenceItem) => {
    // TODO: share via navigator.share or copy link
    const text = `Check this scripture: ${ref.reference}`
    if (navigator.share) {
      navigator.share({ text }).catch(() => {
        // share failed or dismissed
      })
    } else {
      navigator.clipboard?.writeText(text)
    }
  }

  const saveNote = (refId: string) => {
    if (currentNote.trim()) {
      setNotes((prev) => ({
        ...prev,
        [refId]: currentNote.trim(),
      }))
      setCurrentNote('')
    }
  }

  const clearHistory = () => {
    if (window.confirm('Clear all data? This cannot be undone.')) {
      setReferences([])
      setTranscript('')
      setSelectedReference(null)
      setVerseText('')
      setNotes({})
      setSermonSummary('')
      setHighlightedTranscript('')
    }
  }

  const filteredReferences = references.filter((ref) =>
    ref.reference.toLowerCase().includes(searchTerm.toLowerCase())
  )

  /* --- Render --- */
  return (
    <div
      className={`min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 text-white ${
        fullscreen ? 'p-2' : 'p-4'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {!fullscreen && (
          <div className="text-center mb-6 pt-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Icon icon="mdi:book-open-page-variant" className="w-10 h-10 text-purple-400" />
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-pink-400">
                Scripture Listener Pro
              </h1>
            </div>
            <p className="text-slate-300">AI-Powered Sermon Companion</p>
          </div>
        )}

        {/* Controls */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-4 mb-4 border border-slate-700/50">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm">
              ⚠️ {error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={toggleListening}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all text-sm ${
                  isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-500 hover:bg-purple-600'
                }`}
              >
                <Icon icon={isListening ? 'mdi:microphone-off' : 'mdi:microphone'} className="w-4 h-4" />
                {isListening ? 'Stop' : 'Listen'}
              </button>

              <select
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                className="px-3 py-2 bg-slate-700 rounded-xl border border-slate-600 text-sm focus:border-purple-500 focus:outline-none max-w-xs"
              >
                {translations.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setOfflineMode(!offlineMode)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                  offlineMode ? 'bg-orange-600' : 'bg-slate-700'
                }`}
                title={offlineMode ? 'Offline Mode' : 'Online Mode'}
              >
                <Icon icon={offlineMode ? 'mdi:wifi-off' : 'mdi:wifi'} className="w-4 h-4" />
              </button>

              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm"
              >
                <Icon icon={fullscreen ? 'mdi:window-minimize' : 'mdi:window-maximize'} className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={generateSermonSummary}
                disabled={references.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50 text-sm"
                title="Generate Summary"
              >
                <Icon icon="mdi:zap" className="w-4 h-4" />
              </button>
              <button
                onClick={exportReferences}
                disabled={references.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-50 text-sm"
              >
                <Icon icon="mdi:download" className="w-4 h-4" />
              </button>
              <button
                onClick={clearHistory}
                disabled={references.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50 text-sm"
              >
                <Icon icon="mdi:trash-can" className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Transcript and references area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/40">
            <h2 className="text-xl font-semibold mb-2">Transcript</h2>
            <div
              className="prose prose-invert max-h-64 overflow-auto p-3 bg-slate-900/30 rounded"
              // render highlightedTranscript HTML (safe because we control the markup) - ensure you sanitize if content is untrusted
              dangerouslySetInnerHTML={{ __html: highlightedTranscript || transcript || '<i>No transcript yet</i>' }}
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  setTranscript('')
                  setHighlightedTranscript('')
                }}
                className="px-3 py-2 bg-slate-700 rounded"
              >
                Clear Transcript
              </button>
              <button
                onClick={() => {
                  // copy transcript
                  navigator.clipboard?.writeText(transcript)
                }}
                className="px-3 py-2 bg-slate-700 rounded"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/40">
            <h2 className="text-xl font-semibold mb-2">References</h2>

            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search references..."
              className="w-full mb-3 px-3 py-2 bg-slate-900/30 rounded border border-slate-700/50"
            />

            <div className="space-y-2 max-h-64 overflow-auto">
              {filteredReferences.length === 0 ? (
                <div className="text-slate-400 text-sm">No references detected yet.</div>
              ) : (
                filteredReferences.map((ref) => (
                  <div key={ref.id} className="flex items-start gap-2 p-2 bg-slate-900/20 rounded">
                    <div className="flex-1">
                      <div className="font-medium">{ref.reference}</div>
                      <div className="text-sm text-slate-400">{ref.book || ''}</div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setSelectedReference(ref)
                          fetchVerse(ref)
                        }}
                        className="px-2 py-1 bg-slate-700 rounded text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => shareReference(ref)}
                        title="Share"
                        className="px-2 py-1 bg-slate-700 rounded text-sm"
                      >
                        Share
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* notes area */}
            {selectedReference && (
              <div className="mt-4">
                <h3 className="font-semibold">Selected: {selectedReference.reference}</h3>
                <div className="text-sm text-slate-300 my-2">{verseText}</div>
                <div className="flex gap-2">
                  <button onClick={() => playVerseAudio()} className="px-3 py-2 bg-blue-600 rounded">
                    {audioPlaying ? 'Stop Audio' : 'Play Audio'}
                  </button>
                  <button onClick={() => generateInsights(selectedReference)} className="px-3 py-2 bg-purple-600 rounded">
                    Insights
                  </button>
                </div>

                <div className="mt-3">
                  <textarea
                    value={currentNote}
                    onChange={(e) => setCurrentNote(e.target.value)}
                    className="w-full p-2 bg-slate-900/20 rounded text-sm"
                    placeholder="Add a note..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => saveNote(selectedReference.id)} className="px-3 py-2 bg-green-600 rounded">
                      Save Note
                    </button>
                    <button
                      onClick={() => {
                        setCurrentNote('')
                      }}
                      className="px-3 py-2 bg-slate-700 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                  {notes[selectedReference.id] && (
                    <div className="mt-2 text-slate-300">
                      <strong>Saved note:</strong> {notes[selectedReference.id]}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sermon summary / insights display */}
        {showSummary && (
          <div className="mt-6 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/40">
            <h2 className="text-lg font-semibold">Sermon Summary</h2>
            <div className="mt-2 text-slate-300">{sermonSummary}</div>
          </div>
        )}

        {showInsights && (
          <div className="mt-4 bg-slate-800/30 p-3 rounded">
            <h3 className="font-semibold">Insights</h3>
            <div className="text-slate-200 mt-2">{insights}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ScriptureListenerPro
