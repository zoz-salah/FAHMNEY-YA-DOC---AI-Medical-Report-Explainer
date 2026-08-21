import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  useGetMedicalStats,
  getGetMedicalStatsQueryKey,
  getListReportsQueryKey,
} from "@workspace/api-client-react";
import { Upload, FileText, AlertTriangle, Pill, ClipboardList, TrendingUp, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface MedicalReport {
  id: number;
  filename: string;
  summary: string;
  diagnosis: string;
  medications: string[];
  followupInstructions: string[];
  warnings: string[];
  language: string;
  createdAt: string;
}

type UploadState = "idle" | "uploading" | "done" | "error";

export default function Home() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [result, setResult] = useState<MedicalReport | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { data: stats } = useGetMedicalStats({
    query: { queryKey: getGetMedicalStatsQueryKey() },
  });

  const analyzeFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".pdf")) {
      toast({ title: "PDF files only", description: "Please upload a PDF document.", variant: "destructive" });
      return;
    }
    setUploadState("uploading");
    setResult(null);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/medical/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || "Analysis failed");
      }

      const data: MedicalReport = await res.json();
      setResult(data);
      setUploadState("done");
      await queryClient.invalidateQueries({ queryKey: getListReportsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetMedicalStatsQueryKey() });
    } catch (err) {
      setUploadState("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }, [queryClient, toast]);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) analyzeFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) analyzeFile(file);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero */}
      <section className="container mx-auto max-w-5xl px-4 pt-16 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
            Your medical documents,{" "}
            <span className="text-primary">finally explained.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your discharge summary, lab report, or clinical document and get a clear, plain-language guide in seconds. No medical degree required.
          </p>
        </motion.div>
      </section>

      {/* Stats */}
      {stats && stats.totalReports > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="container mx-auto max-w-5xl px-4 mb-8"
        >
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span><strong className="text-foreground">{stats.totalReports}</strong> reports analyzed</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 text-primary" />
              <span><strong className="text-foreground">{stats.recentReports}</strong> this week</span>
            </div>
            {stats.topLanguages.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Languages: </span>
                {stats.topLanguages.slice(0, 3).map(l => (
                  <Badge key={l.language} variant="secondary" className="text-xs">{l.language}</Badge>
                ))}
              </div>
            )}
          </div>
        </motion.section>
      )}

      {/* Upload Zone */}
      <section className="container mx-auto max-w-2xl px-4 pb-16">
        <AnimatePresence mode="wait">
          {uploadState === "idle" || uploadState === "error" ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              <label
                className={`group flex flex-col items-center justify-center w-full min-h-64 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                  dragOver
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-border bg-card hover:border-primary/60 hover:bg-primary/3"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                data-testid="upload-zone"
              >
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={onFileInput}
                  data-testid="input-pdf-file"
                />
                <motion.div
                  animate={dragOver ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="flex flex-col items-center gap-4 p-8 text-center"
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-200 ${dragOver ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {dragOver ? "Drop your PDF here" : "Upload your medical document"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Drag and drop or click to browse — PDF files only
                    </p>
                  </div>
                  <div className="px-6 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium shadow-sm group-hover:shadow-md transition-shadow">
                    Choose PDF
                  </div>
                </motion.div>
              </label>

              {uploadState === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm flex items-center gap-2"
                  data-testid="error-message"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </motion.div>
              )}
            </motion.div>
          ) : uploadState === "uploading" ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-64 gap-6 bg-card rounded-2xl border border-border p-8"
              data-testid="loading-state"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">Reading your document...</p>
                <p className="text-sm text-muted-foreground mt-1">GPT-4o is translating medical jargon into plain language</p>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          ) : result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-4"
              data-testid="result-card"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Analysis Complete</h2>
                  <p className="text-sm text-muted-foreground">{result.filename}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{result.language}</Badge>
                  <button
                    onClick={() => { setUploadState("idle"); setResult(null); }}
                    className="px-4 py-1.5 text-sm border border-border rounded-full hover:bg-muted/50 transition-colors"
                    data-testid="button-new-analysis"
                  >
                    New Analysis
                  </button>
                  <button
                    onClick={() => setLocation(`/report/${result.id}`)}
                    className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity shadow-sm"
                    data-testid="button-view-full-report"
                  >
                    Full Report
                  </button>
                </div>
              </div>

              {/* Summary */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-5 bg-primary/8 border border-primary/20 rounded-xl"
              >
                <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Summary</p>
                <p className="text-foreground leading-relaxed">{result.summary}</p>
              </motion.div>

              {/* Diagnosis */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="p-5 bg-card border border-border rounded-xl"
              >
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Diagnosis</p>
                <p className="text-foreground">{result.diagnosis}</p>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-4">
                {result.medications.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-5 bg-card border border-border rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Pill className="w-4 h-4 text-primary" />
                      <p className="text-sm font-semibold text-foreground">Medications</p>
                    </div>
                    <ul className="space-y-1.5">
                      {result.medications.map((m, i) => (
                        <li key={i} className="text-sm text-foreground/80 flex gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {result.warnings.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="p-5 bg-destructive/5 border border-destructive/15 rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <p className="text-sm font-semibold text-foreground">Warning Signs</p>
                    </div>
                    <ul className="space-y-1.5">
                      {result.warnings.map((w, i) => (
                        <li key={i} className="text-sm text-foreground/80 flex gap-2">
                          <span className="text-destructive mt-0.5">!</span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </div>

              {result.followupInstructions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-5 bg-card border border-border rounded-xl"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList className="w-4 h-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Follow-up Instructions</p>
                  </div>
                  <ul className="space-y-1.5">
                    {result.followupInstructions.map((f, i) => (
                      <li key={i} className="text-sm text-foreground/80 flex gap-2">
                        <span className="text-primary font-medium">{i + 1}.</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      {/* How it works */}
      {uploadState === "idle" && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-muted/30 border-t border-border/40 py-12 mt-auto"
        >
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">How it works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Upload, title: "Upload your PDF", desc: "Any medical document — discharge summary, lab results, clinical notes" },
                { icon: FileText, title: "GPT-4o reads it", desc: "Our AI extracts the key information and translates it into plain language" },
                { icon: ClipboardList, title: "Get your guide", desc: "Receive a clear summary with diagnosis, medications, and what to watch for" },
              ].map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex flex-col items-center text-center gap-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}
