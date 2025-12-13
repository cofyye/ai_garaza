import React from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";

interface InterviewControlsProps {
  isMuted: boolean;
  isVideoOn: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onEndInterview: () => void;
}

export const InterviewControls: React.FC<InterviewControlsProps> = ({
  isMuted,
  isVideoOn,
  onToggleMic,
  onToggleVideo,
  onEndInterview,
}) => {
  return (
    <div className="h-24 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center gap-6 px-6">
      <button
        onClick={onToggleMic}
        className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
          isMuted
            ? "bg-red-100 text-red-600"
            : "bg-green-100 text-green-600 ring-2 ring-green-200"
        }`}
      >
        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </button>

      <button
        onClick={onToggleVideo}
        className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
          !isVideoOn
            ? "bg-red-100 text-red-600"
            : "bg-green-100 text-green-600 ring-2 ring-green-200"
        }`}
      >
        {!isVideoOn ? (
          <VideoOff className="h-5 w-5" />
        ) : (
          <Video className="h-5 w-5" />
        )}
      </button>

      <button
        onClick={onEndInterview}
        className="h-12 px-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 font-medium transition-colors shadow-sm shadow-red-200"
      >
        <PhoneOff className="h-4 w-4" />
        <span>End</span>
      </button>
    </div>
  );
};
