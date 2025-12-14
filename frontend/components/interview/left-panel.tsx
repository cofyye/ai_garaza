import React from "react";
import { AIParticipant } from "./ai-participant";
import { UserParticipant } from "./user-participant";
import { InterviewControls } from "./interview-controls";

interface LeftPanelProps {
  isAIPlaying: boolean;
  isVideoOn: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  toggleMute: () => void;
  toggleVideo: () => void;
  onEndInterview: () => void;
  isMuted: boolean;
}

export function LeftPanel({
  isAIPlaying,
  isVideoOn,
  videoRef,
  toggleMute,
  toggleVideo,
  onEndInterview,
  isMuted,
}: LeftPanelProps) {
  return (
    <div className="w-[350px] flex flex-col gap-4">
      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <AIParticipant isListening={isAIPlaying} />
        <UserParticipant
          isVideoOn={isVideoOn}
          isMuted={isMuted}
          videoRef={videoRef}
          volume={0}
        />
      </div>

      <InterviewControls
        isMuted={isMuted}
        isVideoOn={isVideoOn}
        onToggleMic={toggleMute}
        onToggleVideo={toggleVideo}
        onEndInterview={onEndInterview}
      />
    </div>
  );
}
