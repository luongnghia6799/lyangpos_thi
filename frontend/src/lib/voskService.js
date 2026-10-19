/**
 * Vosk Voice Service - Offline Speech Recognition for POS
 * Sử dụng WebAssembly build của Vosk Kaldi (vosk-browser)
 * Hoạt động 100% Offline, không phụ thuộc mạng, nhận diện trực tiếp trên thiết bị.
 */
import { createModel } from 'vosk-browser';

class VoskVoiceService {
  constructor() {
    this.model = null;
    this.modelLoadingPromise = null;
    this.recognizer = null;
    this.audioContext = null;
    this.mediaStream = null;
    this.processorNode = null;
    this.isListening = false;
    this.modelStatus = 'unloaded'; // 'unloaded' | 'loading' | 'ready' | 'error'
    this.modelProgress = 0;
  }

  /**
   * Tải mô hình tiếng Việt Vosk (chạy 1 lần, tải file tar.gz cục bộ)
   */
  async loadModel(onProgress = null) {
    if (this.model && this.model.ready) {
      return this.model;
    }

    if (this.modelLoadingPromise) {
      return this.modelLoadingPromise;
    }

    this.modelStatus = 'loading';

    this.modelLoadingPromise = (async () => {
      try {
        console.log('[Vosk] Loading offline Vietnamese model...');
        // Model đặt trong public/models/vosk-model-small-vn-0.4.tar.gz
        const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'http://localhost:5002';
        const modelUrl = new URL('/models/vosk-model-small-vn-0.4.tar.gz', origin).href;
        
        const model = await createModel(modelUrl);
        this.model = model;
        this.modelStatus = 'ready';
        this.modelProgress = 100;
        console.log('[Vosk] Offline Vietnamese model loaded successfully!');
        return model;
      } catch (err) {
        console.error('[Vosk] Failed to load offline model:', err);
        this.modelStatus = 'error';
        this.modelLoadingPromise = null;
        throw err;
      }
    })();

    return this.modelLoadingPromise;
  }

  /**
   * Bắt đầu lắng nghe giọng nói trực tiếp từ Microphone
   */
  async start({
    onPartial = null,
    onResult = null,
    onError = null,
    onAudioLevel = null,
  } = {}) {
    if (this.isListening) {
      this.stop();
    }

    try {
      // 1. Đảm bảo model đã sẵn sàng
      const model = await this.loadModel();

      // 2. Yêu cầu quyền Micro
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000,
        },
      });
      this.mediaStream = stream;

      // 3. Setup AudioContext & Analyser để đo volume
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx({ sampleRate: 16000 });
      this.audioContext = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);

      // Volume Analyser (RMS)
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const timeData = new Uint8Array(analyser.fftSize);

      let animId = null;
      const checkVolume = () => {
        if (!this.isListening) return;
        analyser.getByteTimeDomainData(timeData);
        let sumSq = 0;
        for (let i = 0; i < timeData.length; i++) {
          const norm = (timeData[i] - 128) / 128;
          sumSq += norm * norm;
        }
        const rms = Math.sqrt(sumSq / timeData.length);
        const level = Math.min(100, Math.round(rms * 450));
        onAudioLevel?.(level);
        animId = requestAnimationFrame(checkVolume);
      };

      // 4. Khởi tạo KaldiRecognizer
      const recognizer = new model.KaldiRecognizer(audioCtx.sampleRate);
      this.recognizer = recognizer;

      recognizer.on('partialresult', (message) => {
        const partial = message?.result?.partial || '';
        if (partial) {
          onPartial?.(partial.trim());
        }
      });

      recognizer.on('result', (message) => {
        const text = message?.result?.text || '';
        if (text) {
          onResult?.(text.trim());
        }
      });

      // 5. Pipe Audio qua ScriptProcessor
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      this.processorNode = processor;

      processor.onaudioprocess = (event) => {
        if (!this.isListening || !this.recognizer) return;
        try {
          this.recognizer.acceptWaveform(event.inputBuffer);
        } catch (e) {
          // ignore buffer frame drops
        }
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      this.isListening = true;
      checkVolume();

      return true;
    } catch (err) {
      console.error('[Vosk] Start listening failed:', err);
      onError?.(err?.message || 'Không thể truy cập microphone.');
      this.stop();
      return false;
    }
  }

  /**
   * Dừng lắng nghe và lấy kết quả cuối cùng
   */
  stop() {
    this.isListening = false;

    if (this.recognizer) {
      try {
        this.recognizer.retrieveFinalResult();
      } catch (e) {}
    }

    if (this.processorNode) {
      try {
        this.processorNode.disconnect();
      } catch (e) {}
      this.processorNode = null;
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      this.mediaStream = null;
    }
  }
}

export const voskService = new VoskVoiceService();
export default voskService;
