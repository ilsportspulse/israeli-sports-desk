import { Suspense } from "react";

import { ScoreCentre } from "@/components/score-centre";
import { getScoreCentreData } from "@/lib/sports-data";

export const dynamic = "force-dynamic";

export default async function ScoresPage() {
  const data = await getScoreCentreData();
  return (
    <Suspense>
      <ScoreCentre initialData={data} />
    </Suspense>
  );
}
