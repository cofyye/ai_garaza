import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { InterviewHeader } from "../components/interview/interview-header";
import { AIParticipant } from "../components/interview/ai-participant";
import { UserParticipant } from "../components/interview/user-participant";
import { InterviewControls } from "../components/interview/interview-controls";
import { CodeEditorToolbar } from "../components/interview/code-editor-toolbar";
import { CodeEditorTextArea } from "../components/interview/code-editor-text-area";
import { ConsoleOutput } from "../components/interview/console-output";
import { TaskModal } from "../components/interview/task-modal";
import { useSpeechRecognition } from "../hooks/use-speech-recognition";
import { useVideoStream } from "../hooks/use-video-stream";
import { useCodeExecution } from "../hooks/use-code-execution";
import { useAudioVisualizer } from "../hooks/use-audio-visualizer";
import { getSession, completeSession } from "../lib/api.service";
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

  // Build task description from assignment
  const taskDescription = assignment
    ? `${assignment.task_title}

${assignment.task_description}

REQUIREMENTS:
${assignment.task_requirements.map((req, i) => `${i + 1}. ${req}`).join("\n")}

EVALUATION CRITERIA:
${assignment.evaluation_criteria
  .map((crit, i) => `${i + 1}. ${crit}`)
  .join("\n")}
${
  assignment.additional_resources
    ? `\n\nADDITIONAL RESOURCES:\n${assignment.additional_resources}`
    : ""
}`
    : "Loading task...";

  // Custom hooks
  const { isListening, isMuted, toggleMic } = useSpeechRecognition();
  const { isVideoOn, videoRef, toggleVideo } = useVideoStream();
  const { isRunning, output, activeTab, runCode, setActiveTab } =
    useCodeExecution();
  const volume = useAudioVisualizer(isMuted);

  const handleRunCode = () => {
    runCode(code, selectedLanguage);
  };

  const handleEndInterview = async () => {
    if (!sessionId) return;

    if (!confirm("Da li želite da završite intervju?")) return;

    setIsCompleting(true);

    try {
      await completeSession(sessionId);
      alert("Intervju je uspešno završen! Hvala vam na učešću.");
      navigate("/applications");
    } catch (error) {
      console.error("Failed to complete interview:", error);
      alert("Greška prilikom završavanja intervjua. Molimo pokušajte ponovo.");
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Učitavanje...</div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-red-600">Nije moguće učitati zadatak.</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden font-sans text-gray-900 relative">
      <InterviewHeader onToggleTask={() => setIsTaskOpen(true)} />

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
            <AIParticipant isListening={isListening} />
            <UserParticipant
              isVideoOn={isVideoOn}
              isMuted={isMuted}
              videoRef={videoRef}
              volume={volume}
            />
          </div>

          {/* Controls Card */}
          <InterviewControls
            isMuted={isMuted}
            isVideoOn={isVideoOn}
            onToggleMic={toggleMic}
            onToggleVideo={toggleVideo}
            onEndInterview={handleEndInterview}
          />
        </div>

        {/* RIGHT PANEL: Code Editor */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <CodeEditorToolbar
            selectedLanguage={selectedLanguage}
            isRunning={isRunning}
            onLanguageChange={setSelectedLanguage}
            onRunCode={handleRunCode}
          />

          {/* Editor Area */}
          <div className="flex-1 flex flex-col min-h-0">
            <CodeEditorTextArea code={code} onChange={setCode} />
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
