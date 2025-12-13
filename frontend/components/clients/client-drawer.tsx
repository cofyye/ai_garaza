import React from "react";
import { Client } from "../../lib/types";
import { Drawer, Badge } from "../common/ui-primitives";
import { getStatusColor, getInitials, formatDate } from "../../lib/utils";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface ClientDrawerProps {
  client: Client | null;
  onClose: () => void;
}

export const ClientDrawer = ({ client, onClose }: ClientDrawerProps) => {
  if (!client) return null;

  return (
    <Drawer isOpen={!!client} onClose={onClose} title="Candidate Profile">
      <div className="flex flex-col gap-6">
        {/* Profile Header */}
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-600">
            {getInitials(client.name)}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{client.name}</h3>
            <p className="text-sm text-gray-500">{client.email}</p>
            <div className="mt-2">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block">
                  {client.position}
                </span>
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-gray-100" />

        {/* Status */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">Interview Status</span>
            <Badge className={getStatusColor(client.status)}>{client.status.replace("_", " ")}</Badge>
          </div>

          {client.status === "NOT_STARTED" && (
            <div className="text-center pb-2">
              <p className="text-sm text-gray-500">Candidate has not started the interview yet.</p>
            </div>
          )}

          {client.status === "IN_PROGRESS" && (
            <div className="flex flex-col gap-2">
               <div className="flex items-center gap-2 text-sm text-blue-600">
                 <Clock className="h-4 w-4" />
                 <span>Interview in progress</span>
               </div>
               {client.linkExpiresAt && (
                 <p className="text-xs text-gray-400">Link expires: {formatDate(client.linkExpiresAt)}</p>
               )}
            </div>
          )}

           {client.status === "EXPIRED" && (
            <div className="text-center pb-2">
              <p className="text-sm text-red-500 flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" /> Link expired
              </p>
            </div>
          )}
        </div>

        {/* Interview Results (If Completed) */}
        {client.status === "COMPLETED" && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Interview Summary</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-200 p-3 text-center">
                 <div className="text-xs text-gray-500 uppercase">Score</div>
                 <div className="text-2xl font-bold text-gray-900">{client.interviewScore}%</div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 text-center flex flex-col items-center justify-center">
                 <div className="text-xs text-gray-500 uppercase mb-1">Verdict</div>
                 <Badge className={getStatusColor(client.verdict || "")}>{client.verdict?.replace("_", " ")}</Badge>
              </div>
            </div>

            {/* Mock Skills Breakdown */}
            <div className="space-y-3">
               <div className="flex items-center justify-between text-sm">
                 <span>Communication</span>
                 <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                   <div className="h-full bg-green-500 w-[85%]"></div>
                 </div>
               </div>
               <div className="flex items-center justify-between text-sm">
                 <span>Problem Solving</span>
                 <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500 w-[70%]"></div>
                 </div>
               </div>
               <div className="flex items-center justify-between text-sm">
                 <span>Technical Knowledge</span>
                 <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500 w-[90%]"></div>
                 </div>
               </div>
            </div>

            <div className="rounded-md bg-green-50 p-3">
              <h5 className="flex items-center gap-2 text-sm font-semibold text-green-800">
                <CheckCircle2 className="h-4 w-4" /> Strengths
              </h5>
              <ul className="mt-2 list-disc pl-5 text-sm text-green-700 space-y-1">
                <li>Excellent explanation of React hooks</li>
                <li>Clear variable naming conventions</li>
                <li>Good understanding of system scalability</li>
              </ul>
            </div>
            
            <div className="rounded-md bg-gray-50 p-3">
               <h5 className="text-sm font-semibold text-gray-900 mb-2">Transcript Snippet</h5>
               <p className="text-xs text-gray-600 italic">"I usually start by breaking down the UI into atomic components..."</p>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};