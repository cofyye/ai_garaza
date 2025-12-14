import { InterviewHeader } from "../components/interview/interview-header";
import { TaskModal } from "../components/interview/task-modal";
import { StartInterviewOverlay } from "../components/interview/start-interview-overlay";
import { InterviewEndedOverlay } from "../components/interview/interview-ended-overlay";
import { LeftPanel } from "../components/interview/left-panel";
import { RightPanel } from "../components/interview/right-panel";
import { useInterview, buildTaskDescription } from "../hooks/use-interview";

export function InterviewRoomPage() {
  const {
    state,
    isAIPlaying,
    isVideoOn,
    isRunning,
    output,
    activeTab,
    videoRef,
    handlers,
  } = useInterview();

  if (state.isLoading) {
    return <LoadingScreen />;
  }

  if (!state.assignment) {
    return <ErrorScreen />;
  }

  if (state.interviewEnded) {
    return (
      <InterviewEndedOverlay
        earlyTermination={state.earlyTermination}
        onNavigate={handlers.navigateToApplications}
      />
    );
  }

  const taskDescription = buildTaskDescription(state.assignment);
  const showStartOverlay = state.showStartButton && !state.interviewStarted;

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden font-sans text-gray-900 relative">
      <InterviewHeader
        onToggleTask={handlers.openTask}
        taskLocked={!state.taskUnlocked}
      />

      <TaskModal
        isOpen={state.isTaskOpen}
        onClose={handlers.closeTask}
        taskDescription={taskDescription}
      />

      <div className={`flex-1 flex p-6 gap-6 overflow-hidden ${showStartOverlay ? 'blur-sm pointer-events-none' : ''}`}>
        <LeftPanel
          isAIPlaying={isAIPlaying}
          isVideoOn={isVideoOn}
          videoRef={videoRef}
          toggleMute={handlers.toggleMute}
          toggleVideo={handlers.toggleVideo}
          onEndInterview={handlers.handleEndInterview}
          isMuted={state.isMuted}
        />

        <RightPanel
          selectedLanguage={state.selectedLanguage}
          isRunning={isRunning}
          code={state.code}
          canEditCode={state.canEditCode}
          output={output}
          activeTab={activeTab}
          messages={state.messages}
          onLanguageChange={handlers.setSelectedLanguage}
          onRunCode={handlers.handleRunCode}
          onCodeChange={handlers.handleCodeChange}
          onTabChange={handlers.setActiveTab}
        />
      </div>

      {showStartOverlay && (
        <StartInterviewOverlay
          onStart={handlers.handleStartInterview}
          isLoading={state.isSending}
        />
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-gray-600">Loading...</div>
    </div>
  );
}

function ErrorScreen() {
  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-red-600">Failed to load assignment.</div>
    </div>
  );
}
