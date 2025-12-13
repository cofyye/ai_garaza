import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Job, Application } from "../lib/types";
import { getJobById, getApplications } from "../lib/api.service";
import { Button, Badge } from "../components/common/ui-primitives";
import { getStatusColor, formatDate, getInitials } from "../lib/utils";
import { PageHeader } from "../components/common/page-header";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Calendar,
  Check,
  Users,
  Loader2,
  Building2,
  DollarSign,
  Code,
  ChevronDown,
  Globe,
  Clock,
  Filter,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";
import { GenerateLinkModal } from "../components/jobs/generate-link-modal";

export const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Fetch job and applications from API
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);
      try {
        const [jobData, applicationsData] = await Promise.all([
          getJobById(id),
          getApplications({ job_id: id }),
        ]);
        setJob(jobData);
        setApplications(applicationsData);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load job details"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {error || "Job not found"}
        </h2>
        <Button variant="outline" onClick={() => navigate("/jobs")}>
          Back to Jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Breadcrumb / Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Jobs
      </button>

      {/* Header Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {job.title}
                </h1>
                <Badge className={getStatusColor(job.status)}>
                  {job.status.toUpperCase()}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600 border border-gray-200">
                  <Building2 className="h-3.5 w-3.5 text-gray-500" />{" "}
                  {job.company}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600 border border-gray-200">
                  <MapPin className="h-3.5 w-3.5 text-gray-500" />{" "}
                  {job.location} ({job.location_type})
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600 border border-gray-200">
                  <Briefcase className="h-3.5 w-3.5 text-gray-500" />{" "}
                  {job.job_type}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600 border border-gray-200">
                  <Clock className="h-3.5 w-3.5 text-gray-500" /> Posted{" "}
                  {formatDate(job.created_at)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => alert("Stub: Edit Job")}>
                Edit Job
              </Button>
              <Button onClick={() => setIsLinkModalOpen(true)}>
                Generate Interview Link
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Job Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              About the Role
            </h3>
            <div
              className={`relative ${
                !isDescriptionExpanded ? "max-h-48 overflow-hidden" : ""
              }`}
            >
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {job.description}
              </p>
              {!isDescriptionExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
              )}
            </div>
            <button
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              className="mt-4 text-xs font-semibold text-black hover:text-gray-700 flex items-center gap-1 uppercase tracking-wide"
            >
              {isDescriptionExpanded ? "Show Less" : "Read More"}
              <ChevronDown
                className={`h-3 w-3 transition-transform ${
                  isDescriptionExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Responsibilities & Requirements */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-8">
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                  Responsibilities
                </h3>
                <ul className="space-y-3">
                  {job.responsibilities.map((item, i) => (
                    <li key={i} className="flex gap-3 text-gray-600 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-black mt-2.5 shrink-0" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {job.requirements && job.requirements.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                  Requirements
                </h3>
                <ul className="space-y-3">
                  {job.requirements.map((item, i) => (
                    <li key={i} className="flex gap-3 text-gray-600 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-black mt-2.5 shrink-0" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sidebar Info */}
        <div className="space-y-6 h-full flex flex-col">
          {/* Job Details Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              Job Details
            </h3>
            <div className="space-y-4">
              {job.salary_range &&
                (job.salary_range.min || job.salary_range.max) && (
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">
                      Salary Range
                    </span>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      {job.salary_range.min?.toLocaleString()} -{" "}
                      {job.salary_range.max?.toLocaleString()}{" "}
                      {job.salary_range.currency}
                    </div>
                  </div>
                )}

              <div>
                <span className="text-xs text-gray-500 block mb-1">
                  Experience Level
                </span>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Users className="h-4 w-4 text-gray-400" />
                  {job.experience_level}
                </div>
              </div>

              <div>
                <span className="text-xs text-gray-500 block mb-1">
                  Location Type
                </span>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Globe className="h-4 w-4 text-gray-400" />
                  {job.location_type}
                </div>
              </div>
            </div>
          </div>

          {/* Tech Stack Card */}
          {job.tech_stack && job.tech_stack.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                Tech Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.tech_stack.map((tech, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs font-medium text-gray-700"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Benefits Card */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex-1">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                Benefits
              </h3>
              <ul className="space-y-2">
                {job.benefits.map((benefit, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-600"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-black mt-2 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Applications Control Panel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-4">
            <h3 className="text-base font-bold text-gray-900">Applications</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-gray-200 text-gray-700 text-xs font-medium">
              {applications.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-2 text-gray-600">
              <Filter className="h-4 w-4" /> Filter
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 text-gray-600">
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        {applications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Applied
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.slice(0, 10).map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => navigate(`/applications/${app.id}`)}
                    className="group hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center font-semibold text-white text-xs">
                          {app.user_name
                            ? app.user_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                            : "?"}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {app.user_name || "Unknown"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {app.user_email || "No email"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusColor(app.status)}>
                        {app.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-500 text-xs">
                        {formatDate(app.applied_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {applications.length > 10 && (
              <div className="p-4 text-center border-t border-gray-100 bg-gray-50/30">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/applications?job_id=${job.id}`)}
                  className="text-xs"
                >
                  View All {applications.length} Applications
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-gray-50 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900">
              No applications yet
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              Share the interview link to start receiving applications for this
              position.
            </p>
            <Button
              variant="outline"
              onClick={() => setIsLinkModalOpen(true)}
              className="mt-4"
            >
              Generate Link
            </Button>
          </div>
        )}
      </div>

      <GenerateLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        preselectedJob={job}
      />
    </div>
  );
};
