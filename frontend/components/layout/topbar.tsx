import React from "react";
import { Bell, Search, MessageSquare } from "lucide-react";

export const Topbar = () => {
  return (
    <header className="flex h-24 items-center justify-between px-6 bg-transparent z-30">
      {/* Search Bar */}
      <div className="flex items-center w-96 bg-white rounded-2xl px-4 py-3 shadow-sm">
        <Search className="h-5 w-5 text-gray-400 mr-3" />
        <input
          type="text"
          placeholder="Search Anything"
          className="bg-transparent border-none focus:outline-none text-sm w-full text-gray-700 placeholder-gray-400"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 bg-white rounded-full p-1.5 shadow-sm">
          <button className="relative rounded-full p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>
          <button className="rounded-full p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <MessageSquare className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 bg-white rounded-full pl-1.5 pr-4 py-1.5 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="h-9 w-9 rounded-full bg-black flex items-center justify-center text-white">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10 10-4.477 10-10zm-8-4a2 2 0 10-4 0 2 2 0 004 0z" />
              <path d="M12 14a4 4 0 00-4 4h8a4 4 0 00-4-4z" />
            </svg>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-sm font-bold text-gray-900">OpenAI</span>
          </div>
        </div>
      </div>
    </header>
  );
};
