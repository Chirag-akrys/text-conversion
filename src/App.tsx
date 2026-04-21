import React, { useState, useEffect } from 'react';
import { useWhisperWeb } from './hooks/useWhisperWeb';

const LANGUAGES = [
    { value: "auto", label: "Auto Detect", code: "auto" },
    { value: "en", label: "English", code: "en" },
    { value: "hi", label: "Hindi", code: "hi" },
    { value: "ta", label: "Tamil", code: "ta" },
    { value: "te", label: "Telugu", code: "te" },
    { value: "kn", label: "Kannada", code: "kn" },
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

    const [prefixText, setPrefixText] = useState('');

    const {
        isRecording,
        isTranscribing,
        isDownloading,
        transcript: whisperTranscript,
        startRecording,
        stopRecording
    } = useWhisperWeb();

    useEffect(() => {
        if (whisperTranscript) {
            const combinedText = prefixText ? prefixText + ' ' + whisperTranscript : whisperTranscript;
            if (activeField === 'main') {
                setMainTranscript(combinedText);
            } else if (activeField && activeField in medicalData) {
                setMedicalData(prev => ({
                    ...prev,
                    [activeField as keyof typeof medicalData]: combinedText
                }));
            }
        }
    }, [whisperTranscript, activeField, prefixText]);

    const handleCopy = (text: string) => {
        if (text) {
            navigator.clipboard.writeText(text);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const toggleListening = (field: 'main' | 'symptoms' | 'diagnosis' | 'prescription' | 'notes') => {
        if (isRecording && activeField === field) {
            stopRecording();
            // Don't clear activeField immediately, wait for transcription to finish
        } else {
            if (isRecording) {
                stopRecording();
            }

            const currentText = field === 'main' ? mainTranscript : (medicalData[field as keyof typeof medicalData] || '');
            setPrefixText(currentText);

            setActiveField(field);
            startRecording(selectedLanguage.code);
        }
    };

    // Clear active field once transcription is complete
    useEffect(() => {
        if (!isRecording && !isTranscribing && activeField) {
            const timeout = setTimeout(() => {
                setActiveField(null);
                setPrefixText('');
            }, 500); // Small delay to ensure the last transcript update is processed
            return () => clearTimeout(timeout);
        }
    }, [isRecording, isTranscribing, activeField]);



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

    const CopyIcon = () => (
        <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
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
                        <div className={`status-badge ${isRecording && activeField === 'main' ? 'isRecording' : (isTranscribing && activeField === 'main' ? 'isTranscribing' : '')}`}>
                            <span className="dot"></span>
                            {isRecording && activeField === 'main' ? 'Listening...' : (isTranscribing && activeField === 'main' ? 'Transcribing...' : (isDownloading && activeField === 'main' ? 'Downloading Model...' : 'Inactive'))}
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
                                disabled={isRecording}
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
                                    onClick={() => handleCopy(mainTranscript)}
                                    disabled={!mainTranscript}
                                    className="action-btn"
                                    title="Copy to clipboard"
                                >
                                    {isCopied ? 'Copied!' : 'Copy'}
                                </button>
                                <button
                                    onClick={() => setMainTranscript('')}
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
                            readOnly={isRecording && activeField === 'main'}
                        />
                        {isRecording && activeField === 'main' && <div className="recording-indicator-wrapper"><span className="recording-hint">● Recording...</span></div>}
                        {isTranscribing && activeField === 'main' && <div className="recording-indicator-wrapper"><span className="recording-hint">◌ Transcribing...</span></div>}
                        {isDownloading && activeField === 'main' && <div className="recording-indicator-wrapper"><span className="recording-hint">↓ Downloading Model...</span></div>}

                    </div>

                    <div className="controls">
                        {!isRecording || activeField !== 'main' ? (
                            <button
                                className="btn start-btn"
                                onClick={() => toggleListening('main')}
                                disabled={isTranscribing || isDownloading}
                            >
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
                                    <div className="field-actions">
                                        {/* <button
                                            className="copy-btn"
                                            onClick={() => handleCopy(medicalData.symptoms)}
                                            title="Copy symptoms"
                                            disabled={!medicalData.symptoms}
                                        >
                                            <CopyIcon />
                                        </button> */}
                                        <button
                                            className={`mic-btn ${activeField === 'symptoms' && isRecording ? 'recording' : ''}`}
                                            onClick={() => toggleListening('symptoms')}
                                            disabled={(isTranscribing || isDownloading) && !(activeField === 'symptoms' && isRecording)}
                                        >
                                            {activeField === 'symptoms' && isRecording ? <StopIcon /> : <MicIcon />}
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    value={medicalData.symptoms}
                                    onChange={(e) => setMedicalData({ ...medicalData, symptoms: e.target.value })}
                                    placeholder="Enter symptoms..."
                                    readOnly={isRecording && activeField === 'symptoms'}
                                    style={{
                                        minWidth: '50vh',
                                    }}
                                />
                                {activeField === 'symptoms' && isTranscribing && <span className="recording-hint">◌ Transcribing...</span>}
                                {activeField === 'symptoms' && isDownloading && <span className="recording-hint">↓ Downloading...</span>}
                                {activeField === 'symptoms' && isRecording && <span className="recording-hint">● Listening...</span>}
                            </div>
                            <div className="form-group">
                                <div className="label-row">
                                    <label>Diagnosis</label>
                                    <div className="field-actions">
                                        {/* <button
                                            className="copy-btn"
                                            onClick={() => handleCopy(medicalData.diagnosis)}
                                            title="Copy diagnosis"
                                            disabled={!medicalData.diagnosis}
                                        >
                                            <CopyIcon />
                                        </button> */}
                                        <button
                                            className={`mic-btn ${activeField === 'diagnosis' && isRecording ? 'recording' : ''}`}
                                            onClick={() => toggleListening('diagnosis')}
                                            disabled={(isTranscribing || isDownloading) && !(activeField === 'diagnosis' && isRecording)}
                                        >
                                            {activeField === 'diagnosis' && isRecording ? <StopIcon /> : <MicIcon />}
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    value={medicalData.diagnosis}
                                    onChange={(e) => setMedicalData({ ...medicalData, diagnosis: e.target.value })}
                                    placeholder="Enter diagnosis..."
                                    readOnly={isRecording && activeField === 'diagnosis'}
                                    style={{
                                        minWidth: '50vh',
                                    }}
                                />
                                {activeField === 'diagnosis' && isTranscribing && <span className="recording-hint">◌ Transcribing...</span>}
                                {activeField === 'diagnosis' && isDownloading && <span className="recording-hint">↓ Downloading...</span>}
                                {activeField === 'diagnosis' && isRecording && <span className="recording-hint">● Listening...</span>}
                            </div>
                            <div className="form-group">
                                <div className="label-row">
                                    <label>Prescription</label>
                                    <div className="field-actions">
                                        {/* <button
                                            className="copy-btn"
                                            onClick={() => handleCopy(medicalData.prescription)}
                                            title="Copy prescription"
                                            disabled={!medicalData.prescription}
                                        >
                                            <CopyIcon />
                                        </button> */}
                                        <button
                                            className={`mic-btn ${activeField === 'prescription' && isRecording ? 'recording' : ''}`}
                                            onClick={() => toggleListening('prescription')}
                                            disabled={(isTranscribing || isDownloading) && !(activeField === 'prescription' && isRecording)}
                                        >
                                            {activeField === 'prescription' && isRecording ? <StopIcon /> : <MicIcon />}
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    value={medicalData.prescription}
                                    onChange={(e) => setMedicalData({ ...medicalData, prescription: e.target.value })}
                                    placeholder="Enter prescription..."
                                    readOnly={isRecording && activeField === 'prescription'}
                                    style={{
                                        minWidth: '50vh',
                                    }}
                                />
                                {activeField === 'prescription' && isTranscribing && <span className="recording-hint">◌ Transcribing...</span>}
                                {activeField === 'prescription' && isDownloading && <span className="recording-hint">↓ Downloading...</span>}
                                {activeField === 'prescription' && isRecording && <span className="recording-hint">● Listening...</span>}
                            </div>
                        </div>
                    </div>

                    <div className="medical-card">
                        <div className="form-group">
                            <div className="label-row">
                                <label>Notes</label>
                                <div className="field-actions">
                                    {/* <button
                                        className="copy-btn"
                                        onClick={() => handleCopy(medicalData.notes)}
                                        title="Copy notes"
                                        disabled={!medicalData.notes}
                                    >
                                        <CopyIcon />
                                    </button> */}
                                    <button
                                        className={`mic-btn ${activeField === 'notes' && isRecording ? 'recording' : ''}`}
                                        onClick={() => toggleListening('notes')}
                                        disabled={(isTranscribing || isDownloading) && !(activeField === 'notes' && isRecording)}
                                    >
                                        {activeField === 'notes' && isRecording ? <StopIcon /> : <MicIcon />}
                                    </button>
                                </div>
                            </div>
                            <textarea
                                value={medicalData.notes}
                                onChange={(e) => setMedicalData({ ...medicalData, notes: e.target.value })}
                                placeholder="General notes..."
                                readOnly={isRecording && activeField === 'notes'}
                                style={{
                                    minWidth: '50vh',
                                }}
                            />
                            {activeField === 'notes' && isTranscribing && <span className="recording-hint">◌ Transcribing...</span>}
                            {activeField === 'notes' && isDownloading && <span className="recording-hint">↓ Downloading...</span>}
                            {activeField === 'notes' && isRecording && <span className="recording-hint">● Listening...</span>}
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
