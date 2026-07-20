import type { Metadata } from "next";

import { StoryIndex } from "@/components/story-index";
import { getPublicArticleSummaries } from "@/lib/articles";

export const metadata: Metadata = {
  title: "ILSP Columns",
  description: "The complete collection of Israel Sports Pulse analysis and opinion columns.",
};

export default function ColumnsPage() {
  const articles = getPublicArticleSummaries().filter((article) => article.kind === "analysis");
  return (
    <StoryIndex
      eyebrow="ILSP Columns"
      title="Every argument, in one place."
      introduction="Tactical, strategic, financial and cultural analysis stays accessible after the daily homepage selection changes."
      articles={articles}
    />
  );
}
