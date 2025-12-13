import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/common/page-header";
import { Button, Input } from "../components/common/ui-primitives";
import { Plus } from "lucide-react";
import { JobsTable } from "../components/jobs/jobs-table";
import { EmptyState } from "../components/common/empty-state";
import { MOCK_JOBS } from "../lib/mock-data";
import { filterJobs } from "../lib/filters";
import { JobFiltersState } from "../lib/types";

export const JobsPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<JobFiltersState>({
    search: "",
    status: "ALL",
  });
  
  const filteredJobs = useMemo(() => filterJobs(MOCK_JOBS, filters), [filters]);

  return (
    <div className="p-6">
      <PageHeader title="Job Posts" subtitle="Manage open positions and requirements">
        <Button className="gap-2" onClick={() => alert("Stub: Create Job Modal")}>
          <Plus className="h-4 w-4" /> Create Job Post
        </Button>
      </PageHeader>

      <div className="mb-6 flex gap-4">
        <Input 
          placeholder="Search jobs..." 
          className="max-w-sm" 
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
        />
        <div className="flex gap-1 bg-gray-100 p-1 rounded-md">
           {['ALL', 'OPEN', 'CLOSED'].map((s) => (
             <button
               key={s}
               onClick={() => setFilters(prev => ({ ...prev, status: s as any }))}
               className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filters.status === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
               {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
             </button>
           ))}
        </div>
      </div>

      {filteredJobs.length > 0 ? (
        <JobsTable 
          jobs={filteredJobs} 
          onSelectJob={(job) => navigate(`/jobs/${job.id}`)} 
        />
      ) : (
        <EmptyState 
           title="No jobs found" 
           description="Create a new job post to get started." 
           actionLabel="Clear Search"
           onAction={() => setFilters({ search: "", status: "ALL" })}
        />
      )}
    </div>
  );
};