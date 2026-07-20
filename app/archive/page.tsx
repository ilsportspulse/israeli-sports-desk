import type { Metadata } from "next";

import { StoryIndex } from "@/components/story-index";
import { getPublicArticleSummaries } from "@/lib/articles";

export const metadata: Metadata = {
  title: "From the Archive",
  description: "Every Israel Sports Pulse daily historical feature, preserved in one permanent collection.",
};

export default function ArchivePage() {
  const articles = getPublicArticleSummaries().filter((article) => article.category === "From the Archive");
  return (
    <StoryIndex
      eyebrow="One beautiful story every day"
      title="Israeli sporting history, collected."
      introduction="The newest feature leads the homepage, while every previous edition remains here as part of a growing daily history of Israeli sport."
      articles={articles}
    />
  );
}
