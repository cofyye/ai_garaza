import React from "react";
import { MicOff } from "lucide-react";

interface UserParticipantProps {
  isVideoOn: boolean;
  isMuted: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  volume?: number;
}

export const UserParticipant: React.FC<UserParticipantProps> = ({
  isVideoOn,
  isMuted,
  videoRef,
  volume = 0,
}) => {
  return (
    <div className="flex-1 bg-gray-50 relative p-4 flex items-center justify-center overflow-hidden">
      {isVideoOn ? (
        <div 
          className="w-full h-full rounded-lg overflow-hidden transition-shadow duration-100"
          style={{
            boxShadow: `0 0 ${volume * 30}px ${volume * 10}px rgba(59, 130, 246, 0.5)`
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-full w-full flex items-center justify-center">
          <div 
            className="h-20 w-20 rounded-full bg-gray-800 flex items-center justify-center transition-transform duration-75"
            style={{
              transform: `scale(${1 + volume * 0.5})`,
              boxShadow: `0 0 ${volume * 40}px rgba(59, 130, 246, 0.6)`
            }}
          >
            <span className="text-xl font-bold text-white">ME</span>
          </div>
        </div>
      )}
      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-white z-10">
        You
      </div>
      <div className="absolute top-4 right-4 z-10">
        {isMuted && <MicOff className="h-4 w-4 text-red-500" />}
      </div>
    </div>
  );
};
