"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, XCircle, Search, Loader2, X, Terminal, Calendar, Zap } from "lucide-react";
import { executionsApi } from "@/lib/api";
import { AnimatePresence } from "framer-motion";

export default function ExecutionsPage() {
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedExec, setSelectedExec] = useState<any>(null);

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
    <div className="space-y-8 relative">
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
                  <tr 
                    key={exec.id} 
                    onClick={() => setSelectedExec(exec)}
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-mono text-zinc-300">exec_{exec.id}</td>
                    <td className="px-6 py-4 text-white font-medium">{exec.workflow?.name || "Deleted Workflow"}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(exec.status)}
                        <span className={
                          exec.status === 'COMPLETED' ? 'text-emerald-400' :
                          exec.status === 'RUNNING' ? 'text-amber-400' : 'text-rose-400'
                        }>{exec.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {exec.completed_at ? "1.2s" : "---"}
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

      {/* Execution Detail Panel */}
      <AnimatePresence>
        {selectedExec && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedExec(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-dark-surface border-l border-white/10 z-[101] shadow-2xl p-8 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <Terminal className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Execution Details</h2>
                    <p className="text-xs text-zinc-500">ID: exec_{selectedExec.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedExec(null)}
                  className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <section className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-zinc-500">Workflow</p>
                      <p className="text-white font-medium">{selectedExec.workflow?.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-zinc-500">Status</p>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(selectedExec.status)}
                        <p className="text-white font-medium">{selectedExec.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Calendar className="w-4 h-4 text-zinc-500" />
                      <div className="text-xs">
                        <p className="text-zinc-500">Started At</p>
                        <p className="text-zinc-300">{new Date(selectedExec.started_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Zap className="w-4 h-4 text-zinc-500" />
                      <div className="text-xs">
                        <p className="text-zinc-500">Trigger</p>
                        <p className="text-zinc-300">Manual UI</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Terminal className="w-4 h-4" /> Result Data
                  </h3>
                  <div className="bg-black/40 rounded-xl border border-white/5 p-4 font-mono text-xs leading-relaxed overflow-x-auto">
                    <pre className="text-emerald-400/90 whitespace-pre-wrap break-all">
                      {JSON.stringify(selectedExec.result_data || { message: "No data available" }, null, 2)}
                    </pre>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Input Payload</h3>
                  <div className="bg-black/40 rounded-xl border border-white/5 p-4 font-mono text-xs text-zinc-500">
                    <pre className="whitespace-pre-wrap break-all">
                      {JSON.stringify(selectedExec.trigger_payload || { source: "UI_MANUAL_TRIGGER" }, null, 2)}
                    </pre>
                  </div>
                </section>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
