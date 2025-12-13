import React, { useState, useMemo } from "react";
import { PageHeader } from "../components/common/page-header";
import { MOCK_JOBS, MOCK_CLIENTS } from "../lib/mock-data";
import { KpiRow, KpiCard } from "../components/common/kpi-cards";
import { getStatusColor, getInitials } from "../lib/utils";
import { Badge } from "../components/common/ui-primitives";
import { BarChart2, TrendingUp, Users, Award, Info } from "lucide-react";
import { motion } from "framer-motion";

export const AnalyticsPage = () => {
  const [selectedJobId, setSelectedJobId] = useState<string>("ALL");

  // Derive Data
  const selectedJob = MOCK_JOBS.find(j => j.id === selectedJobId);
  
  const relevantClients = useMemo(() => {
    if (selectedJobId === "ALL") return MOCK_CLIENTS;
    return MOCK_CLIENTS.filter(c => c.position === selectedJob?.title);
  }, [selectedJobId, selectedJob]);

  const completedClients = relevantClients.filter(c => c.status === "COMPLETED");
  const hiredClients = completedClients.filter(c => c.verdict === "HIRE" || c.verdict === "STRONG_HIRE");

  // Stats
  const totalCandidates = relevantClients.length;
  const interviewCount = completedClients.length;
  const avgScore = interviewCount > 0 
    ? Math.round(completedClients.reduce((acc, c) => acc + (c.interviewScore || 0), 0) / interviewCount) 
    : 0;
  const hireRate = interviewCount > 0 ? Math.round((hiredClients.length / interviewCount) * 100) : 0;

  // Score Distribution Logic
  const scoreDist = {
    "90-100": completedClients.filter(c => (c.interviewScore || 0) >= 90).length,
    "80-89": completedClients.filter(c => (c.interviewScore || 0) >= 80 && (c.interviewScore || 0) < 90).length,
    "70-79": completedClients.filter(c => (c.interviewScore || 0) >= 70 && (c.interviewScore || 0) < 80).length,
    "< 70": completedClients.filter(c => (c.interviewScore || 0) < 70).length,
  };
  const maxDistVal = Math.max(...Object.values(scoreDist), 1);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Analytics" subtitle="Insights into interview performance and hiring decisions">
        <select 
            className="h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black min-w-[250px]"
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
        >
            <option value="ALL">All Jobs</option>
            {MOCK_JOBS.map(job => (
                <option key={job.id} value={job.id}>{job.title}</option>
            ))}
        </select>
      </PageHeader>

      <KpiRow>
        <KpiCard label="Total Candidates" value={totalCandidates} icon={<Users />} />
        <KpiCard label="Interviews Completed" value={interviewCount} icon={<BarChart2 />} />
        <KpiCard label="Avg. Technical Score" value={`${avgScore}%`} icon={<TrendingUp />} />
        <KpiCard label="Hire Rate" value={`${hireRate}%`} icon={<Award />} />
      </KpiRow>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
         {/* Score Distribution Chart (CSS Only) */}
         <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
         >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Score Distribution</h3>
            <div className="space-y-4">
                {Object.entries(scoreDist).map(([range, count]) => (
                    <div key={range} className="flex items-center gap-4">
                        <span className="w-16 text-sm text-gray-500 font-medium">{range}</span>
                        <div className="flex-1 h-8 bg-gray-50 rounded-md overflow-hidden relative">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(count / maxDistVal) * 100}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className={`h-full ${range === '< 70' ? 'bg-red-200' : 'bg-indigo-200'} rounded-r-md`}
                            />
                            <span className="absolute inset-y-0 right-2 flex items-center text-xs font-semibold text-gray-600">
                                {count > 0 ? count : ''}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            <p className="mt-4 text-xs text-gray-400 text-center">Number of candidates per score range</p>
         </motion.div>

         {/* Funnel / Pass Rate */}
         <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center"
         >
             <h3 className="text-lg font-semibold text-gray-900 mb-6">Hiring Funnel</h3>
             <div className="space-y-2 relative">
                 {/* Steps */}
                 <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100 relative z-10">
                     <span className="font-medium text-blue-900">Applied</span>
                     <span className="font-bold text-blue-900">{totalCandidates}</span>
                 </div>
                 <div className="mx-auto w-0.5 h-4 bg-gray-300"></div>
                 <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-100 relative z-10 w-[90%] mx-auto">
                     <span className="font-medium text-indigo-900">Interviewed</span>
                     <span className="font-bold text-indigo-900">{interviewCount}</span>
                 </div>
                 <div className="mx-auto w-0.5 h-4 bg-gray-300"></div>
                 <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100 relative z-10 w-[80%] mx-auto">
                     <span className="font-medium text-green-900">Hired</span>
                     <span className="font-bold text-green-900">{hiredClients.length}</span>
                 </div>
             </div>
         </motion.div>
      </div>

      {/* Hiring Insights / Selected Candidates */}
      <motion.div 
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.2 }}
         className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Performers & Hiring Decisions</h3>
            <p className="text-sm text-gray-500 mt-1">Candidates selected for {selectedJobId === 'ALL' ? 'all positions' : selectedJob?.title}</p>
          </div>
          
          <div className="divide-y divide-gray-100">
             {hiredClients.length > 0 ? (
                 hiredClients.map(client => (
                     <div key={client.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                            <div className="flex gap-4">
                                <div className="h-12 w-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-lg">
                                    {getInitials(client.name)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-lg">{client.name}</h4>
                                    <p className="text-sm text-gray-500">{client.position}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge className={getStatusColor(client.verdict || "")}>{client.verdict?.replace("_", " ")}</Badge>
                                        <span className="text-sm font-semibold text-gray-900">Score: {client.interviewScore}%</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg max-w-xl flex-1">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2">
                                    <Info className="h-3 w-3" /> Why they were selected
                                </div>
                                <p className="text-sm text-gray-700 italic">
                                    "Demonstrated exceptional problem-solving skills during the system design phase. Communication was clear, and they proactively identified edge cases in the coding challenge. Strong cultural fit."
                                </p>
                            </div>
                        </div>
                     </div>
                 ))
             ) : (
                 <div className="p-12 text-center text-gray-500">
                    No hired candidates found for this selection.
                 </div>
             )}
          </div>
      </motion.div>
    </div>
  );
};