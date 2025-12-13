import React, { useState, useEffect } from "react";
import { Application, Assignment } from "../../lib/types";
import { X, Mail, Clock, CheckCircle, Calendar, Send } from "lucide-react";
import { Button } from "../common/ui-primitives";
import {
  getAssignmentByApplication,
  generateAssignment,
} from "../../lib/api.service";
import { formatDistanceToNow, format } from "date-fns";

interface ApplicationDrawerProps {
  application: Application;
  onClose: () => void;
  onUpdate?: () => void;
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
  pending: "Pending Review",
  invited: "Assignment Sent",
  completed: "Assignment Completed",
  reviewed: "Under Review",
  accepted: "Accepted",
  rejected: "Rejected",
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
    if (!confirm("Generate and send technical assignment to this candidate?"))
      return;

    setIsGenerating(true);
    setError(null);
    try {
      await generateAssignment(application.id, 72);
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
        className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-2xl w-full bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Application Details
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Applied{" "}
              {formatDistanceToNow(new Date(application.applied_at), {
                addSuffix: true,
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Status */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <span
              className={`px-3 py-1.5 inline-flex text-sm font-semibold rounded-full ${
                statusStyles[application.status] || "bg-gray-100 text-gray-800"
              }`}
            >
              {statusLabels[application.status] || application.status}
            </span>
          </div>

          {/* Candidate Info */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Candidate Information
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                  {application.user_name
                    ? application.user_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : "?"}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {application.user_name || "Unknown"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {application.user_email || "No email"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Job Info */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Position Applied For
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900">
                {application.job_title || "Unknown Position"}
              </p>
              <p className="text-sm text-gray-500">
                {application.company_name || "Unknown Company"}
              </p>
            </div>
          </div>

          {/* Cover Letter */}
          {application.cover_letter && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Cover Letter
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {application.cover_letter}
                </p>
              </div>
            </div>
          )}

          {/* Assignment Section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Technical Assignment
            </h3>

            {isLoadingAssignment ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-500">Loading assignment...</p>
              </div>
            ) : assignment ? (
              <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {assignment.task_title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Difficulty:{" "}
                      <span className="font-medium capitalize">
                        {assignment.difficulty}
                      </span>
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      assignment.status === "sent"
                        ? "bg-blue-100 text-blue-800"
                        : assignment.status === "submitted"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {assignment.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{assignment.time_limit_hours}h time limit</span>
                  </div>
                  {assignment.deadline && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Due{" "}
                        {format(new Date(assignment.deadline), "MMM d, HH:mm")}
                      </span>
                    </div>
                  )}
                  {assignment.sent_at && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>
                        Sent{" "}
                        {formatDistanceToNow(new Date(assignment.sent_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>{assignment.email_sent_count} email(s) sent</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-blue-200">
                  <p className="text-xs text-gray-600 mb-2">
                    Requirements ({assignment.task_requirements.length})
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {assignment.task_requirements
                      .slice(0, 3)
                      .map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="text-center">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-700 mb-4">
                    No assignment sent yet
                  </p>
                  <Button
                    onClick={handleGenerateAssignment}
                    disabled={isGenerating}
                    className="gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Generate & Send Assignment
                      </>
                    )}
                  </Button>
                  {error && (
                    <p className="text-sm text-red-600 mt-2">{error}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {application.notes && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Internal Notes
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {application.notes}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
