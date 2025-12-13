import React from "react";
import { Application } from "../../lib/types";
import { formatDistanceToNow } from "date-fns";

interface ApplicationsTableProps {
  applications: Application[];
  onSelectApplication: (application: Application) => void;
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  invited: "bg-blue-100 text-blue-800",
  completed: "bg-purple-100 text-purple-800",
  reviewed: "bg-indigo-100 text-indigo-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  invited: "Invited",
  completed: "Completed",
  reviewed: "Reviewed",
  accepted: "Accepted",
  rejected: "Rejected",
};

export const ApplicationsTable: React.FC<ApplicationsTableProps> = ({
  applications,
  onSelectApplication,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Candidate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Job Position
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Applied
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cover Letter
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {applications.map((application) => (
              <tr
                key={application.id}
                onClick={() => onSelectApplication(application)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {application.user_name
                          ? application.user_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                          : "?"}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {application.user_name || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {application.user_email || "No email"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {application.job_title || "Unknown Position"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {application.company_name || "Unknown Company"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      statusStyles[application.status] ||
                      "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {statusLabels[application.status] || application.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDistanceToNow(new Date(application.applied_at), {
                    addSuffix: true,
                  })}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {application.cover_letter ? (
                    <span className="line-clamp-2">
                      {application.cover_letter}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">
                      No cover letter
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
