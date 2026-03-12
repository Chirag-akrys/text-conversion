import React, { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const LANGUAGES = [
    { value: "auto", label: "Auto Detect", code: "en-IN" },
    { value: "en", label: "English", code: "en-IN" },
    { value: "hi", label: "Hindi", code: "hi-IN" },
    { value: "ta", label: "Tamil", code: "ta-IN" },
    { value: "te", label: "Telugu", code: "te-IN" },
    { value: "kn", label: "Kannada", code: "kn-IN" },
];

const App: React.FC = () => {
    const [isCopied, setIsCopied] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);

    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition,
        isMicrophoneAvailable
    } = useSpeechRecognition();

    if (!browserSupportsSpeechRecognition) {
        return (
            <div className="unsupported-container">
                <h1>Browser not supported</h1>
                <p>Your browser does not support speech recognition software. Please try Chrome.</p>
            </div>
        );
    }

    if (!isMicrophoneAvailable) {
        return (
            <div className="unsupported-container">
                <h1>Microphone not available</h1>
                <p>Please allow microphone access to use this demo.</p>
            </div>
        );
    }

    const handleCopy = () => {
        if (transcript) {
            navigator.clipboard.writeText(transcript);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const startListening = () => SpeechRecognition.startListening({
        continuous: true,
        language: selectedLanguage.code,
    });

    return (
        <div className="app-container">
            <header>
                <h1>Vocalize</h1>
                <p>Real-time speech to text conversion</p>
            </header>

            <main>
                <div className="status-container">
                    <div className={`status-badge ${listening ? 'listening' : ''}`}>
                        <span className="dot"></span>
                        {listening ? 'Listening...' : 'Inactive'}
                    </div>

                    <div className="language-selector">
                        <label htmlFor="language-select">Language:</label>
                        <select
                            id="language-select"
                            value={selectedLanguage.value}
                            onChange={(e) => {
                                const lang = LANGUAGES.find(l => l.value === e.target.value);
                                if (lang) setSelectedLanguage(lang);
                            }}
                            disabled={listening}
                        >
                            {LANGUAGES.map((lang) => (
                                <option key={lang.value} value={lang.value}>
                                    {lang.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="transcript-container">
                    <div className="transcript-header">
                        <span>Transcript</span>
                        <div className="actions">
                            <button
                                onClick={handleCopy}
                                disabled={!transcript}
                                className="action-btn"
                                title="Copy to clipboard"
                            >
                                {isCopied ? 'Copied!' : 'Copy'}
                            </button>
                            <button
                                onClick={resetTranscript}
                                disabled={!transcript}
                                className="action-btn"
                                title="Clear transcript"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                    <div className="transcript-content">
                        {transcript ? (
                            <span className="live-transcript">{transcript}</span>
                        ) : (
                            <span className="placeholder">Start speaking to see the transcript here...</span>
                        )}
                    </div>
                </div>

                <div className="controls">
                    {!listening ? (
                        <button className="btn start-btn" onClick={startListening}>
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path fill="currentColor" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                <path fill="currentColor" d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                            </svg>
                            Start Recording
                        </button>
                    ) : (
                        <button className="btn stop-btn" onClick={SpeechRecognition.stopListening}>
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path fill="currentColor" d="M6 6h12v12H6z" />
                            </svg>
                            Stop Recording
                        </button>
                    )}
                </div>
            </main>

            <footer>
                <p>Built with React & Speech Recognition API</p>
            </footer>
        </div>
    );
};

export default App;
