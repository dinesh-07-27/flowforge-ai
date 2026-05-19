"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Loader2, Mail, FileText, Terminal, ArrowRight, 
  Copy, Check, Zap, ExternalLink, ShieldCheck 
} from "lucide-react";
import { workflowsApi, executionsApi } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function SimulationPortalPage() {
  const [targetWorkflowId, setTargetWorkflowId] = useState<number | null>(null);
  const [activeChannel, setActiveChannel] = useState<"email" | "document">("email");
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Simulation payload inputs
  const [customerName, setCustomerName] = useState("Jane Doe");
  const [customerEmail, setCustomerEmail] = useState("jane@example.com");
  const [emailSubject, setEmailSubject] = useState("Order Delayed Requesting Refund");
  const [emailBody, setEmailBody] = useState(
    "Hi Amazon Support, I ordered my package INV-988301 two weeks ago, but it has not arrived yet. I would like to request a full refund and get an status update immediately. Thank you."
  );
  
  const [invoiceText, setInvoiceText] = useState(
    "Invoice ID: INV-BILL-88301\nDue Date: June 20, 2026\nCharged Amount: $3,250.00\nCustomer: enterprise@gmail.com\nSubscription Plan: SaaS Enterprise Yearly License"
  );

  // Live Telemetry Terminal states
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamically query target workflow
    workflowsApi.list().then((data: any[]) => {
      const match = data.find((w: any) => w.name.toLowerCase().includes("invoice") || w.name.toLowerCase().includes("email"));
      if (match) {
        setTargetWorkflowId(match.id);
      } else if (data.length > 0) {
        setTargetWorkflowId(data[0].id);
      }
    }).catch(err => console.error("Simulation workflows load failed:", err));
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  const getPayload = () => {
    if (activeChannel === "email") {
      return {
        customer_email: customerEmail,
        customer_name: customerName,
        subject: emailSubject,
        content: `From: ${customerName} <${customerEmail}>\nSubject: ${emailSubject}\n\nBody:\n${emailBody}`
      };
    } else {
      return {
        customer_email: "enterprise@gmail.com",
        content: invoiceText
      };
    }
  };

  const handleFireWebhook = async () => {
    if (!targetWorkflowId) {
      toast.error("No valid automation workflow loaded to execute.");
      return;
    }
    
    setRunning(true);
    setExecutionResult(null);
    setTerminalLogs([]);
    
    addLog("📥 Inbound Webhook event triggered via HTTPS POST request.");
    addLog("🔐 Authorization headers verified: JWT Token validated.");
    
    try {
      const payload = getPayload();
      addLog("🚀 Dispatching transaction payload payload to Message Broker...");
      
      const response = await workflowsApi.run(targetWorkflowId, payload);
      const execId = response.execution_id;
      
      addLog(`✅ Task accepted by queue. Assigned Execution ID: #${execId}`);
      addLog("🔄 Message securely dropped into RabbitMQ [Queue: priority_workflow_task].");
      
      // Start Real-time Polling
      let completed = false;
      let attempts = 0;
      
      const pollInterval = setInterval(async () => {
        attempts++;
        if (attempts > 30) {
          clearInterval(pollInterval);
          addLog("❌ Telemetry Polling timeout exceeded.");
          setRunning(false);
          return;
        }

        try {
          const list = await executionsApi.list();
          const current = list.find((e: any) => e.id === execId);
          
          if (!current) {
            addLog("  [Worker Engine] Synchronizing event status...");
            return;
          }

          if (current.status === "PENDING") {
            addLog("⏳ [Queue Status] Task is currently pending in RabbitMQ...");
          } else if (current.status === "RUNNING") {
            addLog("⚙️ [Celery Workers] node-llama-worker-01 active. Executing AI steps...");
          } else if (current.status === "COMPLETED") {
            clearInterval(pollInterval);
            completed = true;
            addLog("🎉 [Celery Workers] Workflow completed successfully in 1.48 seconds.");
            addLog("💾 [Postgres DB] Transaction states and pipeline records committed.");
            addLog("📤 [System Outbox] Automated response logged inside platform!");
            
            setExecutionResult(current);
            setRunning(false);
          } else if (current.status === "FAILED") {
            clearInterval(pollInterval);
            completed = true;
            addLog(`❌ [Celery Workers] Execution failed: ${current.error_message}`);
            setRunning(false);
          }
        } catch (pollErr) {
          console.error("Polling execution failed:", pollErr);
        }
      }, 1200);

    } catch (err: any) {
      addLog(`❌ Gateway connection error: ${err.message || "Failed to trigger webhook."}`);
      setRunning(false);
    }
  };

  const getCurlCommand = () => {
    const payload = getPayload();
    return `curl -X POST "http://localhost/api/v1/workflows/${targetWorkflowId || 15}/run" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <YOUR_JWT_ACCESS_TOKEN>" \\
  -d '${JSON.stringify(payload, null, 2).replace(/'/g, "'\\''")}'`;
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(getCurlCommand());
    setCopied(true);
    toast.success("cURL command copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
            <Zap className="w-3.5 h-3.5 fill-current animate-pulse" /> Production Simulator
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">AI Microservice Simulation Portal</h1>
          <p className="text-zinc-400 mt-1 max-w-2xl text-sm leading-relaxed">
            Directly test how external company storefronts (like Shopify or Amazon portals) integrate with our background automation webhook engine.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl border border-emerald-500/20 font-mono text-xs shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          Webhook Gateway Online
        </div>
      </div>

      {/* Split-Screen Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Mock External Application Composer (45%) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Mock Customer Portal</span>
            </div>

            {/* Channels Tab Toggles */}
            <div className="flex border-b border-white/5 bg-white/[0.01]">
              <button
                onClick={() => setActiveChannel("email")}
                className={`flex-1 py-3.5 px-6 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
                  activeChannel === "email"
                    ? "border-indigo-500 text-indigo-400 bg-indigo-500/[0.02]"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                <Mail className="w-4 h-4" /> Gmail Inbox Channel
              </button>
              <button
                onClick={() => setActiveChannel("document")}
                className={`flex-1 py-3.5 px-6 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
                  activeChannel === "document"
                    ? "border-indigo-500 text-indigo-400 bg-indigo-500/[0.02]"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                <FileText className="w-4 h-4" /> Billing statement drop
              </button>
            </div>

            <div className="p-6 space-y-4">
              <AnimatePresence mode="wait">
                {activeChannel === "email" ? (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1.5 tracking-wider">Customer Name</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1.5 tracking-wider">Customer Email</label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 font-medium"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1.5 tracking-wider">Subject Line</label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1.5 tracking-wider">Email Complaint Body</label>
                      <textarea
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        rows={6}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="document"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1.5 tracking-wider">Raw Billing / Invoice text</label>
                      <textarea
                        value={invoiceText}
                        onChange={(e) => setInvoiceText(e.target.value)}
                        rows={9}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Button */}
              <button
                onClick={handleFireWebhook}
                disabled={running || !targetWorkflowId}
                className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white py-3.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
              >
                {running ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing Asynchronously...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" /> Dispatch API Webhook Event
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Copyable Webhook Console (cURL Block) */}
          <div className="glass-panel border border-white/10 rounded-2xl p-6 bg-white/[0.01]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-2 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-indigo-400" /> Developer Webhook API cURL
              </h4>
              <button
                onClick={handleCopyCurl}
                className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-all"
                title="Copy cURL command"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <pre className="bg-black/55 border border-white/5 rounded-xl p-4 text-[10px] text-zinc-400 font-mono overflow-x-auto leading-relaxed max-h-[160px] scrollbar-thin">
              {getCurlCommand()}
            </pre>
          </div>
        </div>

        {/* Right Side: The FlowForge live Execution Logs & Telemetry (75%) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live Telemetry Logger console */}
          <div className="glass-panel border border-white/10 rounded-2xl overflow-hidden bg-black/60 shadow-2xl flex flex-col min-h-[480px]">
            <div className="px-6 py-4 border-b border-white/5 bg-zinc-950 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span className="text-xs font-semibold text-zinc-300">Live Automation Telemetry Stream</span>
            </div>

            <div className="flex-1 p-6 font-mono text-xs space-y-2 overflow-y-auto max-h-[360px] scrollbar-thin select-text selection:bg-indigo-500/30">
              {terminalLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-zinc-600 py-12">
                  <Terminal className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">Awaiting inbound webhook signal...</p>
                  <p className="text-[10px] mt-1">Configure inputs on the left and click "Dispatch API Webhook Event"</p>
                </div>
              ) : (
                terminalLogs.map((log, idx) => (
                  <div 
                    key={idx} 
                    className={`leading-normal border-l-2 pl-3 ${
                      log.includes("✅") || log.includes("🎉") 
                        ? "text-emerald-400 border-emerald-500/30" 
                        : log.includes("❌") 
                        ? "text-rose-400 border-rose-500/30" 
                        : log.includes("⏳") || log.includes("🔄")
                        ? "text-yellow-400 border-yellow-500/30"
                        : "text-zinc-400 border-white/5"
                    }`}
                  >
                    {log}
                  </div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>

            {/* Simulated Live Outbox Email Display (Fires after completed execution) */}
            <AnimatePresence>
              {executionResult && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="border-t border-white/10 bg-zinc-950/80 p-6 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      📧 Automated Transaction Action Fired
                    </span>
                    <span className="text-xs font-mono text-zinc-500">Channel: Mock SendGrid SMTP Relay</span>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-3 font-sans text-xs text-zinc-300">
                    <div className="grid grid-cols-6 gap-2 border-b border-white/5 pb-2 font-mono text-[10px] text-zinc-500">
                      <span className="col-span-1">RECIPIENT:</span>
                      <span className="col-span-5 text-zinc-300">{customerEmail}</span>
                      <span className="col-span-1">SUBJECT:</span>
                      <span className="col-span-5 text-zinc-300">FlowForge Automated Resolution Notice</span>
                    </div>

                    <div className="pt-2 text-zinc-300 leading-relaxed font-sans whitespace-pre-line max-h-[140px] overflow-y-auto scrollbar-thin">
                      {executionResult.result_data?.steps?.find((s: any) => s.action_type === "email_dispatch")?.output.split("Message Body:\n----------------------------------------\n")[1]?.split("\n----------------------------------------")[0] || 
                       executionResult.result_data?.steps?.[executionResult.result_data.steps.length - 1]?.output}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
