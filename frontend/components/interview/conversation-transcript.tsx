import type { InterviewMessage } from "../../lib/api.service";

interface ConversationTranscriptProps {
  messages: InterviewMessage[];
}

export function ConversationTranscript({ messages }: ConversationTranscriptProps) {
  if (messages.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 max-h-64 overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">Conversation</h3>
      <div className="space-y-2">
        {messages.slice(-10).map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={idx}
              className={`text-xs p-2 rounded ${
                isUser ? "bg-blue-50 text-blue-900" : "bg-gray-50 text-gray-900"
              }`}
            >
              <div className="font-semibold mb-1">
                {isUser ? "You" : "AI Interviewer"}
              </div>
              <div>{msg.text}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
