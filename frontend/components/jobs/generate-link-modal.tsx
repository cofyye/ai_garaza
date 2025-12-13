import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, Input } from "../common/ui-primitives";
import { JobPost, Client } from "../../lib/types";
import { Copy, Send, Mail } from "lucide-react";
import { MOCK_CLIENTS } from "../../lib/mock-data";

interface GenerateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedJob?: JobPost | null;
  preselectedClient?: Client | null;
}

export const GenerateLinkModal = ({ isOpen, onClose, preselectedJob, preselectedClient }: GenerateLinkModalProps) => {
  const [selectedJobId, setSelectedJobId] = useState<string>(preselectedJob?.id || "");
  const [selectedClientId, setSelectedClientId] = useState<string>(preselectedClient?.id || "");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  // Get selected client data to display email
  const selectedClientData = useMemo(() => 
    MOCK_CLIENTS.find(c => c.id === selectedClientId), 
  [selectedClientId]);

  useEffect(() => {
    if (isOpen) {
        setGeneratedLink("");
        setCopied(false);
        if (preselectedJob) setSelectedJobId(preselectedJob.id);
        if (preselectedClient) setSelectedClientId(preselectedClient.id);
        else setSelectedClientId(""); // Reset if reopening
    }
  }, [isOpen, preselectedJob, preselectedClient]);

  const handleGenerate = () => {
    const mockToken = Math.random().toString(36).substring(7);
    const url = `https://interview.talentai.app/s/${selectedJobId || 'j_gen'}/${selectedClientId || 'c_gen'}?token=${mockToken}`;
    setGeneratedLink(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Interview Link">
      <div className="space-y-6">
        {/* Client Selection */}
        {!preselectedClient && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Select Candidate</label>
            <select 
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              <option value="" className="text-gray-500">Choose a candidate...</option>
              {MOCK_CLIENTS.map(c => <option key={c.id} value={c.id} className="text-gray-900">{c.name}</option>)}
            </select>
          </div>
        )}

        {/* Selected Client Email Display */}
        {(selectedClientData || preselectedClient) && (
            <div className="rounded-md bg-blue-50 p-3 flex items-center gap-3 border border-blue-100">
                <div className="bg-white p-1.5 rounded-full text-blue-600">
                    <Mail className="h-4 w-4" />
                </div>
                <div>
                    <div className="text-xs text-blue-600 font-medium uppercase tracking-wide">Candidate Email</div>
                    <div className="text-sm font-medium text-gray-900">{selectedClientData?.email || preselectedClient?.email}</div>
                </div>
            </div>
        )}

        {!generatedLink ? (
          <Button 
            onClick={handleGenerate} 
            disabled={!selectedClientId && !preselectedClient} 
            className="w-full h-11 mt-2"
          >
            Generate Interview Link
          </Button>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
            {/* Link Result */}
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Interview URL</label>
               <div className="flex gap-2">
                 <Input readOnly value={generatedLink} className="bg-gray-50 font-mono text-xs text-gray-900" />
                 <Button variant="outline" onClick={handleCopy} className="shrink-0">
                   {copied ? "Copied" : <Copy className="h-4 w-4" />}
                 </Button>
               </div>
            </div>

            {/* Email Section */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
                <Send className="h-4 w-4 text-indigo-600" /> Send Invitation via Gmail
              </h4>
              
              <div className="space-y-3">
                 <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">To</label>
                    <Input value={selectedClientData?.email || preselectedClient?.email || ""} readOnly disabled className="bg-white text-gray-700" />
                 </div>
                 
                 <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Message</label>
                    <textarea 
                        className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 h-32 focus:outline-none focus:ring-2 focus:ring-black resize-none"
                        defaultValue={`Hi ${selectedClientData?.name.split(' ')[0] || 'there'},\n\nWe're excited to move forward! Please use the following link to start your technical interview:\n\n${generatedLink}\n\nPlease note this link is valid for 48 hours.\n\nBest,\nTalentAI Team`}
                    />
                 </div>

                 <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={onClose} size="sm">Cancel</Button>
                    <Button 
                        className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" 
                        onClick={() => {
                            alert(`Email sent to ${selectedClientData?.email || 'candidate'}!`);
                            onClose();
                        }}
                    >
                        <Send className="h-4 w-4" /> Send Email
                    </Button>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};