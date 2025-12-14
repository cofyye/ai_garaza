import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useVoiceRecorder } from "./use-voice-recorder";
import { useVideoStream } from "./use-video-stream";
import { useCodeExecution } from "./use-code-execution";
import { useInterviewAudio } from "./use-interview-audio";
import { useIdleDetection } from "./use-idle-detection";
import {
  getSession,
  completeSession,
  startInterview,
  uploadInterviewAudio,
  postInterviewCode,
  postInterviewIdle,
  type InterviewMessage,
} from "../lib/api.service";
import type { Assignment } from "../lib/types";

interface InterviewState {
  assignment: Assignment | null;
  isLoading: boolean;
  messages: InterviewMessage[];
  stage: string;
  canEditCode: boolean;
  taskUnlocked: boolean;
  interviewEnded: boolean;
  earlyTermination: boolean;
  interviewStarted: boolean;
  isSending: boolean;
  showStartButton: boolean;
  isMuted: boolean;
  code: string;
  selectedLanguage: string;
  isTaskOpen: boolean;
}

export function useInterview() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState<InterviewState>({
    assignment: null,
    isLoading: true,
    messages: [],
    stage: "INTRO",
    canEditCode: false,
    taskUnlocked: false,
    interviewEnded: false,
    earlyTermination: false,
    interviewStarted: false,
    isSending: false,
    showStartButton: true,
    isMuted: true,
    code: "",
    selectedLanguage: "python",
    isTaskOpen: false,
  });

  const startRecordingRef = useRef<(() => Promise<void>) | null>(null);
  const codeDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const isMutedRef = useRef(true);

  const updateState = useCallback((updates: Partial<InterviewState>) => {
    if (updates.isMuted !== undefined) {
      isMutedRef.current = updates.isMuted;
    }
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleAudioEnded = useCallback(() => {
    if (!isMutedRef.current && startRecordingRef.current) {
      console.log("🎤 AI finished speaking, auto-starting recording...");
      setTimeout(() => startRecordingRef.current?.(), 300);
    }
  }, []);

  const { isPlaying: isAIPlaying, playAudio: playAIAudio, stopAudio: stopAIAudio } = useInterviewAudio({
    onAudioEnded: handleAudioEnded,
  });

  const handleRecordingStart = useCallback(() => {
    if (isAIPlaying) {
      console.log("🛑 Barge-in: Stopping AI audio");
      stopAIAudio();
    }
  }, [isAIPlaying, stopAIAudio]);

  const handleRecordingStop = useCallback(
    async (audioBlob: Blob) => {
      if (!sessionId || !state.interviewStarted || state.isSending) {
        return;
      }

      if (audioBlob.size < 1000) {
        if (!isMutedRef.current && startRecordingRef.current) {
          setTimeout(() => startRecordingRef.current?.(), 300);
        }
        return;
      }

      stopAIAudio();
      updateState({ isSending: true });

      try {
        const response = await uploadInterviewAudio(sessionId, audioBlob);

        const shouldMute = response.interview_ended ? true : isMutedRef.current;
        
        updateState({
          stage: response.stage,
          canEditCode: response.can_edit_code,
          taskUnlocked: response.task_unlocked,
          interviewEnded: response.interview_ended,
          earlyTermination: response.early_termination,
          messages: response.messages_tail,
          isMuted: shouldMute,
        });

        if (response.assistant?.audio_base64 && response.assistant?.audio_mime) {
          playAIAudio(response.assistant.audio_base64, response.assistant.audio_mime);
        } else if (!isMutedRef.current && !response.interview_ended && startRecordingRef.current) {
          setTimeout(() => startRecordingRef.current?.(), 500);
        }
      } catch (error) {
        console.error("❌ Failed to upload audio:", error);
        if (isMutedRef.current) {
          alert(`Failed to process audio: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
        if (!isMutedRef.current && startRecordingRef.current) {
          setTimeout(() => startRecordingRef.current?.(), 1000);
        }
      } finally {
        updateState({ isSending: false });
      }
    },
    [sessionId, state.interviewStarted, state.isSending, stopAIAudio, playAIAudio, updateState]
  );

  const { isRecording, startRecording, stopRecording, error: recorderError } = useVoiceRecorder({
    onRecordingStart: handleRecordingStart,
    onRecordingStop: handleRecordingStop,
    autoStopOnSilence: true,
    silenceThreshold: 0.015,
    silenceDuration: 1500,
  });

  useEffect(() => {
    startRecordingRef.current = startRecording;
  }, [startRecording]);

  const toggleMute = useCallback(() => {
    if (isMutedRef.current) {
      updateState({ isMuted: false });
      if (!isRecording && !isAIPlaying && !state.isSending) {
        startRecording();
      }
    } else {
      updateState({ isMuted: true });
      if (isRecording) {
        stopRecording();
      }
    }
  }, [state.isSending, isRecording, isAIPlaying, startRecording, stopRecording, updateState]);

  const { isVideoOn, videoRef, toggleVideo } = useVideoStream();
  const { isRunning, output, activeTab, runCode, setActiveTab } = useCodeExecution();

  useEffect(() => {
    if (!sessionId) return;

    const fetchAssignment = async () => {
      try {
        const data = await getSession(sessionId);
        updateState({ assignment: data, isLoading: false });
      } catch (error) {
        console.error("Failed to load assignment:", error);
        updateState({ isLoading: false });
      }
    };

    fetchAssignment();
  }, [sessionId, updateState]);

  const handleStartInterview = useCallback(async () => {
    if (!sessionId || state.interviewStarted) return;

    updateState({ showStartButton: false, isSending: true });

    try {
      const response = await startInterview(sessionId);

      updateState({
        stage: response.stage,
        canEditCode: response.can_edit_code,
        taskUnlocked: response.task_unlocked,
        interviewEnded: response.interview_ended,
        earlyTermination: response.early_termination,
        messages: response.messages_tail,
        interviewStarted: true,
        isSending: false,
      });

      if (response.assistant?.audio_base64 && response.assistant?.audio_mime) {
        playAIAudio(response.assistant.audio_base64, response.assistant.audio_mime);
      }
    } catch (error) {
      console.error("Failed to start interview:", error);
      alert("Failed to start interview. Please check console for details.");
      updateState({ showStartButton: true, isSending: false });
    }
  }, [sessionId, state.interviewStarted, playAIAudio, updateState]);

  const handleCodeChange = useCallback(
    (newCode: string) => {
      updateState({ code: newCode });

      if (codeDebounceRef.current) {
        clearTimeout(codeDebounceRef.current);
      }

      codeDebounceRef.current = setTimeout(() => {
        if (sessionId && state.canEditCode) {
          postInterviewCode(sessionId, newCode, state.selectedLanguage).catch((err) =>
            console.error("Failed to save code:", err)
          );
        }
      }, 800);
    },
    [sessionId, state.canEditCode, state.selectedLanguage, updateState]
  );

  const handleIdleNudge = useCallback(
    async (idleTime: number) => {
      if (!sessionId) return;

      try {
        const response = await postInterviewIdle(sessionId, idleTime);

        if (response.assistant) {
          updateState({ messages: response.messages_tail });

          if (response.assistant.audio_base64 && response.assistant.audio_mime) {
            playAIAudio(response.assistant.audio_base64, response.assistant.audio_mime);
          }
        }
      } catch (error) {
        console.error("Failed to report idle:", error);
      }
    },
    [sessionId, playAIAudio, updateState]
  );

  useIdleDetection({
    enabled: state.stage === "CODING" && state.canEditCode,
    sessionId,
    onIdle: handleIdleNudge,
  });

  const handleRunCode = useCallback(() => {
    runCode(state.code, state.selectedLanguage);
  }, [runCode, state.code, state.selectedLanguage]);

  const handleEndInterview = useCallback(async () => {
    if (!sessionId) return;
    if (!confirm("Are you sure you want to end the interview?")) return;

    // Stop any playing audio before navigating
    stopAIAudio();
    if (isRecording) {
      stopRecording();
    }

    try {
      await completeSession(sessionId);
      alert("Interview completed successfully! Thank you.");
      navigate("/applications");
    } catch (error) {
      console.error("Failed to complete interview:", error);
      alert("Failed to complete interview. Please try again.");
    }
  }, [sessionId, navigate, stopAIAudio, isRecording, stopRecording]);

  const setSelectedLanguage = useCallback(
    (lang: string) => updateState({ selectedLanguage: lang }),
    [updateState]
  );

  const openTask = useCallback(() => {
    if (state.taskUnlocked) updateState({ isTaskOpen: true });
  }, [state.taskUnlocked, updateState]);

  const closeTask = useCallback(() => updateState({ isTaskOpen: false }), [updateState]);

  const navigateToApplications = useCallback(() => navigate("/applications"), [navigate]);

  return {
    state,
    isAIPlaying,
    isRecording,
    isVideoOn,
    isRunning,
    output,
    activeTab,
    videoRef,
    recorderError,
    handlers: {
      toggleMute,
      toggleVideo,
      handleStartInterview,
      handleCodeChange,
      handleRunCode,
      handleEndInterview,
      setSelectedLanguage,
      setActiveTab,
      openTask,
      closeTask,
      navigateToApplications,
    },
  };
}

export function buildTaskDescription(assignment: Assignment | null): string {
  if (!assignment) return "Loading task...";

  const parts = [
    assignment.task_title,
    "",
    assignment.task_description,
    "",
    "REQUIREMENTS:",
    ...assignment.task_requirements.map((req, i) => `${i + 1}. ${req}`),
  ];

  if (assignment.additional_resources) {
    parts.push("", "ADDITIONAL RESOURCES:", assignment.additional_resources);
  }

  return parts.join("\n");
}
