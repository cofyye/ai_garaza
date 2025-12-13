import React, { useState, useEffect } from "react";
import { Application, Assignment } from "../../lib/types";
import {
  X,
  Mail,
  Clock,
  CheckCircle,
  Calendar,
  Send,
  Briefcase,
  Building2,
  User,
  FileText,
} from "lucide-react";
import { Button, Badge } from "../common/ui-primitives";
import {
  getAssignmentByApplication,
  generateAssignment,
} from "../../lib/api.service";
import { formatDistanceToNow, format } from "date-fns";
import { getStatusColor } from "../../lib/utils";

interface ApplicationDrawerProps {
  application: Application;
  onClose: () => void;
  onUpdate?: () => void;
}

const statusLabels: Record<string, string> = {
  pending: "pending",
  invited: "invited",
  completed: "completed",
  reviewed: "reviewed",
  accepted: "accepted",
  rejected: "rejected",
};

export const ApplicationDrawer: React.FC<ApplicationDrawerProps> = ({
  application,
  onClose,
  onUpdate,
}) => {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssignment();
  }, [application.id]);

  const loadAssignment = async () => {
    setIsLoadingAssignment(true);
    setError(null);
    try {
      const data = await getAssignmentByApplication(application.id);
      setAssignment(data);
    } catch (err) {
      console.error("Failed to load assignment:", err);
    } finally {
      setIsLoadingAssignment(false);
    }
  };

  const handleGenerateAssignment = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      await generateAssignment(application.id);
      await loadAssignment();
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate assignment"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-2xl w-full bg-gray-50 shadow-2xl flex flex-col h-full border-l border-gray-200">
        {/* Header Section - Styled like Job Page Header */}
        <div className="bg-white border-b border-gray-200 p-8 shadow-sm z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">
                  {application.user_name || "Unknown Candidate"}
                </h2>
                <Badge
                  className={`${getStatusColor(application.status)} border`}
                >
                  {statusLabels[application.status] || application.status}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600 border border-gray-200">
                  <Mail className="h-3.5 w-3.5 text-gray-500" />{" "}
                  {application.user_email || "No email"}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600 border border-gray-200">
                  <Briefcase className="h-3.5 w-3.5 text-gray-500" />{" "}
                  {application.job_title}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600 border border-gray-200">
                  <Clock className="h-3.5 w-3.5 text-gray-500" /> Applied{" "}
                  {formatDistanceToNow(new Date(application.applied_at), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Technical Assignment Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">
              Technical Assignment
            </h3>

            {isLoadingAssignment ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : assignment ? (
              <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {assignment.task_title}
                    </h4>
                  </div>
                  <Badge
                    className={
                      assignment.status === "sent"
                        ? "bg-blue-100 text-blue-800 border-blue-200"
                        : assignment.status === "submitted"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-gray-100 text-gray-800 border-gray-200"
                    }
                  >
                    {assignment.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-white p-3 rounded-lg border border-blue-100">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>{assignment.time_limit_hours}h time limit</span>
                  </div>
                  {assignment.deadline && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-white p-3 rounded-lg border border-blue-100">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span>
                        Due{" "}
                        {format(new Date(assignment.deadline), "MMM d, HH:mm")}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-white p-3 rounded-lg border border-blue-100">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <span>{assignment.email_sent_count} email(s) sent</span>
                  </div>
                </div>

                {/* Interview Session URL */}
                {assignment.session_url && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Interview Session Link
                    </p>
                    <a
                      href={assignment.session_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium underline break-all block mb-2"
                    >
                      {assignment.session_url}
                    </a>
                    <p className="text-xs text-gray-600">
                      Candidate can access their technical interview using this
                      unique link.
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-blue-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Key Requirements
                  </p>
                  <ul className="space-y-2">
                    {assignment.task_requirements
                      .slice(0, 3)
                      .map((req, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-gray-700"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <div className="bg-white p-3 rounded-full w-fit mx-auto mb-4 shadow-sm border border-gray-100">
                  <Send className="h-6 w-6 text-gray-400" />
                </div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  No Assignment Sent
                </h4>
                <p className="text-sm text-gray-500 mb-6">
                  Generate a technical task for this candidate.
                </p>
                <Button
                  onClick={handleGenerateAssignment}
                  disabled={isGenerating}
                  className="gap-2 shadow-lg shadow-blue-500/20"
                >
                  {isGenerating ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>Generate & Send Assignment</>
                  )}
                </Button>
                {error && (
                  <p className="text-sm text-red-600 mt-4 bg-red-50 py-2 px-3 rounded-lg inline-block border border-red-100">
                    {error}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Internal Notes Card */}
          {application.notes && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                Internal Notes
              </h3>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100 text-sm text-yellow-800 leading-relaxed">
                {application.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 p-6 flex justify-end gap-3 z-10">
          <Button variant="outline" onClick={onClose}>
            Close Details
          </Button>
        </div>
      </div>
    </div>
  );
};
