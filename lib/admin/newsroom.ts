import { readData } from "@/lib/admin/persist";

// Reads the monitoring log the cloud runner writes each cycle (newest first).

export type NewsroomDecision = {
  slug?: string;
  title?: string;
  url?: string;
  confidence?: number;
  gate?: "pass" | "hold";
  decision: "published" | "review" | "duplicate" | "skipped" | "error";
  reason?: string;
};

export type NewsroomCycle = {
  ts: string;
  mode: string;
  model: string;
  candidates: number;
  published: number;
  review: number;
  skipped: number;
  gates: { confidenceMin: number; namecheckMin: number; autoPublish: boolean };
  decisions: NewsroomDecision[];
};

export async function getNewsroomLog(limit = 20): Promise<NewsroomCycle[]> {
  const log = await readData<NewsroomCycle[]>("data/newsroom-log.json", []);
  return log.slice(0, limit);
}
