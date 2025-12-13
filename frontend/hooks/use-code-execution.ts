import { useState } from "react";

const API_BASE_URL = "/api";

export const useCodeExecution = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"terminal" | "output">("output");

  const runCode = async (code: string, language: string) => {
    setIsRunning(true);
    setActiveTab("output");
    setOutput("Running...\n");

    try {
      const response = await fetch(`${API_BASE_URL}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });

      const data = await response.json();

      if (data.error) {
        setOutput(`Error:\n${data.error}`);
      } else {
        setOutput(data.output || "(No output)");
      }
    } catch (error) {
      setOutput(
        `Execution Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsRunning(false);
    }
  };

  return {
    isRunning,
    output,
    activeTab,
    runCode,
    setActiveTab,
  };
};
