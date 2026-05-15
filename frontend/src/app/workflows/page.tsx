"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Play, MoreVertical, Workflow as WorkflowIcon, Pause, Trash2, Edit } from "lucide-react";
import Link from "next/link";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState([
    { id: 1, name: "Customer Support Triaging", trigger: "Webhook", steps: 3, status: "Active", lastRun: "2 mins ago" },
    { id: 2, name: "Invoice Document OCR", trigger: "File Upload", steps: 2, status: "Active", lastRun: "1 hour ago" },
    { id: 3, name: "GitHub PR Summarizer", trigger: "Webhook", steps: 4, status: "Paused", lastRun: "2 days ago" },
  ]);
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const toggleStatus = (id: number) => {
    setWorkflows(ws => ws.map(w => w.id === id ? { ...w, status: w.status === "Active" ? "Paused" : "Active" } : w));
  };

  const deleteWorkflow = (id: number) => {
    setWorkflows(ws => ws.filter(w => w.id !== id));
    setOpenMenu(null);
  };

  return (
    <div className="space-y-8" onClick={() => setOpenMenu(null)}>
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Workflows</h1>
          <p className="text-zinc-400 mt-1">Manage and build your automated AI pipelines.</p>
        </div>
        <Link href="/workflows/new">
          <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <Plus className="w-4 h-4" /> Create Workflow
          </button>
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {workflows.map((workflow, idx) => (
            <motion.div
              key={workflow.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: idx * 0.08 }}
              className="glass-panel rounded-xl p-5 flex items-center justify-between group hover:border-indigo-500/40 transition-all"
            >
              <Link href="/workflows/new" className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <WorkflowIcon className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-medium text-white truncate">{workflow.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                    <span className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${workflow.status === "Active" ? "bg-emerald-400" : "bg-zinc-500"}`} />
                      {workflow.status}
                    </span>
                    <span>•</span>
                    <span>Trigger: {workflow.trigger}</span>
                    <span>•</span>
                    <span>{workflow.steps} steps</span>
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-2 shrink-0 ml-4" onClick={e => e.stopPropagation()}>
                <span className="text-xs text-zinc-500 hidden md:block mr-2">Last run {workflow.lastRun}</span>
                <button onClick={() => toggleStatus(workflow.id)}
                  title={workflow.status === "Active" ? "Pause" : "Resume"}
                  className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-indigo-400 transition-colors">
                  {workflow.status === "Active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <div className="relative">
                  <button onClick={() => setOpenMenu(openMenu === workflow.id ? null : workflow.id)}
                    className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {openMenu === workflow.id && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-0 top-10 z-50 glass-panel rounded-xl border border-white/10 w-40 py-1 shadow-xl">
                      <Link href="/workflows/new">
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 transition-colors">
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                      </Link>
                      <button onClick={() => deleteWorkflow(workflow.id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors">
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
