/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Mic,
  MicOff,
  Book,
  Download,
  Search,
  Trash2,
  RefreshCw,
  Lightbulb,
  Volume2,
  Maximize,
  Minimize,
  Wifi,
  WifiOff,
  Share2,
  MessageSquare,
  Bookmark,
  Map,
  FileText,
  Zap,
} from "lucide-react";

const ScriptureListenerPro = () => {
  // Define a typed shape for scripture references so TypeScript can infer array item types
  type Reference = {
    id: number;
    reference: string;
    book: string;
    chapter: string;
    verseStart: string;
    verseEnd: string;
    timestamp: string;
  };
  interface VerseResponse {
    text?: string;
    verses?: { text: string }[];
  }

  interface Translation {
    value: string;
    label: string;
    apiSupported: boolean;
  }

  interface AnthropicContent {
    type: string;
    text?: string;
  }

  interface AnthropicResponse {
    content: AnthropicContent[];
    text?: string;
  }

  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [references, setReferences] = useState<Reference[]>([]);
  const [selectedReference, setSelectedReference] = useState<Reference | null>(
    null
  );
  const [verseText, setVerseText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [translation, setTranslation] = useState<string>("kjv");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [showInsights, setShowInsights] = useState<boolean>(false);
  const [insights, setInsights] = useState<string>("");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [currentNote, setCurrentNote] = useState<string>("");
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);
  const [sermonSummary, setSermonSummary] = useState<string>("");
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [highlightedTranscript, setHighlightedTranscript] =
    useState<string>("");
  const [projectionMode, setProjectionMode] = useState(false);

  // Handle ESC key to exit projection mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && projectionMode) {
        setProjectionMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [projectionMode]);

  // Reset projection mode when changing references
  useEffect(() => {
    if (!selectedReference) {
      setProjectionMode(false);
    }
  }, [selectedReference]);

  const recognitionRef = useRef<SpeechRecognition | null>(null); // Initialize recognitionRef
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const translations = useMemo(
    () => [
      { value: "kjv", label: "KJV - King James Version", apiSupported: true },
      {
        value: "nkjv",
        label: "NKJV - New King James Version",
        apiSupported: false,
      },
      {
        value: "niv",
        label: "NIV - New International Version",
        apiSupported: false,
      },
      {
        value: "nlt",
        label: "NLT - New Living Translation",
        apiSupported: false,
      },
      { value: "amp", label: "AMP - Amplified Bible", apiSupported: false },
      {
        value: "ampc",
        label: "AMPC - Amplified Bible Classic",
        apiSupported: false,
      },
      {
        value: "cev",
        label: "CEV - Contemporary English Version",
        apiSupported: false,
      },
      { value: "msg", label: "MSG - The Message", apiSupported: false },
      { value: "web", label: "WEB - World English Bible", apiSupported: true },
      {
        value: "clementine",
        label: "Clementine Latin Vulgate",
        apiSupported: true,
      },
      {
        value: "almeida",
        label: "João Ferreira de Almeida",
        apiSupported: true,
      },
      {
        value: "rccv",
        label: "Romanian Corrected Cornilescu",
        apiSupported: true,
      },
    ],
    []
  );

  const bibleBooks: Record<string, string> = useMemo<Record<string, string>>(
    () => ({
      genesis: "Genesis",
      gen: "Genesis",
      exodus: "Exodus",
      ex: "Exodus",
      exo: "Exodus",
      leviticus: "Leviticus",
      lev: "Leviticus",
      numbers: "Numbers",
      num: "Numbers",
      deuteronomy: "Deuteronomy",
      deut: "Deuteronomy",
      deu: "Deuteronomy",
      joshua: "Joshua",
      josh: "Joshua",
      jos: "Joshua",
      judges: "Judges",
      judg: "Judges",
      jdg: "Judges",
      ruth: "Ruth",
      "1 samuel": "1 Samuel",
      "first samuel": "1 Samuel",
      "1samuel": "1 Samuel",
      "1sam": "1 Samuel",
      "2 samuel": "2 Samuel",
      "second samuel": "2 Samuel",
      "2samuel": "2 Samuel",
      "2sam": "2 Samuel",
      "1 kings": "1 Kings",
      "first kings": "1 Kings",
      "1kings": "1 Kings",
      "1ki": "1 Kings",
      "2 kings": "2 Kings",
      "second kings": "2 Kings",
      "2kings": "2 Kings",
      "2ki": "2 Kings",
      "1 chronicles": "1 Chronicles",
      "1chr": "1 Chronicles",
      "1ch": "1 Chronicles",
      "2 chronicles": "2 Chronicles",
      "2chr": "2 Chronicles",
      "2ch": "2 Chronicles",
      ezra: "Ezra",
      ezr: "Ezra",
      nehemiah: "Nehemiah",
      neh: "Nehemiah",
      esther: "Esther",
      est: "Esther",
      job: "Job",
      psalms: "Psalms",
      psalm: "Psalms",
      ps: "Psalms",
      psa: "Psalms",
      proverbs: "Proverbs",
      prov: "Proverbs",
      pro: "Proverbs",
      ecclesiastes: "Ecclesiastes",
      eccl: "Ecclesiastes",
      ecc: "Ecclesiastes",
      "song of solomon": "Song of Solomon",
      song: "Song of Solomon",
      sos: "Song of Solomon",
      isaiah: "Isaiah",
      isa: "Isaiah",
      jeremiah: "Jeremiah",
      jer: "Jeremiah",
      lamentations: "Lamentations",
      lam: "Lamentations",
      ezekiel: "Ezekiel",
      ezek: "Ezekiel",
      eze: "Ezekiel",
      daniel: "Daniel",
      dan: "Daniel",
      hosea: "Hosea",
      hos: "Hosea",
      joel: "Joel",
      joe: "Joel",
      amos: "Amos",
      amo: "Amos",
      obadiah: "Obadiah",
      obad: "Obadiah",
      oba: "Obadiah",
      jonah: "Jonah",
      jon: "Jonah",
      micah: "Micah",
      mic: "Micah",
      nahum: "Nahum",
      nah: "Nahum",
      habakkuk: "Habakkuk",
      hab: "Habakkuk",
      zephaniah: "Zephaniah",
      zeph: "Zephaniah",
      zep: "Zephaniah",
      haggai: "Haggai",
      hag: "Haggai",
      zechariah: "Zechariah",
      zech: "Zechariah",
      zec: "Zechariah",
      malachi: "Malachi",
      mal: "Malachi",
      matthew: "Matthew",
      matt: "Matthew",
      mat: "Matthew",
      mt: "Matthew",
      mark: "Mark",
      mar: "Mark",
      mk: "Mark",
      luke: "Luke",
      luk: "Luke",
      lk: "Luke",
      john: "John",
      joh: "John",
      jn: "John",
      acts: "Acts",
      act: "Acts",
      romans: "Romans",
      rom: "Romans",
      "1 corinthians": "1 Corinthians",
      "first corinthians": "1 Corinthians",
      "1cor": "1 Corinthians",
      "2 corinthians": "2 Corinthians",
      "second corinthians": "2 Corinthians",
      "2cor": "2 Corinthians",
      galatians: "Galatians",
      gal: "Galatians",
      ephesians: "Ephesians",
      eph: "Ephesians",
      philippians: "Philippians",
      phil: "Philippians",
      php: "Philippians",
      colossians: "Colossians",
      col: "Colossians",
      "1 thessalonians": "1 Thessalonians",
      "1thess": "1 Thessalonians",
      "1th": "1 Thessalonians",
      "2 thessalonians": "2 Thessalonians",
      "2thess": "2 Thessalonians",
      "2th": "2 Thessalonians",
      "1 timothy": "1 Timothy",
      "1tim": "1 Timothy",
      "1ti": "1 Timothy",
      "2 timothy": "2 Timothy",
      "2tim": "2 Timothy",
      "2ti": "2 Timothy",
      titus: "Titus",
      tit: "Titus",
      philemon: "Philemon",
      philem: "Philemon",
      phm: "Philemon",
      hebrews: "Hebrews",
      heb: "Hebrews",
      james: "James",
      jas: "James",
      "1 peter": "1 Peter",
      "first peter": "1 Peter",
      "1pet": "1 Peter",
      "1pe": "1 Peter",
      "2 peter": "2 Peter",
      "second peter": "2 Peter",
      "2pet": "2 Peter",
      "2pe": "2 Peter",
      "1 john": "1 John",
      "first john": "1 John",
      "1joh": "1 John",
      "1jn": "1 John",
      "2 john": "2 John",
      "second john": "2 John",
      "2joh": "2 John",
      "2jn": "2 John",
      "3 john": "3 John",
      "third john": "3 John",
      "3joh": "3 John",
      "3jn": "3 John",
      jude: "Jude",
      jud: "Jude",
      revelation: "Revelation",
      rev: "Revelation",
    }),
    []
  );

  // Remove the duplicate declaration of detectScriptureReferences
  // (This block is removed because detectScriptureReferences is defined below with correct usage)

  const updateHighlightedTranscript = useCallback(
    (text: string) => {
      let highlighted = text;
      references.forEach((ref) => {
        const regex = new RegExp(
          `\\b${ref.reference.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
          "gi"
        );
        highlighted = highlighted.replace(
          regex,
          `<mark class="bg-purple-500/30 px-1 rounded">$&</mark>`
        );
      });
      setHighlightedTranscript(highlighted);
    },
    [references]
  );

  const normalizeBookName = useCallback(
    (name: string): string | null => {
      const normalized: string = name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .trim();
      return bibleBooks[normalized] ?? null;
    },
    [bibleBooks]
  );

  const detectScriptureReferences = useCallback(
    (text: string) => {
      const patterns = [
        /\b((?:1|2|3|First|Second|Third|I|II|III)?\s*[A-Za-z]+)\s+(\d+)(?::(\d+)(?:-(\d+))?)?\b/gi,
        /\b((?:1|2|3|First|Second|Third|I|II|III)?\s*[A-Za-z]+)\s+chapter\s+(\d+)(?:\s+verse(?:s)?\s+(\d+)(?:\s*-\s*(\d+))?)?\b/gi,
      ];

      patterns.forEach((pattern) => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const bookName = normalizeBookName(match[1].trim());
          if (bookName) {
            const chapter = match[2];
            const verseStart = match[3] || "1";
            const verseEnd = match[4] || verseStart;

            const refString = `${bookName} ${chapter}:${verseStart}${
              verseEnd !== verseStart ? "-" + verseEnd : ""
            }`;

            setReferences((prev) => {
              const exists = prev.some((ref) => ref.reference === refString);
              if (!exists) {
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
                ];
              }
              return prev;
            });
          }
        }
      });
    },
    [normalizeBookName]
  );

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      const rec = recognitionRef.current;
      if (rec) {
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        rec.onstart = () => {
          setError("");
          setIsListening(true);
        };

        rec.onresult = (event) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPart = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcriptPart + " ";
              detectScriptureReferences(finalTranscript);
            } else {
              interimTranscript += transcriptPart;
            }
          }

          if (finalTranscript) {
            setTranscript((prev) => {
              const newTranscript = prev + finalTranscript;
              updateHighlightedTranscript(newTranscript);
              return newTranscript;
            });
          }
        };

        rec.onerror = (event) => {
          setIsListening(false);
          let errorMessage = "";
          switch (event.error) {
            case "no-speech":
              errorMessage = "No speech detected. Please try speaking again.";
              break;
            case "audio-capture":
              errorMessage =
                "No microphone found. Please check your microphone connection.";
              break;
            case "not-allowed":
              errorMessage =
                "Microphone permission denied. Please allow microphone access.";
              break;
            case "network":
              errorMessage =
                "Network error. Please check your internet connection or switch to offline mode.";
              break;
            default:
              errorMessage = `Error: ${event.error}. Please try again.`;
          }
          setError(errorMessage);
        };

        rec.onend = () => {
          setIsListening(false);
        };
      }
    } else {
      setIsSupported(false);
      setError(
        "Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari."
      );
    }
  }, [detectScriptureReferences, updateHighlightedTranscript]);

  // normalizeBookName is already declared above; do not redeclare it here.

  const fetchVerse = useCallback(
    async (ref: Reference): Promise<void> => {
      if (!ref) return;
      setLoading(true);
      setSelectedReference(ref);

      try {
        const verseQuery = `${ref.book} ${ref.chapter}:${ref.verseStart}${
          ref.verseEnd !== ref.verseStart ? "-" + ref.verseEnd : ""
        }`;

        const currentTranslation = translations.find(
          (t: Translation) => t.value === translation
        );

        if (currentTranslation?.apiSupported) {
          const apiUrl = `https://bible-api.com/${encodeURIComponent(
            verseQuery
          )}?translation=${encodeURIComponent(translation)}`;

          const response = await fetch(apiUrl);

          if (!response.ok) {
            console.warn("bible-api returned non-OK:", response.status);
            setVerseText("Verse not available in this translation.");
            return;
          }

          const data: VerseResponse = await response.json();

          const text =
            data.text ??
            (Array.isArray(data.verses)
              ? data.verses.map((v) => v.text).join(" ")
              : "");
          setVerseText(
            (text || "Verse not available in this translation.").trim()
          );
        } else {
          // fallback: AI (Anthropic)
          const aiResponse = await fetch(
            "https://api.anthropic.com/v1/messages",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                // "x-api-key": process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || ""
              },
              body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1000,
                messages: [
                  {
                    role: "user",
                    content: `Please provide the exact text of ${verseQuery} from the ${
                      currentTranslation?.label ?? translation
                    } Bible translation. Return ONLY the verse text.`,
                  },
                ],
              }),
            }
          );

          if (!aiResponse.ok) {
            console.warn("Anthropic AI call failed:", aiResponse.status);
            setVerseText("Verse not available (AI lookup failed).");
            return;
          }

          const aiData: AnthropicResponse = await aiResponse.json();

          let text = "";

          if (Array.isArray(aiData.content)) {
            const found = aiData.content.find(
              (c: AnthropicContent) => c.type === "text" && !!c.text
            );
            text =
              found?.text ??
              aiData.content
                .map((c: AnthropicContent) => c.text || "")
                .join(" ");
          } else if (
            Array.isArray(aiData?.content) &&
            (aiData?.content?.[0] as AnthropicContent)?.text
          ) {
            text = ((aiData.content[0] as AnthropicContent).text) ?? "";
          } else if (typeof aiData?.text === "string") {
            text = aiData.text;
          }

          setVerseText((text || "Verse not available").trim());
        }
      } catch (err) {
        console.error("Error fetching verse:", err);
        setVerseText(
          "Error loading verse. Please try again or switch translations."
        );
      } finally {
        setLoading(false);
      }
    },
    [translation, translations]
  );

  // ✅ Effect that depends on selectedReference and translation
  useEffect(() => {
    if (selectedReference) {
      fetchVerse(selectedReference);
    }
  }, [selectedReference, translation, fetchVerse]);

  const generateInsights = async (ref: Reference) => {
    setShowInsights(true);
    setInsights("Generating insights...");

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Provide brief insights for ${ref.reference} including: 1) Historical context (2-3 sentences), 2) Key themes (bullet points), 3) Three related cross-reference verses. Keep it concise and practical for sermon listeners.`,
            },
          ],
        }),
      });

      const data = await response.json();
      const text =
        data.content.find(
          (c: { type: string; text?: string }) => c.type === "text"
        )?.text || "Insights not available";
      setInsights(text);
    } catch (error) {
      setInsights("Error generating insights. Please try again.");
    }
  };

  const generateSermonSummary = async () => {
    setShowSummary(true);
    setSermonSummary("Generating summary...");

    try {
      const refList = references.map((r) => r.reference).join(", ");
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Based on this sermon transcript and scripture references, provide a concise summary:

Transcript: ${transcript.slice(-500)}

Scripture References: ${refList}

Include: 1) Main theme, 2) Key points (3-4 bullets), 3) Practical applications`,
            },
          ],
        }),
      });

      const data = await response.json();
      const text =
        data.content.find(
          (c: { type: string; text?: string }) => c.type === "text"
        )?.text || "Summary not available";
      setSermonSummary(text);
    } catch (error) {
      setSermonSummary("Error generating summary. Please try again.");
    }
  };

  const playVerseAudio = async () => {
    if (!selectedReference || !verseText) return;

    setAudioPlaying(true);

    try {
      const utterance = new SpeechSynthesisUtterance(verseText);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => setAudioPlaying(false);
      utterance.onerror = () => {
        setAudioPlaying(false);
        setError("Audio playback failed");
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      setAudioPlaying(false);
      setError("Audio playback not supported");
    }
  };

  const stopAudio = () => {
    window.speechSynthesis.cancel();
    setAudioPlaying(false);
  };

  const toggleListening = () => {
    if (!isSupported) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        setError("");
        recognitionRef.current?.start();
      } catch (err) {
        setError("Failed to start listening. Please refresh and try again.");
        setIsListening(false);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!fullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(!fullscreen);
  };

  const exportReferences = () => {
    let exportData = `SERMON NOTES\nDate: ${new Date().toLocaleString()}\nTranslation: ${
      translations.find((t) => t.value === translation)?.label
    }\n\n`;

    exportData += `SCRIPTURE REFERENCES (${references.length})\n${"=".repeat(
      50
    )}\n`;
    references.forEach((ref) => {
      exportData += `\n${ref.reference} - ${ref.timestamp}\n`;
      if (notes[ref.id]) {
        exportData += `Notes: ${notes[ref.id]}\n`;
      }
    });

    if (transcript) {
      exportData += `\n\nTRANSCRIPT\n${"=".repeat(50)}\n${transcript}\n`;
    }

    if (sermonSummary && showSummary) {
      exportData += `\n\nSUMMARY\n${"=".repeat(50)}\n${sermonSummary}\n`;
    }

    const blob = new Blob([exportData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sermon-notes-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareReference = (ref: Reference) => {
    const shareText = `${ref.reference}\n\nShared from Scripture Listener`;
    if (navigator.share) {
      navigator.share({
        title: ref.reference,
        text: shareText,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert("Reference copied to clipboard!");
    }
  };

  const saveNote = (refId: number) => {
    if (currentNote.trim()) {
      setNotes((prev) => ({
        ...prev,
        [refId]: currentNote,
      }));
      setCurrentNote("");
    }
  };

  const clearHistory = () => {
    if (confirm("Clear all data? This cannot be undone.")) {
      setReferences([]);
      setTranscript("");
      setSelectedReference(null);
      setVerseText("");
      setNotes({});
      setSermonSummary("");
      setHighlightedTranscript("");
    }
  };

  const filteredReferences = references.filter((ref) =>
    ref.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className={`min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 text-white ${
        fullscreen ? "p-2" : "p-4"
      }`}
    >
      {projectionMode ? (
        // 🟣 Projection screen
        <div className="fixed inset-0 flex items-center justify-center bg-black text-white text-5xl font-bold text-center p-8">
          {verseText || "No verse selected yet"}
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          {!fullscreen && (
            <div className="text-center mb-6 pt-4">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Book className="w-10 h-10 text-purple-400" />
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
                    isListening
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-purple-500 hover:bg-purple-600"
                  }`}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                  {isListening ? "Stop" : "Listen"}
                </button>

                <select
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                  className="px-3 py-2 bg-slate-700 rounded-xl border border-slate-600 text-sm focus:border-purple-500 focus:outline-none max-w-xs"
                >
                  <optgroup label="Popular Translations">
                    <option value="kjv">KJV - King James</option>
                    <option value="nkjv">NKJV - New King James</option>
                    <option value="niv">NIV - New International</option>
                    <option value="nlt">NLT - New Living</option>
                    <option value="amp">AMP - Amplified</option>
                    <option value="ampc">AMPC - Amplified Classic</option>
                    <option value="cev">CEV - Contemporary English</option>
                    <option value="msg">MSG - The Message</option>
                  </optgroup>
                  <optgroup label="Other Translations">
                    <option value="web">WEB - World English</option>
                    <option value="clementine">Clementine Latin</option>
                    <option value="almeida">Almeida (Portuguese)</option>
                    <option value="rccv">Romanian Cornilescu</option>
                  </optgroup>
                </select>

                <button
                  onClick={() => setOfflineMode(!offlineMode)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                    offlineMode ? "bg-orange-600" : "bg-slate-700"
                  }`}
                  title={offlineMode ? "Offline Mode" : "Online Mode"}
                >
                  {offlineMode ? (
                    <WifiOff className="w-4 h-4" />
                  ) : (
                    <Wifi className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm"
                >
                  {fullscreen ? (
                    <Minimize className="w-4 h-4" />
                  ) : (
                    <Maximize className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={() => setProjectionMode(!projectionMode)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                    projectionMode
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "bg-slate-700 hover:bg-slate-600"
                  }`}
                  title={
                    projectionMode
                      ? "Exit Projection Mode"
                      : "Enter Projection Mode"
                  }
                >
                  {projectionMode ? "Exit Projection" : "Project"}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={generateSermonSummary}
                  disabled={references.length === 0}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50 text-sm"
                  title="Generate Summary"
                >
                  <Zap className="w-4 h-4" />
                </button>
                <button
                  onClick={exportReferences}
                  disabled={references.length === 0}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-50 text-sm"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={clearHistory}
                  disabled={references.length === 0}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isListening && (
              <div className="mt-3 flex items-center gap-2 text-xs text-purple-300">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse delay-75"></div>
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse delay-150"></div>
                </div>
                <span>Listening{offlineMode ? " (Offline)" : ""}...</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* References Panel */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold text-purple-400">
                  References
                </h2>
                <span className="px-2 py-1 bg-purple-500/20 rounded-full text-xs">
                  {references.length}
                </span>
              </div>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-700 rounded-xl border border-slate-600 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredReferences.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Book className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No references yet</p>
                  </div>
                ) : (
                  filteredReferences.map((ref) => (
                    <div
                      key={ref.id}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${
                        selectedReference?.id === ref.id
                          ? "bg-purple-600/40 border-2 border-purple-500"
                          : "bg-slate-700/50 border-2 border-transparent hover:border-slate-600"
                      }`}
                    >
                      <div
                        onClick={() => fetchVerse(ref)}
                        className="flex items-center justify-between mb-2"
                      >
                        <span className="font-semibold">{ref.reference}</span>
                        <span className="text-xs text-slate-400">
                          {ref.timestamp}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => generateInsights(ref)}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-600/50 hover:bg-blue-600 rounded text-xs"
                          title="Get Insights"
                        >
                          <Lightbulb className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => shareReference(ref)}
                          className="flex items-center gap-1 px-2 py-1 bg-green-600/50 hover:bg-green-600 rounded text-xs"
                          title="Share"
                        >
                          <Share2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setSelectedReference(ref)}
                          className="flex items-center gap-1 px-2 py-1 bg-purple-600/50 hover:bg-purple-600 rounded text-xs"
                          title="Add Note"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </button>
                      </div>

                      {notes[ref.id] && (
                        <div className="mt-2 p-2 bg-slate-900/50 rounded text-xs text-slate-300">
                          <div className="flex items-start gap-1">
                            <Bookmark className="w-3 h-3 mt-0.5 shrink-0" />
                            <span>{notes[ref.id]}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Verse Display Panel */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-4 border border-slate-700/50">
              <h2 className="text-xl font-bold text-purple-400 mb-3">
                Verse Text
              </h2>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
                </div>
              ) : selectedReference ? (
                <div>
                  <div className="mb-3 pb-3 border-b border-slate-700">
                    <h3 className="text-xl font-bold text-purple-300">
                      {selectedReference.reference}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {translations.find((t) => t.value === translation)?.label}
                    </p>
                  </div>

                  <div className="prose prose-invert max-w-none mb-4">
                    <p className="text-base leading-relaxed text-slate-200">
                      {verseText}
                    </p>
                  </div>
                  {!projectionMode && (
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={audioPlaying ? stopAudio : playVerseAudio}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl text-sm"
                      >
                        <Volume2 className="w-4 h-4" />
                        {audioPlaying ? "Stop Audio" : "Play Audio"}
                      </button>

                      <button
                        onClick={() => generateInsights(selectedReference)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm"
                      >
                        <Lightbulb className="w-4 h-4" />
                        Insights
                      </button>

                      <button
                        onClick={() => setProjectionMode(!projectionMode)}
                        className="px-3 py-2 bg-indigo-600 rounded"
                      >
                        {projectionMode ? "Exit Projection" : "Project Verse"}
                      </button>
                    </div>
                  )}

                  {/* Notes Section */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2 text-purple-300">
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      Personal Note
                    </label>
                    <textarea
                      value={currentNote}
                      onChange={(e) => setCurrentNote(e.target.value)}
                      placeholder="Add your thoughts or observations..."
                      className="w-full px-3 py-2 bg-slate-700 rounded-xl border border-slate-600 text-sm focus:border-purple-500 focus:outline-none resize-none"
                      rows={3}
                    />
                    <button
                      onClick={() => saveNote(selectedReference.id)}
                      disabled={!currentNote.trim()}
                      className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl text-sm disabled:opacity-50"
                    >
                      Save Note
                    </button>
                  </div>

                  {/* AI Insights Panel */}
                  {showInsights && (
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-blue-500/30">
                      <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        AI Insights
                      </h4>
                      <div className="text-sm text-slate-300 whitespace-pre-wrap">
                        {insights}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Book className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-base">Select a reference to view</p>
                </div>
              )}
            </div>
          </div>

          {/* Transcript Section */}
          {transcript && (
            <div className="mt-4 bg-slate-800/50 backdrop-blur-lg rounded-2xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Live Transcript
                </h3>
                <span className="text-xs text-slate-400">
                  {transcript.split(" ").length} words
                </span>
              </div>
              <div
                className="max-h-40 overflow-y-auto text-slate-300 leading-relaxed text-sm"
                dangerouslySetInnerHTML={{
                  __html: highlightedTranscript || transcript,
                }}
              />
            </div>
          )}

          {/* Sermon Summary */}
          {showSummary && (
            <div className="mt-4 bg-slate-800/50 backdrop-blur-lg rounded-2xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Sermon Summary
                </h3>
                <button
                  onClick={() => setShowSummary(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  Close
                </button>
              </div>
              <div className="prose prose-invert max-w-none text-sm">
                <div className="text-slate-300 whitespace-pre-wrap">
                  {sermonSummary}
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats Footer */}
          {!fullscreen && references.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-3 border border-slate-700/50 text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {references.length}
                </div>
                <div className="text-xs text-slate-400">References</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-3 border border-slate-700/50 text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {Object.keys(notes).length}
                </div>
                <div className="text-xs text-slate-400">Notes</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-3 border border-slate-700/50 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {Math.floor(transcript.split(" ").length / 150)}m
                </div>
                <div className="text-xs text-slate-400">Duration</div>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .delay-75 {
          animation-delay: 75ms;
        }
        .delay-150 {
          animation-delay: 150ms;
        }
        mark {
          background-color: rgba(168, 85, 247, 0.3);
          padding: 2px 4px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default ScriptureListenerPro;
