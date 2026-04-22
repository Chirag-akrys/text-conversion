import React, { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const SpeechRecognitionDemo: React.FC = () => {
    const {
        transcript,
        listening,
        resetTranscript: resetHookTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    const [mainText, setMainText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const wasListeningRef = useRef(false);

    // Commit results to mainText when listening stops
    useEffect(() => {
        if (wasListeningRef.current && !listening && transcript) {
            setMainText(prev => {
                const trimmedPrev = prev.trim();
                return (trimmedPrev + (trimmedPrev ? ' ' : '') + transcript.trim()).trim();
            });
            resetHookTranscript();
        }
        wasListeningRef.current = listening;
    }, [listening, transcript, resetHookTranscript]);

    if (!browserSupportsSpeechRecognition) {
        return <div className="demo-component">⚠️ Browser not supported. Use Chrome.</div>;
    }

    const handleStart = async () => {
        setError(null);
        console.log("Button clicked. Attempting to start...");
        try {
            await resetHookTranscript();
            // Try starting WITHOUT continuous first to see if it works
            // If that works, then we know continuous is the problem
            await SpeechRecognition.startListening({
                continuous: true,
                language: 'en-US'
            });
            console.log("Start command success.");
        } catch (err: any) {
            console.error("Speech Recognition Error:", err);
            setError(err.message || 'Unknown error');
            alert("Error: " + (err.message || 'Could not start microphone'));
        }
    };

    const handleTextEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        if (listening && transcript && newValue.endsWith(transcript)) {
            setMainText(newValue.slice(0, newValue.length - transcript.length).trimEnd());
        } else {
            setMainText(newValue);
        }
    };

    return (
        <div className="demo-component rsr-demo">
            <h2>React Speech Recognition</h2>
            <p className="description">Browser Native API (Vercel Deep Debug)</p>

            <div className="controls">
                {!listening ? (
                    <button className="btn start-btn" onClick={handleStart}>
                        Start Listening
                    </button>
                ) : (
                    <button className="btn stop-btn" onClick={SpeechRecognition.stopListening}>
                        Stop Listening
                    </button>
                )}
                <button className="btn clear-btn" onClick={() => {
                    setMainText('');
                    resetHookTranscript();
                    setError(null);
                }}>Clear</button>
            </div>

            <div className="status">
                {listening ? (
                    <span className="badge recording">● LISTENING NOW</span>
                ) : (
                    <span className="badge stopped">{error ? `ERROR: ${error}` : 'OFF'}</span>
                )}
            </div>

            <div className="transcript-box">
                <label>Transcript:</label>
                <textarea
                    value={mainText + (listening && transcript ? (mainText ? ' ' : '') + transcript : '')}
                    onChange={handleTextEdit}
                    placeholder="Speak now..."
                />
            </div>

            <div style={{ marginTop: '10px', fontSize: '0.8rem', opacity: 0.7 }}>
                Debugging: State={listening ? 'TRUE' : 'FALSE'}, BrowserSupport={browserSupportsSpeechRecognition ? 'YES' : 'NO'}
            </div>
        </div>
    );
};

export default SpeechRecognitionDemo;
