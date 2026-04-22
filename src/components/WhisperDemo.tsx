import React, { useState, useEffect } from 'react';
import { useWhisperWeb } from '../hooks/useWhisperWeb';

const WhisperDemo: React.FC = () => {
    const {
        isRecording,
        isTranscribing,
        isDownloading,
        transcript: whisperTranscript,
        error,
        startRecording,
        stopRecording,
        setTranscript
    } = useWhisperWeb();

    const [language, setLanguage] = useState('en');
    const [fullTranscript, setFullTranscript] = useState('');
    const [isProcessingDone, setIsProcessingDone] = useState(false);

    // Watch for the transition from transcribing to not transcribing
    useEffect(() => {
        if (!isRecording && isTranscribing) {
            setIsProcessingDone(false);
        }
        if (!isRecording && !isTranscribing && whisperTranscript && !isProcessingDone) {
            // This is the final step
            setFullTranscript(prev => prev + (prev ? ' ' : '') + whisperTranscript);
            setTranscript('');
            setIsProcessingDone(true);
        }
    }, [isRecording, isTranscribing, whisperTranscript, isProcessingDone, setTranscript]);

    const handleClear = () => {
        setFullTranscript('');
        setTranscript('');
    };

    return (
        <div className="demo-component whisper-demo">
            <h2>Whisper Web Demo</h2>
            <p className="description">Offline transcription using Whisper.cpp (WASM)</p>

            <div className="controls">
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={isRecording}
                    className="demo-select"
                >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="gu">Gujarati</option>
                </select>

                {!isRecording ? (
                    <button
                        className="btn start-btn"
                        onClick={() => startRecording(language)}
                        disabled={isTranscribing || isDownloading}
                    >
                        Start Recording
                    </button>
                ) : (
                    <button className="btn stop-btn" onClick={stopRecording}>
                        Stop Recording
                    </button>
                )}
                <button className="btn clear-btn" onClick={handleClear}>Clear</button>
            </div>

            <div className="status">
                {isDownloading && <span className="badge downloading">Downloading...</span>}
                {isRecording && <span className="badge recording">Listening...</span>}
                {isTranscribing && <span className="badge transcribing">Transcribing...</span>}
                {error && <span className="badge error">{error}</span>}
            </div>

            <div className="transcript-box">
                <label>Transcript:</label>
                <textarea
                    value={fullTranscript + (isTranscribing && whisperTranscript ? (fullTranscript ? ' ' : '') + whisperTranscript : '')}
                    onChange={(e) => setFullTranscript(e.target.value)}
                    placeholder="Transcription will appear here..."
                />
            </div>
        </div>
    );
};

export default WhisperDemo;
