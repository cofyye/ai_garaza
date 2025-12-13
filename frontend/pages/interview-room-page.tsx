import React, { useState } from "react";
import { InterviewHeader } from "../components/interview/interview-header";
import { AIParticipant } from "../components/interview/ai-participant";
import { UserParticipant } from "../components/interview/user-participant";
import { InterviewControls } from "../components/interview/interview-controls";
import { CodeEditorToolbar } from "../components/interview/code-editor-toolbar";
import { CodeEditorTextArea } from "../components/interview/code-editor-text-area";
import { ConsoleOutput } from "../components/interview/console-output";
import { TaskModal } from "../components/interview/task-modal";
import { useSpeechRecognition } from "../hooks/use-speech-recognition";
import { useVideoStream } from "../hooks/use-video-stream";
import { useCodeExecution } from "../hooks/use-code-execution";
import { useAudioVisualizer } from "../hooks/use-audio-visualizer";

export const InterviewRoomPage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("python");
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [code, setCode] = useState(`def solve_problem(arr, target):
    """
    Implement a function that finds the two numbers 
    in the array that add up to the target.
    """
    seen = {}
    for i, num in enumerate(arr):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Test case
result = solve_problem([2, 7, 11, 15], 9)
print(f"Result: {result}")`);

  const taskDescription = `Two Sum Problem:

Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]

Example 3:
Input: nums = [3,3], target = 6
Output: [0,1]
`;

  // Custom hooks
  const { isListening, isMuted, toggleMic } = useSpeechRecognition();
  const { isVideoOn, videoRef, toggleVideo } = useVideoStream();
  const { isRunning, output, activeTab, runCode, setActiveTab } =
    useCodeExecution();
  const volume = useAudioVisualizer(isMuted);

  const handleRunCode = () => {
    runCode(code, selectedLanguage);
  };

  const handleEndInterview = () => {
    console.log("� Ending interview...");
    // TODO: Navigate away or show confirmation
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden font-sans text-gray-900 relative">
      <InterviewHeader onToggleTask={() => setIsTaskOpen(true)} />

      <TaskModal
        isOpen={isTaskOpen}
        onClose={() => setIsTaskOpen(false)}
        taskDescription={taskDescription}
      />

      {/* Main Content */}
      <div className="flex-1 flex p-6 gap-6 overflow-hidden">
        {/* LEFT PANEL: Participants & Controls */}
        <div className="w-[400px] flex flex-col gap-4">
          {/* Participants Card */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <AIParticipant isListening={isListening} />
            <UserParticipant
              isVideoOn={isVideoOn}
              isMuted={isMuted}
              videoRef={videoRef}
              volume={volume}
            />
          </div>

          {/* Controls Card */}
          <InterviewControls
            isMuted={isMuted}
            isVideoOn={isVideoOn}
            onToggleMic={toggleMic}
            onToggleVideo={toggleVideo}
            onEndInterview={handleEndInterview}
          />
        </div>

        {/* RIGHT PANEL: Code Editor */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <CodeEditorToolbar
            selectedLanguage={selectedLanguage}
            isRunning={isRunning}
            onLanguageChange={setSelectedLanguage}
            onRunCode={handleRunCode}
          />

          {/* Editor Area */}
          <div className="flex-1 flex flex-col min-h-0">
            <CodeEditorTextArea code={code} onChange={setCode} />
            <ConsoleOutput
              activeTab={activeTab}
              output={output}
              onTabChange={setActiveTab}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
