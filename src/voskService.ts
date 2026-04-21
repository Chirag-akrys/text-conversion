import { createModel, KaldiRecognizer, Model } from 'vosk-browser';

export type VoskResult = {
    result: {
        text: string;
        conf: number;
    };
};

export type VoskPartialResult = {
    partial: string;
};

class VoskService {
    private model: Model | null = null;
    private recognizer: KaldiRecognizer | null = null;
    private audioContext: AudioContext | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private processor: ScriptProcessorNode | null = null;
    private stream: MediaStream | null = null;

    async init(modelUrl: string): Promise<void> {
        if (this.model) return;

        try {
            this.model = await createModel(modelUrl);
        } catch (error) {
            console.error('Failed to load Vosk model:', error);
            throw error;
        }
    }

    async start(
        onResult: (text: string) => void,
        onPartialResult: (text: string) => void,
        sampleRate: number = 16000
    ): Promise<void> {
        if (!this.model) {
            throw new Error('Vosk model not initialized. Call init() first.');
        }

        this.recognizer = new this.model.KaldiRecognizer(sampleRate);
        this.recognizer.setWords(true);

        this.recognizer.on('result', (message: any) => {
            onResult(message.result.text);
        });

        this.recognizer.on('partialresult', (message: any) => {
            onPartialResult(message.result.partial);
        });

        this.stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                channelCount: 1,
                sampleRate,
            },
        });

        this.audioContext = new AudioContext({ sampleRate });
        this.source = this.audioContext.createMediaStreamSource(this.stream);
        this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

        this.processor.onaudioprocess = (event) => {
            const inputBuffer = event.inputBuffer.getChannelData(0);
            // @ts-ignore - vosk-browser types sometimes expect AudioBuffer but work with Float32Array
            this.recognizer?.acceptWaveform(inputBuffer);
        };

        this.source.connect(this.processor);
        this.processor.connect(this.audioContext.destination);
    }

    stop(): void {
        if (this.processor) {
            this.processor.disconnect();
            this.processor.onaudioprocess = null;
            this.processor = null;
        }

        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.recognizer) {
            // @ts-ignore - remove/terminate might not be in the current type definitions
            this.recognizer.remove?.() || (this.recognizer as any).terminate?.();
            this.recognizer = null;
        }
    }

    isInitialized(): boolean {
        return !!this.model;
    }
}

const voskService = new VoskService();
export default voskService;
