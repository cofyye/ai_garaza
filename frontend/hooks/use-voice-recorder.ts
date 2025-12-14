/**
 * Voice Recorder Hook using MediaRecorder API
 * 
 * Features:
 * - Record audio using MediaRecorder
 * - Auto-stop on silence detection (VAD)
 * - Callbacks for recording start (barge-in) and stop
 */

import { useState, useRef, useCallback, useEffect } from "react";

interface UseVoiceRecorderOptions {
  onRecordingStart?: () => void;
  onRecordingStop?: (audioBlob: Blob) => void;
  onError?: (error: string) => void;
  autoStopOnSilence?: boolean;
  silenceThreshold?: number;
  silenceDuration?: number;
}

interface UseVoiceRecorderReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  error: string | null;
}

export const useVoiceRecorder = (
  options: UseVoiceRecorderOptions = {}
): UseVoiceRecorderReturn => {
  const {
    onRecordingStart,
    onRecordingStop,
    onError,
    autoStopOnSilence = true,
    silenceThreshold = 0.02,
    silenceDuration = 1500,
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // All refs for recording state
  const isRecordingRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const hasSpokenRef = useRef(false);

  // Stop recording function
  const stopRecording = useCallback(() => {
    console.log("🛑 stopRecording called, isRecordingRef:", isRecordingRef.current);
    
    if (!isRecordingRef.current) return;
    
    isRecordingRef.current = false;
    
    // Cancel animation frame
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    // Stop audio context
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    console.log("🛑 Recording stopped");
  }, []);

  // Start recording function
  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) {
      console.log("⚠️ Already recording");
      return;
    }

    try {
      setError(null);
      console.log("🎤 Starting recording...");

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;

      // Setup AudioContext for VAD
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      audioChunksRef.current = [];
      hasSpokenRef.current = false;
      silenceStartRef.current = null;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("📼 MediaRecorder stopped, chunks:", audioChunksRef.current.length);
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        console.log("📦 Audio blob size:", audioBlob.size);
        
        if (onRecordingStop && audioBlob.size > 0) {
          onRecordingStop(audioBlob);
        }
        
        audioChunksRef.current = [];
      };

      mediaRecorder.onerror = (event) => {
        console.error("❌ MediaRecorder error:", event);
        setError("Recording error");
        if (onError) onError("Recording error");
        stopRecording();
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      isRecordingRef.current = true;
      setIsRecording(true);

      // Notify recording started
      if (onRecordingStart) {
        onRecordingStart();
      }

      console.log("🎤 Recording started, autoStopOnSilence:", autoStopOnSilence);

      // Start VAD monitoring
      if (autoStopOnSilence) {
        const dataArray = new Uint8Array(analyser.fftSize);
        
        const checkAudioLevel = () => {
          if (!isRecordingRef.current || !analyserRef.current) {
            return;
          }

          analyserRef.current.getByteTimeDomainData(dataArray);

          // Calculate RMS
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const normalized = (dataArray[i] - 128) / 128;
            sum += normalized * normalized;
          }
          const rms = Math.sqrt(sum / dataArray.length);

          const now = Date.now();
          const isSilent = rms < silenceThreshold;

          if (!isSilent) {
            // Sound detected
            hasSpokenRef.current = true;
            silenceStartRef.current = null;
          } else if (hasSpokenRef.current) {
            // Silence after speaking
            if (!silenceStartRef.current) {
              silenceStartRef.current = now;
              console.log("🔇 Silence started...");
            } else if (now - silenceStartRef.current > silenceDuration) {
              console.log("🔇 Silence threshold reached, stopping...");
              stopRecording();
              return;
            }
          }

          rafIdRef.current = requestAnimationFrame(checkAudioLevel);
        };

        // Start monitoring
        rafIdRef.current = requestAnimationFrame(checkAudioLevel);
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to access microphone";
      console.error("❌ Recording error:", err);
      setError(errorMsg);
      if (onError) onError(errorMsg);
      stopRecording();
    }
  }, [autoStopOnSilence, silenceThreshold, silenceDuration, onRecordingStart, onRecordingStop, onError, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecordingRef.current) {
        stopRecording();
      }
    };
  }, [stopRecording]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    error,
  };
};
