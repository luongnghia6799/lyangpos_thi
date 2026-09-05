// Typing Engine - Xử lý logic gõ tiếng Việt, tính WPM, độ chính xác, caret và âm thanh

import { soundEngine, ttsEngine } from './typingAudio';

export class TypingEngine {
    constructor(callbacks) {
        this.words = [];
        this.currentWordIdx = 0;
        this.currentLetterIdx = 0;
        this.typedHistory = []; // mảng lưu các từ đã gõ
        this.inputBuffer = ""; // input hiện tại của từ đang gõ

        this.startTime = null;
        this.timer = null;
        this.timeLimit = 30; // seconds (0 nghĩa là free mode / không giới hạn)
        this.timeLeft = 30;
        this.mode = 'words'; // 'pos' | 'words' | 'time' | 'proverbs' | 'quotes' | 'lyrics' | 'tts'
        this.wordCountLimit = 25;

        this.correctChars = 0;
        this.incorrectChars = 0;
        this.extraChars = 0;
        this.totalKeystrokes = 0;
        this.isFinished = false;
        this.isStarted = false;

        this.callbacks = callbacks || {}; // { onUpdateStats, onFinish, onScrollLine }
    }

    setWords(wordsArray) {
        if (!wordsArray || !Array.isArray(wordsArray)) {
            if (typeof wordsArray === 'string') {
                this.words = wordsArray.trim().split(/\s+/).filter(Boolean);
            } else {
                this.words = ["LyangPOS", "Luyện", "Gõ", "Phím"];
            }
        } else {
            this.words = [...wordsArray].filter(Boolean);
        }
        if (this.words.length === 0) {
            this.words = ["LyangPOS", "Luyện", "Gõ", "Phím"];
        }
        this.reset();
    }

    reset() {
        if (this.timer) clearInterval(this.timer);
        this.currentWordIdx = 0;
        this.currentLetterIdx = 0;
        this.typedHistory = [];
        this.inputBuffer = "";
        this.startTime = null;
        this.timer = null;
        this.timeLeft = this.timeLimit;
        this.correctChars = 0;
        this.incorrectChars = 0;
        this.extraChars = 0;
        this.totalKeystrokes = 0;
        this.isFinished = false;
        this.isStarted = false;
    }

    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        this.startTime = Date.now();

        if (this.mode === 'time' && this.timeLimit > 0) {
            this.timeLeft = this.timeLimit;
            this.timer = setInterval(() => {
                this.timeLeft--;
                if (this.timeLeft <= 0) {
                    this.timeLeft = 0;
                    this.finish();
                }
                this.notifyUpdate();
            }, 1000);
        } else {
            this.timer = setInterval(() => {
                this.notifyUpdate();
            }, 1000);
        }
    }

    finish() {
        if (this.isFinished) return;
        this.isFinished = true;
        if (this.timer) clearInterval(this.timer);

        const stats = this.calculateStats();
        if (this.callbacks.onFinish) {
            this.callbacks.onFinish(stats);
        }
    }

    // Xử lý input từ bàn phím (hỗ trợ bộ gõ Tiếng Việt tự nhiên Telex / VNI)
    handleInput(val) {
        if (this.isFinished) return;
        if (!this.isStarted) {
            this.start();
        }

        const targetWord = this.words[this.currentWordIdx] || "";

        // Kiểm tra phím cách (Space) để hoàn thành từ
        if (val.endsWith(" ")) {
            const wordTyped = val.trim();
            this.finishCurrentWord(wordTyped);
            soundEngine.playKeySound(true);
            return "";
        }

        // Người dùng đang gõ dở từ hiện tại
        const prevLength = this.inputBuffer.length;
        this.inputBuffer = val;
        this.currentLetterIdx = val.length;

        // Phát âm thanh phím cơ học
        if (val.length > prevLength) {
            this.totalKeystrokes++;
            soundEngine.playKeySound(false);
        }

        this.notifyUpdate();
        return val;
    }

    handleBackspace() {
        if (this.inputBuffer.length === 0 && this.currentWordIdx > 0) {
            const prevTyped = this.typedHistory[this.currentWordIdx - 1];
            // Chỉ cho phép quay lại từ trước nếu từ trước gõ sai
            if (prevTyped !== this.words[this.currentWordIdx - 1]) {
                this.currentWordIdx--;
                this.inputBuffer = this.typedHistory.pop() || "";
                this.currentLetterIdx = this.inputBuffer.length;
                this.notifyUpdate();
                return true;
            }
        }
        return false;
    }

    finishCurrentWord(typedWord) {
        const targetWord = this.words[this.currentWordIdx] || "";
        this.typedHistory.push(typedWord);

        // Tính ký tự đúng / sai của từ vừa gõ
        let matchLength = Math.min(typedWord.length, targetWord.length);
        for (let i = 0; i < matchLength; i++) {
            if (typedWord[i] === targetWord[i]) {
                this.correctChars++;
            } else {
                this.incorrectChars++;
            }
        }
        if (typedWord.length > targetWord.length) {
            this.extraChars += (typedWord.length - targetWord.length);
        } else if (typedWord.length < targetWord.length) {
            this.incorrectChars += (targetWord.length - typedWord.length);
        }

        // Ký tự dấu cách đúng
        this.correctChars++;

        this.currentWordIdx++;
        this.inputBuffer = "";
        this.currentLetterIdx = 0;

        // Kiểm tra nếu đã gõ hết danh sách từ
        if (this.currentWordIdx >= this.words.length) {
            this.finish();
            return;
        }

        // Nếu ở chế độ 'tts' -> Tự động phát âm từ tiếp theo ngay khi bấm Space xong
        if (this.mode === 'tts' && this.words[this.currentWordIdx]) {
            ttsEngine.speakWord(this.words[this.currentWordIdx]);
        }

        this.notifyUpdate();
    }

    calculateStats() {
        const now = Date.now();
        const elapsedMinutes = this.startTime ? Math.max((now - this.startTime) / 60000, 0.001) : 0.001;

        // WPM chuẩn = (Số ký tự đúng / 5) / Phút
        const wpm = Math.round((this.correctChars / 5) / elapsedMinutes);
        const rawWpm = Math.round(((this.correctChars + this.incorrectChars + this.extraChars) / 5) / elapsedMinutes);

        const totalTyped = this.correctChars + this.incorrectChars + this.extraChars;
        const accuracy = totalTyped > 0 ? Math.round((this.correctChars / totalTyped) * 100) : 100;

        return {
            wpm: Math.max(0, wpm),
            rawWpm: Math.max(0, rawWpm),
            accuracy: Math.max(0, Math.min(100, accuracy)),
            correctChars: this.correctChars,
            incorrectChars: this.incorrectChars,
            extraChars: this.extraChars,
            totalKeystrokes: this.totalKeystrokes,
            timeElapsed: Math.round(elapsedMinutes * 60)
        };
    }

    notifyUpdate() {
        if (this.callbacks.onUpdateStats) {
            this.callbacks.onUpdateStats({
                currentWordIdx: this.currentWordIdx,
                currentLetterIdx: this.currentLetterIdx,
                inputBuffer: this.inputBuffer,
                timeLeft: this.timeLeft,
                stats: this.calculateStats()
            });
        }
    }
}
