import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, Input } from "../common/ui-primitives";
import { Job, JobPost, Client, User, Application } from "../../lib/types";
import { Copy, Send, Mail, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { getUsers, generateBulkAssignments, getApplications } from "../../lib/api.service";

interface GenerateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedJob?: Job | JobPost | null;
  preselectedClient?: Client | null;
  selectedApplicationIds?: string[];
  isBulkMode?: boolean;
}

export const GenerateLinkModal = ({
  isOpen,
  onClose,
  preselectedJob,
  preselectedClient,
  selectedApplicationIds = [],
  isBulkMode = false,
}: GenerateLinkModalProps) => {
  const [selectedJobId, setSelectedJobId] = useState<string>(
    preselectedJob?.id || ""
  );
  const [selectedClientId, setSelectedClientId] = useState<string>(
    preselectedClient?.id || ""
  );
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);

  // Get selected client data to display email
  const selectedClientData = useMemo(
    () => users.find((c) => c.id === selectedClientId),
    [selectedClientId, users]
  );

  useEffect(() => {
    if (isOpen) {
      setGeneratedLink("");
      setCopied(false);
      if (preselectedJob) setSelectedJobId(preselectedJob.id);
      if (preselectedClient) setSelectedClientId(preselectedClient.id);
      else setSelectedClientId(""); // Reset if reopening

      fetchUsers();
      
      if (isBulkMode && selectedApplicationIds.length > 0) {
        fetchApplications();
      }
    }
  }, [isOpen, preselectedJob, preselectedClient, isBulkMode, selectedApplicationIds]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchApplications = async () => {
    if (!preselectedJob) return;
    
    try {
      const data = await getApplications({ job_id: preselectedJob.id });
      const selectedApps = data.filter(app => selectedApplicationIds.includes(app.id));
      setApplications(selectedApps);
    } catch (error) {
      console.error("Failed to fetch applications", error);
    }
  };

  const handleGenerate = () => {
    const mockToken = Math.random().toString(36).substring(7);
    const url = `https://interview.engval.ai/s/${selectedJobId || "j_gen"}/${
      selectedClientId || "c_gen"
    }?token=${mockToken}`;
    setGeneratedLink(url);
  };

  const handleBulkGenerate = async () => {
    if (!preselectedJob || applications.length === 0) return;
    
    const applicationIds = applications.map(app => app.id);
    
    // Fire-and-forget: start generation in background
    generateBulkAssignments(
      applicationIds,
      true // auto_send emails
    ).then(() => {
      console.log(`✅ Successfully sent interview links to ${applicationIds.length} candidates`);
    }).catch((error) => {
      console.error("Failed to generate bulk assignments:", error);
    });
    
    // Close modal immediately
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isBulkMode ? `Generate Links for ${applications.length} Candidates` : "Generate Interview Link"}
    >
      <div className="space-y-5">{isBulkMode ? (
        // Bulk Mode UI - Simple confirmation before sending
        <>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              You are about to generate interview links and send invitations to the following candidates:
            </p>
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              {applications.map((app) => (
                <div 
                  key={app.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center font-semibold text-white text-xs shrink-0">
                    {app.user_name
                      ? app.user_name.split(" ").map((n) => n[0]).join("").toUpperCase()
                      : "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {app.user_name || "Unknown"}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {app.user_email || "No email"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 italic">
              Links will be generated and sent in the background. You can continue working.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="ghost"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkGenerate}
              className="gap-2 bg-black hover:bg-gray-800 text-white"
            >
              <Send className="h-4 w-4" />
              Generate & Send All
            </Button>
          </div>
        </>
      ) : (
        // Single Mode UI (existing)
        <>
          {/* Client Selection */}
          {!preselectedClient && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide">
              Select Candidate
            </label>
            {isLoadingUsers ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading
                candidates...
              </div>
            ) : (
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
              >
                <option value="" className="text-gray-500">
                  Choose a candidate...
                </option>
                {users.map((c) => (
                  <option key={c.id} value={c.id} className="text-gray-900">
                    {c.full_name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Selected Client Email Display - Compact */}
        {(selectedClientData || preselectedClient) && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
            <Mail className="h-3.5 w-3.5 text-gray-400" />
            <span className="font-medium text-gray-900">
              {selectedClientData?.email || preselectedClient?.email}
            </span>
          </div>
        )}

        {!generatedLink ? (
          <Button
            onClick={handleGenerate}
            disabled={!selectedClientId && !preselectedClient}
            className="w-full h-10 mt-2 bg-black text-white hover:bg-gray-800"
          >
            Generate Link
          </Button>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 space-y-5 duration-300">
            {/* Link Result */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide">
                Interview URL
              </label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={generatedLink}
                  className="bg-gray-50 font-mono text-xs text-gray-900 h-9"
                />
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="shrink-0 h-9 w-9 p-0 flex items-center justify-center"
                >
                  {copied ? (
                    <span className="text-xs font-bold">✓</span>
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Email Section - Simplified */}
            <div className="pt-4 border-t border-gray-100">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide">
                    Message Preview
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-600 h-24 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black resize-none leading-relaxed"
                    defaultValue={`Hi ${
                      selectedClientData?.full_name.split(" ")[0] || "there"
                    },\n\nWe're excited to move forward! Please use the following link to start your technical interview:\n\n${generatedLink}`}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    size="sm"
                    className="h-9"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="gap-2 bg-black hover:bg-gray-800 text-white h-9 px-4"
                    onClick={() => {
                      alert(
                        `Email sent to ${
                          selectedClientData?.email || "candidate"
                        }!`
                      );
                      onClose();
                    }}
                  >
                    <Send className="h-3.5 w-3.5" /> Send Invitation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        </>
      )}
      </div>
    </Modal>
  );
};
