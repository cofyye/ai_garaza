import React from "react";
import { JobPost } from "../../lib/types";
import { Drawer, Badge, Button } from "../common/ui-primitives";
import { getStatusColor, formatDate } from "../../lib/utils";
import { Users, BarChart } from "lucide-react";

interface JobDrawerProps {
  job: JobPost | null;
  onClose: () => void;
  onGenerateLink: (job: JobPost) => void;
}

export const JobDrawer = ({ job, onClose, onGenerateLink }: JobDrawerProps) => {
  if (!job) return null;

  return (
    <Drawer isOpen={!!job} onClose={onClose} title="Job Details">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{job.title}</h2>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
            <span className="text-sm text-gray-500">{job.location} • {job.employmentType}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Users className="h-4 w-4" /> Candidates
              </div>
              <div className="text-2xl font-semibold">{job.candidatesCount}</div>
           </div>
           <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <BarChart className="h-4 w-4" /> Avg Score
              </div>
              <div className="text-2xl font-semibold">76%</div>
           </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{job.description.intro}</p>
        </div>

        <div>
           <h3 className="font-semibold text-gray-900 mb-2">Responsibilities</h3>
           <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
             {job.description.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
           </ul>
        </div>

        <div>
           <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
           <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
             {job.description.requirements.map((r, i) => <li key={i}>{r}</li>)}
           </ul>
        </div>
        
        <div className="mt-auto border-t pt-6">
           <Button className="w-full" onClick={() => onGenerateLink(job)}>
             Generate Interview Link
           </Button>
           <p className="mt-2 text-center text-xs text-gray-400">
             Created on {formatDate(job.createdAt)}
           </p>
        </div>
      </div>
    </Drawer>
  );
};