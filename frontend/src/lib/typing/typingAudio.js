// Bộ phát âm thanh phím cơ mô phỏng bằng Web Audio API (không tốn dung lượng tải file)

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.soundType = 'thock'; // 'thock' | 'clicky' | 'typewriter' | 'off'
        this.volume = 0.5;
        this.initialized = false;
    }

    init() {
        if (!this.initialized) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                this.initialized = true;
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setSoundType(type) {
        this.soundType = type;
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }

    playKeySound(isSpace = false, isError = false) {
        if (this.soundType === 'off' || !this.volume) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        if (isError) {
            this.playErrorBeep(now);
            return;
        }

        switch (this.soundType) {
            case 'clicky':
                this.playClicky(now, isSpace);
                break;
            case 'typewriter':
                this.playTypewriter(now, isSpace);
                break;
            case 'thock':
            default:
                this.playThock(now, isSpace);
                break;
        }
    }

    playThock(time, isSpace) {
        this.playMechanicalClick(time, 1400, 0.025);
    }

    playClicky(time, isSpace) {
        this.playMechanicalClick(time, 2400, 0.02);
    }

    playTypewriter(time, isSpace) {
        this.playMechanicalClick(time, 1800, 0.03);
    }

    playErrorBeep(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, time);
        osc.frequency.exponentialRampToValueAtTime(100, time + 0.1);
        gain.gain.setValueAtTime(this.volume * 0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.1);
    }

    playMechanicalClick(time, freq, duration) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const targetFreq = freq + (Math.random() * 200 - 100);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(targetFreq, time);
        osc.frequency.exponentialRampToValueAtTime(targetFreq * 0.4, time + duration);

        gain.gain.setValueAtTime(this.volume * 0.35, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + duration);

        this.playNoise(time, duration * 0.6, 0.15 * this.volume, targetFreq);
    }

    playNoise(time, duration, vol, filterFreq) {
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        if (bufferSize <= 0) return;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = filterFreq;
        filter.Q.value = 3;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(time);
        noise.stop(time + duration);
    }
}

// Audio Engine Tiếng Việt (TTS - Nghe & Gõ)
class TTSEngine {
    constructor() {
        this.currentWord = "";
        this.audioPlayer = new Audio();
        this.audioCache = new Map();
        this.unlockAudio();
    }

    unlockAudio() {
        const unlock = () => {
            this.audioPlayer.play().then(() => {
                this.audioPlayer.pause();
            }).catch(() => {});
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
        };
        window.addEventListener('click', unlock);
        window.addEventListener('keydown', unlock);
    }

