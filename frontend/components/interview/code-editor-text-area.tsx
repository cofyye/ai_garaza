import React from "react";

interface CodeEditorTextAreaProps {
  code: string;
  onChange: (code: string) => void;
}

export const CodeEditorTextArea: React.FC<CodeEditorTextAreaProps> = ({
  code,
  onChange,
}) => {
  const lineCount = code.split("\n").length;

  return (
    <div className="flex-1 relative flex overflow-hidden">
      {/* Line Numbers */}
      <div className="w-12 bg-gray-50 border-r border-gray-200 flex flex-col items-end py-4 pr-3 select-none text-gray-400 text-sm font-mono leading-6">
        {Array.from({ length: Math.max(lineCount, 20) }).map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      {/* Textarea */}
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 p-4 bg-white font-mono text-sm leading-6 resize-none focus:outline-none text-gray-800"
        spellCheck={false}
      />
    </div>
  );
};
