import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    Keyboard,
    RotateCcw,
    Volume2,
    VolumeX,
    Music,
    Sparkles,
    Trophy,
    Clock,
    Flame,
    Zap,
    BookOpen,
    Quote,
    Disc,
    Mic,
    Package,
    ChevronDown,
    Award,
    CheckCircle2,
    Play,
    Search,
    Loader2,
    X,
    HelpCircle,
    ChevronUp,
    Feather,
    FileText,
    Copy,
    Check
} from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';
import CustomSelect from '../../components/CustomSelect';
import { TypingEngine } from '../../lib/typing/typingEngine';
import { soundEngine, musicPlayer } from '../../lib/typing/typingAudio';
import {
    POS_PRODUCT_WORDS,
    VIETNAMESE_WORDS,
    VIETNAMESE_PROVERBS,
    VIETNAMESE_QUOTES,
    POPULAR_SONGS,
    TYPING_FONTS,
    loadGoogleFontDynamically
} from '../../lib/typing/typingContent';
import { LyricsService } from '../../lib/typing/lyricsService';
import { useProductData } from '../../queries/useProductData';
import { loadGoogleFont } from '../../lib/googleFonts';

const SOUND_OPTIONS = [
    { id: 'thock', name: 'Thock (Bàn phím cơ)' },
    { id: 'clicky', name: 'Clicky (Blue Switch)' },
    { id: 'typewriter', name: 'Máy đánh chữ' },
    { id: 'off', name: 'Tắt âm thanh' }
];

const shuffleArray = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

// Component Word riêng biệt được memoize để giảm tải 95% GPU & CPU render lại
const MemoizedWord = React.memo(function MemoizedWord({ 
    targetWord, 
    wIdx, 
    isCurrent, 
    isPast, 
    inputBuf, 
    pastTyped,
    fontFamily 
}) {
    const wordStyle = fontFamily ? { fontFamily: `${fontFamily} !important` } : {};

    return (
        <div
            id={`type-word-${wIdx}`}
            className={`flex items-center relative ${
                isCurrent ? 'opacity-100' : isPast ? 'opacity-40' : 'opacity-90'
            }`}
            style={{ fontFamily: fontFamily || 'inherit' }}
        >
            {targetWord.split('').map((char, lIdx) => {
                let letterClass = 'text-stone-500 dark:text-stone-400 font-semibold';
                let displayChar = char;

                if (isCurrent) {
                    if (lIdx < inputBuf.length) {
                        if (inputBuf[lIdx] === char) {
                            letterClass = 'text-[#2d5016] dark:text-emerald-400 font-extrabold';
                        } else {
                            letterClass = 'text-rose-600 dark:text-rose-400 underline decoration-2 font-extrabold';
                            displayChar = inputBuf[lIdx];
                        }
                    } else {
                        letterClass = 'text-stone-900 dark:text-stone-100 font-extrabold';
                    }
                } else if (isPast) {
                    if (pastTyped && pastTyped[lIdx] === char) {
                        letterClass = 'text-[#2d5016]/80 dark:text-emerald-400/80 font-bold';
                    } else {
                        letterClass = 'text-rose-600/80 dark:text-rose-400/80 underline font-bold';
                    }
                }

                return (
                    <span
                        key={lIdx}
                        className={`type-letter ${letterClass}`}
                        style={{ fontFamily: fontFamily || 'inherit' }}
                    >
                        {displayChar}
                    </span>
                );
            })}

            {isCurrent && inputBuf.length > targetWord.length && (
                inputBuf.slice(targetWord.length).split('').map((extraChar, eIdx) => (
                    <span
                        key={`extra-${eIdx}`}
                        className="type-letter text-rose-600 dark:text-rose-400 underline decoration-2 font-bold"
                        style={{ fontFamily: fontFamily || 'inherit' }}
                    >
                        {extraChar}
                    </span>
                ))
            )}
        </div>
    );
});

