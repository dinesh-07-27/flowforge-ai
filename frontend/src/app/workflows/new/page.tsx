"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Plus, Zap, Bot, Send, Settings2 } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

export default function WorkflowBuilder() {
  const [steps, setSteps] = useState([
    { id: 1, type: "trigger", name: "Webhook Trigger", icon: Zap, color: "text-amber-400", bg: "bg-amber-400/10" },
    { id: 2, type: "action", name: "AI Summarize", icon: Bot, color: "text-indigo-400", bg: "bg-indigo-400/10" },
  ]);

  const addStep = () => {
    setSteps([...steps, { id: steps.length + 1, type: "action", name: "HTTP Request", icon: Send, color: "text-emerald-400", bg: "bg-emerald-400/10" }]);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <header className="flex justify-between items-center border-b border-white/5 pb-4">
        <div className="flex items-center gap-4">
          <Link href="/workflows">
            <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white focus:outline-none focus:ring-0" contentEditable>Untitled Workflow</h1>
            <p className="text-zinc-400 text-sm mt-1">Build your automation pipeline.</p>
          </div>
        </div>
        <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save & Deploy
        </button>
      </header>

      {/* Builder Canvas */}
      <div className="relative py-8 flex flex-col items-center">
        {/* Vertical Line connecting steps */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent -translate-x-1/2" />

        {steps.map((step, idx) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 w-full max-w-lg mb-8 group"
          >
            <div className="glass-panel rounded-xl p-5 border border-white/10 hover:border-indigo-500/50 transition-colors shadow-lg shadow-black/20">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center", step.bg)}>
                    <step.icon className={clsx("w-6 h-6", step.color)} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{step.type}</p>
                    <h3 className="text-lg font-medium text-white">{step.name}</h3>
                  </div>
                </div>
                <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 opacity-0 group-hover:opacity-100 transition-all">
                  <Settings2 className="w-5 h-5" />
                </button>
              </div>
              
              {/* Fake config area */}
              {step.type === 'action' && (
                <div className="mt-4 pt-4 border-t border-white/5">
                   <div className="bg-black/20 rounded-lg p-3 text-xs text-zinc-400 font-mono">
                     {"{ \"input\": \"{{step_1.output}}\" }"}
                   </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        <motion.button
          onClick={addStep}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative z-10 w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-shadow mt-4"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </div>
    </div>
  );
}
