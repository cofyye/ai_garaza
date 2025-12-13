import React from "react";
import { PageHeader } from "../components/common/page-header";
import { KpiRow, KpiCard } from "../components/common/kpi-cards";
import { EmptyState } from "../components/common/empty-state";

export const DashboardPage = () => {
  return (
    <div>
      <PageHeader title="Overview" subtitle="Welcome back, admin." />
      
      <KpiRow>
        <KpiCard label="Active Interviews" value={12} />
        <KpiCard label="Pending Review" value={4} />
        <KpiCard label="Hires This Month" value={3} />
        <KpiCard label="Avg. Completion Time" value="45m" />
      </KpiRow>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="rounded-xl border border-gray-200 bg-white p-1">
          <EmptyState 
             title="No recent activity" 
             description="Your activity feed will populate once candidates start taking interviews." 
          />
        </div>
      </div>
    </div>
  );
};