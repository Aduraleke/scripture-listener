/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Icon } from '@iconify/react'


declare global {
  interface Window {
    webkitSpeechRecognition:  SpeechRecognition
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    start: () => void
    stop: () => void
    onstart: (() => void) | null
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
    onend: (() => void) | null
  }

  interface SpeechRecognition extends Event {
    resultIndex: number
    results: SpeechRecognition
  }

  interface SpeechRecognition extends Event {
    error: 'no-speech' | 'audio-capture' | 'not-allowed' | string
  }
}

interface Reference {
  id: number
  reference: string
  book: string
  chapter: string
  verseStart: string
  verseEnd: string
  timestamp: string
}

interface BookAbbreviations {
  [key: string]: string
}

const ScriptureListener: React.FC = () => {
  const [isListening, setIsListening] = useState(false)
  const [, setTranscript] = useState('')
  const [references, setReferences] = useState<Reference[]>([])
  const [selectedReference, setSelectedReference] = useState<Reference | null>(null)
  const [verseText, setVerseText] = useState('')
  const [loading, setLoading] = useState(false)
  const [translation, setTranslation] = useState('KJV')
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')
  const [isSupported, setIsSupported] = useState(true)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const translations = [
    { value: 'KJV', label: 'King James Version' },
    { value: 'NIV', label: 'New International Version' },
    { value: 'NKJV', label: 'New King James Version' },
    { value: 'NLT', label: 'New Living Translation' },
    { value: 'AMP', label: 'Amplified Bible' },
    { value: 'AMPC', label: 'Amplified Bible, Classic' },
  ]

  const bibleBooks = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
    '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
    'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
    'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah',
    'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians',
    '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians',
    '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
    '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation',
  ]

  const bookAbbreviations: BookAbbreviations = {
    gen: 'Genesis', ex: 'Exodus', lev: 'Leviticus', num: 'Numbers', deut: 'Deuteronomy',
    josh: 'Joshua', judg: 'Judges', sam: 'Samuel', kin: 'Kings', chron: 'Chronicles',
    neh: 'Nehemiah', ps: 'Psalms', prov: 'Proverbs', eccl: 'Ecclesiastes', song: 'Song of Solomon',
    isa: 'Isaiah', jer: 'Jeremiah', lam: 'Lamentations', ezek: 'Ezekiel', dan: 'Daniel',
    hos: 'Hosea', obad: 'Obadiah', jon: 'Jonah', mic: 'Micah', nah: 'Nahum',
    hab: 'Habakkuk', zeph: 'Zephaniah', hag: 'Haggai', zech: 'Zechariah', mal: 'Malachi',
    matt: 'Matthew', mk: 'Mark', lk: 'Luke', jn: 'John', rom: 'Romans',
    cor: 'Corinthians', gal: 'Galatians', eph: 'Ephesians', phil: 'Philippians',
    col: 'Colossians', thess: 'Thessalonians', tim: 'Timothy', tit: 'Titus',
    philem: 'Philemon', heb: 'Hebrews', jas: 'James', pet: 'Peter', rev: 'Revelation',
  }

  const normalizeBookName = (name: string): string | null => {
    const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '')
    for (const [abbr, fullName] of Object.entries(bookAbbreviations)) {
      if (normalized.includes(abbr)) {
        if (name.match(/^(1|first|i)\s/i)) return '1 ' + fullName
        if (name.match(/^(2|second|ii)\s/i)) return '2 ' + fullName
        if (name.match(/^(3|third|iii)\s/i)) return '3 ' + fullName
        return fullName
      }
    }
    for (const book of bibleBooks) {
      const cleanBook = book.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (normalized.includes(cleanBook) || cleanBook.includes(normalized)) return book
    }
    return null
  }

  // ✅ Wrapped in useCallback to fix missing dependency warning
  const detectScriptureReferences = useCallback((text: string) => {
    const patterns = [
      /\b((?:1|2|3|First|Second|Third|I|II|III)?\s*[A-Za-z]+)\s+(\d+)(?::(\d+)(?:-(\d+))?)?\b/gi,
    ]
    patterns.forEach((pattern) => {
      let match: RegExpExecArray | null
      while ((match = pattern.exec(text)) !== null) {
        const bookName = normalizeBookName(match[1].trim())
        if (bookName) {
          const chapter = match[2]
          const verseStart = match[3] || '1'
          const verseEnd = match[4] || verseStart
          const refString = `${bookName} ${chapter}:${verseStart}${
            verseEnd !== verseStart ? '-' + verseEnd : ''
          }`

          setReferences((prev) => {
            if (!prev.some((r) => r.reference === refString)) {
              return [
                ...prev,
                {
                  id: Date.now() + Math.random(),
                  reference: refString,
                  book: bookName,
                  chapter,
                  verseStart,
                  verseEnd,
                  timestamp: new Date().toLocaleTimeString(),
                },
              ]
            }
            return prev
          })
        }
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognitionClass() as SpeechRecognition
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setError('')
        setIsListening(true)
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart + ' '
            detectScriptureReferences(transcriptPart)
          }
        }
        setTranscript((prev) => prev + finalTranscript)
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false)
        let message = ''
        switch (event.error) {
          case 'no-speech':
            message = 'No speech detected. Please try again.'
            break
          case 'audio-capture':
            message = 'Microphone not found.'
            break
          case 'not-allowed':
            message = 'Microphone access denied.'
            break
          default:
            message = `Error: ${event.error}`
        }
        setError(message)
      }

      recognition.onend = () => setIsListening(false)

      recognitionRef.current = recognition
    } else {
      setIsSupported(false)
      setError('Speech recognition not supported. Try Chrome or Edge.')
    }
  }, [detectScriptureReferences])

  const fetchVerse = async (ref: Reference) => {
    setLoading(true)
    setSelectedReference(ref)
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `Please provide the text of ${ref.reference} from the ${translation} translation. Return only the verse text.`,
            },
          ],
        }),
      })

      const data: { content?: { type: string; text?: string }[] } = await response.json()
      const text =
        data.content?.find((c) => c.type === 'text')?.text || 'Verse not available'
      setVerseText(text)
    } catch {
      setVerseText('Error loading verse.')
    } finally {
      setLoading(false)
    }
  }

  const toggleListening = () => {
    if (!isSupported) return setError('Speech recognition not supported.')
    if (isListening) {
      recognitionRef.current?.stop()
    } else {
      try {
        setError('')
        recognitionRef.current?.start()
      } catch {
        setError('Failed to start listening.')
      }
    }
  }

  const exportReferences = () => {
    const data = references.map((r) => `${r.reference} - ${r.timestamp}`).join('\n')
    const blob = new Blob(
      [
        `Scripture References\nTranslation: ${translation}\nExported: ${new Date().toLocaleString()}\n\n${data}`,
      ],
      { type: 'text/plain' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scripture-references-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearHistory = () => {
    if (confirm('Clear all references?')) {
      setReferences([])
      setTranscript('')
      setSelectedReference(null)
      setVerseText('')
    }
  }

  const filteredReferences = references.filter((r) =>
    r.reference.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Icon icon="mdi:book-open-variant" className="text-purple-400 w-10 h-10" />
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-pink-400">
              Scripture Listener
            </h1>
          </div>
          <p className="text-slate-300">Real-time scripture reference detection</p>
        </div>

        {/* Controls */}
        <div className="bg-slate-800/50 rounded-2xl p-6 mb-6 border border-slate-700/50">
          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300">
              ⚠️ {error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleListening}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50'
                    : 'bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-500/50'
                }`}
              >
                <Icon
                  icon={isListening ? 'mdi:microphone-off' : 'mdi:microphone'}
                  className="w-5 h-5"
                />
                {isListening ? 'Stop Listening' : 'Start Listening'}
              </button>

              <select
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                className="px-4 py-3 bg-slate-700 rounded-xl border border-slate-600 focus:border-purple-500 focus:outline-none"
              >
                {translations.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportReferences}
                disabled={references.length === 0}
                className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-50"
              >
                <Icon icon="mdi:download" className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={clearHistory}
                disabled={references.length === 0}
                className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50"
              >
                <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* References + Verse display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* References */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <div className="flex justify-between mb-4">
              <h2 className="text-2xl font-bold text-purple-400">Detected References</h2>
              <span className="px-3 py-1 bg-purple-500/20 rounded-full text-sm">
                {references.length} found
              </span>
            </div>

            <div className="relative mb-4">
              <Icon
                icon="mdi:magnify"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search references..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-700 rounded-xl border border-slate-600 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredReferences.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Icon icon="mdi:book-outline" className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No references detected yet</p>
                </div>
              ) : (
                filteredReferences.map((ref) => (
                  <div
                    key={ref.id}
                    onClick={() => fetchVerse(ref)}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      selectedReference?.id === ref.id
                        ? 'bg-purple-600/40 border-2 border-purple-500'
                        : 'bg-slate-700/50 border-2 border-transparent hover:border-slate-600'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="font-semibold text-lg">{ref.reference}</span>
                      <span className="text-xs text-slate-400">{ref.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Verse */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Verse Text</h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <Icon icon="mdi:loading" className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : selectedReference ? (
              <div>
                <h3 className="text-2xl font-bold text-purple-300 mb-2">
                  {selectedReference.reference}
                </h3>
                <p className="text-sm text-slate-400 mb-4">{translation}</p>
                <p className="text-lg leading-relaxed text-slate-200">{verseText}</p>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Icon icon="mdi:ear-hearing" className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Tap “Start Listening” and speak a verse reference</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScriptureListener
