"use client";

import { motion } from "framer-motion";
import { Plus, Play, MoreVertical, Workflow as WorkflowIcon } from "lucide-react";
import Link from "next/link";

export default function WorkflowsPage() {
  const workflows = [
    { id: 1, name: "Customer Support Triaging", trigger: "Webhook", steps: 3, status: "Active", lastRun: "2 mins ago" },
    { id: 2, name: "Invoice Document OCR", trigger: "File Upload", steps: 2, status: "Active", lastRun: "1 hour ago" },
    { id: 3, name: "GitHub PR Summarizer", trigger: "Webhook", steps: 4, status: "Paused", lastRun: "2 days ago" },
  ];

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Workflows</h1>
          <p className="text-zinc-400 mt-1">Manage and build your automated AI pipelines.</p>
        </div>
        <Link href="/workflows/new">
          <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <Plus className="w-4 h-4" />
            Create Workflow
          </button>
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {workflows.map((workflow, idx) => (
          <motion.div
            key={workflow.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-panel rounded-xl p-5 flex items-center justify-between group hover:border-white/20 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <WorkflowIcon className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">{workflow.name}</h3>
                <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                  <span className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${workflow.status === 'Active' ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                    {workflow.status}
                  </span>
                  <span>•</span>
                  <span>Trigger: {workflow.trigger}</span>
                  <span>•</span>
                  <span>{workflow.steps} steps</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs text-zinc-500 hidden md:block">Last run {workflow.lastRun}</span>
              <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors">
                <Play className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
