import React from "react";
import { ClientFiltersState } from "../../lib/types";

interface ClientsFiltersProps {
  filters: ClientFiltersState;
  setFilters: React.Dispatch<React.SetStateAction<ClientFiltersState>>;
  positions: string[];
}

export const ClientsFilters = ({ filters, setFilters, positions }: ClientsFiltersProps) => {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex flex-wrap gap-2 items-center">
        <label className="text-sm font-medium text-gray-700">Filter by Position:</label>
        <select
          className="h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black min-w-[200px]"
          value={filters.position}
          onChange={(e) => setFilters((prev) => ({ ...prev, position: e.target.value }))}
        >
          <option value="ALL" className="text-gray-900">All Positions</option>
          {positions.map((pos) => (
            <option key={pos} value={pos} className="text-gray-900">{pos}</option>
          ))}
        </select>
      </div>
    </div>
  );
};