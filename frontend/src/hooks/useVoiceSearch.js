import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import voskService from '../lib/voskService';

/**
 * useVoiceSearch - Hook quản lý nhận diện giọng nói tiếng Việt cho POS
 * Hỗ trợ Dual-Engine:
 *  - Engine 1: VOSK Offline WebAssembly (nhận diện tức thì 100% không cần mạng)
 *  - Engine 2: AI Cloud Gemini (dự phòng thông minh khi cần)
 */
export default function useVoiceSearch({
  onResult = null,
  onInterim = null,
  onError = null,
  silenceTimeoutMs = 1200
} = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // 0 -> 100
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [engineMode, setEngineMode] = useState('offline'); // 'offline' | 'cloud'

  const isTauri = typeof window !== 'undefined' && (!!window.__TAURI_INTERNALS__ || !!window.__TAURI__);

  const recognitionRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioCtxRef = useRef(null);
  const animFrameRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const hasSpokenRef = useRef(false);
  const isManuallyStoppedRef = useRef(false);
  const isWebSpeechFailedRef = useRef(isTauri);
  const transcriptRef = useRef('');
  const isVoskActiveRef = useRef(false);

  const onResultRef = useRef(onResult);
  const onInterimRef = useRef(onInterim);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onInterimRef.current = onInterim;
  }, [onInterim]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const cleanupAudio = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {}
      });
      mediaStreamRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Gửi audio thu âm qua MediaRecorder lên backend AI Transcribe
  const transcribeRecordedAudio = useCallback(async (audioBlob) => {
    if (!audioBlob || audioBlob.size < 200) {
      setIsProcessing(false);
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      const base64Data = await base64Promise;

      const baseUrl = axios.defaults.baseURL || 'http://localhost:3579';
      const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/ai/transcribe-voice`;

      const resp = await axios.post(endpoint, {
        audio_base64: base64Data,
        mime_type: audioBlob.type || 'audio/webm'
      });

      if (resp.data && resp.data.success && resp.data.transcript) {
        const resultText = resp.data.transcript.trim();
        transcriptRef.current = resultText;
        setTranscript(resultText);
        setInterimTranscript(resultText);
        onResultRef.current?.(resultText);
      } else if (resp.data && resp.data.error) {
        setError(resp.data.error);
        onErrorRef.current?.(resp.data.error);
      }
    } catch (err) {
      console.warn('Backend audio transcription error:', err);
      const errMsg = err?.response?.data?.error || 'Không thể nhận diện âm thanh qua AI.';
      setError(errMsg);
      onErrorRef.current?.(errMsg);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    clearSilenceTimer();

    // 1. Dừng Vosk Offline
    if (isVoskActiveRef.current) {
      try {
        voskService.stop();
      } catch (e) {}
      isVoskActiveRef.current = false;
    }

    // 2. Dừng Web Speech API
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    // 3. Dừng MediaRecorder & gửi xử lý nếu Vosk chưa có kết quả
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        cleanupAudio();
      }
    } else {
      cleanupAudio();
    }

    setIsListening(false);
  }, [clearSilenceTimer, cleanupAudio]);

  const startListening = useCallback(async () => {
    // Dọn dẹp phiên trước nếu đang chạy
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
    if (isVoskActiveRef.current) {
      try {
        voskService.stop();
      } catch (e) {}
      isVoskActiveRef.current = false;
    }
    cleanupAudio();
    clearSilenceTimer();

    setError(null);
    setTranscript('');
    setInterimTranscript('');
    transcriptRef.current = '';
    setIsProcessing(false);
    isManuallyStoppedRef.current = false;
    hasSpokenRef.current = false;
    audioChunksRef.current = [];

    // 1. Ưu tiên khởi động VOSK Offline (Nhận diện streaming tức thì 100% trên máy)
    try {
      const voskStarted = await voskService.start({
        onPartial: (partial) => {
          setInterimTranscript(partial);
          onInterimRef.current?.(partial);
        },
        onResult: (text) => {
          if (text) {
            transcriptRef.current = text;
            setTranscript(text);
            setInterimTranscript(text);
            onResultRef.current?.(text);
          }
        },
        onError: (err) => {
          console.warn('[Vosk] error:', err);
        },
        onAudioLevel: (level) => {
          setAudioLevel(level);

          // Phát hiện im lặng tự động: khi người dùng bắt đầu nói và sau đó im lặng >= 1.3s
          if (level > 12) {
            hasSpokenRef.current = true;
            clearSilenceTimer();
          } else if (hasSpokenRef.current && level < 8) {
            if (!silenceTimerRef.current) {
              silenceTimerRef.current = setTimeout(() => {
                stopListening();
              }, silenceTimeoutMs || 1300);
            }
          }
        }
      });

      if (voskStarted) {
        isVoskActiveRef.current = true;
        setEngineMode('offline');
        setIsListening(true);
      }
    } catch (voskErr) {
      console.warn('[Vosk] Failed to start offline engine, falling back:', voskErr);
    }

    // 2. Khởi động Micro qua MediaRecorder ghi âm song song (làm backup an toàn)
    try {
      const stream = (voskService && voskService.mediaStream) ? voskService.mediaStream : await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      mediaStreamRef.current = stream;

      // Setup Web Audio Analyser để đo volume & detect im lặng chính xác qua RMS (nếu Vosk chưa setup)
      if (!isVoskActiveRef.current) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          audioCtxRef.current = audioCtx;

          const timeData = new Uint8Array(analyser.fftSize);

          const checkAudio = () => {
            if (!mediaStreamRef.current) return;
            analyser.getByteTimeDomainData(timeData);
            let sumSquares = 0;
            for (let i = 0; i < timeData.length; i++) {
              const norm = (timeData[i] - 128) / 128;
              sumSquares += norm * norm;
            }
            const rms = Math.sqrt(sumSquares / timeData.length);
            const level = Math.min(100, Math.round(rms * 450));
            setAudioLevel(level);

            // Phát hiện khi bắt đầu nói (level > 10)
            if (level > 10) {
              hasSpokenRef.current = true;
              clearSilenceTimer();
            } else if (hasSpokenRef.current && level < 7) {
              if (!silenceTimerRef.current) {
                silenceTimerRef.current = setTimeout(() => {
                  stopListening();
                }, silenceTimeoutMs || 1200);
              }
            }

            animFrameRef.current = requestAnimationFrame(checkAudio);
          };
          checkAudio();
        }
      }

      // Khởi động MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        cleanupAudio();
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        // Chỉ gửi backend AI nếu Vosk Offline chưa có kết quả
        if (!transcriptRef.current) {
          transcribeRecordedAudio(audioBlob);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsListening(true);
    } catch (micErr) {
      if (!isVoskActiveRef.current) {
        console.warn('Microphone access error:', micErr);
        let msg = 'Không thể truy cập Microphone. Vui lòng cấp quyền micro!';
        if (micErr.name === 'NotAllowedError') {
          msg = 'Quyền sử dụng Microphone bị từ chối trong Windows / Trình duyệt!';
        }
        setError(msg);
        onErrorRef.current?.(msg);
        setIsListening(false);
        return;
      }
    }

    // 2. Chạy kèm Web Speech API nếu ở trình duyệt web (không phải Tauri)
    const SpeechRecognition = !isTauri ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (SpeechRecognition && !isWebSpeechFailedRef.current) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        let finalCollected = '';

        recognition.onresult = (event) => {
          let interim = '';
          let currentFinal = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const item = event.results[i];
            const text = item[0]?.transcript || '';
            if (item.isFinal) {
              currentFinal += text + ' ';
            } else {
              interim += text;
            }
          }

          if (currentFinal) {
            finalCollected += currentFinal;
            transcriptRef.current = finalCollected.trim();
            setTranscript(finalCollected.trim());
          }
          setInterimTranscript(interim.trim());
          onInterimRef.current?.((finalCollected + ' ' + interim).trim());
        };

        recognition.onerror = (event) => {
          if (event.error === 'network') {
            isWebSpeechFailedRef.current = true;
            return;
          }
          if (event.error === 'not-allowed') {
            setError('Quyền sử dụng Microphone bị từ chối!');
          }
        };

        recognition.onend = () => {
          const finalResult = (finalCollected || interimTranscript).trim();
          if (!isManuallyStoppedRef.current && finalResult && !isWebSpeechFailedRef.current) {
            onResultRef.current?.(finalResult);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (e) {
        console.warn('Web Speech API failed to initialize:', e);
        isWebSpeechFailedRef.current = true;
      }
    } else {
      isWebSpeechFailedRef.current = true;
    }
  }, [cleanupAudio, clearSilenceTimer, isTauri, silenceTimeoutMs, stopListening, transcribeRecordedAudio, interimTranscript]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      cleanupAudio();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [clearSilenceTimer, cleanupAudio]);

  return {
    isSupported: true, // Luôn hỗ trợ vì có MediaRecorder + AI Transcribe
    isListening,
    isProcessing,
    audioLevel,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    toggleListening
  };
}
