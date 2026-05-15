"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Save, Plus, Zap, Bot, Send, Settings2, Trash2, X, Check } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const STEP_TYPES = [
  { type: "trigger", name: "Webhook Trigger", icon: Zap, color: "text-amber-400", bg: "bg-amber-400/10" },
  { type: "action", name: "AI Summarize", icon: Bot, color: "text-indigo-400", bg: "bg-indigo-400/10" },
  { type: "action", name: "HTTP Request", icon: Send, color: "text-emerald-400", bg: "bg-emerald-400/10" },
];

type Step = {
  id: number;
  type: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  config: string;
};

export default function WorkflowBuilder() {
  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const [saved, setSaved] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [steps, setSteps] = useState<Step[]>([
    { id: 1, type: "trigger", name: "Webhook Trigger", icon: Zap, color: "text-amber-400", bg: "bg-amber-400/10", config: '{ "method": "POST", "path": "/webhook" }' },
    { id: 2, type: "action", name: "AI Summarize", icon: Bot, color: "text-indigo-400", bg: "bg-indigo-400/10", config: '{ "input": "{{step_1.output}}", "model": "llama-3" }' },
  ]);

  const addStep = (template: typeof STEP_TYPES[0]) => {
    setSteps([...steps, {
      id: Date.now(),
      ...template,
      config: `{ "input": "{{step_${steps.length}.output}}" }`,
    }]);
    setShowPicker(false);
  };

  const removeStep = (id: number) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const updateConfig = (id: number, value: string) => {
    setSteps(steps.map(s => s.id === id ? { ...s, config: value } : s));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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
            <input
              className="text-2xl font-bold tracking-tight text-white bg-transparent border-b border-transparent hover:border-white/20 focus:border-indigo-500 outline-none transition-colors w-80"
              value={workflowName}
              onChange={e => setWorkflowName(e.target.value)}
              placeholder="Workflow Name..."
            />
            <p className="text-zinc-400 text-sm mt-1">Build your automation pipeline.</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className={clsx(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
            saved
              ? "bg-emerald-500 text-white"
              : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]"
          )}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : "Save & Deploy"}
        </button>
      </header>

      {/* Builder Canvas */}
      <div className="relative py-8 flex flex-col items-center">
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent -translate-x-1/2" />

        <AnimatePresence>
          {steps.map((step) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative z-10 w-full max-w-lg mb-6 group"
            >
              <div className="glass-panel rounded-xl p-5 border border-white/10 hover:border-indigo-500/50 transition-colors shadow-lg shadow-black/20">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center", step.bg)}>
                      <step.icon className={clsx("w-6 h-6", step.color)} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{step.type}</p>
                      <h3 className="text-lg font-medium text-white">{step.name}</h3>
                    </div>
                  </div>
                  {step.type !== "trigger" && (
                    <button
                      onClick={() => removeStep(step.id)}
                      className="p-2 hover:bg-rose-500/10 rounded-lg text-zinc-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Editable config */}
                <div className="mt-2">
                  <label className="text-xs text-zinc-500 mb-1 block">Configuration (JSON)</label>
                  <textarea
                    value={step.config}
                    onChange={e => updateConfig(step.id, e.target.value)}
                    rows={2}
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-xs text-zinc-300 font-mono focus:outline-none focus:border-indigo-500/60 resize-none transition-colors"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add Step Button / Picker */}
        <div className="relative z-10 mt-2">
          {showPicker ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel rounded-xl p-4 border border-white/10 w-64"
            >
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-medium text-white">Add a Step</p>
                <button onClick={() => setShowPicker(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {STEP_TYPES.filter(s => s.type === "action").map(t => (
                <button
                  key={t.name}
                  onClick={() => addStep(t)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors text-left"
                >
                  <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center", t.bg)}>
                    <t.icon className={clsx("w-4 h-4", t.color)} />
                  </div>
                  <span className="text-sm text-zinc-300">{t.name}</span>
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.button
              onClick={() => setShowPicker(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-shadow"
            >
              <Plus className="w-6 h-6" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
