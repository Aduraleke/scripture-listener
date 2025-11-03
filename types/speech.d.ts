declare interface SpeechRecognition extends EventTarget {
  onstart: () => void
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult?: (event: SpeechRecognitionEvent) => void
  onerror?: (event: SpeechRecognitionErrorEvent) => void
  onend?: (event: Event) => void
}

declare interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList
  readonly resultIndex: number
}

declare interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

declare interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

declare interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

declare interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message: string
}

// eslint-disable-next-line no-var
declare var SpeechRecognition: {
  prototype: SpeechRecognition
  new (): SpeechRecognition
}
// eslint-disable-next-line no-var
declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition
  new (): SpeechRecognition
}
