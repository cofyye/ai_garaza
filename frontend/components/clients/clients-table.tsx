import React from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { Client } from "../../lib/types";
import { Badge, Button } from "../common/ui-primitives";
import { getStatusColor, getInitials, formatDate } from "../../lib/utils";

interface ClientsTableProps {
  clients: Client[];
  onSelectClient: (client: Client) => void;
}

export const ClientsTable = ({ clients, onSelectClient }: ClientsTableProps) => {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-6 py-3">Candidate</th>
              <th className="px-6 py-3">Position</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Score</th>
              <th className="px-6 py-3">Verdict</th>
              <th className="px-6 py-3 text-right">Updated</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {clients.map((client) => (
              <motion.tr
                key={client.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                onClick={() => onSelectClient(client)}
                className="cursor-pointer group hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 font-medium text-gray-600">
                      {getInitials(client.name)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{client.name}</div>
                      <div className="text-gray-400">{client.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                    {client.position}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Badge className={getStatusColor(client.status)}>{client.status.replace("_", " ")}</Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  {client.interviewScore ? (
                    <span className={client.interviewScore > 80 ? "font-bold text-gray-900" : "text-gray-600"}>
                      {client.interviewScore}%
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-6 py-4">
                  {client.verdict ? (
                    <Badge className={getStatusColor(client.verdict)}>{client.verdict.replace("_", " ")}</Badge>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  {formatDate(client.lastUpdated)}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onSelectClient(client); }}>
                    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 transition-colors duration-200" />
                  </Button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};