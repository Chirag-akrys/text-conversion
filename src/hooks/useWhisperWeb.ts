import { useState, useRef, useCallback, useEffect } from 'react';
import { transcribe, downloadWhisperModel, WhisperWebLanguage } from '@remotion/whisper-web';

export const useWhisperWeb = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);

    const ensureModelDownloaded = useCallback(async () => {
        setIsDownloading(true);
        try {
            await downloadWhisperModel({
                model: 'tiny',
                onProgress: (p) => {
                    console.log(`Download progress: ${Math.round(p.progress * 100)}%`);
                }
            });
        } catch (err) {
            console.error('Failed to download model:', err);
            setError('Failed to download Whisper model.');
            throw err;
        } finally {
            setIsDownloading(false);
        }
    }, []);

    const processAudio = async (audioBlob: Blob, language: string = 'en', isPartial: boolean = false) => {
        if (!isPartial) setIsTranscribing(true);
        try {
            console.log(`${isPartial ? 'Partial' : 'Final'} audio processing...`);
            // await ensureModelDownloaded();

            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext({ sampleRate: 16000 });
            }

            const audioContext = audioContextRef.current;
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const audioData = audioBuffer.getChannelData(0); // Get first channel

            console.log(`Transcribing ${audioData.length / 16000} seconds of audio...`);

            // const result = await transcribe({
            //     model: 'tiny',
            //     channelWaveform: audioData,
            //     language: (language === 'auto' ? undefined : language) as WhisperWebLanguage,
            //     onTranscriptionChunk: (chunks) => {
            //         const partialText = chunks.map(c => c.text).join(' ');
            //         console.log("Partial transcription:", partialText);
            //         setTranscript(partialText);
            //     }
            // });
            const result = await transcribe({
                model: 'tiny',
                channelWaveform: audioData,
                language: (language === 'auto' ? undefined : language) as WhisperWebLanguage,
                threads: navigator.hardwareConcurrency || 4,
                onTranscriptionChunk: (chunks) => {
                    const partialText = chunks.map(c => c.text).join(' ');
                    setTranscript(partialText);
                }
            });
            const text = result.transcription.map(t => t.text).join(' ').trim();
            console.log("Setting FINAL transcript to state:", text);
            setTranscript(text);

        } catch (err) {
            console.error('Transcription error:', err);
            setError('Transcription failed.');
        } finally {
            if (!isPartial) setIsTranscribing(false);
        }
    };

    useEffect(() => {
        ensureModelDownloaded();
    }, []);
    const isProcessingRef = useRef(false);

    const startRecording = useCallback(async (language: string = 'en') => {
        try {
            setError(null);
            setTranscript('');
            console.log(`Starting recording... Language: ${language}`);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                console.log("Recording stopped. Processing audio...");
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                await processAudio(audioBlob, language, false);

                // Stop all tracks to release the microphone
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start(1000);
            setIsRecording(true);
        } catch (err) {
            console.error('Error starting recording:', err);
            setError('Could not access microphone.');
        }
    }, [ensureModelDownloaded]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    return {
        isRecording,
        isTranscribing,
        isDownloading,
        transcript,
        error,
        startRecording,
        stopRecording,
        setTranscript
    };
};

