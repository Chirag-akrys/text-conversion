import React, { useState, useRef, useEffect } from 'react';
import * as Vosk from 'vosk-browser';

const VoskDemo: React.FC = () => {
    const [transcript, setTranscript] = useState('');
    const [status, setStatus] = useState('Idle');
    const [isLoaded, setIsLoaded] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const modelRef = useRef<Vosk.Model | null>(null);
    const recognizerRef = useRef<Vosk.KaldiRecognizer | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        initVosk();
    }, []);

    const initVosk = async () => {
        if (modelRef.current) return;

        setStatus('Loading model...');
        try {
            const model = await Vosk.createModel('/vosk-model-small-en-us-0.15.tar.gz');
            modelRef.current = model;

            const recognizer = new model.KaldiRecognizer(16000);
            recognizer.on("result", (message: any) => {
                const result = message.result.text;
                if (result) {
                    setTranscript(prev => prev + ' ' + result);
                }
            });

            recognizer.on("partialresult", (message: any) => {
                // setTranscript(prev => prev + ' ' + message.result.partial);
                console.log("Partial:", message.result.partial);
            });

            recognizerRef.current = recognizer;
            setIsLoaded(true);
            setStatus('Model Loaded');
        } catch (err) {
            console.error(err);
            setStatus('Failed to load model');
        }
    };

    const startRecording = async () => {
        if (!isLoaded || !recognizerRef.current) {
            await initVosk();
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    channelCount: 1,
                    sampleRate: 16000
                }
            });
            streamRef.current = stream;

            const audioContext = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (event) => {
                const data = event.inputBuffer.getChannelData(0);
                const audioBuffer = audioContext.createBuffer(1, data.length, 16000);
                audioBuffer.getChannelData(0).set(data);
                recognizerRef.current?.acceptWaveform(audioBuffer);
            };

            source.connect(processor);
            processor.connect(audioContext.destination);

            setIsRecording(true);
            setStatus('Listening...');
        } catch (err) {
            console.error(err);
            setStatus('Error accessing microphone');
        }
    };

    const stopRecording = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (processorRef.current) {
            processorRef.current.disconnect();
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        setIsRecording(false);
        setStatus('Stopped');
    };

    useEffect(() => {
        return () => {
            stopRecording();
            modelRef.current?.terminate();
        };
    }, []);

    return (
        <div className="demo-component vosk-demo">
            <h2>Vosk Browser Demo</h2>
            <p className="description">High-accuracy offline speech recognition</p>

            <div className="controls">
                {isLoaded && !isRecording && (
                    <button className="btn start-btn" onClick={startRecording}>
                        Start Recording
                    </button>
                )}

                {isRecording && (
                    <button className="btn stop-btn" onClick={stopRecording}>
                        Stop Recording
                    </button>
                )}

                <button className="btn clear-btn" onClick={() => setTranscript('')}>Clear</button>
            </div>

            <div className="status">
                <span className={`badge ${status.toLowerCase().replace(' ', '-')}`}>{status}</span>
            </div>

            <div className="transcript-box">
                <label>Transcript:</label>
                <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Transcription will appear here..."
                />
            </div>
        </div>
    );
};

export default VoskDemo;
