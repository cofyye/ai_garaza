import React, { useState, useMemo, useEffect } from "react";
import { PageHeader } from "../components/common/page-header";
import { Button, Input } from "../components/common/ui-primitives";
import { Plus, Loader2, Filter } from "lucide-react";
import { ApplicationsTable } from "../components/applications/applications-table";
import { ApplicationDrawer } from "../components/applications/application-drawer";
import { EmptyState } from "../components/common/empty-state";
import { Application, ApplicationFiltersState } from "../lib/types";
import { getApplications, getJobs } from "../lib/api.service";

export const ApplicationsPage = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);

  const [filters, setFilters] = useState<ApplicationFiltersState>({
    search: "",
    status: "ALL",
  });

  // Fetch applications from API
  useEffect(() => {
    fetchApplications();
  }, [filters.status, filters.job_id]);

  const fetchApplications = async () => {
    if (applications.length === 0) setIsLoading(true);
    setError(null);
    try {
      const statusFilter =
        filters.status !== "ALL" ? filters.status : undefined;
      const data = await getApplications({
        status: statusFilter,
        job_id: filters.job_id,
      });
      setApplications(data);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load applications"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Filter applications by search (client-side)
  const filteredApplications = useMemo(() => {
    if (!filters.search) return applications;
    const searchLower = filters.search.toLowerCase();
    return applications.filter(
      (app) =>
        app.user_name?.toLowerCase().includes(searchLower) ||
        app.user_email?.toLowerCase().includes(searchLower) ||
        app.job_title?.toLowerCase().includes(searchLower) ||
        app.company_name?.toLowerCase().includes(searchLower)
    );
  }, [applications, filters.search]);

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
          title="Error loading applications"
          description={error}
          actionLabel="Try Again"
          onAction={() => fetchApplications()}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Applications"
        subtitle="Manage candidate applications and assignments"
      >
        <Button
          className="gap-2"
          onClick={() => alert("Stub: Create Application Modal")}
        >
          <Plus className="h-4 w-4" /> New Application
        </Button>
      </PageHeader>

      <div className="mb-6 flex gap-4">
        <Input
          placeholder="Search by candidate, email, or position..."
          className="max-w-md"
          value={filters.search}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, search: e.target.value }))
          }
        />
        <div className="flex gap-1 bg-gray-100 p-1 rounded-md">
          {(
            [
              "ALL",
              "pending",
              "invited",
              "completed",
              "reviewed",
              "accepted",
              "rejected",
            ] as const
          ).map((s) => (
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

      {filteredApplications.length > 0 ? (
        <ApplicationsTable
          applications={filteredApplications}
          onSelectApplication={setSelectedApplication}
        />
      ) : (
        <EmptyState
          title="No applications found"
          description={
            applications.length === 0
              ? "Applications will appear here when candidates apply."
              : "No applications match your search criteria."
          }
          actionLabel={filters.search ? "Clear Search" : undefined}
          onAction={
            filters.search
              ? () => setFilters({ search: "", status: "ALL" })
              : undefined
          }
        />
      )}

      {selectedApplication && (
        <ApplicationDrawer
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onUpdate={fetchApplications}
        />
      )}
    </div>
  );
};
