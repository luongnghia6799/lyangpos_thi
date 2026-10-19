import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * useVoiceSearch - Hook quản lý nhận diện giọng nói tiếng Việt cho POS
 * Hỗ trợ Dual-Engine:
 *  - Trình duyệt Web (Chrome/Edge): Dùng Web Speech API nhận diện realtime
 *  - Tauri Desktop / WebView2: Dùng MediaRecorder + Gemini Flash AI nhận diện siêu chuẩn xác
 */
export default function useVoiceSearch({
  onResult = null,
  onInterim = null,
  onError = null,
  silenceTimeoutMs = 1500
} = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // 0 -> 100
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);

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
    if (!audioBlob || audioBlob.size < 800) {
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

      const resp = await axios.post('/api/ai/transcribe-voice', {
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

    // 1. Dừng Web Speech API
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    // 2. Dừng MediaRecorder & gửi xử lý (cleanupAudio sẽ được gọi bên trong onstop)
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

    // 1. Khởi động Micro qua MediaRecorder (Hoạt động tốt trong Tauri WebView2 & Chrome)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      mediaStreamRef.current = stream;

      // Setup Web Audio Analyser để đo volume & detect im lặng
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        audioCtxRef.current = audioCtx;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkAudio = () => {
          if (!mediaStreamRef.current) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const level = Math.min(100, Math.round((avg / 128) * 100));
          setAudioLevel(level);

          // Phát hiện giọng nói
          if (level > 15) {
            hasSpokenRef.current = true;
            clearSilenceTimer();
          } else if (hasSpokenRef.current && level < 8) {
            // Đã nói rồi và đang im lặng -> đếm ngược để tự động dừng
            if (!silenceTimerRef.current) {
              silenceTimerRef.current = setTimeout(() => {
                stopListening();
              }, silenceTimeoutMs);
            }
          }

          animFrameRef.current = requestAnimationFrame(checkAudio);
        };
        checkAudio();
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
        // Chỉ gửi backend AI nếu Web Speech API không hoạt động hoặc chưa có kết quả
        if (isWebSpeechFailedRef.current || isTauri || !transcriptRef.current) {
          transcribeRecordedAudio(audioBlob);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250); // Thu theo từng chunk 250ms
      setIsListening(true);
    } catch (micErr) {
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
