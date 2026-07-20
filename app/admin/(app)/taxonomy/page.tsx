import { TaxonomyEditor } from "@/components/admin/taxonomy-editor";
import { getTaxonomy } from "@/lib/admin/taxonomy";

export const dynamic = "force-dynamic";

export default async function TaxonomyPage() {
  const taxonomy = await getTaxonomy();
  return <TaxonomyEditor initial={taxonomy} />;
}
