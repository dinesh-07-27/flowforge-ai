"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, XCircle, Search } from "lucide-react";

export default function ExecutionsPage() {
  const executions = [
    { id: "exec_9a8b7c", workflow: "Invoice Document OCR", status: "COMPLETED", duration: "1.2s", time: "2 mins ago" },
    { id: "exec_3f4e5d", workflow: "GitHub PR Summarizer", status: "RUNNING", duration: "4.5s", time: "Just now" },
    { id: "exec_1a2b3c", workflow: "Customer Support Triaging", status: "FAILED", duration: "0.8s", time: "1 hour ago" },
    { id: "exec_8x9y0z", workflow: "Invoice Document OCR", status: "COMPLETED", duration: "1.1s", time: "3 hours ago" },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'RUNNING': return <Clock className="w-4 h-4 text-amber-400 animate-pulse" />;
      case 'FAILED': return <XCircle className="w-4 h-4 text-rose-400" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Execution History</h1>
          <p className="text-zinc-400 mt-1">Audit logs for every triggered workflow.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search executions..." 
            className="bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors w-64"
          />
        </div>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-xl overflow-hidden"
      >
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/10 text-zinc-400">
            <tr>
              <th className="px-6 py-4 font-medium">Execution ID</th>
              <th className="px-6 py-4 font-medium">Workflow</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Duration</th>
              <th className="px-6 py-4 font-medium text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {executions.map((exec) => (
              <tr key={exec.id} className="hover:bg-white/5 transition-colors cursor-pointer group">
                <td className="px-6 py-4 font-mono text-zinc-300">{exec.id}</td>
                <td className="px-6 py-4 text-white font-medium">{exec.workflow}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(exec.status)}
                    <span className={
                      exec.status === 'COMPLETED' ? 'text-emerald-400' :
                      exec.status === 'RUNNING' ? 'text-amber-400' : 'text-rose-400'
                    }>{exec.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-zinc-400">{exec.duration}</td>
                <td className="px-6 py-4 text-right text-zinc-500 group-hover:text-zinc-300 transition-colors">{exec.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
