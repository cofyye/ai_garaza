import { CodeEditorToolbar } from "./code-editor-toolbar";
import { CodeEditorTextArea } from "./code-editor-text-area";
import { ConsoleOutput } from "./console-output";
import type { InterviewMessage } from "../../lib/api.service";

interface RightPanelProps {
  selectedLanguage: string;
  isRunning: boolean;
  code: string;
  canEditCode: boolean;
  output: string;
  activeTab: string;
  messages: InterviewMessage[];
  onLanguageChange: (lang: string) => void;
  onRunCode: () => void;
  onCodeChange: (code: string) => void;
  onTabChange: (tab: string) => void;
}

export function RightPanel({
  selectedLanguage,
  isRunning,
  code,
  canEditCode,
  output,
  activeTab,
  messages,
  onLanguageChange,
  onRunCode,
  onCodeChange,
  onTabChange,
}: RightPanelProps) {
  return (
    <div className="flex-1 flex gap-4 overflow-hidden">
      {/* Code Editor */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
        <CodeEditorToolbar
          selectedLanguage={selectedLanguage}
          isRunning={isRunning}
          onLanguageChange={onLanguageChange}
          onRunCode={onRunCode}
          disabled={!canEditCode}
        />

        <div className="flex-1 flex flex-col min-h-0">
          <CodeEditorTextArea
            code={code}
            onChange={onCodeChange}
            disabled={!canEditCode}
          />
          <ConsoleOutput
            activeTab={activeTab}
            output={output}
            onTabChange={onTabChange}
          />
        </div>
      </div>

      {/* Chat Panel */}
      <div className="w-[350px] bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Conversation</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={idx}
                  className={`text-sm p-3 rounded-lg ${
                    isUser ? "bg-blue-50 text-blue-900" : "bg-gray-50 text-gray-900"
                  }`}
                >
                  <div className="font-semibold mb-1 text-xs">
                    {isUser ? "You" : "AI Interviewer"}
                  </div>
                  <div>{msg.text}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
