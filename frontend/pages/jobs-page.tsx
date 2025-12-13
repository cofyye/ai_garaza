import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/common/page-header";
import { Button, Input } from "../components/common/ui-primitives";
import { Plus, Loader2 } from "lucide-react";
import { JobsTable } from "../components/jobs/jobs-table";
import { EmptyState } from "../components/common/empty-state";
import { Job, JobFiltersState, JobStatus } from "../lib/types";
import { getJobs } from "../lib/api.service";

export const JobsPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<JobFiltersState>({
    search: "",
    status: "ALL",
  });

  // Fetch jobs from API
  useEffect(() => {
    const fetchJobs = async () => {
      // Only show full loading state on initial load
      if (jobs.length === 0) setIsLoading(true);
      setError(null);
      try {
        const statusFilter =
          filters.status !== "ALL" ? (filters.status as JobStatus) : undefined;
        const data = await getJobs({ status: statusFilter });
        setJobs(data);
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
        setError(err instanceof Error ? err.message : "Failed to load jobs");
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [filters.status]);

  // Filter jobs by search (client-side)
  const filteredJobs = useMemo(() => {
    if (!filters.search) return jobs;
    const searchLower = filters.search.toLowerCase();
    return jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(searchLower) ||
        job.location.toLowerCase().includes(searchLower)
    );
  }, [jobs, filters.search]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <EmptyState
          title="Error loading jobs"
          description={error}
          actionLabel="Try Again"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Job Posts"
        subtitle="Manage open positions and requirements"
      >
        <Button
          className="gap-2"
          onClick={() => alert("Stub: Create Job Modal")}
        >
          <Plus className="h-4 w-4" /> Create Job Post
        </Button>
      </PageHeader>

      <div className="mb-6 flex gap-4">
        <Input
          placeholder="Search jobs..."
          className="max-w-sm"
          value={filters.search}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, search: e.target.value }))
          }
        />
        <div className="flex gap-1 bg-gray-100 p-1 rounded-md">
          {(["ALL", "active", "closed", "draft"] as const).map((s) => (
            <button
              key={s}
              onClick={() =>
                setFilters((prev) => ({ ...prev, status: s as any }))
              }
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                filters.status === s
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
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
          description={
            jobs.length === 0
              ? "Create a new job post to get started."
              : "No jobs match your search criteria."
          }
          actionLabel={filters.search ? "Clear Search" : undefined}
          onAction={
            filters.search
              ? () => setFilters({ search: "", status: "ALL" })
              : undefined
          }
        />
      )}
    </div>
  );
};
