import { readFile } from "node:fs/promises";
import path from "node:path";

export type NewsroomStatus = {
  checkedAt: string | null;
  candidates: number;
  errors: number;
  primaryFeedsHealthy: boolean;
};

export async function getNewsroomStatus(): Promise<NewsroomStatus> {
  try {
    const raw = await readFile(path.join(process.cwd(), "data/ingestion-report.json"), "utf8");
    const report = JSON.parse(raw) as {
      finishedAt?: string;
      summary?: { candidates?: number; errors?: number };
      sources?: { id?: string; fetched?: boolean }[];
    };
    const primary = ["one", "sport5"].map((id) =>
      report.sources?.find((source) => source.id === id),
    );
    return {
      checkedAt: report.finishedAt ?? null,
      candidates: report.summary?.candidates ?? 0,
      errors: report.summary?.errors ?? 0,
      primaryFeedsHealthy: primary.every((source) => source?.fetched),
    };
  } catch {
    return { checkedAt: null, candidates: 0, errors: 0, primaryFeedsHealthy: false };
  }
}
