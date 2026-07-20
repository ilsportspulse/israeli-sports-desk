import { ArticleEditor } from "@/components/admin/article-editor";

export const dynamic = "force-dynamic";

// Static segment "new" resolves before the dynamic [id] route.
export default function NewArticlePage() {
  return (
    <ArticleEditor
      mode="new"
      initial={{
        title: "",
        dek: "",
        category: "Israeli Football",
        desk: "israel",
        kind: "news",
        theme: "night-pitch",
        status: "review",
        readMinutes: 3,
        body: [""],
        facts: [],
        verificationSources: [],
        source: { name: "", url: "" },
      }}
    />
  );
}
