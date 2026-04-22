import React, { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const SpeechRecognitionDemo: React.FC = () => {
    const {
        interimTranscript,
        finalTranscript,
        listening,
        resetTranscript: resetHookTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    const [mainText, setMainText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);

    // Automatically append final fragments to mainText
    useEffect(() => {
        if (finalTranscript) {
            setMainText(prev => {
                const trimmedPrev = prev.trim();
                const suffix = finalTranscript.trim();
                if (!suffix) return prev;
                return (trimmedPrev + (trimmedPrev ? ' ' : '') + suffix).trim();
            });
            resetHookTranscript();
        }
    }, [finalTranscript, resetHookTranscript]);

    if (!browserSupportsSpeechRecognition) {
        return <div className="demo-component">⚠️ Browser not supported. Use Chrome.</div>;
    }

    const handleStart = async () => {
        if (listening) return;

        setError(null);
        setIsStarting(true);

        try {
            // Clear previous hook state first
            resetHookTranscript();

            // Re-initialize with explicit interimResults hope
            await SpeechRecognition.startListening({
                continuous: true,
                language: 'en-US'
            });
            console.log("RSR: Started successfully");
        } catch (err: any) {
            console.error("RSR: Start Error:", err);
            setError(err.message || 'Microphone error');
        } finally {
            setIsStarting(false);
        }
    };

    const handleStop = async () => {
        try {
            await SpeechRecognition.stopListening();
            console.log("RSR: Stopped requested");
        } catch (err) {
            console.error("RSR: Stop Error:", err);
        }
    };

    const handleTextEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;

        // If we are currently speaking, the visible value is mainText + ' ' + interimTranscript.
        // We need to strip the interim part to keep mainText clean.
        if (listening && interimTranscript) {
            const interimWithSpace = (mainText ? ' ' : '') + interimTranscript;
            if (newValue.endsWith(interimWithSpace)) {
                setMainText(newValue.slice(0, newValue.length - interimWithSpace.length));
                return;
            }
        }

        setMainText(newValue);
    };

    const handleClear = () => {
        setMainText('');
        resetHookTranscript();
        setError(null);
    };

    return (
        <div className="demo-component rsr-demo">
            <h2>React Speech Recognition</h2>
            <p className="description">Browser Native API (Live Streaming)</p>

            <div className="controls">
                {!listening ? (
                    <button
                        className={`btn start-btn ${isStarting ? 'loading' : ''}`}
                        onClick={handleStart}
                        disabled={isStarting}
                    >
                        {isStarting ? 'Starting...' : 'Start Listening'}
                    </button>
                ) : (
                    <button className="btn stop-btn" onClick={handleStop}>
                        Stop Listening
                    </button>
                )}
                <button className="btn clear-btn" onClick={handleClear}>Clear</button>
            </div>

            <div className="status">
                {listening ? (
                    <span className="badge recording">● ACTIVE</span>
                ) : (
                    <div className="status-group">
                        {/* <span className="badge stopped">{error ? `ERROR: ${error}` : 'IDLE'}</span> */}
                        {isStarting && <small> Initializing mic...</small>}
                    </div>
                )}
            </div>

            <div className="transcript-box">
                <label>Real-time Output:</label>
                <textarea
                    value={mainText + (interimTranscript ? (mainText ? ' ' : '') + interimTranscript : '')}
                    onChange={handleTextEdit}
                    placeholder="Click 'Start' and speak..."
                    rows={8}
                />
            </div>

            {/* <div className="debug-info">
                <span>Status: {listening ? 'Listening' : 'Off'}</span>
                <span> | Interim: {interimTranscript ? 'Yes' : 'No'}</span>
                {error && <span className="error-text"> | {error}</span>}
            </div> */}
        </div>
    );
};

export default SpeechRecognitionDemo;