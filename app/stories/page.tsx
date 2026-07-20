import type { Metadata } from "next";

import { StoryIndex } from "@/components/story-index";
import { getPublicArticleSummaries } from "@/lib/articles";

export const metadata: Metadata = {
  title: "All stories",
  description: "Every published Israel Sports Pulse report, feature and column in one permanent chronological index.",
};

export default function StoriesPage() {
  return (
    <StoryIndex
      eyebrow="The complete desk"
      title="Every ILSP story, always available."
      introduction="Browse every published report, feature and column from Israel Sports Pulse. New homepage priorities never remove earlier journalism from this index."
      articles={getPublicArticleSummaries()}
    />
  );
}
