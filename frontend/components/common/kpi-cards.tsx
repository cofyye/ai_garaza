import React from "react";
import { motion } from "framer-motion";

interface KpiCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: string;
}

export const KpiRow = ({ children }: { children?: React.ReactNode }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
    {children}
  </div>
);

export const KpiCard = ({ label, value }: KpiCardProps) => {
  return (
    <div 
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <dt className="truncate text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-2 text-3xl font-semibold text-gray-900 tracking-tight">{value}</dd>
    </div>
  );
};