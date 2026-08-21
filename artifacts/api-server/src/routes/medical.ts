import { Router } from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import { db } from "@workspace/db";
import { medicalReportsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { GetReportParams, DeleteReportParams } from "@workspace/api-zod";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const SYSTEM_PROMPT = `You are a compassionate medical document translator. Your job is to convert complex medical discharge summaries, lab reports, and clinical documents into clear, plain-language explanations that any patient can understand.

Given a medical document, respond ONLY with a valid JSON object (no markdown, no code fences) with this exact structure:
{
  "summary": "A 2-3 sentence overview of what happened and what the patient should know",
  "diagnosis": "The main condition(s) in simple terms",
  "medications": ["Medication 1: purpose and how to take it", "Medication 2: ..."],
  "followupInstructions": ["Instruction 1", "Instruction 2", ...],
  "warnings": ["Warning sign 1 to watch for", "Warning sign 2 to watch for", ...],
  "language": "English"
}

Use simple, friendly, reassuring language. Avoid medical jargon. If you must use a medical term, explain it in parentheses.`;

router.post("/analyze", upload.single("pdf"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No PDF file uploaded" });
    return;
  }

  const filename = req.file.originalname;

  try {
    const parsed = await pdfParse(req.file.buffer);
    const text = parsed.text?.trim();

    if (!text || text.length < 50) {
      res.status(422).json({ error: "Could not extract text from this PDF. Please ensure it is not a scanned image without OCR." });
      return;
    }

    const truncatedText = text.slice(0, 12000);

    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 2048,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Medical document:\n\n${truncatedText}` },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed2: {
      summary?: string;
      diagnosis?: string;
      medications?: string[];
      followupInstructions?: string[];
      warnings?: string[];
      language?: string;
    };
    try {
      parsed2 = JSON.parse(raw);
    } catch {
      parsed2 = { summary: raw };
    }

    const [report] = await db.insert(medicalReportsTable).values({
      filename,
      originalText: truncatedText,
      summary: parsed2.summary ?? "No summary available",
      diagnosis: parsed2.diagnosis ?? "Not specified",
      medications: parsed2.medications ?? [],
      followupInstructions: parsed2.followupInstructions ?? [],
      warnings: parsed2.warnings ?? [],
      language: parsed2.language ?? "English",
    }).returning();

    res.json({
      id: report.id,
      filename: report.filename,
      summary: report.summary,
      diagnosis: report.diagnosis,
      medications: report.medications,
      followupInstructions: report.followupInstructions,
      warnings: report.warnings,
      language: report.language,
      createdAt: report.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to analyze PDF");
    res.status(500).json({ error: "Failed to analyze document. Please try again." });
  }
});

router.get("/reports", async (req, res) => {
  const reports = await db
    .select()
    .from(medicalReportsTable)
    .orderBy(desc(medicalReportsTable.createdAt));

  res.json(reports.map(r => ({
    id: r.id,
    filename: r.filename,
    summary: r.summary,
    diagnosis: r.diagnosis,
    medications: r.medications,
    followupInstructions: r.followupInstructions,
    warnings: r.warnings,
    language: r.language,
    createdAt: r.createdAt.toISOString(),
  })));
});

router.get("/reports/:id", async (req, res) => {
  const params = GetReportParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [report] = await db
    .select()
    .from(medicalReportsTable)
    .where(eq(medicalReportsTable.id, params.data.id));

  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.json({
    id: report.id,
    filename: report.filename,
    summary: report.summary,
    diagnosis: report.diagnosis,
    medications: report.medications,
    followupInstructions: report.followupInstructions,
    warnings: report.warnings,
    language: report.language,
    createdAt: report.createdAt.toISOString(),
  });
});

router.delete("/reports/:id", async (req, res) => {
  const params = DeleteReportParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [deleted] = await db
    .delete(medicalReportsTable)
    .where(eq(medicalReportsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.json({ success: true });
});

router.get("/stats", async (req, res) => {
  const [totalRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(medicalReportsTable);

  const [recentRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(medicalReportsTable)
    .where(sql`created_at > now() - interval '7 days'`);

  const langRows = await db
    .select({
      language: medicalReportsTable.language,
      count: sql<number>`count(*)::int`,
    })
    .from(medicalReportsTable)
    .groupBy(medicalReportsTable.language)
    .orderBy(sql`count(*) desc`)
    .limit(5);

  res.json({
    totalReports: totalRow?.count ?? 0,
    recentReports: recentRow?.count ?? 0,
    topLanguages: langRows.map(r => ({ language: r.language, count: r.count })),
  });
});

export default router;
