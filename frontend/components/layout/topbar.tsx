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
      <div className="flex items-center gap-4 bg-white rounded-full px-6 shadow-sm">
        <button className="relative rounded-full p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <button className="rounded-full p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
          <MessageSquare className="h-5 w-5" />
        </button>

        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/1280px-OpenAI_Logo.svg.png"
          alt="OpenAI"
          className="h-16 w-20 rounded-full object-contain p-1 mr-1"
        />
      </div>
    </header>
  );
};
