import React from "react";
import { Terminal as TerminalIcon } from "lucide-react";

interface ConsoleOutputProps {
  activeTab: "terminal" | "output";
  output: string;
  onTabChange: (tab: "terminal" | "output") => void;
}

export const ConsoleOutput: React.FC<ConsoleOutputProps> = ({
  activeTab,
  output,
  onTabChange,
}) => {
  return (
    <div className="h-1/3 border-t border-gray-200 flex flex-col bg-gray-50 text-gray-900">
      <div className="h-9 border-b border-gray-200 flex items-center px-4 gap-4 bg-gray-100">
        <button
          onClick={() => onTabChange("output")}
          className={`h-full text-xs font-medium flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "output"
              ? "border-black text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <TerminalIcon className="h-3.5 w-3.5" />
          Console Output
        </button>
      </div>
      <div className="flex-1 p-4 font-mono text-xs overflow-auto whitespace-pre-wrap text-gray-800">
        {output || (
          <span className="text-gray-400">Run your code to see output here...</span>
        )}
      </div>
    </div>
  );
};
