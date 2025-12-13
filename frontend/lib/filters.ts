import { Client, ClientFiltersState, Job, JobPost, JobFiltersState } from "./types";

export function filterClients(clients: Client[], filters: ClientFiltersState): Client[] {
  return clients.filter((client) => {
    // Search
    const searchMatch =
      client.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      client.email.toLowerCase().includes(filters.search.toLowerCase());
    
    // Position
    const positionMatch =
      filters.position === "ALL" || client.position === filters.position;

    // Status
    const statusMatch = filters.status === "ALL" || client.status === filters.status;

    return searchMatch && positionMatch && statusMatch;
  }).sort((a, b) => {
    switch (filters.sort) {
      case "NEWEST":
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      case "OLDEST":
        return new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
      case "SCORE_HIGH":
        return (b.interviewScore || 0) - (a.interviewScore || 0);
      case "SCORE_LOW":
        // Handle undefined scores by pushing them to the bottom or treating as 0 depending on pref
        if (a.interviewScore === undefined) return 1;
        if (b.interviewScore === undefined) return -1;
        return a.interviewScore - b.interviewScore;
      default:
        return 0;
    }
  });
}

// Filter for new Job type (from backend API)
export function filterJobsApi(jobs: Job[], filters: JobFiltersState): Job[] {
  return jobs.filter((job) => {
    const searchMatch = job.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                       job.company.toLowerCase().includes(filters.search.toLowerCase());
    const statusMatch = filters.status === "ALL" || job.status === filters.status;
    return searchMatch && statusMatch;
  });
}

// Legacy filter for JobPost (mock data) - kept for backwards compatibility
export function filterJobs(jobs: JobPost[], filters: { search: string; status: string }): JobPost[] {
  return jobs.filter((job) => {
    const searchMatch = job.title.toLowerCase().includes(filters.search.toLowerCase());
    const statusMatch = filters.status === "ALL" || job.status === filters.status;
    return searchMatch && statusMatch;
  });
}

export function getUniquePositions(clients: Client[]): string[] {
  const positions = new Set<string>();
  clients.forEach(c => positions.add(c.position));
  return Array.from(positions).sort();
}