    cleanWord(rawText) {
        if (!rawText) return "";
        return rawText.trim().replace(/^[\(\[\{"'“‘\-—–]+|[\)\]\}"'”’.,?!;:\-—–]+$/g, '').toLowerCase();
    }

    getAudioUrls(word) {
        const encodedText = encodeURIComponent(word);
        return [
            `https://dict.youdao.com/dictvoice?audio=${encodedText}&le=vi`,
            `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodedText}`,
            `https://api.dictionaryapi.dev/media/pronunciations/vi/${encodedText}.mp3`
        ];
    }

    async preloadWords(wordsList, onProgress) {
        if (!wordsList || wordsList.length === 0) {
            if (onProgress) onProgress(100, 1, 1);
            return;
        }

        const uniqueWords = [...new Set(wordsList.map(w => this.cleanWord(w)))].filter(w => w.length > 0);
        const total = uniqueWords.length;
        let loaded = 0;

        const loadSingleWord = (word) => {
            return new Promise((resolve) => {
                if (this.audioCache.has(word)) {
                    loaded++;
                    if (onProgress) onProgress(Math.round((loaded / total) * 100), loaded, total);
                    resolve();
                    return;
                }

                const urls = this.getAudioUrls(word);
                let currentUrlIdx = 0;

                const tryNextUrl = () => {
                    if (currentUrlIdx >= urls.length) {
                        const fallbackAudio = new Audio(urls[0]);
                        this.audioCache.set(word, fallbackAudio);
                        loaded++;
                        if (onProgress) onProgress(Math.round((loaded / total) * 100), loaded, total);
                        resolve();
                        return;
                    }

                    const audio = new Audio();
                    audio.preload = 'auto';

                    let isDone = false;
                    const cleanup = () => {
                        audio.removeEventListener('canplaythrough', onCanPlay);
                        audio.removeEventListener('loadeddata', onCanPlay);
                        audio.removeEventListener('error', onError);
                    };

                    const onCanPlay = () => {
                        if (isDone) return;
                        isDone = true;
                        cleanup();
                        this.audioCache.set(word, audio);
                        loaded++;
                        if (onProgress) onProgress(Math.round((loaded / total) * 100), loaded, total);
                        resolve();
                    };

                    const onError = () => {
                        if (isDone) return;
                        isDone = true;
                        cleanup();
                        currentUrlIdx++;
                        tryNextUrl();
                    };

                    audio.addEventListener('canplaythrough', onCanPlay, { once: true });
                    audio.addEventListener('loadeddata', onCanPlay, { once: true });
                    audio.addEventListener('error', onError, { once: true });

                    audio.src = urls[currentUrlIdx];
                    audio.load();

                    setTimeout(() => {
                        if (!isDone) {
                            isDone = true;
                            cleanup();
                            currentUrlIdx++;
                            tryNextUrl();
                        }
                    }, 2000);
                };

                tryNextUrl();
            });
        };

        const batchSize = 4;
        for (let i = 0; i < uniqueWords.length; i += batchSize) {
            const batch = uniqueWords.slice(i, i + batchSize);
            await Promise.all(batch.map(w => loadSingleWord(w)));
        }
    }

    speakWord(text) {
        if (!text) return;
        const targetWord = this.cleanWord(text);
        this.currentWord = targetWord;
        if (!this.currentWord) return;

        if (this.audioCache.has(this.currentWord)) {
            try {
                const cachedAudio = this.audioCache.get(this.currentWord);
                cachedAudio.pause();
                cachedAudio.currentTime = 0;
                const p = cachedAudio.play();
                if (p !== undefined) {
                    p.catch(() => this.playDirect(this.currentWord));
                }
                return;
            } catch (e) {
                this.playDirect(this.currentWord);
                return;
            }
        }

        this.playDirect(this.currentWord);
    }

    playDirect(word) {
        const targetWord = this.cleanWord(word);
        if (!targetWord) return;

        const urls = this.getAudioUrls(targetWord);
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
        this.audioPlayer.src = urls[0];
        this.audioPlayer.load();
        this.audioPlayer.play().catch(() => {
            if (urls[1]) {
                this.audioPlayer.src = urls[1];
                this.audioPlayer.load();
                this.audioPlayer.play().catch(() => {});
            }
        });
    }

    replay() {
        if (this.currentWord) {
            this.speakWord(this.currentWord);
        }
    }

    stop() {
        if (this.audioPlayer) {
            this.audioPlayer.pause();
        }
    }
}

// Trình phát nhạc nền thư giãn Lo-Fi
class BackgroundMusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.audio.loop = true;
        this.volume = 0.35;
        this.audio.volume = this.volume;
        this.isPlaying = false;
        this.currentSongId = null;
        this.enabled = true;
    }

    playSong(song) {
        if (!song || !song.audioUrl) {
            this.stop();
            return;
        }

        if (!this.enabled) {
            this.currentSongId = song.id;
            return;
        }

        if (this.currentSongId === song.id && this.isPlaying) {
            return;
        }

        this.currentSongId = song.id;
        this.audio.pause();
        this.audio.src = song.audioUrl;
        this.audio.currentTime = 0;
        this.audio.volume = this.volume;

        const p = this.audio.play();
        if (p !== undefined) {
            p.then(() => {
                this.isPlaying = true;
            }).catch(() => {
                this.isPlaying = false;
            });
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) {
            if (this.audio.src) {
                this.audio.play().then(() => {
                    this.isPlaying = true;
                }).catch(() => {});
            }
        } else {
            this.audio.pause();
            this.isPlaying = false;
        }
        return this.enabled;
    }

    stop() {
        this.audio.pause();
        this.isPlaying = false;
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        this.audio.volume = this.volume;
    }
}

export const soundEngine = new SoundEngine();
export const ttsEngine = new TTSEngine();
export const musicPlayer = new BackgroundMusicPlayer();
