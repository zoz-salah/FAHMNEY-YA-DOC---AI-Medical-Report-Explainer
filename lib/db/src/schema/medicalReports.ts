import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const medicalReportsTable = pgTable("medical_reports", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalText: text("original_text").notNull().default(""),
  summary: text("summary").notNull().default(""),
  diagnosis: text("diagnosis").notNull().default(""),
  medications: jsonb("medications").$type<string[]>().notNull().default([]),
  followupInstructions: jsonb("followup_instructions").$type<string[]>().notNull().default([]),
  warnings: jsonb("warnings").$type<string[]>().notNull().default([]),
  language: text("language").notNull().default("English"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMedicalReportSchema = createInsertSchema(medicalReportsTable).omit({ id: true, createdAt: true });
export type InsertMedicalReport = z.infer<typeof insertMedicalReportSchema>;
export type MedicalReport = typeof medicalReportsTable.$inferSelect;
