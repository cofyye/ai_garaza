import { useState, useRef, useCallback } from "react";

interface UseInterviewAudioOptions {
  onAudioEnded?: () => void;
}

interface UseInterviewAudioReturn {
  isPlaying: boolean;
  playAudio: (audioBase64: string, audioMime: string) => void;
  stopAudio: () => void;
}

export function useInterviewAudio(
  options: UseInterviewAudioOptions = {}
): UseInterviewAudioReturn {
  const { onAudioEnded } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const playAudio = useCallback(
    (audioBase64: string, audioMime: string) => {
      stopAudio();

      const audio = new Audio(`data:${audioMime};base64,${audioBase64}`);
      audioRef.current = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        onAudioEnded?.();
      };
      audio.onerror = () => {
        console.error("Audio playback error");
        setIsPlaying(false);
      };

      audio.play().catch((err) => console.error("Failed to play audio:", err));
    },
    [stopAudio, onAudioEnded]
  );

  return { isPlaying, playAudio, stopAudio };
}
