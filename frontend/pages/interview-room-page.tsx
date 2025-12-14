import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { InterviewHeader } from "../components/interview/interview-header";
import { AIParticipant } from "../components/interview/ai-participant";
import { UserParticipant } from "../components/interview/user-participant";
import { InterviewControls } from "../components/interview/interview-controls";
import { CodeEditorToolbar } from "../components/interview/code-editor-toolbar";
import { CodeEditorTextArea } from "../components/interview/code-editor-text-area";
import { ConsoleOutput } from "../components/interview/console-output";
import { TaskModal } from "../components/interview/task-modal";
import { useVoiceRecorder } from "../hooks/use-voice-recorder";
import { useVideoStream } from "../hooks/use-video-stream";
import { useCodeExecution } from "../hooks/use-code-execution";
import { useAudioVisualizer } from "../hooks/use-audio-visualizer";
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

export const InterviewRoomPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState("python");
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [code, setCode] = useState("");
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  // Interview state
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [stage, setStage] = useState<string>("INTRO");
  const [canEditCode, setCanEditCode] = useState(false);
  const [taskUnlocked, setTaskUnlocked] = useState(false);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [earlyTermination, setEarlyTermination] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showStartButton, setShowStartButton] = useState(true);
  const [isListeningMode, setIsListeningMode] = useState(false); // Continuous listening mode

  // Audio playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isAIPlaying, setIsAIPlaying] = useState(false);
  const startRecordingRef = useRef<(() => Promise<void>) | null>(null); // Ref to access startRecording

  // Code monitoring
  const lastCodeChangeRef = useRef<number>(Date.now());
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastIdleCheckRef = useRef<number>(0);
  const codeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Stop AI audio playback
  const stopAIAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsAIPlaying(false);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Play AI audio from base64, auto-start listening when done
  const playAIAudio = useCallback((audioBase64: string, audioMime: string) => {
    stopAIAudio();

    const audio = new Audio(`data:${audioMime};base64,${audioBase64}`);
    audioRef.current = audio;

    audio.onplay = () => setIsAIPlaying(true);
    audio.onended = () => {
      setIsAIPlaying(false);
      // Auto-start recording when AI finishes speaking (if in listening mode and interview not ended)
      if (isListeningMode && !interviewEnded && startRecordingRef.current) {
        console.log("🎤 AI finished speaking, auto-starting recording...");
        setTimeout(() => {
          startRecordingRef.current?.();
        }, 300); // Small delay before starting to listen
      }
    };
    audio.onerror = () => {
      console.error("Audio playback error");
      setIsAIPlaying(false);
    };

    audio.play().catch((err) => console.error("Failed to play audio:", err));
  }, [stopAIAudio, isListeningMode, interviewEnded]);

  // Handle recording start (barge-in)
  const handleRecordingStart = useCallback(() => {
    if (isAIPlaying) {
      console.log("🛑 Barge-in: Stopping AI audio");
      stopAIAudio();
    }
  }, [isAIPlaying, stopAIAudio]);

  // Handle recording stop (upload audio for transcription)
  const handleRecordingStop = useCallback(
    async (audioBlob: Blob) => {
      if (!sessionId || !interviewStarted || isSending) {
        console.log("⚠️ Skipping upload - sessionId:", sessionId, "started:", interviewStarted, "sending:", isSending);
        return;
      }

      console.log("🎤 Recording stopped, blob size:", audioBlob.size, "bytes");
      
      if (audioBlob.size < 1000) {
        console.warn("⚠️ Audio blob too small, might be empty recording");
        // Don't show alert - just restart recording if in listening mode
        if (isListeningMode && startRecordingRef.current) {
          console.log("🔄 Restarting recording (blob too small)...");
          setTimeout(() => startRecordingRef.current?.(), 300);
        }
        return;
      }
      
      console.log("📤 Uploading audio to backend...");
      stopAIAudio();
      setIsSending(true);

      try {
        const response = await uploadInterviewAudio(sessionId, audioBlob);

        console.log("✅ Transcribed:", response.transcript);
        console.log("📊 Response:", response);

        // Update state
        setStage(response.stage);
        setCanEditCode(response.can_edit_code);
        setTaskUnlocked(response.task_unlocked);
        setInterviewEnded(response.interview_ended);
        setEarlyTermination(response.early_termination);
        setMessages(response.messages_tail);

        // If interview ended, stop listening mode and just play final message
        if (response.interview_ended) {
          console.log("🔴 Interview ended, stopping listening mode");
          setIsListeningMode(false);
          if (response.assistant?.audio_base64 && response.assistant?.audio_mime) {
            playAIAudio(response.assistant.audio_base64, response.assistant.audio_mime);
          }
          return; // Don't auto-restart recording
        }

        // Play audio if present (will auto-start recording when done)
        if (response.assistant?.audio_base64 && response.assistant?.audio_mime) {
          console.log("🔊 Playing AI audio response...");
          playAIAudio(response.assistant.audio_base64, response.assistant.audio_mime);
        } else {
          console.log("⚠️ No audio in response");
          // If no audio but in listening mode, restart recording
          if (isListeningMode && startRecordingRef.current) {
            console.log("🎤 No audio response, restarting recording...");
            setTimeout(() => startRecordingRef.current?.(), 500);
          }
        }
      } catch (error) {
        console.error("❌ Failed to upload audio:", error);
        // Don't alert in listening mode, just try to continue
        if (!isListeningMode) {
          alert(`Failed to process audio: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
        // Restart recording if in listening mode
        if (isListeningMode && startRecordingRef.current) {
          console.log("🔄 Error occurred, restarting recording...");
          setTimeout(() => startRecordingRef.current?.(), 1000);
        }
      } finally {
        setIsSending(false);
      }
    },
    [sessionId, interviewStarted, isSending, isListeningMode, stopAIAudio, playAIAudio]
  );

  // Voice recorder (replaces SpeechRecognition)
  // Auto-stop on silence enabled for hands-free conversation
  const { isRecording, startRecording, stopRecording, error: recorderError } = useVoiceRecorder({
    onRecordingStart: handleRecordingStart,
    onRecordingStop: handleRecordingStop,
    autoStopOnSilence: true, // Automatically stop when user stops speaking
    silenceThreshold: 0.015, // Sensitivity (lower = more sensitive to quiet sounds)
    silenceDuration: 1500, // 1.5 seconds of silence before auto-stop
  });

  // Store startRecording in ref for use in playAIAudio callback
  useEffect(() => {
    startRecordingRef.current = startRecording;
  }, [startRecording]);

  // Toggle recording (mic button) - also toggles listening mode
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
      setIsListeningMode(false); // Exit listening mode when manually stopping
    } else {
      startRecording();
      setIsListeningMode(true); // Enter listening mode when manually starting
    }
  }, [isRecording, startRecording, stopRecording]);

  const { isVideoOn, videoRef, toggleVideo } = useVideoStream();
  const { isRunning, output, activeTab, runCode, setActiveTab } = useCodeExecution();
  
  // Mock volume for visualizer (since we're not using continuous mic monitoring)
  const volume = 0;

  // Fetch assignment data
  useEffect(() => {
    const fetchAssignment = async () => {
      if (!sessionId) return;

      try {
        const data = await getSession(sessionId);
        setAssignment(data);
      } catch (error) {
        console.error("Failed to load assignment:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignment();
  }, [sessionId]);

  // Manual start interview (requires user interaction for audio to work)
  const handleStartInterview = useCallback(async () => {
    if (!sessionId || interviewStarted) return;

    setShowStartButton(false);
    setIsSending(true);

    try {
      const response = await startInterview(sessionId);

      setStage(response.stage);
      setCanEditCode(response.can_edit_code);
      setTaskUnlocked(response.task_unlocked);
      setInterviewEnded(response.interview_ended);
      setEarlyTermination(response.early_termination);
      setMessages(response.messages_tail);
      setInterviewStarted(true);

      // Play initial greeting (now with user interaction, so autoplay works)
      if (response.assistant?.audio_base64 && response.assistant?.audio_mime) {
        console.log("✅ AI greeting received, playing audio...");
        playAIAudio(response.assistant.audio_base64, response.assistant.audio_mime);
      } else {
        console.log("⚠️ No audio in greeting:", response.assistant);
      }
    } catch (error) {
      console.error("Failed to start interview:", error);
      alert("Failed to start interview. Please check console for details.");
      setShowStartButton(true);
    } finally {
      setIsSending(false);
    }
  }, [sessionId, interviewStarted, playAIAudio]);

  // Code change handler with debounce
  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode);
      lastCodeChangeRef.current = Date.now();

      // Debounced save to backend
      if (codeDebounceRef.current) {
        clearTimeout(codeDebounceRef.current);
      }

      codeDebounceRef.current = setTimeout(() => {
        if (sessionId && canEditCode) {
          postInterviewCode(sessionId, newCode, selectedLanguage).catch((err) =>
            console.error("Failed to save code:", err)
          );
        }
      }, 800);
    },
    [sessionId, canEditCode, selectedLanguage]
  );

  // Idle detection timer
  useEffect(() => {
    if (stage !== "CODING" || !canEditCode || !sessionId) {
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      return;
    }

    // Check idle every 5 seconds
    idleTimerRef.current = setInterval(async () => {
      const now = Date.now();
      const idleTime = Math.floor((now - lastCodeChangeRef.current) / 1000);

      // If idle >= 30 seconds and cooldown passed (30s since last check)
      if (idleTime >= 30 && now - lastIdleCheckRef.current >= 30000) {
        console.log(`⏰ Idle for ${idleTime}s, triggering nudge`);
        lastIdleCheckRef.current = now;

        try {
          const response = await postInterviewIdle(sessionId, idleTime);

          if (response.assistant) {
            setMessages(response.messages_tail);

            if (response.assistant.audio_base64 && response.assistant.audio_mime) {
              playAIAudio(response.assistant.audio_base64, response.assistant.audio_mime);
            }
          }
        } catch (error) {
          console.error("Failed to report idle:", error);
        }
      }
    }, 5000);

    return () => {
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
      }
    };
  }, [stage, canEditCode, sessionId, playAIAudio]);

  // Build task description
  const taskDescription = assignment
    ? `${assignment.task_title}

${assignment.task_description}

REQUIREMENTS:
${assignment.task_requirements.map((req, i) => `${i + 1}. ${req}`).join("\n")}

EVALUATION CRITERIA:
${assignment.evaluation_criteria.map((crit, i) => `${i + 1}. ${crit}`).join("\n")}
${assignment.additional_resources ? `\n\nADDITIONAL RESOURCES:\n${assignment.additional_resources}` : ""}`
    : "Loading task...";

  const handleRunCode = () => {
    runCode(code, selectedLanguage);
  };

  const handleEndInterview = async () => {
    if (!sessionId) return;

    if (!confirm("Are you sure you want to end the interview?")) return;

    setIsCompleting(true);

    try {
      await completeSession(sessionId);
      alert("Interview completed successfully! Thank you.");
      navigate("/applications");
    } catch (error) {
      console.error("Failed to complete interview:", error);
      alert("Failed to complete interview. Please try again.");
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-red-600">Failed to load assignment.</div>
      </div>
    );
  }

  // Show start button overlay (requires user interaction for audio)
  if (showStartButton && !interviewStarted) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Ready to Start?
            </h1>
            <p className="text-gray-600 mb-8">
              Click below to begin your AI-powered technical interview. Make sure your microphone is ready.
            </p>
          </div>
          <button
            onClick={handleStartInterview}
            disabled={isSending}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-8 rounded-xl transition-all transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
          >
            {isSending ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Starting Interview...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Interview
              </span>
            )}
          </button>
          <p className="text-xs text-gray-500 mt-4">
            ⚠️ Browser will ask for microphone permissions
          </p>
        </div>
      </div>
    );
  }

  // Show interview ended overlay
  if (interviewEnded) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md text-center">
          <div className="mb-6">
            {earlyTermination ? (
              <>
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Interview Ended
                </h1>
                <p className="text-gray-600 mb-4">
                  Thank you for your time. Unfortunately, we were unable to proceed with the coding task at this time.
                </p>
                <p className="text-sm text-gray-500 mb-8">
                  Our recruiter will be in touch regarding next steps.
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Interview Completed
                </h1>
                <p className="text-gray-600 mb-8">
                  Thank you for completing the interview! Our team will review your session and be in touch soon.
                </p>
              </>
            )}
          </div>
          <button
            onClick={() => navigate("/applications")}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg"
          >
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              Back to Dashboard
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden font-sans text-gray-900 relative">
      <InterviewHeader
        onToggleTask={() => taskUnlocked && setIsTaskOpen(true)}
        taskLocked={!taskUnlocked}
      />

      <TaskModal
        isOpen={isTaskOpen}
        onClose={() => setIsTaskOpen(false)}
        taskDescription={taskDescription}
      />

      {/* Main Content */}
      <div className="flex-1 flex p-6 gap-6 overflow-hidden">
        {/* LEFT PANEL: Participants & Controls */}
        <div className="w-[400px] flex flex-col gap-4">
          {/* Participants Card */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <AIParticipant isListening={isAIPlaying} />
            <UserParticipant
              isVideoOn={isVideoOn}
              isMuted={!isRecording}
              videoRef={videoRef}
              volume={volume}
            />
          </div>

          {/* Conversation Transcript */}
          {messages.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 max-h-64 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Conversation</h3>
              <div className="space-y-2">
                {messages.slice(-10).map((msg, idx) => (
                  <div
                    key={idx}
                    className={`text-xs p-2 rounded ${
                      msg.role === "user"
                        ? "bg-blue-50 text-blue-900"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    <div className="font-semibold mb-1">
                      {msg.role === "user" ? "You" : "AI Interviewer"}
                    </div>
                    <div>{msg.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Controls Card */}
          <InterviewControls
            isMuted={!isRecording && !isListeningMode}
            isVideoOn={isVideoOn}
            onToggleMic={toggleRecording}
            onToggleVideo={toggleVideo}
            onEndInterview={handleEndInterview}
          />
          
          {/* Listening Mode Status */}
          {isListeningMode && !isRecording && !isSending && !isAIPlaying && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-green-700 font-medium">
                🎧 Listening mode active - Start speaking anytime! Click mic to exit.
              </p>
            </div>
          )}
          
          {/* Recording Status */}
          {isRecording && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-red-700 font-medium">
                🎤 Recording... Will auto-send when you stop speaking
              </p>
            </div>
          )}
          
          {/* AI Speaking Status */}
          {isAIPlaying && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-purple-700 font-medium">
                🔊 AI is speaking... (You can interrupt by clicking mic)
              </p>
            </div>
          )}
          
          {/* Sending Status */}
          {isSending && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-blue-700">Processing your audio...</p>
            </div>
          )}
          
          {/* Recorder Error Display */}
          {recorderError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">⚠️ {recorderError}</p>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Code Editor */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <CodeEditorToolbar
            selectedLanguage={selectedLanguage}
            isRunning={isRunning}
            onLanguageChange={setSelectedLanguage}
            onRunCode={handleRunCode}
            disabled={!canEditCode}
          />

          {/* Editor Area */}
          <div className="flex-1 flex flex-col min-h-0">
            <CodeEditorTextArea
              code={code}
              onChange={handleCodeChange}
              disabled={!canEditCode}
            />
            <ConsoleOutput
              activeTab={activeTab}
              output={output}
              onTabChange={setActiveTab}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
