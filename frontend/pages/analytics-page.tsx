import React from "react";
import { PageHeader } from "../components/common/page-header";
import { Input } from "../components/common/ui-primitives";
import { AnalyticsTable } from "../components/analytics/analytics-table";

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

const MOCK_CANDIDATES_ANALYSIS: CandidateAnalysis[] = [
  {
    id: "1",
    name: "Sarah Anderson",
    position: "Senior Full-Stack Developer",
    interviewDate: "2025-12-10T14:30:00Z",
    duration: 87,
    technicalScore: 92,
    communicationScore: 88,
    overallScore: 90,
    verdict: "STRONG_HIRE",
    keyStrengths: [
      "Excellent code organization and TypeScript best practices",
      "Strong problem-solving approach with edge case consideration",
      "Clear communication throughout the interview",
    ],
    keyInsights: "Demonstrated senior-level expertise with proactive problem identification and excellent collaboration skills. Would be a strong addition to the team.",
    notableMoments: [
      { time: "00:23:15", description: "Identified potential race condition before implementation", type: "positive" },
      { time: "00:45:30", description: "Refactored code for better readability without prompting", type: "positive" },
      { time: "01:05:20", description: "Missed edge case initially but corrected quickly after hint", type: "negative" },
    ],
  },
  {
    id: "2",
    name: "Michael Chen",
    position: "Senior Full-Stack Developer",
    interviewDate: "2025-12-11T10:00:00Z",
    duration: 95,
    technicalScore: 88,
    communicationScore: 85,
    overallScore: 87,
    verdict: "HIRE",
    keyStrengths: [
      "Solid understanding of system architecture",
      "Good testing practices and code coverage",
      "Efficient time management during implementation",
    ],
    keyInsights: "Strong technical candidate with good fundamentals. Shows promise for growth into senior role with more experience in complex systems.",
    notableMoments: [
      { time: "00:15:00", description: "Asked insightful questions about scalability requirements", type: "positive" },
      { time: "00:52:00", description: "Struggled with async/await pattern initially", type: "negative" },
      { time: "01:20:00", description: "Wrote comprehensive test suite covering edge cases", type: "positive" },
    ],
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    position: "Senior Full-Stack Developer",
    interviewDate: "2025-12-09T15:00:00Z",
    duration: 82,
    technicalScore: 85,
    communicationScore: 90,
    overallScore: 87,
    verdict: "HIRE",
    keyStrengths: [
      "Exceptional communication and thought process explanation",
      "Strong collaboration and feedback incorporation",
      "Clean, readable code with good documentation",
    ],
    keyInsights: "Excellent communicator with solid technical skills. Strong team player who would integrate well. Could benefit from more focus on performance optimization.",
    notableMoments: [
      { time: "00:18:30", description: "Clearly explained complex algorithmic approach step-by-step", type: "positive" },
      { time: "00:40:00", description: "Implemented solution without considering performance implications", type: "negative" },
      { time: "01:15:00", description: "Quickly adapted to feedback and optimized solution", type: "positive" },
    ],
  },
  {
    id: "4",
    name: "David Park",
    position: "Senior Full-Stack Developer",
    interviewDate: "2025-12-12T11:30:00Z",
    duration: 78,
    technicalScore: 82,
    communicationScore: 78,
    overallScore: 80,
    verdict: "HIRE",
    keyStrengths: [
      "Fast implementation speed",
      "Good debugging skills",
      "Practical approach to problem-solving",
    ],
    keyInsights: "Capable developer with practical experience. Shows good technical aptitude but could improve communication and systematic approach to complex problems.",
    notableMoments: [
      { time: "00:25:00", description: "Quickly implemented working solution", type: "positive" },
      { time: "00:45:00", description: "Did not explain reasoning before coding", type: "negative" },
      { time: "01:10:00", description: "Efficiently debugged and fixed multiple issues", type: "positive" },
    ],
  },
  {
    id: "5",
    name: "Lisa Thompson",
    position: "Senior Full-Stack Developer",
    interviewDate: "2025-12-08T13:00:00Z",
    duration: 91,
    technicalScore: 78,
    communicationScore: 82,
    overallScore: 80,
    verdict: "HIRE",
    keyStrengths: [
      "Strong understanding of React ecosystem",
      "Good attention to UI/UX details",
      "Collaborative mindset",
    ],
    keyInsights: "Front-end specialist with good React knowledge. Would be valuable for UI-heavy projects but may need support on backend/system design aspects.",
    notableMoments: [
      { time: "00:20:00", description: "Proposed excellent component structure", type: "positive" },
      { time: "00:55:00", description: "Struggled with backend API design", type: "negative" },
      { time: "01:25:00", description: "Created polished and responsive UI", type: "positive" },
    ],
  },
];

export const AnalyticsPage = () => {
  const totalCandidates = 20;
  const topCount = totalCandidates <= 2 ? 1 : totalCandidates <= 10 ? 5 : 10;
  const topCandidates = [...MOCK_CANDIDATES_ANALYSIS].sort((a, b) => b.overallScore - a.overallScore).slice(0, topCount);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Top Candidates" subtitle="AI-powered analysis and ranking of interview performance" />
      
      <div className="mb-6 flex gap-4">
        <Input placeholder="Search by candidate name or position..." className="max-w-md" value="" onChange={() => {}} />
        <div className="flex gap-1 bg-gray-100 p-1 rounded-md">
          {["All", "Strong Hire", "Hire", "Maybe"].map((status) => (
            <button key={status} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${ status === "All" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{status}</button>
          ))}
        </div>
      </div>

      <AnalyticsTable candidates={topCandidates} />
    </div>
  );
};
