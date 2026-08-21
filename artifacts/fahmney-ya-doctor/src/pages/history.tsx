import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import {
  useListReports,
  getListReportsQueryKey,
  useDeleteReport,
  getGetMedicalStatsQueryKey,
} from "@workspace/api-client-react";
import { FileText, Trash2, Clock, ChevronRight, BarChart2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function History() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: reports, isLoading } = useListReports({
    query: { queryKey: getListReportsQueryKey() },
  });

  const deleteMutation = useDeleteReport({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListReportsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMedicalStatsQueryKey() });
        toast({ title: "Report deleted" });
      },
    },
  });

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMutation.mutate({ id });
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 flex-1">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Past Reports</h1>
            <p className="text-muted-foreground text-sm mt-1">Your analyzed medical documents</p>
          </div>
          <button
            onClick={() => setLocation("/")}
            className="px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium shadow-sm hover:opacity-90 transition-opacity"
            data-testid="button-new-analysis"
          >
            New Analysis
          </button>
        </div>

        {isLoading ? (
          <div className="grid gap-3" data-testid="loading-skeleton">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : !reports || reports.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-4 text-center"
            data-testid="empty-state"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <BarChart2 className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">No reports yet</h2>
              <p className="text-muted-foreground text-sm mt-1">Upload your first medical document to get started</p>
            </div>
            <button
              onClick={() => setLocation("/")}
              className="mt-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium shadow-sm hover:opacity-90 transition-opacity"
            >
              Upload a Document
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-3">
            {reports.map((report, i) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setLocation(`/report/${report.id}`)}
                className="group flex items-center gap-4 p-5 bg-card border border-border rounded-xl cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all duration-200"
                data-testid={`card-report-${report.id}`}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{report.filename}</p>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">{report.diagnosis}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDate(report.createdAt)}
                    </span>
                    <Badge variant="secondary" className="text-xs">{report.language}</Badge>
                    {report.medications.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {report.medications.length} medication{report.medications.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => handleDelete(report.id, e)}
                    disabled={deleteMutation.isPending}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
                    data-testid={`button-delete-report-${report.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
