"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, XCircle, Search, Loader2 } from "lucide-react";
import { executionsApi } from "@/lib/api";

export default function ExecutionsPage() {
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadExecutions();
  }, []);

  const loadExecutions = async () => {
    try {
      const data = await executionsApi.list();
      setExecutions(data);
    } catch (err) {
      console.error("Failed to load executions", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'RUNNING': return <Clock className="w-4 h-4 text-amber-400 animate-pulse" />;
      case 'FAILED': return <XCircle className="w-4 h-4 text-rose-400" />;
      default: return <Clock className="w-4 h-4 text-zinc-500" />;
    }
  };

  const filteredExecutions = executions.filter(exec => 
    exec.id.toString().includes(search) || 
    (exec.workflow?.name || "Workflow").toLowerCase().includes(search.toLowerCase())
  );

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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors w-64"
          />
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-zinc-400">Loading audit logs...</p>
        </div>
      ) : (
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
                <th className="px-6 py-4 font-medium text-right">Started At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredExecutions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    No executions found.
                  </td>
                </tr>
              ) : (
                filteredExecutions.map((exec) => (
                  <tr key={exec.id} className="hover:bg-white/5 transition-colors cursor-pointer group">
                    <td className="px-6 py-4 font-mono text-zinc-300">exec_{exec.id}</td>
                    <td className="px-6 py-4 text-white font-medium">{exec.workflow?.name || "Deleted Workflow"}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(exec.state)}
                        <span className={
                          exec.state === 'COMPLETED' ? 'text-emerald-400' :
                          exec.state === 'RUNNING' ? 'text-amber-400' : 'text-rose-400'
                        }>{exec.state}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {exec.finished_at ? "1.2s" : "---"}
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-500 group-hover:text-zinc-300 transition-colors">
                      {new Date(exec.started_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}
