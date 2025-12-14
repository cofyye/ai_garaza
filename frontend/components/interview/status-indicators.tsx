import React from "react";

interface StatusIndicatorProps {
  isMuted: boolean;
  isRecording: boolean;
  isSending: boolean;
  isAIPlaying: boolean;
  recorderError: string | null;
}

export function StatusIndicators({
  isMuted,
  isRecording,
  isSending,
  isAIPlaying,
  recorderError,
}: StatusIndicatorProps) {
  return (
    <>
      {!isMuted && !isRecording && !isSending && !isAIPlaying && (
        <ListeningModeIndicator />
      )}
      {isRecording && <RecordingIndicator />}
      {isAIPlaying && <AISpeakingIndicator isMuted={isMuted} />}
      {isSending && <ProcessingIndicator />}
      {recorderError && <ErrorIndicator error={recorderError} />}
    </>
  );
}

function ListeningModeIndicator() {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
      <p className="text-sm text-green-700 font-medium">
        🎧 Mic on - Listening for your voice...
      </p>
    </div>
  );
}

function RecordingIndicator() {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      <p className="text-sm text-red-700 font-medium">
        🎤 Recording... Will auto-send when you stop speaking
      </p>
    </div>
  );
}

function AISpeakingIndicator({ isMuted }: { isMuted: boolean }) {
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center gap-2">
      <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
      <p className="text-sm text-purple-700 font-medium">
        🔊 AI is speaking...{!isMuted && " (Click mic to mute)"}
      </p>
    </div>
  );
}

function ProcessingIndicator() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
      <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="text-sm text-blue-700">Processing your audio...</p>
    </div>
  );
}

function ErrorIndicator({ error }: { error: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
      <p className="text-sm text-red-700">⚠️ {error}</p>
    </div>
  );
}
