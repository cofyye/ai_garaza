import React from "react";
import { Bell } from "lucide-react";

export const Topbar = () => {
  return (
    <header className="flex h-14 items-center justify-end border-b border-gray-200 bg-white px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
        <div className="h-8 w-8 cursor-pointer rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500" />
      </div>
    </header>
  );
};