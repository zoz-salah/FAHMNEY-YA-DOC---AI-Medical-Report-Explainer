import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetReport, getGetReportQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, Download, Pill, AlertTriangle, ClipboardList, Calendar, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function downloadPDF(report: {
  filename: string;
  summary: string;
  diagnosis: string;
  medications: string[];
  followupInstructions: string[];
  warnings: string[];
  language: string;
  createdAt: string;
}) {
  import("jspdf").then(({ jsPDF }) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentW = pageW - margin * 2;
    let y = 20;

    const addSection = (title: string, lines: string[], accent: [number, number, number]) => {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFillColor(...accent);
      doc.roundedRect(margin, y, contentW, 8, 2, 2, "F");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(title.toUpperCase(), margin + 4, y + 5.5);
      y += 12;
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      lines.forEach(line => {
        const wrapped = doc.splitTextToSize(line, contentW - 4);
        wrapped.forEach((l: string) => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(l, margin + 4, y);
          y += 6;
        });
        y += 2;
      });
      y += 6;
    };

    // Header
    doc.setFillColor(30, 95, 95);
    doc.rect(0, 0, pageW, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Fahmney Ya Doctor", margin, 18);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Plain-Language Medical Guide", margin, 26);
    doc.text(`Generated: ${formatDate(report.createdAt)}`, margin, 33);
    y = 52;

    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    const nameLines = doc.splitTextToSize(report.filename, contentW);
    doc.text(nameLines, margin, y);
    y += nameLines.length * 7 + 8;

    addSection("Summary", [report.summary], [30, 95, 95]);
    addSection("Diagnosis", [report.diagnosis], [50, 120, 110]);

    if (report.medications.length > 0) {
      addSection("Medications", report.medications.map(m => `• ${m}`), [70, 100, 140]);
    }
    if (report.followupInstructions.length > 0) {
      addSection("Follow-up Instructions", report.followupInstructions.map((f, i) => `${i + 1}. ${f}`), [80, 110, 80]);
    }
    if (report.warnings.length > 0) {
      addSection("Warning Signs — Seek Medical Attention", report.warnings.map(w => `! ${w}`), [180, 70, 70]);
    }

    const docName = report.filename.replace(/\.pdf$/i, "");
    doc.save(`${docName}_guide.pdf`);
  });
}

export default function ReportDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const id = Number(params.id);

  const { data: report, isLoading, error } = useGetReport(id, {
    query: { queryKey: getGetReportQueryKey(id), enabled: !!id },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-10 flex-1" data-testid="loading-skeleton">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-32 w-full rounded-xl mb-4" />
        <Skeleton className="h-24 w-full rounded-xl mb-4" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-10 flex-1 flex flex-col items-center justify-center gap-4" data-testid="error-state">
        <FileText className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Report not found</h2>
        <button onClick={() => setLocation("/history")} className="text-primary text-sm underline">
          Back to history
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 flex-1">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <button
              onClick={() => setLocation("/history")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to history
            </button>
            <h1 className="text-xl font-bold text-foreground break-all">{report.filename}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(report.createdAt)}
              </span>
              <Badge variant="secondary">{report.language}</Badge>
            </div>
          </div>
          <button
            onClick={() => downloadPDF(report)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium shadow-sm hover:opacity-90 transition-opacity shrink-0"
            data-testid="button-download-pdf"
          >
            <Download className="w-4 h-4" />
            Download Guide
          </button>
        </div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 bg-primary/8 border border-primary/20 rounded-xl"
          data-testid="section-summary"
        >
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Summary</p>
          <p className="text-foreground leading-relaxed">{report.summary}</p>
        </motion.div>

        {/* Diagnosis */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-5 bg-card border border-border rounded-xl"
          data-testid="section-diagnosis"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Diagnosis</p>
          <p className="text-foreground text-lg">{report.diagnosis}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Medications */}
          {report.medications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-5 bg-card border border-border rounded-xl"
              data-testid="section-medications"
            >
              <div className="flex items-center gap-2 mb-3">
                <Pill className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Medications</p>
                <Badge variant="secondary" className="ml-auto text-xs">{report.medications.length}</Badge>
              </div>
              <ul className="space-y-2">
                {report.medications.map((m, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                    className="text-sm text-foreground/85 flex gap-2 leading-snug"
                  >
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <span>{m}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Warnings */}
          {report.warnings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="p-5 bg-destructive/5 border border-destructive/15 rounded-xl"
              data-testid="section-warnings"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <p className="text-sm font-semibold text-foreground">Warning Signs</p>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Seek medical attention if you experience:</p>
              <ul className="space-y-2">
                {report.warnings.map((w, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.06 }}
                    className="text-sm text-foreground/85 flex gap-2 leading-snug"
                  >
                    <span className="text-destructive font-bold mt-0.5">!</span>
                    <span>{w}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>

        {/* Follow-up Instructions */}
        {report.followupInstructions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-5 bg-card border border-border rounded-xl"
            data-testid="section-followup"
          >
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Follow-up Instructions</p>
            </div>
            <ol className="space-y-2">
              {report.followupInstructions.map((f, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  className="text-sm text-foreground/85 flex gap-3 leading-snug"
                >
                  <span className="text-primary font-semibold shrink-0 mt-0.5">{i + 1}.</span>
                  <span>{f}</span>
                </motion.li>
              ))}
            </ol>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
