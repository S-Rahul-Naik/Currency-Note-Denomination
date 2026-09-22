import type { DetectionRecord } from "@/types";

export const MOCK_HISTORY: DetectionRecord[] = [
  // ── Today's entries (2026-09-14) ──────────────────────────────────────────
  { id: "t1",  currency: "INR", denomination: 500,  confidence: 0.97, status: "success",         source: "camera",            createdAt: "2026-09-14T08:32:00Z" },
  { id: "t2",  currency: "INR", denomination: 100,  confidence: 0.94, status: "success",         source: "camera",            createdAt: "2026-09-14T09:10:00Z" },
  { id: "t3",  currency: "USD", denomination: 50,   confidence: 0.62, status: "low_confidence",   source: "camera",            createdAt: "2026-09-14T10:05:00Z" },
  { id: "t4",  currency: "INR", denomination: 500,  confidence: 0.91, status: "success",         source: "counterfeit_check", counterfeitVerdict: "authentic",   createdAt: "2026-09-14T11:20:00Z" },
  { id: "t5",  currency: "INR", denomination: 2000, confidence: 0.53, status: "success",         source: "counterfeit_check", counterfeitVerdict: "suspicious",  createdAt: "2026-09-14T12:45:00Z" },
  // ── Counterfeit check entries ─────────────────────────────────────────────
  { id: "cf1", currency: "INR", denomination: 500,  confidence: 0.96, status: "success", source: "counterfeit_check", counterfeitVerdict: "authentic",   createdAt: "2026-09-09T10:30:00Z" },
  { id: "cf2", currency: "USD", denomination: 100,  confidence: 0.58, status: "success", source: "counterfeit_check", counterfeitVerdict: "suspicious",   createdAt: "2026-09-09T09:15:00Z" },
  { id: "cf3", currency: "EUR", denomination: 50,   confidence: 0.34, status: "success", source: "counterfeit_check", counterfeitVerdict: "counterfeit",  createdAt: "2026-09-08T15:20:00Z" },
  // ── Regular detection entries ─────────────────────────────────────────────
  { id: "h1",  currency: "INR", denomination: 500,  confidence: 0.96, status: "success",         source: "camera", createdAt: "2026-09-08T09:14:00Z" },
  { id: "h2",  currency: "USD", denomination: 20,   confidence: 0.93, status: "wrong_currency",   source: "camera", createdAt: "2026-09-08T08:52:00Z" },
  { id: "h3",  currency: "INR", denomination: 100,  confidence: 0.61, status: "low_confidence",   source: "camera", createdAt: "2026-09-07T21:30:00Z" },
  { id: "h4",  currency: "EUR", denomination: 50,   confidence: 0.98, status: "success",         source: "camera", createdAt: "2026-09-07T18:05:00Z" },
  { id: "h5",  currency: "INR", denomination: 2000, confidence: 0.89, status: "success",         source: "manual", createdAt: "2026-09-07T12:44:00Z" },
  { id: "h6",  currency: "PHP", denomination: 1000, confidence: 0.9,  status: "success",         source: "camera", createdAt: "2026-09-06T16:19:00Z" },
];