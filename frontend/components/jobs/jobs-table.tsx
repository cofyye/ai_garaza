import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Users,
  ArrowRight,
} from "lucide-react";
import { Job } from "../../lib/types";
import { Badge, Button } from "../common/ui-primitives";
import { getStatusColor, formatDate } from "../../lib/utils";

interface JobsTableProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
}

export const JobsTable = ({ jobs, onSelectJob }: JobsTableProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 font-medium text-gray-500">Job Title</th>
            <th className="px-6 py-4 font-medium text-gray-500">Status</th>
            <th className="px-6 py-4 font-medium text-gray-500">Location</th>
            <th className="px-6 py-4 font-medium text-gray-500">
              Applications
            </th>
            <th className="px-6 py-4 font-medium text-gray-500">Posted</th>
            <th className="px-6 py-4 font-medium text-gray-500 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {jobs.map((job) => {
            const isExpanded = expandedId === job.id;
            return (
              <React.Fragment key={job.id}>
                <tr
                  className={`hover:bg-gray-50 transition-colors cursor-pointer group ${
                    isExpanded ? "bg-gray-50" : ""
                  }`}
                  onClick={(e) => toggleExpand(job.id, e)}
                >
                  <td className="px-6 py-4">
                    <div>
                      <h3 className="font-bold text-gray-600 group-hover:text-black transition-colors">
                        {job.title}
                      </h3>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getStatusColor(job.status)}>
                      {job.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" /> {job.job_type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {job.applications_count}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDate(job.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </td>
                </tr>

                <AnimatePresence>
                  {isExpanded && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-0 border-b border-gray-100 bg-gray-50/50"
                      >
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="md:col-span-2 space-y-4">
                                <div>
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Description
                                  </h4>
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                    {job.description}
                                  </p>
                                </div>

                                {job.tech_stack &&
                                  job.tech_stack.length > 0 && (
                                    <div>
                                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        Tech Stack
                                      </h4>
                                      <div className="flex flex-wrap gap-2">
                                        {job.tech_stack.map((tech, i) => (
                                          <span
                                            key={i}
                                            className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600 font-medium"
                                          >
                                            {tech}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                              </div>

                              <div className="flex flex-col justify-end items-start md:items-end">
                                <Button
                                  onClick={() => onSelectJob(job)}
                                  className="gap-2"
                                >
                                  View Full Details{" "}
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
