import React from "react";
import { Code2, Play, Loader2 } from "lucide-react";
import { Button } from "../common/ui-primitives";

interface CodeEditorToolbarProps {
  selectedLanguage: string;
  isRunning: boolean;
  onLanguageChange: (language: string) => void;
  onRunCode: () => void;
  disabled?: boolean;
}

export const CodeEditorToolbar: React.FC<CodeEditorToolbarProps> = ({
  selectedLanguage,
  isRunning,
  onLanguageChange,
  onRunCode,
  disabled = false,
}) => {
  return (
    <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4 bg-gray-50/50">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md shadow-sm">
          <Code2 className="h-4 w-4 text-blue-600" />
          <span className="text-xs font-semibold text-gray-700">solution.py</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <select
          className="text-xs border-none bg-transparent font-medium text-gray-600 focus:ring-0 cursor-pointer hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          value={selectedLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          disabled={disabled}
        >
          <option value="python">Python 3.10</option>
          <option value="javascript" disabled>
            JavaScript (Node)
          </option>
        </select>
        <div className="h-4 w-[1px] bg-gray-300" />
        <Button onClick={onRunCode} disabled={isRunning || disabled} className="h-8 text-xs gap-2">
          {isRunning ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Play className="h-3 w-3" />
          )}
          Run Code
        </Button>
      </div>
    </div>
  );
};
