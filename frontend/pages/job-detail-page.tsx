import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MOCK_CLIENTS } from "../lib/mock-data";
import { Job } from "../lib/types";
import { getJobById } from "../lib/api.service";
import { Button, Badge } from "../components/common/ui-primitives";
import { getStatusColor, formatDate, getInitials } from "../lib/utils";
import { ArrowLeft, MapPin, Briefcase, Calendar, Check, Users, Loader2, Building2, DollarSign, Code } from "lucide-react";
import { motion } from "framer-motion";
import { GenerateLinkModal } from "../components/jobs/generate-link-modal";

export const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch job from API
  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const data = await getJobById(id);
        setJob(data);
      } catch (err) {
        console.error("Failed to fetch job:", err);
        setError(err instanceof Error ? err.message : "Failed to load job");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchJob();
  }, [id]);
  
  // TODO: Replace with real API when backend supports clients
  // For now, filter mock clients that might match this job title
  const candidates = job ? MOCK_CLIENTS.filter(c => c.position === job.title) : [];

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
    <div 
        className="max-w-7xl mx-auto"
    >
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 pl-0 hover:bg-transparent hover:text-gray-900">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Jobs
      </Button>

      <div className="space-y-6">
         {/* Main Job Details Card */}
         <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
             {/* Header */}
             <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                 <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">{job.title}</h1>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4 text-gray-400"/> {job.company}</span>
                        <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-gray-400"/> {job.location} ({job.location_type})</span>
                        <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4 text-gray-400"/> {job.job_type} · {job.experience_level}</span>
                        <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-gray-400"/> Created {formatDate(job.created_at)}</span>
                    </div>
                 </div>
                 <Badge className={getStatusColor(job.status)}>{job.status.toUpperCase()}</Badge>
             </div>

             {/* Salary & Tech Stack */}
             <div className="flex flex-wrap gap-4 mb-8">
                {job.salary_range && (job.salary_range.min || job.salary_range.max) && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <DollarSign className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {job.salary_range.min?.toLocaleString()} - {job.salary_range.max?.toLocaleString()} {job.salary_range.currency}
                    </span>
                  </div>
                )}
                {job.tech_stack && job.tech_stack.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Code className="h-4 w-4 text-gray-400" />
                    {job.tech_stack.map((tech, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-50 border border-gray-100 rounded text-xs font-medium text-gray-600">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
             </div>

             {/* Content */}
             <div className="space-y-8">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-3">About the Role</h3>
                  <p className="text-gray-600 leading-relaxed max-w-4xl whitespace-pre-wrap">{job.description}</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-12">
                    {job.responsibilities && job.responsibilities.length > 0 && (
                      <div>
                          <h3 className="font-semibold text-lg text-gray-900 mb-4">Responsibilities</h3>
                          <ul className="space-y-3">
                              {job.responsibilities.map((item, i) => (
                                  <li key={i} className="flex gap-3 text-gray-600">
                                      <Check className="h-5 w-5 text-gray-900 shrink-0 mt-0.5" />
                                      <span className="leading-relaxed">{item}</span>
                                  </li>
                              ))}
                          </ul>
                      </div>
                    )}
                    {job.requirements && job.requirements.length > 0 && (
                      <div>
                          <h3 className="font-semibold text-lg text-gray-900 mb-4">Requirements</h3>
                          <ul className="space-y-3">
                              {job.requirements.map((item, i) => (
                                  <li key={i} className="flex gap-3 text-gray-600">
                                      <div className="h-1.5 w-1.5 rounded-full bg-gray-300 mt-2.5 shrink-0" />
                                      <span className="leading-relaxed">{item}</span>
                                  </li>
                              ))}
                          </ul>
                      </div>
                    )}
                </div>

                {job.nice_to_have && job.nice_to_have.length > 0 && (
                  <div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-4">Nice to Have</h3>
                      <ul className="space-y-2">
                          {job.nice_to_have.map((item, i) => (
                              <li key={i} className="flex gap-3 text-gray-500 text-sm">
                                  <div className="h-1.5 w-1.5 rounded-full bg-gray-300 mt-2 shrink-0" />
                                  <span>{item}</span>
                              </li>
                          ))}
                      </ul>
                  </div>
                )}

                {job.benefits && job.benefits.length > 0 && (
                  <div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-4">Benefits</h3>
                      <div className="flex flex-wrap gap-2">
                          {job.benefits.map((benefit, i) => (
                              <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                  {benefit}
                              </span>
                          ))}
                      </div>
                  </div>
                )}
             </div>

             {/* Footer Action */}
             <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end">
                <Button 
                    className="h-12 px-6 text-base shadow-lg shadow-gray-100 transition-all hover:-translate-y-0.5" 
                    onClick={() => setIsLinkModalOpen(true)}
                >
                  Generate Interview Link
               </Button>
             </div>
         </div>

         {/* Candidates List (Full Width) */}
         <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
             <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg text-gray-900">Candidates for this Role</h3>
                <span className="bg-gray-100 text-gray-600 py-1 px-2.5 rounded-full text-xs font-medium">{job.applications_count || candidates.length} total</span>
             </div>

             {candidates.length > 0 ? (
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500">
                        <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
                            <tr>
                                <th className="px-6 py-3 rounded-l-lg">Candidate</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Score</th>
                                <th className="px-6 py-3 text-right rounded-r-lg">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {candidates.map(c => (
                                <tr 
                                    key={c.id} 
                                    onClick={() => navigate(`/clients/${c.id}`)} 
                                    className="group hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                {getInitials(c.name)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{c.name}</div>
                                                <div className="text-xs text-gray-400">{c.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge className={getStatusColor(c.status)}>{c.status.replace("_", " ")}</Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        {c.interviewScore ? <span className="font-bold text-gray-900">{c.interviewScore}%</span> : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-gray-900 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">View Details &rarr;</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
             ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No candidates assigned to this position yet.</p>
                </div>
             )}
         </div>
      </div>

      <GenerateLinkModal 
        isOpen={isLinkModalOpen} 
        onClose={() => setIsLinkModalOpen(false)}
        preselectedJob={job}
      />
    </div>
  );
};