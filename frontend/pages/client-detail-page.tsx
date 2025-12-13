import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MOCK_CLIENTS } from "../lib/mock-data";
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
  Send
} from "lucide-react";
import { motion } from "framer-motion";

// Types for Timeline Steps
type TimelineStep = {
  id: string;
  title: string;
  date?: string;
  status: "completed" | "current" | "upcoming";
  icon: React.ElementType;
  description?: string;
};

export const ClientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const client = MOCK_CLIENTS.find((c) => c.id === id);

  if (!client) return <div className="p-6">Client not found</div>;

  // --- Logic to build the Timeline based on Client Status ---
  const timelineSteps: TimelineStep[] = useMemo(() => {
    const steps: TimelineStep[] = [
      {
        id: "applied",
        title: "Application Received",
        date: "2 days ago", // Mock relative time
        status: "completed",
        icon: UserPlus,
        description: `Applied for ${client.position}`,
      },
      {
        id: "invite",
        title: "Invitation Sent",
        date: "1 day ago",
        status: client.status === "NOT_STARTED" ? "current" : "completed",
        icon: Mail,
        description: "Interview link generated and sent",
      },
    ];

    if (client.status === "IN_PROGRESS" || client.status === "COMPLETED" || client.status === "EXPIRED") {
       steps.push({
         id: "started",
         title: "Interview Started",
         date: client.status === "IN_PROGRESS" ? "Just now" : "Yesterday",
         status: client.status === "IN_PROGRESS" ? "current" : "completed",
         icon: PlayCircle,
         description: "Candidate began the session",
       });
    } else {
       steps.push({
         id: "started",
         title: "Interview Started",
         status: "upcoming",
         icon: PlayCircle,
       });
    }

    if (client.status === "COMPLETED") {
       steps.push({
         id: "completed",
         title: "Assessment Completed",
         date: formatDate(client.lastUpdated),
         status: "completed",
         icon: CheckCircle2,
         description: `Scored ${client.interviewScore}%`,
       });
    } else {
       steps.push({
         id: "completed",
         title: "Assessment Completed",
         status: "upcoming",
         icon: CheckCircle2,
       });
    }
    
    return steps;
  }, [client]);

  // Determine Process Progress %
  const progressPercentage = useMemo(() => {
     switch(client.status) {
         case "NOT_STARTED": return 35;
         case "IN_PROGRESS": return 65;
         case "COMPLETED": return 100;
         case "EXPIRED": return 35;
         default: return 0;
     }
  }, [client.status]);

  return (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 max-w-7xl mx-auto"
    >
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 pl-0 hover:bg-transparent hover:text-indigo-600">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Clients
      </Button>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl font-bold border-4 border-white shadow-sm">
              {getInitials(client.name)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{client.name}</h1>
              <div className="flex items-center gap-3 mt-2 text-gray-500">
                <div className="flex items-center gap-1.5 text-sm">
                   <Mail className="h-4 w-4" /> {client.email}
                </div>
                <span className="text-gray-300">|</span>
                <span className="font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-sm">{client.position}</span>
              </div>
              <div className="mt-4 flex gap-2">
                 <Badge className={getStatusColor(client.status)}>{client.status.replace("_", " ")}</Badge>
                 {client.verdict && (
                    <Badge className={getStatusColor(client.verdict)}>{client.verdict.replace("_", " ")}</Badge>
                 )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end justify-center min-h-[80px]">
             {client.interviewScore !== undefined && (
                <div className="text-right">
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Total Score</div>
                    <div className="text-5xl font-bold text-gray-900 leading-none">{client.interviewScore}</div>
                </div>
             )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Modern Timeline */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Timer className="h-5 w-5 text-gray-500" /> Activity Timeline
            </h3>
            
            <div className="relative pl-2">
               {/* Vertical Line */}
               <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-gray-100" />
               
               <div className="space-y-8">
                  {timelineSteps.map((step, index) => {
                      const isLast = index === timelineSteps.length - 1;
                      const isCompleted = step.status === "completed";
                      const isCurrent = step.status === "current";

                      return (
                          <div key={step.id} className="relative flex gap-4">
                              {/* Icon Marker */}
                              <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300
                                  ${isCompleted ? "border-indigo-600 bg-indigo-600 text-white" : 
                                    isCurrent ? "border-indigo-600 bg-white text-indigo-600 ring-4 ring-indigo-50" : 
                                    "border-gray-200 bg-white text-gray-300"}`}
                              >
                                  <step.icon className="h-5 w-5" />
                              </div>

                              {/* Content */}
                              <div className={`pt-1 ${step.status === 'upcoming' ? 'opacity-50' : 'opacity-100'}`}>
                                  <p className="text-sm font-bold text-gray-900 leading-none">{step.title}</p>
                                  <p className="text-xs text-gray-500 mt-1">{step.description || "Pending..."}</p>
                                  {step.date && (
                                    <p className="text-[10px] uppercase font-bold text-gray-400 mt-2 tracking-wide">{step.date}</p>
                                  )}
                              </div>
                          </div>
                      );
                  })}
               </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Results OR Progress Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          {client.status === "COMPLETED" ? (
             <>
               {/* --- COMPLETED VIEW: Detailed Analysis --- */}
               <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-gray-500" /> Skill Breakdown
                  </h3>
                  
                  <div className="space-y-5">
                     {[
                        { label: "Technical Proficiency", score: 88, color: "bg-blue-600" },
                        { label: "Communication", score: 92, color: "bg-green-500" },
                        { label: "Problem Solving", score: 75, color: "bg-orange-500" },
                        { label: "System Design", score: 60, color: "bg-red-500" },
                     ].map((skill) => (
                        <div key={skill.label}>
                           <div className="flex justify-between text-sm font-medium mb-1.5">
                              <span className="text-gray-700">{skill.label}</span>
                              <span className="text-gray-900 font-bold">{skill.score}/100</span>
                           </div>
                           <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${skill.score}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={`h-full ${skill.color}`} 
                              />
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-6">
                      <h4 className="flex items-center gap-2 font-bold text-emerald-800 mb-3">
                        <CheckCircle2 className="h-5 w-5" /> Strengths
                      </h4>
                      <ul className="list-disc pl-5 text-sm text-emerald-800 space-y-2 leading-relaxed">
                        <li>Demonstrated deep understanding of asynchronous programming patterns.</li>
                        <li>Clear and concise communication style during technical explanations.</li>
                        <li>Efficiently solved the algorithmic challenge with optimal time complexity.</li>
                      </ul>
                  </div>

                  <div className="bg-amber-50 rounded-xl border border-amber-100 p-6">
                      <h4 className="flex items-center gap-2 font-bold text-amber-800 mb-3">
                        <AlertCircle className="h-5 w-5" /> Areas for Improvement
                      </h4>
                      <ul className="list-disc pl-5 text-sm text-amber-800 space-y-2 leading-relaxed">
                        <li>Could improve knowledge of distributed system consistency models.</li>
                        <li>Missed edge cases in the initial test suite setup.</li>
                      </ul>
                  </div>
               </div>

               {/* Transcript */}
               <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-gray-500" /> Key Transcript Moments
                  </h3>
                  <div className="space-y-4">
                     <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">QUESTION 1</span>
                            <span className="text-xs font-medium text-gray-400">04:20</span>
                        </div>
                        <p className="font-semibold text-gray-900 mb-1">"How would you handle state management in a large scale application?"</p>
                        <p className="text-sm text-gray-600 italic">"I usually start by breaking down the UI into atomic components and then deciding whether local state is sufficient or if a global store is needed. For complex flows..."</p>
                     </div>
                  </div>
               </div>
             </>
          ) : (
             // --- NOT COMPLETED VIEW: Progress Dashboard ---
             <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Current Process Status</h3>
                        <p className="text-gray-500 mt-1">Interview process is currently underway.</p>
                    </div>
                    <Badge className="bg-blue-50 text-blue-700 border-blue-100 px-3 py-1 text-sm">
                        {progressPercentage}% Complete
                    </Badge>
                </div>

                {/* Progress Bar Visual */}
                <div className="mb-10">
                    <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercentage}%` }}
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                        />
                    </div>
                    <div className="flex justify-between text-xs font-medium text-gray-400 uppercase tracking-wide">
                        <span>Applied</span>
                        <span>Invited</span>
                        <span>Interviewing</span>
                        <span>Results</span>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white rounded-md shadow-sm text-indigo-600">
                                <Clock className="h-5 w-5" />
                            </div>
                            <span className="font-semibold text-gray-900">Time Elapsed</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 pl-1">2 Days</p>
                        <p className="text-sm text-gray-500 pl-1">Since application</p>
                    </div>

                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white rounded-md shadow-sm text-indigo-600">
                                <Send className="h-5 w-5" />
                            </div>
                            <span className="font-semibold text-gray-900">Last Action</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 pl-1">Invitation Sent</p>
                        <p className="text-sm text-gray-500 pl-1">Waiting for candidate</p>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100 flex justify-end gap-3">
                    <Button variant="outline">Preview Interview</Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                        <Mail className="h-4 w-4" /> Resend Invitation
                    </Button>
                </div>
             </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};