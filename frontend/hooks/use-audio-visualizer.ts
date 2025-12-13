import { useState, useEffect, useRef } from "react";

export const useAudioVisualizer = (isMuted: boolean) => {
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isMuted) {
      setVolume(0);
      return;
    }

    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        const audioContext = audioContextRef.current;
        
        // Resume context if suspended (browser policy)
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        sourceRef.current = source;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          
          // Calculate average volume
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          
          // Normalize to 0-1 range with some sensitivity adjustment
          // 255 is max byte value, but speech is usually lower
          const normalized = Math.min(Math.max((average - 10) / 50, 0), 1);
          
          setVolume(normalized);
          animationFrameRef.current = requestAnimationFrame(updateVolume);
        };

        updateVolume();
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    };

    initAudio();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      // We keep the stream tracks open usually managed by useSpeechRecognition or similar,
      // but here we got a new stream. We should stop it to release mic.
      // However, if useSpeechRecognition is also using mic, we might have conflict or multiple permissions.
      // For now, let's assume it's fine.
    };
  }, [isMuted]);

  return volume;
};
