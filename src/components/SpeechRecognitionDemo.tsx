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
    const wasListeningRef = useRef(false);

    // FIX: This takes the final speech and permanently adds it to your text
    useEffect(() => {
        if (wasListeningRef.current && !listening && transcript) {
            setMainText(prev => {
                const trimmedPrev = prev.trim();
                return trimmedPrev + (trimmedPrev ? ' ' : '') + transcript.trim();
            });
            resetHookTranscript();
        }
        wasListeningRef.current = listening;
    }, [listening, transcript, resetHookTranscript]);

    if (!browserSupportsSpeechRecognition) {
        return <div className="demo-component">Browser doesn't support speech recognition.</div>;
    }

    // IMPORTANT: This function handles edits so that your speech doesn't duplicate
    const handleTextEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;

        if (listening && transcript && newValue.endsWith(transcript)) {
            // If you edit while listening, we only save the part BEFORE the live speech
            setMainText(newValue.slice(0, newValue.length - transcript.length).trimEnd());
        } else {
            // Otherwise, we just save exactly what you typed
            setMainText(newValue);
        }
    };

    console.log("isListening:", listening)
    return (
        <div className="demo-component rsr-demo">
            <h2>React Speech Recognition</h2>
            <p className="description">Now capturing ALL words correctly even after edits!</p>

            <div className="controls">
                {!listening ? (
                    <button
                        className="btn start-btn"
                        onClick={() => {
                            console.log("Starting listening...");
                            resetHookTranscript();
                            console.log("Transcript reset...");
                            SpeechRecognition.startListening({ continuous: true });
                            console.log("Listening end...");
                        }}
                    >
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
                }}>Clear</button>
            </div>

            <div className="status">
                {listening && <span className="badge recording">LISTENING...</span>}
            </div>

            <div className="transcript-box">
                <label>Transcript:</label>
                <textarea
                    value={mainText + (listening && transcript ? (mainText ? ' ' : '') + transcript : '')}
                    onChange={handleTextEdit}
                    placeholder="Type here, then speak... everything will stay!"
                />
            </div>
        </div>
    );
};

export default SpeechRecognitionDemo;
