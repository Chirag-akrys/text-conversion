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
    const [medicalData, setMedicalData] = useState({
        symptoms: '',
        diagnosis: '',
        prescription: '',
        notes: ''
    });
    const [mainTranscript, setMainTranscript] = useState('');
    const [activeField, setActiveField] = useState<'main' | 'symptoms' | 'diagnosis' | 'prescription' | 'notes' | null>(null);

    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition,
        isMicrophoneAvailable
    } = useSpeechRecognition();

    useEffect(() => {
        if (activeField === 'main') {
            setMainTranscript(transcript);
        } else if (activeField && activeField in medicalData) {
            setMedicalData(prev => ({ ...prev, [activeField]: transcript }));
        }
    }, [transcript, activeField]);

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

    const toggleListening = (field: 'main' | 'symptoms' | 'diagnosis' | 'prescription' | 'notes') => {
        if (listening && activeField === field) {
            SpeechRecognition.stopListening();
            setActiveField(null);
        } else {
            // If already listening to another field, stop first
            if (listening) {
                SpeechRecognition.stopListening();
            }

            setActiveField(field);
            resetTranscript();

            // Set initial transcript if we want to append or just start fresh
            // For now, starting fresh is cleaner for individual fields

            SpeechRecognition.startListening({
                continuous: true,
                language: selectedLanguage.code,
            });
        }
    };

    const MicIcon = () => (
        <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path fill="currentColor" d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
    );

    const StopIcon = () => (
        <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M6 6h12v12H6z" />
        </svg>
    );

    return (
        <div className="app-container">
            <header>
                <h1>Vocalize</h1>
                <p>Real-time speech to text conversion</p>
            </header>

            {/* <main> */}
            <div className='both-card'>
                <div className='main-card'>
                    <div className="status-container">
                        <div className={`status-badge ${listening && activeField === 'main' ? 'listening' : ''}`}>
                            <span className="dot"></span>
                            {listening && activeField === 'main' ? 'Listening...' : 'Inactive'}
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
                            <span className="transcript-label">TRANSCRIPT</span>
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
                        <textarea
                            className="transcript-content"
                            value={mainTranscript}
                            onChange={(e) => setMainTranscript(e.target.value)}
                            placeholder="Start speaking or type here to see the transcript..."
                            disabled={listening && activeField === 'main'}
                        />
                        {listening && activeField === 'main' && <div className="recording-indicator-wrapper"><span className="recording-hint">● Recording...</span></div>}
                    </div>

                    <div className="controls">
                        {!listening || activeField !== 'main' ? (
                            <button className="btn start-btn" onClick={() => toggleListening('main')}>
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                    <path fill="currentColor" d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                                </svg>
                                Start Recording
                            </button>
                        ) : (
                            <button className="btn stop-btn" onClick={() => toggleListening('main')}>
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M6 6h12v12H6z" />
                                </svg>
                                Stop Recording
                            </button>
                        )}
                    </div>
                </div>
                {/* </main> */}
                <div className="medical-grid">
                    <div className="medical-card">
                        <div className="form-grid">
                            <div className="form-group">
                                <div className="label-row">
                                    <label>Symptoms</label>
                                    <button
                                        className={`mic-btn ${activeField === 'symptoms' && listening ? 'recording' : ''}`}
                                        onClick={() => toggleListening('symptoms')}
                                    >
                                        {activeField === 'symptoms' && listening ? <StopIcon /> : <MicIcon />}
                                    </button>
                                </div>
                                <textarea
                                    value={medicalData.symptoms}
                                    onChange={(e) => setMedicalData({ ...medicalData, symptoms: e.target.value })}
                                    placeholder="Enter symptoms..."
                                    style={{
                                        minWidth: '50vh',
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <div className="label-row">
                                    <label>Diagnosis</label>
                                    <button
                                        className={`mic-btn ${activeField === 'diagnosis' && listening ? 'recording' : ''}`}
                                        onClick={() => toggleListening('diagnosis')}
                                    >
                                        {activeField === 'diagnosis' && listening ? <StopIcon /> : <MicIcon />}
                                    </button>
                                </div>
                                <textarea
                                    value={medicalData.diagnosis}
                                    onChange={(e) => setMedicalData({ ...medicalData, diagnosis: e.target.value })}
                                    placeholder="Enter diagnosis..."
                                    style={{
                                        minWidth: '50vh',
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <div className="label-row">
                                    <label>Prescription</label>
                                    <button
                                        className={`mic-btn ${activeField === 'prescription' && listening ? 'recording' : ''}`}
                                        onClick={() => toggleListening('prescription')}
                                    >
                                        {activeField === 'prescription' && listening ? <StopIcon /> : <MicIcon />}
                                    </button>
                                </div>
                                <textarea
                                    value={medicalData.prescription}
                                    onChange={(e) => setMedicalData({ ...medicalData, prescription: e.target.value })}
                                    placeholder="Enter prescription..."
                                    style={{
                                        minWidth: '50vh',
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="medical-card">
                        <div className="form-group">
                            <div className="label-row">
                                <label>Notes</label>
                                <button
                                    className={`mic-btn ${activeField === 'notes' && listening ? 'recording' : ''}`}
                                    onClick={() => toggleListening('notes')}
                                >
                                    {activeField === 'notes' && listening ? <StopIcon /> : <MicIcon />}
                                </button>
                            </div>
                            <textarea
                                value={medicalData.notes}
                                onChange={(e) => setMedicalData({ ...medicalData, notes: e.target.value })}
                                placeholder="General notes..."
                                style={{
                                        minWidth: '50vh',
                                    }}
                            />
                        </div>
                    </div>
                </div>
            </div>


            <footer>
                <p>Built with React & Speech Recognition API</p>
            </footer>
        </div>
    );
};

export default App;
