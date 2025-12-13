import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Assignment } from "../lib/types";
import { getSession, completeSession } from "../lib/api.service";
import { Button, Badge } from "../components/common/ui-primitives";
import { getStatusColor, formatDate } from "../lib/utils";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  FileText,
  ListChecks,
  Target,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";

export const InterviewSessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch assignment by session ID
  useEffect(() => {
    const fetchAssignment = async () => {
      if (!sessionId) return;

      setIsLoading(true);
      setError(null);
      try {
        const data = await getSession(sessionId);
        setAssignment(data);
      } catch (err) {
        console.error("Failed to fetch session:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load interview session"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignment();
  }, [sessionId]);

  const handleCompleteInterview = async () => {
    if (!sessionId) return;

    setIsCompleting(true);
    try {
      await completeSession(sessionId);
      setIsCompleted(true);
    } catch (err) {
      console.error("Failed to complete session:", err);
      setError(
        err instanceof Error ? err.message : "Failed to complete interview"
      );
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {error || "Interview session not found"}
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            The interview link may be invalid or expired.
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md text-center"
        >
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Interview Completed!
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for completing the technical interview. We'll review your
            submission and get back to you soon.
          </p>
          <Button variant="default" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  // Calculate time remaining
  const deadline = assignment.deadline ? new Date(assignment.deadline) : null;
  const now = new Date();
  const timeRemaining = deadline
    ? Math.max(0, deadline.getTime() - now.getTime())
    : null;
  const hoursRemaining = timeRemaining
    ? Math.floor(timeRemaining / (1000 * 60 * 60))
    : null;
  const isExpired = deadline && deadline < now;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {assignment.task_title}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={getStatusColor(assignment.status)}>
                  {assignment.status}
                </Badge>
                <Badge variant="outline">
                  {assignment.difficulty}
                </Badge>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  {assignment.time_limit_hours}h time limit
                </div>
              </div>
            </div>
          </div>

          {/* Deadline warning */}
          {deadline && !isExpired && hoursRemaining !== null && (
            <div
              className={`flex items-center gap-2 p-3 rounded-md ${
                hoursRemaining < 24
                  ? "bg-red-50 text-red-700"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">
                Deadline: {formatDate(assignment.deadline!)} ({hoursRemaining}h
                remaining)
              </span>
            </div>
          )}

          {isExpired && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                This assignment has expired.
              </span>
            </div>
          )}
        </div>

        {/* Task Description */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">
              Task Description
            </h2>
          </div>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {assignment.task_description}
          </div>
        </div>

        {/* Requirements */}
        {assignment.task_requirements &&
          assignment.task_requirements.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <ListChecks className="h-5 w-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Requirements
                </h2>
              </div>
              <ul className="space-y-2">
                {assignment.task_requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        {/* Evaluation Criteria */}
        {assignment.evaluation_criteria &&
          assignment.evaluation_criteria.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Evaluation Criteria
                </h2>
              </div>
              <ul className="space-y-2">
                {assignment.evaluation_criteria.map((criteria, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="text-sm text-gray-700">{criteria}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        {/* Additional Resources */}
        {assignment.additional_resources && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              Additional Resources
            </h3>
            <p className="text-sm text-blue-800 whitespace-pre-wrap">
              {assignment.additional_resources}
            </p>
          </div>
        )}

        {/* Complete Interview Button */}
        {assignment.status !== "submitted" && !isExpired && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ready to submit?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Once you click "Complete Interview", your session will be marked
                as finished.
              </p>
              <Button
                variant="default"
                size="lg"
                onClick={handleCompleteInterview}
                disabled={isCompleting}
                className="min-w-[200px]"
              >
                {isCompleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Interview
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {assignment.status === "submitted" && (
          <div className="bg-green-50 rounded-lg border border-green-200 p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Assignment Already Submitted
            </h3>
            <p className="text-sm text-green-800">
              You have already completed this interview. Thank you!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
