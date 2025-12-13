import React from "react";
import { Cpu, MicOff } from "lucide-react";

interface AIParticipantProps {
  isListening: boolean;
}

export const AIParticipant: React.FC<AIParticipantProps> = ({ isListening }) => {
  return (
    <div className="flex-1 bg-gray-50 relative border-b border-gray-100 p-4 flex items-center justify-center">
      <div className="h-24 w-24 rounded-full bg-gray-900 flex items-center justify-center shadow-lg">
        <Cpu className="h-10 w-10 text-white" />
      </div>
      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-white">
        Your Interviewer
      </div>
    </div>
  );
};
