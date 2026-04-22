import React, { useState, useEffect, useRef } from 'react';
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
    const [mainText, setMainText] = useState('');
    const hasAppendedRef = useRef(true);

    useEffect(() => {
        if (isRecording) {
            hasAppendedRef.current = false;
        }
    }, [isRecording]);

    useEffect(() => {
        if (!isRecording && !isTranscribing && !hasAppendedRef.current && whisperTranscript) {
            setMainText(prev => {
                const trimmedPrev = prev.trim();
                return trimmedPrev + (trimmedPrev ? ' ' : '') + whisperTranscript.trim();
            });
            setTranscript('');
            hasAppendedRef.current = true;
        }
    }, [isRecording, isTranscribing, whisperTranscript, setTranscript]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        if ((isTranscribing || isRecording) && whisperTranscript && newValue.endsWith(whisperTranscript)) {
            setMainText(newValue.slice(0, newValue.length - whisperTranscript.length).trimEnd());
        } else {
            setMainText(newValue);
            if (!isTranscribing && !isRecording) setTranscript('');
        }
    };

    const handleClear = () => {
        setMainText('');
        setTranscript('');
        hasAppendedRef.current = true;
    };

    return (
        <div className="demo-component whisper-demo">
            <h2>Whisper Web Demo</h2>
            <p className="description">Offline Whisper (Pro Sync logic)</p>

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
                    value={mainText + (whisperTranscript ? (mainText ? ' ' : '') + whisperTranscript : '')}
                    onChange={handleTextChange}
                    placeholder="Transcription will appear here..."
                />
            </div>
        </div>
    );
};

export default WhisperDemo;