export default function TypingPractice() {
    // Lấy dữ liệu sản phẩm thực tế từ cơ sở dữ liệu POS
    const { data: productsData } = useProductData();

    // Game Modes: 'pos' | 'words' | 'time' | 'proverbs' | 'quotes' | 'lyrics' | 'free'
    const [mode, setMode] = useState('pos');
    const [timeLimit, setTimeLimit] = useState(30);
    const [wordLimit, setWordLimit] = useState(25);
    const [customSongs, setCustomSongs] = useState(POPULAR_SONGS);
    const [selectedSong, setSelectedSong] = useState(POPULAR_SONGS[0]);
    const [selectedFont, setSelectedFont] = useState('space-mono');
    const [fontSize, setFontSize] = useState(32);
    const [showVietnameseTips, setShowVietnameseTips] = useState(false);
    const [activeMethodTab, setActiveMethodTab] = useState('telex'); // 'telex' | 'vni'
    const [arenaKey, setArenaKey] = useState(0); // Dùng trigger animation chuyển mượt khi reset/đổi cấu hình

    // Free Mode (Gõ Tự Do - Scratchpad / Bảng Trắng Tự Gõ) states
    const [freeModeTypedText, setFreeModeTypedText] = useState('');
    const [freeStartTime, setFreeStartTime] = useState(null);
    const [freeTotalKeystrokes, setFreeTotalKeystrokes] = useState(0);
    const [freeLiveWpm, setFreeLiveWpm] = useState(0);

    // Audio states
    const [soundType, setSoundType] = useState('thock'); // 'thock' | 'clicky' | 'typewriter' | 'off'
    const [musicEnabled, setMusicEnabled] = useState(false);

    // Online Lyrics Search modal states
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchLyricsQuery, setSearchLyricsQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchingLyrics, setIsSearchingLyrics] = useState(false);
    const [searchError, setSearchError] = useState('');

    // Tự động load Google Font nếu font được chọn có googleName
    useEffect(() => {
        const fontObj = TYPING_FONTS.find(f => f.id === selectedFont);
        if (fontObj) {
            if (fontObj.googleName) {
                loadGoogleFont(fontObj.googleName);
            }
            document.documentElement.style.setProperty('--typing-font', fontObj.family);
        }
        setArenaKey(prev => prev + 1);
    }, [selectedFont, fontSize]);

    // Typing State
    const [words, setWords] = useState([]);
    const [engineState, setEngineState] = useState({
        currentWordIdx: 0,
        currentLetterIdx: 0,
        inputBuffer: '',
        timeLeft: 30,
        stats: {
            wpm: 0,
            rawWpm: 0,
            accuracy: 100,
            correctChars: 0,
            incorrectChars: 0,
            extraChars: 0,
            totalKeystrokes: 0,
            timeElapsed: 0
        }
    });

    const [isFocused, setIsFocused] = useState(true);
    const [isFinished, setIsFinished] = useState(false);
    const [finalStats, setFinalStats] = useState(null);
    const [highScore, setHighScore] = useState(() => {
        try {
            return parseInt(localStorage.getItem('pos_typing_highscore') || '0', 10);
        } catch (e) {
            return 0;
        }
    });

    const [caretPos, setCaretPos] = useState({ left: 0, top: 0 });

    const hiddenInputRef = useRef(null);
    const freeTextareaRef = useRef(null);
    const wordsWrapperRef = useRef(null);
    const engineRef = useRef(null);
    const tipsRef = useRef(null);

    // Live WPM calculation timer for Free Scratchpad Mode
    useEffect(() => {
        if (mode !== 'free' || !freeStartTime) return;
        const interval = setInterval(() => {
            const elapsedMins = (Date.now() - freeStartTime) / 60000;
            if (elapsedMins > 0.02) {
                // Tiêu chuẩn 5 ký tự = 1 từ
                const wpm = Math.round((freeTotalKeystrokes / 5) / elapsedMins);
                setFreeLiveWpm(wpm);
            }
        }, 300);
        return () => clearInterval(interval);
    }, [mode, freeStartTime, freeTotalKeystrokes]);

    // Click outside to close Tips Popover
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (tipsRef.current && !tipsRef.current.contains(e.target)) {
                setShowVietnameseTips(false);
            }
        };
        if (showVietnameseTips) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showVietnameseTips]);

    // Trích xuất kho từ vựng động từ danh sách sản phẩm POS trong Database
    const dynamicPosWords = useMemo(() => {
        const wordsSet = new Set(POS_PRODUCT_WORDS);
        if (Array.isArray(productsData) && productsData.length > 0) {
            productsData.forEach(p => {
                if (p.name) {
                    // Tách tên sản phẩm thành các từ đơn
                    const tokens = p.name.split(/[\s,()\-+/]+/).map(t => t.trim().toLowerCase()).filter(t => t.length >= 2);
                    tokens.forEach(t => wordsSet.add(t));
                }
                if (p.unit) {
                    const u = p.unit.trim().toLowerCase();
                    if (u) wordsSet.add(u);
                }
                if (p.category) {
                    const catTokens = p.category.split(/[\s,()\-+/]+/).map(t => t.trim().toLowerCase()).filter(t => t.length >= 2);
                    catTokens.forEach(t => wordsSet.add(t));
                }
            });
        }
        return Array.from(wordsSet);
    }, [productsData]);

    // Initialize Words based on mode
    const generateWords = useCallback(() => {
        let wordsList = [];
        if (mode === 'pos') {
            const pool = dynamicPosWords.length > 0 ? dynamicPosWords : POS_PRODUCT_WORDS;
            const shuffled = shuffleArray(pool);
            wordsList = shuffled.slice(0, wordLimit);
        } else if (mode === 'words') {
            const shuffled = shuffleArray(VIETNAMESE_WORDS);
            wordsList = shuffled.slice(0, wordLimit);
        } else if (mode === 'time') {
            const posPool = dynamicPosWords.length > 0 ? dynamicPosWords : POS_PRODUCT_WORDS;
            const pool = shuffleArray([...posPool, ...VIETNAMESE_WORDS]);
            wordsList = pool.slice(0, 80);
        } else if (mode === 'proverbs') {
            const item = VIETNAMESE_PROVERBS[Math.floor(Math.random() * VIETNAMESE_PROVERBS.length)];
            wordsList = item.split(/\s+/);
        } else if (mode === 'quotes') {
            const item = VIETNAMESE_QUOTES[Math.floor(Math.random() * VIETNAMESE_QUOTES.length)];
            wordsList = item.split(/\s+/);
        } else if (mode === 'lyrics') {
            if (selectedSong && selectedSong.lyrics) {
                wordsList = selectedSong.lyrics.replace(/\n+/g, ' ').trim().split(/\s+/);
            }
        }
        return wordsList;
    }, [mode, wordLimit, selectedSong, dynamicPosWords]);

    // Update Caret Position (Hardware Accelerated via requestAnimationFrame)
    const updateCaret = useCallback((currentWordIdx, inputBuffer) => {
        requestAnimationFrame(() => {
            if (!wordsWrapperRef.current) return;
            const wrapper = wordsWrapperRef.current;
            const wordEl = document.getElementById(`type-word-${currentWordIdx}`);
            if (!wordEl) return;

            const letters = wordEl.querySelectorAll('.type-letter');
            const wrapperRect = wrapper.getBoundingClientRect();
            const wordRect = wordEl.getBoundingClientRect();

            let targetLeft = 0;
            let targetTop = 0;
            const lineHeight = fontSize * 1.5 + 20; // 20px gap-y-5
            const caretHeight = fontSize * 1.25;

            const letterIdx = inputBuffer.length;
            if (letterIdx === 0) {
                if (letters.length > 0) {
                    const firstLetterRect = letters[0].getBoundingClientRect();
                    targetLeft = (firstLetterRect.left - wrapperRect.left) + wrapper.scrollLeft;
                    targetTop = (firstLetterRect.top - wrapperRect.top) + wrapper.scrollTop + (firstLetterRect.height - caretHeight) / 2;
                } else {
                    targetLeft = (wordRect.left - wrapperRect.left) + wrapper.scrollLeft;
                    targetTop = (wordRect.top - wrapperRect.top) + wrapper.scrollTop + (wordRect.height - caretHeight) / 2;
                }
            } else if (letterIdx <= letters.length) {
                const lastLetter = letters[letterIdx - 1];
                const letRect = lastLetter.getBoundingClientRect();
                targetLeft = (letRect.right - wrapperRect.left) + wrapper.scrollLeft;
                targetTop = (letRect.top - wrapperRect.top) + wrapper.scrollTop + (letRect.height - caretHeight) / 2;
            } else {
                const allLetters = wordEl.querySelectorAll('.type-letter');
                const lastEl = allLetters[allLetters.length - 1] || wordEl;
                const letRect = lastEl.getBoundingClientRect();
                targetLeft = (letRect.right - wrapperRect.left) + wrapper.scrollLeft;
                targetTop = (letRect.top - wrapperRect.top) + wrapper.scrollTop + (letRect.height - caretHeight) / 2;
            }

            setCaretPos({ left: targetLeft, top: Math.max(0, targetTop) });

            // Auto Scroll mượt mà giữ dòng gõ luôn ở tầm nhìn thoải mái (scroll khi sang dòng thứ 3)
            const wordOffsetTop = wordEl.offsetTop - wrapper.offsetTop;
            const threshold = lineHeight * 1.5;
            if (wordOffsetTop > threshold) {
                wrapper.scrollTo({
                    top: wordOffsetTop - lineHeight * 0.8,
                    behavior: 'smooth'
                });
            } else if (wordOffsetTop <= lineHeight * 0.5) {
                wrapper.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        });
    }, [fontSize, selectedFont]);

    // Initialize Engine & Words
    const resetGame = useCallback((overrideWords = null, overrideSong = null) => {
        const activeSong = (overrideSong && typeof overrideSong === 'object' && overrideSong.lyrics) ? overrideSong : selectedSong;
        let newWords = (overrideWords && (Array.isArray(overrideWords) || typeof overrideWords === 'string')) ? overrideWords : null;
        
        if (!newWords) {
            if (mode === 'lyrics') {
                if (activeSong && activeSong.lyrics) {
                    newWords = activeSong.lyrics
                        .replace(/\r\n/g, '\n')
                        .split(/\n+/)
                        .map(line => line.trim())
                        .filter(Boolean)
                        .join(' ')
                        .split(/\s+/)
                        .filter(Boolean);
                } else {
                    newWords = [];
                }
            } else {
                newWords = generateWords();
            }
        }

        if (!newWords || !Array.isArray(newWords) || newWords.length === 0) {
            newWords = ["LyangPOS", "Luyện", "Gõ", "Phím", "Tiếng", "Việt"];
        }

        setWords(newWords);
        setIsFinished(false);
        setFinalStats(null);
        setArenaKey(prev => prev + 1); // Kích hoạt hiệu ứng smooth transition cho toàn bộ từ khóa

        if (engineRef.current) {
            engineRef.current.mode = mode;
            engineRef.current.timeLimit = mode === 'time' ? timeLimit : 0;
            engineRef.current.setWords(newWords);
        }

        setEngineState({
            currentWordIdx: 0,
            currentLetterIdx: 0,
            inputBuffer: '',
            timeLeft: timeLimit,
            stats: {
                wpm: 0,
                rawWpm: 0,
                accuracy: 100,
                correctChars: 0,
                incorrectChars: 0,
                extraChars: 0,
                totalKeystrokes: 0,
                timeElapsed: 0
            }
        });

        // Reset free mode states
        setFreeModeTypedText('');
        setFreeStartTime(null);
        setFreeTotalKeystrokes(0);
        setFreeLiveWpm(0);

        if (wordsWrapperRef.current) {
            wordsWrapperRef.current.scrollTop = 0;
        }

        setTimeout(() => {
            if (mode === 'free') {
                if (freeTextareaRef.current) {
                    freeTextareaRef.current.value = '';
                    freeTextareaRef.current.focus();
                }
            } else {
                if (hiddenInputRef.current) {
                    hiddenInputRef.current.value = '';
                    hiddenInputRef.current.focus();
                }
                updateCaret(0, '');
            }
        }, 50);

        // Play Song Music if lyrics mode
        if (mode === 'lyrics' && activeSong && musicEnabled) {
            musicPlayer.playSong(activeSong);
        } else {
            musicPlayer.stop();
        }
    }, [generateWords, mode, timeLimit, selectedSong, musicEnabled, updateCaret]);

    // Setup Engine on Mount / Mode change
    useEffect(() => {
        soundEngine.setSoundType(soundType);
    }, [soundType]);

    // Handle Keyboard Shortcuts (Enter -> Bài Mới, Escape -> Đóng Bảng) when Result Modal is open
    useEffect(() => {
        if (!isFinished) return;
        const handleResultModalKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                resetGame();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setIsFinished(false);
            }
        };
        window.addEventListener('keydown', handleResultModalKeyDown);
        return () => window.removeEventListener('keydown', handleResultModalKeyDown);
    }, [isFinished, resetGame]);

    useEffect(() => {
        const engine = new TypingEngine({
            onUpdateStats: (state) => {
                setEngineState(state);
                updateCaret(state.currentWordIdx, state.inputBuffer);
            },
            onFinish: (stats) => {
                setIsFinished(true);
                setFinalStats(stats);
                if (stats.wpm > highScore) {
                    setHighScore(stats.wpm);
                    localStorage.setItem('pos_typing_highscore', stats.wpm.toString());
                }
                musicPlayer.stop();
            }
        });
        engineRef.current = engine;
        resetGame();

        return () => {
            if (engineRef.current) {
                engineRef.current.reset();
            }
            musicPlayer.stop();
        };
    }, [mode, timeLimit, wordLimit, selectedSong]);

    // Keyboard Input Handling
    const handleInputChange = (e) => {
        const val = e.target.value;
        if (engineRef.current) {
            const nextVal = engineRef.current.handleInput(val);
            if (nextVal === '') {
                if (hiddenInputRef.current) hiddenInputRef.current.value = '';
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Backspace') {
            if (engineRef.current && hiddenInputRef.current && hiddenInputRef.current.value === '') {
                const steppedBack = engineRef.current.handleBackspace();
                if (steppedBack) {
                    hiddenInputRef.current.value = engineRef.current.inputBuffer;
                }
            }
        } else if (e.key === 'Tab' || (e.key === 'Enter' && e.ctrlKey)) {
            e.preventDefault();
            resetGame();
        }
    };

    // Keep hidden input focused when clicking arena
    const focusHiddenInput = () => {
        if (hiddenInputRef.current) {
            hiddenInputRef.current.focus();
            setIsFocused(true);
        }
    };

    const getSelectedFontFamily = () => {
        const f = TYPING_FONTS.find(item => item.id === selectedFont);
        return f ? f.family : "'Inter', sans-serif";
    };

    return (
        <div className="typing-practice-root w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-between p-4 md:p-6 select-none relative max-w-6xl mx-auto overflow-hidden">
            
            {/* Dynamic CSS Override for Typing Arena Fonts */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    .typing-practice-root .typing-custom-font,
                    .typing-practice-root .typing-custom-font *,
                    .typing-practice-root .type-letter,
                    .typing-practice-root [id^="type-word-"] {
                        font-family: ${getSelectedFontFamily()} !important;
                    }
                `
            }} />
            
            {/* BACKGROUND ARTISTIC GLYPHS & LYANGPOS WATERMARK LOGO */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none opacity-40 dark:opacity-25 transition-opacity">
                {/* Large Center LyangPOS Watermark Crest */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
                    <div className="relative flex items-center justify-center">
                        <Keyboard className="w-[360px] h-[360px] sm:w-[480px] sm:h-[480px] text-[#2d5016]/[0.035] dark:text-emerald-400/[0.045] transform -rotate-6" />
                        <span className="absolute font-mono font-black text-6xl sm:text-8xl tracking-widest text-[#2d5016]/[0.03] dark:text-emerald-400/[0.04] uppercase">
                            LYANGPOS
                        </span>
                    </div>
                </div>

                {/* Floating Geometric Glyphs around corners */}
                <div className="absolute top-6 left-8 transform -rotate-12 text-[#2d5016]/[0.05] dark:text-emerald-400/[0.07]">
                    <Sparkles size={80} />
                </div>
                <div className="absolute top-16 right-12 transform rotate-45 text-[#2d5016]/[0.04] dark:text-emerald-400/[0.06]">
                    <Zap size={100} />
                </div>
                <div className="absolute bottom-20 left-12 transform 15 text-[#2d5016]/[0.05] dark:text-emerald-400/[0.07]">
                    <BookOpen size={90} />
                </div>
                <div className="absolute bottom-12 right-16 transform -rotate-12 text-[#2d5016]/[0.05] dark:text-emerald-400/[0.07]">
                    <Trophy size={95} />
                </div>
                <div className="absolute top-1/3 left-10 transform rotate-12 text-[#2d5016]/[0.04] dark:text-emerald-400/[0.06]">
                    <Disc size={75} />
                </div>
                <div className="absolute top-1/3 right-8 transform -rotate-15 text-[#2d5016]/[0.04] dark:text-emerald-400/[0.06]">
                    <Music size={80} />
                </div>
            </div>

            {/* Hidden Input for seamless typing (supports all Vietnamese IMEs) */}
            <input
                ref={hiddenInputRef}
                type="text"
                className="absolute opacity-0 pointer-events-none -top-96"
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={() => setIsFocused(false)}
                onFocus={() => setIsFocused(true)}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
            />

            {/* TOP HEADER & CONTROLS */}
            <div className="w-full flex flex-col gap-4 relative z-10">
                
                {/* Brand & High Score Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-black/10 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#2d5016] text-white flex items-center justify-center shadow-lg shadow-[#2d5016]/20">
                            <Keyboard size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-extrabold uppercase tracking-wide text-[#2d5016] dark:text-emerald-400">
                                    Luyện Gõ Phím
                                </h1>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#2d5016]/10 dark:bg-emerald-500/20 text-[#2d5016] dark:text-emerald-300 border border-[#2d5016]/20">
                                    MONKEYTYPE STYLE
                                </span>
                            </div>
                            <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
                                Nâng cao tốc độ thao tác máy POS & phản xạ gõ dấu tiếng Việt
                            </p>
                        </div>
                    </div>

                    {/* Quick Stats & Audio Pill */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                        {/* High score badge */}
                        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-bold shadow-sm">
                            <Trophy size={15} className="text-amber-600 dark:text-amber-400" />
                            <span>Kỷ lục: <strong className="font-mono text-sm text-amber-700 dark:text-amber-400">{highScore}</strong> WPM</span>
                        </div>

                        {/* Sound Effect Select */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 shadow-sm">
                            <Volume2 size={15} className="text-[#2d5016] dark:text-emerald-400 shrink-0" />
                            <select
                                value={soundType}
                                onChange={(e) => setSoundType(e.target.value)}
                                className="bg-transparent border-none outline-none text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer pr-1"
                            >
                                {SOUND_OPTIONS.map(opt => (
                                    <option key={opt.id} value={opt.id} className="bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200">
                                        {opt.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Background Music Toggle */}
                        {mode === 'lyrics' && (
                            <button
                                onClick={() => {
                                    const nextState = !musicEnabled;
                                    setMusicEnabled(nextState);
                                    if (nextState && selectedSong) {
                                        musicPlayer.playSong(selectedSong);
                                    } else {
                                        musicPlayer.stop();
                                    }
                                }}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer ${
                                    musicEnabled
                                        ? 'bg-purple-600 text-white border-purple-600 shadow-purple-500/20'
                                        : 'bg-white/80 dark:bg-stone-800/80 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                                }`}
                            >
                                <Music size={14} className={musicEnabled ? 'animate-spin' : ''} />
                                Nhạc nền: {musicEnabled ? 'Bật' : 'Tắt'}
                            </button>
                        )}
                    </div>
                </div>

                {/* MODES NAVIGATION BAR (Ultra Clean & High Contrast with Smooth Motion Tabs) */}
                <div className="w-full flex items-center justify-between gap-3 flex-wrap bg-white/80 dark:bg-[#121812]/80 backdrop-blur-xl p-2 rounded-2xl border border-[#2d5016]/20 dark:border-emerald-500/20 shadow-md shadow-[#2d5016]/5">
                    
                    {/* Mode Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                            { id: 'pos', label: 'Hàng Hóa POS', icon: Package },
                            { id: 'words', label: 'Từ Vựng', icon: Sparkles },
                            { id: 'time', label: 'Thời Gian', icon: Clock },
                            { id: 'proverbs', label: 'Ca Dao & Tục Ngữ', icon: BookOpen },
                            { id: 'quotes', label: 'Danh Ngôn', icon: Quote },
                            { id: 'lyrics', label: 'Ca Từ & Thơ', icon: Disc },
                            { id: 'free', label: 'Gõ Tự Do', icon: Feather }
                        ].map(mItem => {
                            const IconComponent = mItem.icon;
                            const isActive = mode === mItem.id;
                            return (
                                <button
                                    key={mItem.id}
                                    onClick={() => setMode(mItem.id)}
                                    className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        isActive
                                            ? 'text-white'
                                            : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800'
                                    }`}
                                >
                                    {isActive && (
                                        <m.div
                                            layoutId="active-mode-indicator"
                                            className="absolute inset-0 bg-[#2d5016] rounded-xl shadow-md shadow-[#2d5016]/25 z-0"
                                            transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-1.5">
                                        <IconComponent size={15} />
                                        {mItem.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Mode Sub-Settings (Time / Word count / Song selection & Search Online) */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {mode === 'time' && (
                            <div className="flex items-center gap-1 bg-stone-200/80 dark:bg-stone-800 p-1 rounded-xl border border-stone-300 dark:border-stone-700">
                                {[15, 30, 60].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTimeLimit(t)}
                                        className={`relative px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                            timeLimit === t
                                                ? 'text-white'
                                                : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white'
                                        }`}
                                    >
                                        {timeLimit === t && (
                                            <m.div
                                                layoutId="active-time-indicator"
                                                className="absolute inset-0 bg-[#2d5016] rounded-lg shadow-sm z-0"
                                                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                            />
                                        )}
                                        <span className="relative z-10">{t}s</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {(mode === 'pos' || mode === 'words') && (
                            <div className="flex items-center gap-1 bg-stone-200/80 dark:bg-stone-800 p-1 rounded-xl border border-stone-300 dark:border-stone-700">
                                {[10, 25, 50].map((w) => (
                                    <button
                                        key={w}
                                        onClick={() => setWordLimit(w)}
                                        className={`relative px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                            wordLimit === w
                                                ? 'text-white'
                                                : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white'
                                        }`}
                                    >
                                        {wordLimit === w && (
                                            <m.div
                                                layoutId="active-wordlimit-indicator"
                                                className="absolute inset-0 bg-[#2d5016] rounded-lg shadow-sm z-0"
                                                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                            />
                                        )}
                                        <span className="relative z-10">{w} từ</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {mode === 'lyrics' && (
                            <div className="flex items-center gap-2">
                                <CustomSelect
                                    value={selectedSong ? selectedSong.id : ''}
                                    onChange={(val) => {
                                        const s = customSongs.find(item => item.id === val);
                                        if (s) {
                                            setSelectedSong(s);
                                            resetGame(null, s);
                                        }
                                    }}
                                    options={customSongs.map(song => ({
                                        value: song.id,
                                        label: `${song.title} - ${song.author}`
                                    }))}
                                    className="!py-1.5 !px-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 min-w-[180px] max-w-[240px]"
                                    dropdownClassName="w-64 text-xs font-bold z-[9999]"
                                />

                                <button
                                    onClick={() => {
                                        setSearchLyricsQuery('');
                                        setSearchResults([]);
                                        setSearchError('');
                                        setShowSearchModal(true);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all whitespace-nowrap cursor-pointer"
                                    title="Tìm kiếm lời bài hát trực tuyến"
                                >
                                    <Search size={14} />
                                    Tìm Online
                                </button>
                            </div>
                        )}

                        {/* Font Size Selector with Smooth Indicator */}
                        <div className="flex items-center gap-1 bg-stone-200/80 dark:bg-stone-800 p-1 rounded-xl border border-stone-300 dark:border-stone-700">
                            {[
                                { size: 26, label: 'Nhỏ' },
                                { size: 32, label: 'Vừa' },
                                { size: 38, label: 'Lớn' }
                            ].map((s) => (
                                <button
                                    key={s.size}
                                    onClick={() => setFontSize(s.size)}
                                    className={`relative px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                        fontSize === s.size
                                            ? 'text-white'
                                            : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white'
                                    }`}
                                >
                                    {fontSize === s.size && (
                                        <m.div
                                            layoutId="active-fontsize-indicator"
                                            className="absolute inset-0 bg-[#2d5016] rounded-lg shadow-sm z-0"
                                            transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                        />
                                    )}
                                    <span className="relative z-10">{s.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Font Family Styled Select */}
                        <div className="relative inline-flex items-center">
                            <select
                                value={selectedFont}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedFont(val);
                                    setTimeout(() => updateCaret(engineState.currentWordIdx, engineState.inputBuffer), 50);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 outline-none cursor-pointer shadow-sm min-w-[200px]"
                            >
                                {TYPING_FONTS.map(f => (
                                    <option 
                                        key={f.id} 
                                        value={f.id}
                                        className="bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold"
                                    >
                                        {f.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* LIVE DASHBOARD STATS (Ultra Premium Glassmorphism Theme Cards) */}
            <div className="w-full grid grid-cols-3 gap-3.5 md:gap-5 my-4 max-w-3xl relative z-10">
                {/* WPM Speed Card */}
                <div className="relative group overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-white/95 to-[#faf8f3]/90 dark:from-[#151c14]/95 dark:to-[#0d120d]/90 border border-[#2d5016]/20 dark:border-emerald-500/30 shadow-lg shadow-[#2d5016]/5 dark:shadow-emerald-950/40 backdrop-blur-xl flex flex-col items-center justify-center transition-all duration-300 hover:border-[#2d5016]/40 dark:hover:border-emerald-400/50 hover:shadow-xl hover:-translate-y-0.5">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#2d5016]/5 dark:bg-emerald-500/10 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
                    <div className="flex items-center gap-1.5 text-[11px] uppercase font-black tracking-widest text-[#2d5016]/70 dark:text-emerald-400/80">
                        <Zap size={13} className="text-[#2d5016] dark:text-emerald-400 animate-pulse" />
                        Tốc độ (WPM)
                    </div>
                    <span className="text-3xl sm:text-5xl font-black font-mono tracking-tight text-[#2d5016] dark:text-emerald-400 mt-1 drop-shadow-xs">
                        {mode === 'free' ? freeLiveWpm : engineState.stats.wpm}
                    </span>
                    <span className="text-[10px] font-bold text-stone-600 dark:text-stone-300 mt-0.5">từ / phút</span>
                </div>

                {/* Accuracy or Word Count Card */}
                <div className="relative group overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-white/95 to-[#faf8f3]/90 dark:from-[#151c14]/95 dark:to-[#0d120d]/90 border border-[#8b6f47]/20 dark:border-emerald-500/20 shadow-lg shadow-[#8b6f47]/5 dark:shadow-emerald-950/40 backdrop-blur-xl flex flex-col items-center justify-center transition-all duration-300 hover:border-[#8b6f47]/40 dark:hover:border-emerald-400/40 hover:shadow-xl hover:-translate-y-0.5">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 dark:bg-emerald-500/10 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
                    <div className="flex items-center gap-1.5 text-[11px] uppercase font-black tracking-widest text-amber-800/80 dark:text-amber-400/90">
                        <Sparkles size={13} className="text-amber-600 dark:text-amber-400" />
                        {mode === 'free' ? 'Số từ đã gõ' : 'Chính xác'}
                    </div>
                    <span className="text-3xl sm:text-5xl font-black font-mono tracking-tight text-amber-700 dark:text-amber-400 mt-1 drop-shadow-xs">
                        {mode === 'free' ? (
                            freeModeTypedText.trim() ? freeModeTypedText.trim().split(/\s+/).length : 0
                        ) : (
                            <>{engineState.stats.accuracy}<span className="text-2xl font-bold opacity-80">%</span></>
                        )}
                    </span>
                    <span className="text-[10px] font-bold text-stone-600 dark:text-stone-300 mt-0.5">
                        {mode === 'free' ? `${freeModeTypedText.length} ký tự` : 'độ chuẩn xác'}
                    </span>
                </div>

                {/* Time Elapsed / Left Card */}
                <div className="relative group overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-white/95 to-[#faf8f3]/90 dark:from-[#151c14]/95 dark:to-[#0d120d]/90 border border-emerald-600/20 dark:border-teal-500/25 shadow-lg shadow-emerald-900/5 dark:shadow-teal-950/40 backdrop-blur-xl flex flex-col items-center justify-center transition-all duration-300 hover:border-emerald-600/40 dark:hover:border-teal-400/40 hover:shadow-xl hover:-translate-y-0.5">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 dark:bg-teal-500/10 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
                    <div className="flex items-center gap-1.5 text-[11px] uppercase font-black tracking-widest text-emerald-800/80 dark:text-teal-400/90">
                        <Clock size={13} className="text-emerald-700 dark:text-teal-400" />
                        {mode === 'time' ? 'Còn lại' : 'Thời gian'}
                    </div>
                    <span className="text-3xl sm:text-5xl font-black font-mono tracking-tight text-emerald-800 dark:text-teal-300 mt-1 drop-shadow-xs">
                        {mode === 'time' ? (
                            `${engineState.timeLeft}`
                        ) : mode === 'free' ? (
                            freeStartTime ? Math.floor((Date.now() - freeStartTime) / 1000) : 0
                        ) : (
                            `${engineState.stats.timeElapsed}`
                        )}
                        <span className="text-2xl font-bold opacity-80">s</span>
                    </span>
                    <span className="text-[10px] font-bold text-stone-600 dark:text-stone-300 mt-0.5">thời gian gõ</span>
                </div>
            </div>

            {/* TYPING ARENA BOX (Theme-Colored Premium Card with Glowing Aura & High Contrast Text) */}
            {mode === 'free' ? (
                /* FREE SCRATCHPAD ARENA (Không có chữ mẫu, gõ tự do bất kỳ điều gì bạn muốn) */
                <div
                    className="typing-custom-font w-full relative z-10 rounded-[2.2rem] border border-[#2d5016]/40 dark:border-emerald-500/50 bg-white/95 dark:bg-[#0c120c]/95 shadow-2xl shadow-[#2d5016]/10 dark:shadow-emerald-950/50 ring-4 ring-[#2d5016]/10 dark:ring-emerald-500/20 transition-all duration-300 py-6 px-6 md:px-8 cursor-text overflow-hidden"
                    style={{ 
                        fontFamily: getSelectedFontFamily(),
                        '--typing-font': getSelectedFontFamily(),
                        minHeight: `${Math.round(fontSize * 1.5 * 3 + 40 + 48)}px`
                    }}
                    onClick={() => {
                        if (freeTextareaRef.current) {
                            freeTextareaRef.current.focus();
                        }
                    }}
                >
                    {/* Ambient glow accent corners */}
                    <div className="absolute -top-16 -left-16 w-44 h-44 bg-[#2d5016]/[0.06] dark:bg-emerald-500/[0.08] rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-[#8b6f47]/[0.08] dark:bg-emerald-400/[0.06] rounded-full blur-3xl pointer-events-none" />

                    <div className="relative w-full h-full flex flex-col justify-between">
                        <textarea
                            ref={freeTextareaRef}
                            value={freeModeTypedText}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (!freeStartTime && val.length > 0) {
                                    setFreeStartTime(Date.now());
                                }
                                setFreeTotalKeystrokes(prev => prev + 1);
                                setFreeModeTypedText(val);
                                soundEngine.playKeySound(val.endsWith(' '));
                            }}
                            placeholder="Gõ tự do bất kỳ điều gì bạn muốn tại đây... (Không giới hạn, hỗ trợ tiếng Việt đầy đủ)"
                            rows={4}
                            className="w-full bg-transparent border-none outline-none resize-none font-bold text-stone-800 dark:text-stone-100 placeholder:text-stone-400/60 dark:placeholder:text-stone-600 select-text"
                            style={{
                                fontSize: `${fontSize}px`,
                                lineHeight: `${fontSize * 1.5}px`,
                                minHeight: `${Math.round(fontSize * 1.5 * 3)}px`,
                                fontFamily: getSelectedFontFamily()
                            }}
                            autoFocus
                        />

                        <div className="flex items-center justify-between pt-3 border-t border-stone-200/80 dark:border-stone-800/80 text-xs text-stone-500 dark:text-stone-400 font-semibold select-none">
                            <span className="flex items-center gap-1.5">
                                <Feather size={14} className="text-[#2d5016] dark:text-emerald-400" />
                                Chế độ gõ tự do không giới hạn • Tự động tính WPM
                            </span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFreeModeTypedText('');
                                    setFreeStartTime(null);
                                    setFreeTotalKeystrokes(0);
                                    setFreeLiveWpm(0);
                                    if (freeTextareaRef.current) freeTextareaRef.current.focus();
                                }}
                                className="px-3 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-all font-bold cursor-pointer"
                            >
                                Xóa bảng
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* REGULAR TYPING ARENA BOX (Chế độ gõ theo từ mẫu) */
                <div
                    onClick={focusHiddenInput}
                    className={`typing-custom-font w-full relative z-10 rounded-[2.2rem] border transition-all duration-300 py-7 px-5 md:px-8 cursor-text overflow-hidden ${
                        isFocused
                            ? 'bg-white/95 dark:bg-[#0c120c]/95 border-[#2d5016]/40 dark:border-emerald-500/50 shadow-2xl shadow-[#2d5016]/10 dark:shadow-emerald-950/50 ring-4 ring-[#2d5016]/10 dark:ring-emerald-500/20'
                            : 'bg-white/85 dark:bg-[#0c120c]/80 border-[#8b6f47]/25 dark:border-stone-800 shadow-md opacity-85 hover:opacity-100 hover:border-[#2d5016]/30'
                    }`}
                    style={{ 
                        fontFamily: getSelectedFontFamily(),
                        '--typing-font': getSelectedFontFamily(),
                        minHeight: `${Math.round(fontSize * 1.5 * 3 + 40 + 48)}px`
                    }}
                >
                    {/* Ambient glow accent corners */}
                    <div className="absolute -top-16 -left-16 w-44 h-44 bg-[#2d5016]/[0.06] dark:bg-emerald-500/[0.08] rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-[#8b6f47]/[0.08] dark:bg-emerald-400/[0.06] rounded-full blur-3xl pointer-events-none" />

                    {/* Out of focus overlay notice */}
                    {!isFocused && (
                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-stone-900/25 dark:bg-black/60 backdrop-blur-[2.5px] transition-all">
                            <div className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#2d5016] to-[#3a681d] text-white font-black text-sm shadow-2xl shadow-[#2d5016]/40 animate-bounce border border-emerald-400/30">
                                <Zap size={18} className="text-amber-300 fill-amber-300" />
                                Nhấp vào đây để tiếp tục gõ
                            </div>
                        </div>
                    )}

                    {/* Words Wrapper Container (Hiển thị trọn vẹn đúng 3 dòng cho cả cỡ Nhỏ, Vừa, Lớn & Chuyển Động Mượt Mà) */}
                    <AnimatePresence mode="wait">
                        <m.div
                            key={arenaKey}
                            initial={{ opacity: 0, y: 6, filter: 'blur(3px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -6, filter: 'blur(3px)' }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            ref={wordsWrapperRef}
                            className="relative w-full overflow-y-auto flex flex-wrap content-start items-center gap-x-4 gap-y-5 select-none scroll-smooth pb-4 will-change-scroll"
                            style={{ 
                                fontSize: `${fontSize}px`, 
                                lineHeight: `${fontSize * 1.5}px`,
                                height: `${Math.round(fontSize * 1.5 * 3 + 40 + 12)}px`,
                                contain: 'layout style paint'
                            }}
                        >
                            {/* Animated Smooth Caret (Hardware Accelerated with translate3d) */}
                            <div
                                className="absolute w-[3.5px] bg-[#2d5016] dark:bg-emerald-400 rounded-full z-10 pointer-events-none shadow-sm will-change-transform animate-pulse"
                                style={{
                                    transform: `translate3d(${caretPos.left}px, ${caretPos.top}px, 0)`,
                                    height: `${fontSize * 1.25}px`,
                                    top: 0,
                                    left: 0,
                                    transition: 'transform 0.08s ease-out'
                                }}
                            />

                            {/* Words & Letters Render (Memoized for 0% redundant GPU/CPU load) */}
                            {words.map((targetWord, wIdx) => {
                                const isCurrent = wIdx === engineState.currentWordIdx;
                                const isPast = wIdx < engineState.currentWordIdx;
                                const inputBuf = isCurrent ? engineState.inputBuffer : '';
                                const pastTyped = isPast && engineRef.current ? engineRef.current.typedHistory[wIdx] : null;

                                return (
                                    <MemoizedWord
                                        key={wIdx}
                                        targetWord={targetWord}
                                        wIdx={wIdx}
                                        isCurrent={isCurrent}
                                        isPast={isPast}
                                        inputBuf={inputBuf}
                                        pastTyped={pastTyped}
                                        fontFamily={getSelectedFontFamily()}
                                    />
                                );
                            })}
                        </m.div>
                    </AnimatePresence>
                </div>
            )}

            {/* RESTART & SHORTCUT HINTS */}
            <div className="w-full flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600 dark:text-stone-400 font-semibold mt-4 px-2 relative z-10">
                <div className="flex items-center gap-2">
                    <button
                        onClick={resetGame}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold border border-stone-300 dark:border-stone-700 shadow-sm transition-all cursor-pointer"
                    >
                        <RotateCcw size={15} />
                        Làm Mới (Tab / Ctrl + Enter)
                    </button>

                    {/* Button Bật / Tắt Popover Mẹo Gõ Tiếng Việt */}
                    <div className="relative" ref={tipsRef}>
                        <button
                            onClick={() => setShowVietnameseTips(!showVietnameseTips)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer ${
                                showVietnameseTips
                                    ? 'bg-[#2d5016] text-white border-[#2d5016] shadow-md shadow-[#2d5016]/20'
                                    : 'bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700'
                            }`}
                            title="Bấm để mở bảng tra cứu phím gõ Telex & VNI"
                        >
                            <HelpCircle size={15} />
                            Mẹo gõ Telex & VNI
                            {showVietnameseTips ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {/* FLOATING POPOVER (Hiển thị nổi thông minh, không đẩy layout, chống rớt dòng) */}
                        <AnimatePresence>
                            {showVietnameseTips && (
                                <m.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute bottom-full left-0 mb-3 w-[360px] sm:w-[580px] md:w-[660px] z-50 rounded-3xl bg-white/95 dark:bg-stone-900/95 border border-stone-300 dark:border-stone-800 p-5 shadow-2xl backdrop-blur-xl max-h-[85vh] overflow-y-auto"
                                    style={{
                                        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    {/* Header & Tabs */}
                                    <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-stone-200 dark:border-stone-800">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-xl bg-[#2d5016]/10 text-[#2d5016] dark:text-emerald-400">
                                                <Keyboard size={18} />
                                            </div>
                                            <h4 className="text-sm font-extrabold text-stone-900 dark:text-white whitespace-nowrap">
                                                Quy Tắc Gõ Tiếng Việt
                                            </h4>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Method Switcher Pill */}
                                            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-300 dark:border-stone-700">
                                                <button
                                                    onClick={() => setActiveMethodTab('telex')}
                                                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                                                        activeMethodTab === 'telex'
                                                            ? 'bg-[#2d5016] text-white shadow-sm'
                                                            : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white'
                                                    }`}
                                                >
                                                    TELEX
                                                </button>
                                                <button
                                                    onClick={() => setActiveMethodTab('vni')}
                                                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                                                        activeMethodTab === 'vni'
                                                            ? 'bg-[#2d5016] text-white shadow-sm'
                                                            : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white'
                                                    }`}
                                                >
                                                    VNI
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => setShowVietnameseTips(false)}
                                                className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                                                title="Đóng"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content for Selected Typing Method */}
                                    {activeMethodTab === 'telex' ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                            {/* Dấu thanh Telex */}
                                            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800">
                                                <h5 className="text-[11px] font-black uppercase tracking-wider text-[#2d5016] dark:text-emerald-400 mb-2.5 flex items-center gap-1.5 whitespace-nowrap">
                                                    <Sparkles size={13} /> Dấu Thanh (Telex)
                                                </h5>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700/80 gap-1.5 whitespace-nowrap">
                                                        <span className="font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap">Sắc ( / )</span>
                                                        <kbd className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-[#2d5016] dark:text-emerald-300 font-mono font-black border border-emerald-300 dark:border-emerald-800 shrink-0">S</kbd>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700/80 gap-1.5 whitespace-nowrap">
                                                        <span className="font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap">Huyền ( \ )</span>
                                                        <kbd className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-[#2d5016] dark:text-emerald-300 font-mono font-black border border-emerald-300 dark:border-emerald-800 shrink-0">F</kbd>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700/80 gap-1.5 whitespace-nowrap">
                                                        <span className="font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap">Hỏi ( ? )</span>
                                                        <kbd className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-[#2d5016] dark:text-emerald-300 font-mono font-black border border-emerald-300 dark:border-emerald-800 shrink-0">R</kbd>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700/80 gap-1.5 whitespace-nowrap">
                                                        <span className="font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap">Ngã ( ~ )</span>
                                                        <kbd className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-[#2d5016] dark:text-emerald-300 font-mono font-black border border-emerald-300 dark:border-emerald-800 shrink-0">X</kbd>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700/80 gap-1.5 whitespace-nowrap">
                                                        <span className="font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap">Nặng ( . )</span>
                                                        <kbd className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-[#2d5016] dark:text-emerald-300 font-mono font-black border border-emerald-300 dark:border-emerald-800 shrink-0">J</kbd>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700/80 gap-1.5 whitespace-nowrap">
                                                        <span className="font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap">Xóa dấu</span>
                                                        <kbd className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-mono font-black border border-amber-300 dark:border-amber-800 shrink-0">Z</kbd>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Chữ có mũ và móc Telex */}
                                            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800">
                                                <h5 className="text-[11px] font-black uppercase tracking-wider text-[#2d5016] dark:text-emerald-400 mb-2.5 flex items-center gap-1.5 whitespace-nowrap">
                                                    <Sparkles size={13} /> Mũ & Móc (Telex)
                                                </h5>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700/80 gap-1.5 whitespace-nowrap">
                                                        <span className="font-extrabold text-stone-900 dark:text-white whitespace-nowrap">Ă</span>
                                                        <kbd className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-mono font-black text-stone-800 dark:text-stone-200 shrink-0">AW</kbd>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700/80 gap-1.5 whitespace-nowrap">
                                                        <span className="font-extrabold text-stone-900 dark:text-white whitespace-nowrap">Â</span>
                                                        <kbd className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-mono font-black text-stone-800 dark:text-stone-200 shrink-0">AA</kbd>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700/80 gap-1.5 whitespace-nowrap">
                                                        <span className="font-extrabold text-stone-900 dark:text-white whitespace-nowrap">Ê</span>
                                                        <kbd className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-mono font-black text-stone-800 dark:text-stone-200 shrink-0">EE</kbd>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700/80 gap-1.5 whitespace-nowrap">
                                                        <span className="font-extrabold text-stone-900 dark:text-white whitespace-nowrap">Ô</span>
                                                        <kbd className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-mono font-black text-stone-800 dark:text-stone-200 shrink-0">OO</kbd>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700/80 gap-1.5 whitespace-nowrap">
                                                        <span className="font-extrabold text-stone-900 dark:text-white whitespace-nowrap">Ơ / Ư</span>
                                                        <kbd className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-mono font-black text-stone-800 dark:text-stone-200 shrink-0">OW / UW</kbd>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700/80 gap-1.5 whitespace-nowrap">
                                                        <span className="font-extrabold text-stone-900 dark:text-white whitespace-nowrap">Đ</span>
                                                        <kbd className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-mono font-black text-stone-800 dark:text-stone-200 shrink-0">DD</kbd>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                            {/* Dấu thanh VNI */}
                                            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800">
                                                <h5 className="text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2.5 flex items-center gap-1.5 whitespace-nowrap">
                                                    <Sparkles size={13} /> Dấu Thanh (VNI)
                                                </h5>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700/80 gap-1.5 whitespace-nowrap">
                                                        <span className="font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap">Sắc ( / )</span>
                                                        <kbd className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-mono font-black border border-blue-300 dark:border-blue-800 shrink-0 whitespace-nowrap">Phím 1</kbd>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700/80 gap-1.5 whitespace-nowrap">
                                                        <span className="font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap">Huyền ( \ )</span>
                                                        <kbd className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-mono font-black border border-blue-300 dark:border-blue-800 shrink-0 whitespace-nowrap">Phím 2</kbd>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700/80 gap-1.5 whitespace-nowrap">
                                                        <span className="font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap">Hỏi ( ? )</span>
                                                        <kbd className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-mono font-black border border-blue-300 dark:border-blue-800 shrink-0 whitespace-nowrap">Phím 3</kbd>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700/80 gap-1.5 whitespace-nowrap">
                                                        <span className="font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap">Ngã ( ~ )</span>
                                                        <kbd className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-mono font-black border border-blue-300 dark:border-blue-800 shrink-0 whitespace-nowrap">Phím 4</kbd>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700/80 gap-1.5 whitespace-nowrap">
                                                        <span className="font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap">Nặng ( . )</span>
                                                        <kbd className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-mono font-black border border-blue-300 dark:border-blue-800 shrink-0 whitespace-nowrap">Phím 5</kbd>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700/80 gap-1.5 whitespace-nowrap">
                                                        <span className="font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap">Xóa dấu</span>
                                                        <kbd className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-mono font-black border border-amber-300 dark:border-amber-800 shrink-0 whitespace-nowrap">Phím 0</kbd>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Chữ có mũ và móc VNI */}
                                            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800">
                                                <h5 className="text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2.5 flex items-center gap-1.5 whitespace-nowrap">
                                                    <Sparkles size={13} /> Mũ & Móc (VNI)
                                                </h5>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700/80 gap-1.5 whitespace-nowrap">
                                                        <span className="font-extrabold text-stone-900 dark:text-white whitespace-nowrap">Â, Ê, Ô (mũ)</span>
                                                        <kbd className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-mono font-black text-stone-800 dark:text-stone-200 shrink-0 whitespace-nowrap">+ 6</kbd>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700/80 gap-1.5 whitespace-nowrap">
                                                        <span className="font-extrabold text-stone-900 dark:text-white whitespace-nowrap">Ơ, Ư (móc)</span>
                                                        <kbd className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-mono font-black text-stone-800 dark:text-stone-200 shrink-0 whitespace-nowrap">+ 7</kbd>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700/80 gap-1.5 whitespace-nowrap">
                                                        <span className="font-extrabold text-stone-900 dark:text-white whitespace-nowrap">Ă (trăng)</span>
                                                        <kbd className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-mono font-black text-stone-800 dark:text-stone-200 shrink-0 whitespace-nowrap">A + 8</kbd>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700/80 gap-1.5 whitespace-nowrap">
                                                        <span className="font-extrabold text-stone-900 dark:text-white whitespace-nowrap">Đ (gạch)</span>
                                                        <kbd className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-mono font-black text-stone-800 dark:text-stone-200 shrink-0 whitespace-nowrap">D + 9</kbd>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </m.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-4 text-stone-600 dark:text-stone-400">
                    <span>Phím <kbd className="px-2 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-[11px] font-mono shadow-xs text-stone-800 dark:text-stone-200">Space</kbd> : Hoàn thành từ</span>
                    <span>Phím <kbd className="px-2 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-[11px] font-mono shadow-xs text-stone-800 dark:text-stone-200">Tab</kbd> : Bắt đầu lại</span>
                </div>
            </div>

            {/* SEARCH ONLINE LYRICS MODAL */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {showSearchModal && (
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        >
                            <m.div
                                initial={{ scale: 0.95, y: 15 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.95, y: 15 }}
                                className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 shadow-2xl flex flex-col gap-4 relative"
                            >
                                <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
                                            <Disc size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-stone-900 dark:text-white">
                                                Tìm Kiếm Lời Bài Hát Online
                                            </h3>
                                            <p className="text-xs text-stone-500">
                                                Tìm kiếm bài hát qua cơ sở dữ liệu LRCLIB & nhạc Việt
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowSearchModal(false)}
                                        className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Search Input Box */}
                                <form
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        if (!searchLyricsQuery.trim()) return;
                                        setIsSearchingLyrics(true);
                                        setSearchError('');
                                        try {
                                            const res = await LyricsService.searchOnline(searchLyricsQuery);
                                            if (res && res.length > 0) {
                                                setSearchResults(res);
                                            } else {
                                                setSearchResults([]);
                                                setSearchError('Không tìm thấy bài hát nào phù hợp. Bạn thử gõ từ khóa ngắn gọn hơn xem!');
                                            }
                                        } catch (err) {
                                            setSearchError('Lỗi khi tìm kiếm, vui lòng thử lại.');
                                        } finally {
                                            setIsSearchingLyrics(false);
                                        }
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700">
                                        <Search size={16} className="text-stone-400" />
                                        <input
                                            type="text"
                                            value={searchLyricsQuery}
                                            onChange={(e) => setSearchLyricsQuery(e.target.value)}
                                            placeholder="Nhập tên bài hát hoặc ca sĩ (VD: Diễm xưa, Áo mới Cà Mau...)"
                                            className="w-full bg-transparent border-none outline-none text-xs font-semibold text-stone-900 dark:text-white placeholder:text-stone-400"
                                            autoFocus
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSearchingLyrics}
                                        className="px-4 py-2.5 rounded-xl bg-[#2d5016] hover:bg-[#244012] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                                    >
                                        {isSearchingLyrics ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                                        Tìm
                                    </button>
                                </form>

                                {/* Search Results List */}
                                <div className="max-h-64 overflow-y-auto flex flex-col gap-2 pr-1">
                                    {isSearchingLyrics && (
                                        <div className="py-8 flex flex-col items-center justify-center text-stone-400 gap-2">
                                            <Loader2 size={24} className="animate-spin text-emerald-600" />
                                            <span className="text-xs font-medium">Đang tìm lời bài hát online...</span>
                                        </div>
                                    )}

                                    {searchError && (
                                        <div className="py-4 text-center text-xs text-rose-500 font-medium bg-rose-500/10 rounded-xl p-3">
                                            {searchError}
                                        </div>
                                    )}

                                    {!isSearchingLyrics && searchResults.length > 0 && (
                                        searchResults.map((song) => (
                                            <div
                                                key={song.id}
                                                onClick={() => {
                                                    setCustomSongs(prev => {
                                                        if (!prev.some(s => s.id === song.id)) {
                                                            return [song, ...prev];
                                                        }
                                                        return prev;
                                                    });
                                                    setSelectedSong(song);
                                                    setMode('lyrics');
                                                    setShowSearchModal(false);
                                                    resetGame(null, song);
                                                }}
                                                className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 cursor-pointer transition-all flex items-center justify-between group"
                                            >
                                                <div className="flex-1 pr-2">
                                                    <div className="text-xs font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                                        {song.title}
                                                    </div>
                                                    <div className="text-[11px] text-stone-500 font-medium">
                                                        {song.author} {song.album ? `• ${song.album}` : ''}
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                    Chọn bài
                                                </span>
                                            </div>
                                        ))
                                    )}

                                    {!isSearchingLyrics && searchResults.length === 0 && !searchError && (
                                        <div className="py-6 text-center text-xs text-stone-400">
                                            Gợi ý: Hãy nhập tên bài hát yêu thích của bạn và bấm Tìm
                                        </div>
                                    )}
                                </div>
                            </m.div>
                        </m.div>
                    )}
                </AnimatePresence>,
                document.getElementById('modal-root') || document.body
            )}

            {/* RESULT STATS MODAL (High Contrast & Crisp Design) */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isFinished && finalStats && (
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md"
                        >
                            <m.div
                                initial={{ scale: 0.92, y: 15 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.92, y: 15 }}
                                className="w-full max-w-lg p-6 md:p-8 rounded-[2rem] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col items-center gap-6 relative overflow-hidden"
                            >
                                {/* Decorative badge icon */}
                                <div className="w-16 h-16 rounded-3xl bg-[#2d5016] text-white flex items-center justify-center shadow-xl shadow-[#2d5016]/30">
                                    <Award size={36} className="text-amber-300 animate-bounce" />
                                </div>

                                <div className="text-center">
                                    <h3 className="text-2xl font-black uppercase tracking-wider text-stone-900 dark:text-white">
                                        KẾT QUẢ LUYỆN GÕ
                                    </h3>
                                    <p className="text-xs text-stone-500 dark:text-stone-400 font-semibold mt-1">
                                        {finalStats.wpm >= 50 && finalStats.accuracy >= 95
                                            ? '🏆 Xuất sắc! Tốc độ gõ phím cực kỳ nhanh và chuẩn xác!'
                                            : finalStats.accuracy >= 90
                                            ? '🌟 Rất tốt! Bạn đang thao tác rất mượt mà!'
                                            : '💡 Hãy giữ nhịp gõ thong thả để nâng cao độ chính xác nhé!'}
                                    </p>
                                </div>

                                {/* Main Scores Grid (High Contrast & Clear Numbers) */}
                                <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-center shadow-xs">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">Tốc độ</span>
                                        <div className="text-3xl font-black font-mono text-[#2d5016] dark:text-emerald-400 mt-1">
                                            {finalStats.wpm}
                                        </div>
                                        <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500">WPM</span>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-center shadow-xs">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">Chính xác</span>
                                        <div className="text-3xl font-black font-mono text-teal-700 dark:text-teal-400 mt-1">
                                            {finalStats.accuracy}%
                                        </div>
                                        <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500">Tỉ lệ đúng</span>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-center shadow-xs">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">Ký tự đúng</span>
                                        <div className="text-3xl font-black font-mono text-blue-700 dark:text-blue-400 mt-1">
                                            {finalStats.correctChars}
                                        </div>
                                        <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500">Ký tự</span>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-center shadow-xs">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">Lỗi sai</span>
                                        <div className="text-3xl font-black font-mono text-rose-600 dark:text-rose-400 mt-1">
                                            {finalStats.incorrectChars + finalStats.extraChars}
                                        </div>
                                        <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500">Lỗi gõ</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="w-full flex flex-col sm:flex-row items-center gap-3">
                                    <m.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => resetGame()}
                                        className="w-full py-3.5 rounded-2xl bg-[#2d5016] hover:bg-[#233f11] text-white font-black uppercase tracking-wider text-xs shadow-lg shadow-[#2d5016]/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                                    >
                                        <RotateCcw size={16} />
                                        <span>Luyện tập bài mới</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/20 text-white font-mono lowercase">enter</span>
                                    </m.button>
                                    <button
                                        onClick={() => setIsFinished(false)}
                                        className="w-full py-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-black uppercase tracking-wider text-xs cursor-pointer transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>Đóng bảng</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 font-mono lowercase">esc</span>
                                    </button>
                                </div>
                            </m.div>
                        </m.div>
                    )}
                </AnimatePresence>,
                document.getElementById('modal-root') || document.body
            )}
        </div>
    );
}
