"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Pause, Trash2, Workflow as WorkflowIcon, Zap, Bot, Send, Loader2, Calendar, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { workflowsApi } from "@/lib/api";
import toast from "react-hot-toast";
import clsx from "clsx";

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [running, setRunning] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  useEffect(() => {
    loadWorkflow();
  }, [params.id]);

  const loadWorkflow = async () => {
    try {
      const data = await workflowsApi.get(params.id as string);
      setWorkflow(data);
      setTempName(data.name);
    } catch (err) {
      console.error("Failed to load workflow", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    try {
      setRunning(true);
      await workflowsApi.run(params.id as string);
      setWorkflow({ ...workflow, is_active: true });
      toast.success("Workflow triggered and activated successfully!");
    } catch (err) {
      console.error("Run failed", err);
      toast.error("Failed to trigger workflow.");
    } finally {
      setRunning(false);
    }
  };

  const handleRename = async () => {
    if (!tempName.trim() || tempName === workflow.name) {
      setIsEditingName(false);
      setTempName(workflow.name);
      return;
    }
    try {
      await workflowsApi.update(params.id as string, { name: tempName });
      setWorkflow({ ...workflow, name: tempName });
      setIsEditingName(false);
      toast.success("Workflow renamed successfully.");
    } catch (err) {
      console.error("Rename failed", err);
      toast.error("Failed to rename workflow.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this workflow? This action cannot be undone.")) return;
    try {
      setDeleting(true);
      await workflowsApi.delete(params.id as string);
      toast.success("Workflow deleted permanently.");
      router.push("/workflows");
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Failed to delete workflow.");
      setDeleting(false);
    }
  };

  const getStepIcon = (type: string) => {
    if (type.toLowerCase().includes("summarize")) return Bot;
    if (type.toLowerCase().includes("http")) return Send;
    return Zap;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-zinc-400">Loading workflow details...</p>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white">Workflow not found</h2>
        <Link href="/workflows">
          <button className="mt-4 text-indigo-400 hover:text-indigo-300">Return to list</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <header className="flex justify-between items-start">
        <div className="flex items-start gap-4">
          <Link href="/workflows">
            <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors mt-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              {isEditingName ? (
                <input
                  autoFocus
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                  className="text-3xl font-bold text-white tracking-tight bg-white/5 border-b-2 border-indigo-500 outline-none px-2 py-1 rounded-t-lg w-full max-w-md"
                />
              ) : (
                <h1 
                  onClick={() => setIsEditingName(true)}
                  className="text-3xl font-bold text-white tracking-tight cursor-pointer hover:text-indigo-400 transition-colors group relative"
                >
                  {workflow.name}
                  <span className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-xs font-normal text-indigo-400 transition-opacity">Edit</span>
                </h1>
              )}
              <span className={clsx(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                workflow.is_active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20"
              )}>
                {workflow.is_active ? "Active" : "Paused"}
              </span>
            </div>
            <p className="text-zinc-400 mt-2 max-w-xl">{workflow.description || "No description provided."}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={handleDelete}
             disabled={deleting}
             className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors border border-rose-500/20"
           >
             {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
           </button>
           <button 
             onClick={handleRun}
             disabled={running}
             className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-400 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
           >
             {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
             Run Now
           </button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column: Flow */}
        <div className="col-span-2 space-y-6">
          <section className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" /> Pipeline Steps
            </h2>
            <div className="space-y-4 relative">
              <div className="absolute left-[21px] top-4 bottom-4 w-0.5 bg-white/5" />
              
              {/* Trigger */}
              <div className="flex gap-4 relative z-10">
                <div className="w-11 h-11 rounded-full bg-amber-400/10 flex items-center justify-center border border-amber-400/20">
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/5">
                  <h4 className="text-white font-medium">Trigger: {workflow.trigger_type}</h4>
                  <p className="text-xs text-zinc-500 mt-1">Accepts incoming JSON payloads</p>
                </div>
              </div>

              {/* Actions */}
              {workflow.steps.map((step: any, idx: number) => {
                const Icon = getStepIcon(step.action_type);
                return (
                  <div key={step.id} className="flex gap-4 relative z-10">
                    <div className="w-11 h-11 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                      <Icon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/5">
                      <div className="flex justify-between items-start">
                        <h4 className="text-white font-medium">{step.action_type}</h4>
                        <span className="text-[10px] text-zinc-600 font-mono">STEP {idx + 1}</span>
                      </div>
                      <pre className="mt-3 bg-black/40 p-3 rounded-lg text-[11px] font-mono text-zinc-400 overflow-x-auto border border-white/5">
                        {JSON.stringify(step.action_config, null, 2)}
                      </pre>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Meta */}
        <div className="space-y-6">
          <section className="glass-panel rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Metadata</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-zinc-300">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <div className="text-xs">
                  <p className="text-zinc-500">Created</p>
                  <p>{new Date(workflow.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <ShieldCheck className="w-4 h-4 text-zinc-500" />
                <div className="text-xs">
                  <p className="text-zinc-500">Owner</p>
                  <p>Admin (ID: 1)</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-indigo-500/5 rounded-2xl p-6 border border-indigo-500/10">
            <h3 className="text-indigo-400 font-semibold text-sm mb-2">Usage Tip</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Use the "Run Now" button to manually trigger this workflow with a test payload. Perfect for debugging your AI prompts.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
