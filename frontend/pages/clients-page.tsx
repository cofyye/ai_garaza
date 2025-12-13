import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/common/page-header";
import { Button } from "../components/common/ui-primitives";
import { Plus, Download } from "lucide-react";
import { ClientsFilters } from "../components/clients/clients-filters";
import { ClientsTable } from "../components/clients/clients-table";
import { EmptyState } from "../components/common/empty-state";
import { MOCK_CLIENTS } from "../lib/mock-data";
import { filterClients, getUniquePositions } from "../lib/filters";
import { ClientFiltersState } from "../lib/types";

export const ClientsPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ClientFiltersState>({
    search: "",
    position: "ALL",
    status: "ALL",
    sort: "NEWEST",
  });
  
  // Filter Data
  const filteredClients = useMemo(() => filterClients(MOCK_CLIENTS, filters), [filters]);
  const positions = useMemo(() => getUniquePositions(MOCK_CLIENTS), []);

  return (
    <div className="p-6">
      <PageHeader title="Clients" subtitle="Manage candidates and interview statuses">
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export
        </Button>
        <Button className="gap-2" onClick={() => alert("Stub: Open add client modal")}>
          <Plus className="h-4 w-4" /> Add Client
        </Button>
      </PageHeader>

      <ClientsFilters filters={filters} setFilters={setFilters} positions={positions} />

      {filteredClients.length > 0 ? (
        <ClientsTable 
          clients={filteredClients} 
          onSelectClient={(client) => navigate(`/clients/${client.id}`)} 
        />
      ) : (
        <EmptyState 
          title="No clients found" 
          description="Try adjusting your filters." 
          actionLabel="Clear Filters"
          onAction={() => setFilters({ search: "", position: "ALL", status: "ALL", sort: "NEWEST" })}
        />
      )}
    </div>
  );
};