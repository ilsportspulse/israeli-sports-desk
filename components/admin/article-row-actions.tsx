"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { id: string; status: "published" | "review"; compact?: boolean };

export function ArticleRowActions({ id, status, compact }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function action(kind: string) {
    setBusy(kind);
    try {
      if (kind === "delete") {
        if (!window.confirm("Delete this article permanently? This cannot be undone from the UI.")) {
          setBusy(null);
          return;
        }
        await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/admin/articles/${id}/actions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: kind }),
        });
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="row-actions">
      <a className="btn sm" href={`/admin/articles/${id}`}>Edit</a>
      {status === "review" ? (
        <button className="btn sm success" disabled={busy !== null} onClick={() => action("publish")}>
          {busy === "publish" ? "…" : "Publish"}
        </button>
      ) : (
        <button className="btn sm" disabled={busy !== null} onClick={() => action("reject")}>
          {busy === "reject" ? "…" : "Unpublish"}
        </button>
      )}
      {!compact && (
        <button className="btn sm" disabled={busy !== null} onClick={() => action("duplicate")}>
          {busy === "duplicate" ? "…" : "Duplicate"}
        </button>
      )}
      <button className="btn sm danger" disabled={busy !== null} onClick={() => action("delete")}>
        {busy === "delete" ? "…" : "Delete"}
      </button>
    </div>
  );
}
