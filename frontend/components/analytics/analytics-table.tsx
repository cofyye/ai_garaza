import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "../common/ui-primitives";

interface CandidateAnalysis {
  id: string;
  name: string;
  position: string;
  interviewDate: string;
  duration: number;
  technicalScore: number;
  communicationScore: number;
  overallScore: number;
  verdict: "STRONG_HIRE" | "HIRE" | "MAYBE" | "NO_HIRE";
  keyStrengths: string[];
  keyInsights: string;
  notableMoments: Array<{
    time: string;
    description: string;
    type: "positive" | "negative";
  }>;
}

interface AnalyticsTableProps {
  candidates: CandidateAnalysis[];
}

export const AnalyticsTable = ({ candidates }: AnalyticsTableProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "STRONG_HIRE": return "bg-green-600 text-white";
      case "HIRE": return "bg-green-500 text-white";
      case "MAYBE": return "bg-yellow-600 text-white";
      case "NO_HIRE": return "bg-gray-600 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 font-medium text-gray-500">Rank</th>
            <th className="px-6 py-4 font-medium text-gray-500">Candidate</th>
            <th className="px-6 py-4 font-medium text-gray-500">Position</th>
            <th className="px-6 py-4 font-medium text-gray-500 text-center">Verdict</th>
            <th className="px-6 py-4 font-medium text-gray-500 text-center">Technical</th>
            <th className="px-6 py-4 font-medium text-gray-500 text-center">Communication</th>
            <th className="px-6 py-4 font-medium text-gray-500 text-center">Overall</th>
            <th className="px-6 py-4 font-medium text-gray-500">Date</th>
            <th className="px-6 py-4 font-medium text-gray-500 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {candidates.map((candidate, index) => {
            const isExpanded = expandedId === candidate.id;
            return (
              <React.Fragment key={candidate.id}>
                <tr
                  className={`hover:bg-gray-50 transition-colors cursor-pointer group ${
                    isExpanded ? "bg-gray-50" : ""
                  }`}
                  onClick={(e) => toggleExpand(candidate.id, e)}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {candidate.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{candidate.position}</div>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="inline-block">
                      <Badge className={getVerdictColor(candidate.verdict)}>
                        {candidate.verdict.replace("_", " ")}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-medium text-gray-900">{candidate.technicalScore}%</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-medium text-gray-900">{candidate.communicationScore}%</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-semibold text-gray-900">{candidate.overallScore}%</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(candidate.interviewDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </td>
                </tr>

                <AnimatePresence>
                  {isExpanded && (
                    <tr>
                      <td
                        colSpan={9}
                        className="p-0 border-b border-gray-100 bg-gray-50/50"
                      >
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 pt-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Left Column - Quick Assessment */}
                              <div className="bg-white p-5 rounded-lg border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Assessment</h3>
                                <div className="text-base text-gray-700 space-y-4">
                                  {/* Overall Verdict */}
                                  <div>
                                    <span className="font-semibold text-gray-900">Overall: </span>
                                    <span>
                                      {candidate.verdict === "STRONG_HIRE"
                                        ? "Exceptional candidate - top performer in the pool."
                                        : candidate.verdict === "HIRE"
                                        ? "Solid candidate with strong qualifications."
                                        : candidate.verdict === "MAYBE"
                                        ? "Shows potential but has some areas of concern."
                                        : "Does not meet requirements for this position."}
                                    </span>
                                  </div>

                                  {/* Key Insight */}
                                  <div>
                                    <span className="font-semibold text-gray-900">Summary: </span>
                                    <span>{candidate.keyInsights}</span>
                                  </div>

                                  {/* Performance Scores */}
                                  <div>
                                    <span className="font-semibold text-gray-900">Performance: </span>
                                    <span>
                                      Technical skills rated at {candidate.technicalScore}% and communication at {candidate.communicationScore}%, resulting in an overall score of {candidate.overallScore}%. 
                                      {candidate.overallScore >= 85 
                                        ? " Strong performance across both technical and soft skills."
                                        : candidate.overallScore >= 80
                                        ? " Competent with room for growth in some areas."
                                        : " Needs improvement in key areas."}
                                    </span>
                                  </div>

                                  {/* Red Flags */}
                                  <div>
                                    <span className="font-semibold text-gray-900">Concerns: </span>
                                    <span>
                                      {candidate.technicalScore < 75 || candidate.communicationScore < 75
                                        ? `${candidate.technicalScore < 75 ? "Technical skills below threshold. " : ""}${candidate.communicationScore < 75 ? "Communication needs improvement." : ""}`
                                        : "No significant issues identified during the interview process."}
                                    </span>
                                  </div>

                                  {/* Ranking */}
                                  <div>
                                    <span className="font-semibold text-gray-900">Ranking: </span>
                                    <span>
                                      {candidate.overallScore >= 88
                                        ? "Top-tier candidate with high scores across all areas."
                                        : candidate.overallScore >= 85
                                        ? "Above average performer, solid choice."
                                        : candidate.overallScore >= 80
                                        ? "Average performance in candidate pool."
                                        : "Below average compared to other candidates."}
                                    </span>
                                  </div>

                                  {/* Key Strengths */}
                                  <div>
                                    <span className="font-semibold text-gray-900">Key Strengths: </span>
                                    <span>{candidate.keyStrengths.join("; ")}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Right Column - Video & Timeline */}
                              <div className="flex flex-col h-full">
                                {/* Mock Video Player */}
                                <div className="mb-4">
                                  <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                                    <div className="aspect-video bg-gray-800 flex items-center justify-center cursor-pointer hover:bg-gray-750 transition-colors">
                                      <button className="text-white text-5xl hover:scale-110 transition-transform">
                                        ▶
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Timeline - Notable Moments */}
                                <div className="flex-1 flex flex-col">
                                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Key Timestamps</h4>
                                  <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200 flex-1 overflow-y-auto">
                                    {candidate.notableMoments.map((moment, idx) => (
                                      <button
                                        key={idx}
                                        className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          alert(`Mock: Jump to ${moment.time} in video`);
                                        }}
                                      >
                                        <div className="flex items-center justify-between gap-3">
                                          <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <span className="font-mono text-xs font-semibold text-gray-900 flex-shrink-0">
                                              {moment.time}
                                            </span>
                                            <p className="text-sm text-gray-900 flex-1">{moment.description}</p>
                                          </div>
                                          <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${
                                            moment.type === 'positive' 
                                              ? 'bg-green-100 text-green-700' 
                                              : 'bg-red-100 text-red-700'
                                          }`}>
                                            {moment.type}
                                          </span>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
