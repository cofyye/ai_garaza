import React, { useEffect, useState } from "react";
import { PageHeader } from "../components/common/page-header";
import { Input } from "../components/common/ui-primitives";
import { AnalyticsTable } from "../components/analytics/analytics-table";
import { getAnalytics, CandidateAnalysis } from "../lib/api.service";

export const AnalyticsPage = () => {
  const [candidates, setCandidates] = useState<CandidateAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [verdictFilter, setVerdictFilter] = useState<string>("All");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const params: any = {
          pageSize: 50,
          sortBy: "overallScore",
          sortOrder: "desc" as const,
        };
        
        if (searchQuery) {
          params.search = searchQuery;
        }
        
        if (verdictFilter !== "All") {
          params.verdict = verdictFilter.toUpperCase().replace(" ", "_");
        }
        
        const response = await getAnalytics(params);
        setCandidates(response.candidates);
        setTotal(response.total);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
        setError(err instanceof Error ? err.message : "Failed to load analytics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [searchQuery, verdictFilter]);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(debouncedSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [debouncedSearch]);

  const verdictOptions = ["All", "Strong Hire", "Hire", "Maybe", "No Hire"];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Interview Analytics" 
        subtitle={`AI-powered analysis and ranking of interview performance${total > 0 ? ` • ${total} candidates` : ''}`} 
      />
      
      <div className="mb-6 flex gap-4">
        <Input 
          placeholder="Search by candidate name or position..." 
          className="max-w-md" 
          value={debouncedSearch} 
          onChange={(e) => setDebouncedSearch(e.target.value)} 
        />
        <div className="flex gap-1 bg-gray-100 p-1 rounded-md">
          {verdictOptions.map((status) => (
            <button 
              key={status} 
              onClick={() => setVerdictFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                status === verdictFilter 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading analytics...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500">{error}</div>
        </div>
      ) : candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-gray-400 text-lg mb-2">No interview analyses yet</div>
          <div className="text-gray-500 text-sm">
            Completed interviews will appear here with AI-generated insights
          </div>
        </div>
      ) : (
        <AnalyticsTable candidates={candidates} />
      )}
    </div>
  );
};
