import React from "react";
import { Cpu, Settings, ListTodo } from "lucide-react";
import { Button } from "../common/ui-primitives";

interface InterviewHeaderProps {
  onToggleTask?: () => void;
}

export const InterviewHeader = ({ onToggleTask }: InterviewHeaderProps) => {
  return (
    <header className="h-20 bg-gray-100 flex items-center justify-between px-6 shrink-0 z-10">
      <div className="flex items-center">
        <Cpu className="mr-2 h-8 w-8 text-black" />
        <span className="text-xl font-bold text-black">EngVal.AI</span>
      </div>

      <div className="flex items-center gap-4">
        <Button 
          variant="secondary" 
          size="sm" 
          className="gap-2"
          onClick={onToggleTask}
        >
          <ListTodo className="h-4 w-4" />
          <span>Get your task</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4 text-gray-500" />
        </Button>
      </div>
    </header>
  );
};
