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
    const [isConnecting, setIsConnecting] = useState(false);

    // Append finalized speech to the main text
    useEffect(() => {
        if (!listening && transcript) {
            setMainText(prev => prev + (prev ? ' ' : '') + transcript);
            resetHookTranscript();
        }
    }, [listening, transcript, resetHookTranscript]);

    // Handle connecting states
    useEffect(() => {
        if (listening) {
            setIsConnecting(false);
        }
    }, [listening]);

    if (!browserSupportsSpeechRecognition) {
        return <div className="demo-component">Browser doesn't support speech recognition.</div>;
    }

    const startListening = () => {
        setIsConnecting(true);
        SpeechRecognition.startListening({ continuous: true });
    };

    return (
        <div className="demo-component rsr-demo">
            <h2>React Speech Recognition</h2>
            <p className="description">Using native Browser Speech API (Now with Connecting status)</p>

            <div className="controls">
                {!listening ? (
                    <button
                        className={`btn start-btn ${isConnecting ? 'loading' : ''}`}
                        onClick={startListening}
                        disabled={isConnecting}
                    >
                        {isConnecting ? 'Connecting...' : 'Start Listening'}
                    </button>
                ) : (
                    <button className="btn stop-btn" onClick={SpeechRecognition.stopListening}>
                        Stop Listening
                    </button>
                )}
                <button className="btn clear-btn" onClick={() => {
                    setMainText('');
                    resetHookTranscript();
                    setIsConnecting(false);
                }}>Clear</button>
            </div>

            <div className="status">
                {isConnecting && <span className="badge processing">Connecting...</span>}
                {listening && <span className="badge recording">Listening...</span>}
            </div>

            <div className="transcript-box">
                <label>Transcript:</label>
                <textarea
                    value={mainText + (listening && transcript ? (mainText ? ' ' : '') + transcript : '')}
                    onChange={(e) => setMainText(e.target.value)}
                    placeholder="Transcription will appear here..."
                />
            </div>
        </div>
    );
};

export default SpeechRecognitionDemo;
