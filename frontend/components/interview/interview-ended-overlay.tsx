import React from "react";

interface InterviewEndedOverlayProps {
  earlyTermination: boolean;
  onNavigate: () => void;
}

export function InterviewEndedOverlay({ earlyTermination, onNavigate }: InterviewEndedOverlayProps) {
  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md text-center">
        <div className="mb-6">
          {earlyTermination ? (
            <EarlyTerminationContent />
          ) : (
            <CompletionContent />
          )}
        </div>
        <button
          onClick={onNavigate}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg"
        >
          <span className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Back to Dashboard
          </span>
        </button>
      </div>
    </div>
  );
}

function EarlyTerminationContent() {
  return (
    <>
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Ended</h1>
      <p className="text-gray-600 mb-4">
        Thank you for your time. Unfortunately, we were unable to proceed with the coding task at this time.
      </p>
      <p className="text-sm text-gray-500 mb-8">
        Our recruiter will be in touch regarding next steps.
      </p>
    </>
  );
}

function CompletionContent() {
  return (
    <>
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Completed</h1>
      <p className="text-gray-600 mb-8">
        Thank you for completing the interview! Our team will review your session and be in touch soon.
      </p>
    </>
  );
}
