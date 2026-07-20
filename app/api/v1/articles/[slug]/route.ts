import { NextResponse } from "next/server";

import { getArticle, toPublicArticle } from "@/lib/articles";
import { getArticleImage } from "@/lib/media";

export const dynamic = "force-dynamic";

type RouteContext = { params: { slug: string } };

export function GET(_request: Request, { params }: RouteContext) {
  const article = getArticle(params.slug);
  if (!article) {
    return NextResponse.json(
      {
        schemaVersion: "1.0",
        generatedAt: new Date().toISOString(),
        data: null,
        meta: { locale: "en", timezone: "Asia/Jerusalem" },
      },
      { status: 404 },
    );
  }

  const publicArticle = toPublicArticle(article);
  const image = getArticleImage(article);
  return NextResponse.json(
    {
      schemaVersion: "1.0",
      generatedAt: new Date().toISOString(),
      data: {
        schemaVersion: "1.0",
        id: publicArticle.id,
        slug: publicArticle.slug,
        locale: "en",
        status: "published",
        title: publicArticle.title,
        dek: publicArticle.dek,
        category: publicArticle.category,
        kind: publicArticle.kind,
        publishedAt: publicArticle.publishedAt,
        readMinutes: publicArticle.readMinutes,
        media: {
          src: image.src,
          alt: image.alt,
          caption: image.caption,
          credit: image.credit,
          creditUrl: image.creditUrl,
          license: image.license,
          licenseUrl: image.licenseUrl,
        },
        body: publicArticle.body,
        facts: publicArticle.facts,
        matchRecap: publicArticle.matchRecap,
        basketballRecap: publicArticle.basketballRecap,
      },
      meta: { locale: "en", timezone: "Asia/Jerusalem" },
    },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" } },
  );
}
