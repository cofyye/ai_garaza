import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Application, Assignment } from "../lib/types";
import {
  getApplicationById,
  getAssignmentByApplication,
  generateAssignment,
} from "../lib/api.service";
import { Button, Badge } from "../components/common/ui-primitives";
import { getStatusColor, getInitials, formatDate } from "../lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  BarChart3,
  Mail,
  UserPlus,
  PlayCircle,
  Timer,
  Send,
  Briefcase,
  Building2,
  Loader2,
  CheckCircle,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";

export const ClientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState<Application | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const appData = await getApplicationById(id);
        setApplication(appData);

        // Try to fetch assignment, but don't fail if it doesn't exist or errors
        try {
          const assignData = await getAssignmentByApplication(id);
          setAssignment(assignData);
        } catch (e) {
          console.log("No assignment or error fetching assignment");
        }
      } catch (err) {
        console.error("Failed to fetch application:", err);
        setError("Failed to load application details");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleGenerateAssignment = async () => {
    if (
      !application ||
      !confirm("Generate and send technical assignment to this candidate?")
    )
      return;

    setIsGenerating(true);
    try {
      await generateAssignment(application.id, 72);
      const assignData = await getAssignmentByApplication(application.id);
      setAssignment(assignData);
    } catch (err) {
      alert("Failed to generate assignment");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {error || "Application not found"}
        </h2>
        <Button variant="outline" onClick={() => navigate("/applications")}>
          Back to Applications
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-8 pb-12"
    >
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </button>

      {/* Header Section - Matching JobDetailPage */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {application.user_name || "Unknown Candidate"}
                </h1>
                <Badge
                  className={`${getStatusColor(application.status)} border`}
                >
                  {application.status}
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

            {/* Actions moved to sidebar */}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Main Content */}
        <div className="lg:col-span-2 flex flex-col">
          {/* Technical Assignment Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 h-full">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">
              Technical Assignment
            </h3>

            {assignment ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {assignment.task_title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                      <span className="font-medium">Difficulty:</span>
                      <span className="capitalize px-2 py-0.5 bg-gray-100 rounded text-xs">
                        {assignment.difficulty}
                      </span>
                    </p>
                  </div>
                  <Badge
                    className={
                      assignment.status === "sent"
                        ? "bg-gray-100 text-gray-800 border-gray-200"
                        : assignment.status === "submitted"
                        ? "bg-gray-100 text-gray-800 border-gray-200"
                        : "bg-gray-100 text-gray-800 border-gray-200"
                    }
                  >
                    {assignment.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{assignment.time_limit_hours}h time limit</span>
                  </div>
                  {assignment.deadline && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>
                        Due{" "}
                        {format(new Date(assignment.deadline), "MMM d, HH:mm")}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <CheckCircle className="h-4 w-4 text-gray-500" />
                    <span>{assignment.email_sent_count} email(s) sent</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
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
                          <div className="h-1.5 w-1.5 rounded-full bg-black mt-2 shrink-0" />
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
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar Info */}
        <div className="flex flex-col gap-6 h-full">
          {/* Internal Notes */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              Internal Notes
            </h3>
            {application.notes ? (
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100 text-sm text-yellow-800 leading-relaxed">
                {application.notes}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                No notes added yet.
              </p>
            )}
            <Button variant="outline" size="sm" className="w-full mt-4">
              Add Note
            </Button>
          </div>

          {/* Timeline / History */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex-1">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">
              Activity
            </h3>
            <div className="relative pl-6 border-l border-gray-200 space-y-8 ml-3">
              <div className="relative">
                <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-gray-200 ring-4 ring-white border border-gray-300" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    Application Received
                  </span>
                  <span className="text-xs text-gray-500 mt-0.5">
                    {formatDistanceToNow(new Date(application.applied_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>

              {assignment && (
                <div className="relative">
                  <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-black ring-4 ring-white" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      Assignment Sent
                    </span>
                    <span className="text-xs text-gray-500 mt-0.5">
                      {assignment.sent_at
                        ? formatDistanceToNow(new Date(assignment.sent_at), {
                            addSuffix: true,
                          })
                        : "Recently"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
