import React from "react";
import { motion } from "framer-motion";
import { MapPin, Briefcase } from "lucide-react";
import { JobPost } from "../../lib/types";
import { Badge } from "../common/ui-primitives";
import { getStatusColor, formatDate } from "../../lib/utils";

interface JobsTableProps {
  jobs: JobPost[];
  onSelectJob: (job: JobPost) => void;
}

export const JobsTable = ({ jobs, onSelectJob }: JobsTableProps) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <motion.div
          key={job.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          whileHover={{ 
            y: -5, 
            boxShadow: "0 12px 24px -8px rgba(0, 0, 0, 0.15)",
            transition: { duration: 0.2, ease: "easeInOut" }
          }}
          onClick={() => onSelectJob(job)}
          className="cursor-pointer rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start justify-between">
             <div className="mb-4">
                <h3 className="font-bold text-gray-900">{job.title}</h3>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" /> {job.employmentType}
                  </span>
                </div>
             </div>
             <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
          </div>

          <p className="mb-6 text-sm text-gray-600 line-clamp-2">{job.description.intro}</p>

          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <div className="text-xs text-gray-500">
              <span className="font-semibold text-gray-900">{job.candidatesCount}</span> Candidates
            </div>
            <div className="text-xs text-gray-400">Created {formatDate(job.createdAt)}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};