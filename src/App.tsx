import React, { useState } from 'react';
import WhisperDemo from './components/WhisperDemo';
import SpeechRecognitionDemo from './components/SpeechRecognitionDemo';
import VoskDemo from './components/VoskDemo';

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'whisper' | 'rsr' | 'vosk'>('whisper');

    return (
        <div className="app-container">
            <header>
                <h1>Speech To Text Demos</h1>
                <p>3 Different Libraries in One Project</p>
            </header>

            <div className="tabs-container">
                <button
                    className={`tab-btn ${activeTab === 'whisper' ? 'active' : ''}`}
                    onClick={() => setActiveTab('whisper')}
                >
                    Whisper Web
                </button>
                <button
                    className={`tab-btn ${activeTab === 'rsr' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rsr')}
                >
                    React Speech Recognition
                </button>
                <button
                    className={`tab-btn ${activeTab === 'vosk' ? 'active' : ''}`}
                    onClick={() => setActiveTab('vosk')}
                >
                    Vosk Browser
                </button>
            </div>

            <main>
                {activeTab === 'whisper' && <WhisperDemo />}
                {activeTab === 'rsr' && <SpeechRecognitionDemo />}
                {activeTab === 'vosk' && <VoskDemo />}
            </main>

            <footer>
                <p>Built with React & modern Speech-to-Text libraries</p>
            </footer>
        </div>
    );
};

export default App;
