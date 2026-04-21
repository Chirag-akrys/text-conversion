import { useState, useRef, useCallback } from 'react';
import { transcribe, downloadWhisperModel, WhisperWebLanguage } from '@remotion/whisper-web';

export const useWhisperWeb = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

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
            await ensureModelDownloaded();

            const audioContext = new AudioContext({ sampleRate: 16000 });
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const audioData = audioBuffer.getChannelData(0); // Get first channel

            console.log(`Transcribing ${audioData.length / 16000} seconds of audio...`);

            const result = await transcribe({
                model: 'tiny',
                channelWaveform: audioData,
                language: (language === 'auto' ? undefined : language) as WhisperWebLanguage,
                onTranscriptionChunk: (chunks) => {
                    const partialText = chunks.map(c => c.text).join(' ');
                    console.log("Partial transcription:", partialText);
                    setTranscript(partialText);
                }
            });

            const text = result.transcription.map(t => t.text).join(' ');
            console.log("Final transcription result:", text);
            setTranscript(text);

        } catch (err) {
            console.error('Transcription error:', err);
            setError('Transcription failed.');
        } finally {
            if (!isPartial) setIsTranscribing(false);
        }
    };

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

            mediaRecorder.ondataavailable = async (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);

                    // Periodic partial transcription
                    if (!isProcessingRef.current && audioChunksRef.current.length % 3 === 0) {
                        isProcessingRef.current = true;
                        const tempBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                        await processAudio(tempBlob, language, true);
                        isProcessingRef.current = false;
                    }
                }
            };

            mediaRecorder.onstop = async () => {
                console.log("Recording stopped. Processing audio...");
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                await processAudio(audioBlob, language, false);

                // Stop all tracks to release the microphone
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
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

