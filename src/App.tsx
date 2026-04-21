import React, { useState, useEffect, useCallback } from 'react';
import voskService from './voskService';

const LANGUAGES = [
    { value: "en", label: "English", code: "en-US" },
    // Vosk models are usually language-specific, so for this demo we'll stick to English
    // unless multiple models are loaded. For simplicity, we'll use the English model.
];

const MODEL_URL = '/vosk-model.tar.gz';

const App: React.FC = () => {
    const [isCopied, setIsCopied] = useState(false);
    const [isModelLoading, setIsModelLoading] = useState(false);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [partialTranscript, setPartialTranscript] = useState('');

    const [medicalData, setMedicalData] = useState({
        symptoms: '',
        diagnosis: '',
        prescription: '',
        notes: ''
    });
    const [mainTranscript, setMainTranscript] = useState('');
    const [activeField, setActiveField] = useState<'main' | 'symptoms' | 'diagnosis' | 'prescription' | 'notes' | null>(null);

    // Initialize Vosk Model
    useEffect(() => {
        const initVosk = async () => {
            setIsModelLoading(true);
            try {
                await voskService.init(MODEL_URL);
                setIsModelLoaded(true);
            } catch (error) {
                console.error('Failed to initialize Vosk:', error);
            } finally {
                setIsModelLoading(false);
            }
        };

        initVosk();

        return () => {
            voskService.stop();
        };
    }, []);

    const handleResult = useCallback((text: string) => {
        if (!text) return;

        setTranscript(prev => {
            const newTranscript = prev ? `${prev} ${text}` : text;
            return newTranscript;
        });
        setPartialTranscript('');
    }, []);

    const handlePartialResult = useCallback((text: string) => {
        setPartialTranscript(text);
    }, []);

    useEffect(() => {
        const fullText = partialTranscript
            ? (transcript ? `${transcript} ${partialTranscript}` : partialTranscript)
            : transcript;

        if (activeField === 'main') {
            setMainTranscript(fullText);
        } else if (activeField && activeField in medicalData) {
            setMedicalData(prev => ({ ...prev, [activeField]: fullText }));
        }
    }, [transcript, partialTranscript, activeField]);

    const handleCopy = () => {
        const currentText = activeField === 'main' ? mainTranscript : (activeField ? medicalData[activeField as keyof typeof medicalData] : '');
        if (currentText) {
            navigator.clipboard.writeText(currentText);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const resetTranscript = () => {
        setTranscript('');
        setPartialTranscript('');
        if (activeField === 'main') {
            setMainTranscript('');
        } else if (activeField) {
            setMedicalData(prev => ({ ...prev, [activeField]: '' }));
        }
    };

    const toggleListening = async (field: 'main' | 'symptoms' | 'diagnosis' | 'prescription' | 'notes') => {
        if (listening) {
            voskService.stop();
            setListening(false);

            if (activeField === field) {
                setActiveField(null);
                return;
            }
        }

        // Start listening for new field
        setActiveField(field);
        setTranscript('');
        setPartialTranscript('');

        try {
            await voskService.start(handleResult, handlePartialResult);
            setListening(true);
        } catch (error) {
            console.error('Failed to start Vosk:', error);
            setActiveField(null);
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

    if (isModelLoading) {
        return (
            <div className="unsupported-container">
                <div className="loading-spinner"></div>
                <h1>Loading Speech Model...</h1>
                <p>This may take a moment (approx. 30MB)</p>
            </div>
        );
    }

    if (!isModelLoaded && !isModelLoading) {
        return (
            <div className="unsupported-container">
                <h1>Model Error</h1>
                <p>Could not load the speech recognition model. Please check your internet connection.</p>
                <button className="btn start-btn" onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    return (
        <div className="app-container">
            <header>
                <h1>Vocalize</h1>
                <p>Real-time speech to text (Powered by Vosk)</p>
            </header>

            <div className='both-card'>
                <div className='main-card'>
                    <div className="status-container">
                        <div className={`status-badge ${listening && activeField === 'main' ? 'listening' : ''}`}>
                            <span className="dot"></span>
                            {listening && activeField === 'main' ? 'Listening...' : 'Inactive'}
                        </div>

                        <div className="language-selector">
                            <label>Model: English (Small)</label>
                        </div>
                    </div>

                    <div className="transcript-container">
                        <div className="transcript-header">
                            <span className="transcript-label">TRANSCRIPT</span>
                            <div className="actions">
                                <button
                                    onClick={handleCopy}
                                    disabled={!mainTranscript}
                                    className="action-btn"
                                    title="Copy to clipboard"
                                >
                                    {isCopied ? 'Copied!' : 'Copy'}
                                </button>
                                <button
                                    onClick={resetTranscript}
                                    disabled={!mainTranscript}
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
                                    style={{ minWidth: '50vh' }}
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
                                    style={{ minWidth: '50vh' }}
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
                                    style={{ minWidth: '50vh' }}
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
                                style={{ minWidth: '50vh' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <footer>
                <p>Built with React & Vosk Speech Recognition</p>
            </footer>
        </div>
    );
};

export default App;

