// Simple synth for UI sounds using Web Audio API to avoid external assets

let audioCtx: AudioContext | null = null;
let voices: SpeechSynthesisVoice[] = [];

// Initialize voice loading immediately
if ('speechSynthesis' in window) {
    const loadVoices = () => {
        voices = window.speechSynthesis.getVoices();
    };
    
    // Attempt to load immediately
    loadVoices();
    
    // Chrome loads voices asynchronously, so we must listen for the event
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
}

const getContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

const playTone = (freq: number, type: OscillatorType, duration: number, delay: number = 0, vol: number = 0.1) => {
    try {
        const ctx = getContext();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        
        gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + duration);
        
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
    } catch (e) {
        console.error("Audio play failed", e);
    }
}

export const playCorrectSound = () => {
    // A happy climbing major third
    playTone(523.25, 'sine', 0.2, 0); // C5
    playTone(659.25, 'sine', 0.4, 0.1); // E5
};

export const playIncorrectSound = () => {
    // A low thud
    playTone(150, 'sawtooth', 0.3, 0);
    playTone(130, 'sawtooth', 0.3, 0.1);
};

export const playTryAgainSound = () => {
    // A gentle "bonk" for hints
    playTone(300, 'sine', 0.2, 0);
    playTone(250, 'sine', 0.3, 0.1);
};

export const playFanfare = () => {
    // C Major Arpeggio
    playTone(523.25, 'triangle', 0.3, 0);   // C5
    playTone(659.25, 'triangle', 0.3, 0.1); // E5
    playTone(783.99, 'triangle', 0.3, 0.2); // G5
    playTone(1046.50, 'triangle', 0.8, 0.3); // C6
};

// Text to Speech Helper for Pronunciation
export const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
        // Ensure we try to get voices again if they haven't loaded
        if (voices.length === 0) {
            voices = window.speechSynthesis.getVoices();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        const normalize = (lang: string) => lang.replace('_', '-');
        
        // Robust Priority List for Kiwi/Aussie Context
        let selectedVoice = null;

        // 1. Explicit NZ Locale (e.g. 'en-NZ')
        selectedVoice = voices.find(v => normalize(v.lang) === 'en-NZ');
        
        // 2. Name contains 'New Zealand' or 'NZ' (Handles voices with generic 'en' tags but specific names)
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.name.includes('New Zealand') || v.name.includes('NZ'));
        }

        // 3. Fallback to Australia (Closest accent to NZ) - Locale Check
        if (!selectedVoice) {
            selectedVoice = voices.find(v => normalize(v.lang) === 'en-AU');
        }

        // 4. Fallback to Australia - Name Check
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.name.includes('Australia') || v.name.includes('AU'));
        }

        // 5. Fallback to UK (Better for NZ spelling rules than US)
        if (!selectedVoice) {
            selectedVoice = voices.find(v => normalize(v.lang) === 'en-GB' || v.name.includes('Great Britain') || v.name.includes('UK'));
        }

        // 6. Generic English fallback
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang.startsWith('en'));
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        // Settings for clarity
        utterance.rate = 0.85; // Slightly slower to ensure students catch the sounds
        utterance.pitch = 1.0; // Neutral pitch is usually clearest
        utterance.volume = 1.0;
        
        window.speechSynthesis.cancel(); // Stop any previous speech
        window.speechSynthesis.speak(utterance);
    } else {
        console.warn("Text to speech not supported");
    }
};