import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import translationsJson from "@/data/content-translations.json";
import { getPublicArticleSummaries } from "@/lib/articles";
import { formatLocalizedArticleDate } from "@/lib/locales";
import { getArticleImage } from "@/lib/media";

import styles from "./hebrew-preview.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ישראל ספורטס פולס",
  description: "חדשות, תוצאות ופרשנות ספורט מישראל ומהעולם.",
  robots: { index: false, follow: false },
};

type HebrewTranslation = {
  articleId: string;
  locale: "he";
  title: string;
  dek: string;
  category: string;
};

export default function HebrewPreviewPage() {
  const translations = translationsJson.translations as HebrewTranslation[];
  const articlesById = new Map(
    getPublicArticleSummaries().map((article) => [article.id, article]),
  );
  const localizedStories = translations.flatMap((translation) => {
    const article = articlesById.get(translation.articleId);
    return article ? [{ article, translation }] : [];
  });
  const [lead, ...secondaryStories] = localizedStories;

  if (!lead) return null;

  const leadImage = getArticleImage(lead.article);

  return (
    <main className={styles.page} lang="he" dir="rtl">
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/he-preview" aria-label="ישראל ספורטס פולס">
            <Image
              alt="Israel Sports Pulse"
              height={64}
              priority
              src="/brand/ilsp-lockup.svg?v=4"
              unoptimized
              width={260}
            />
          </Link>
          <nav className={styles.nav} aria-label="ניווט ראשי">
            <a href="#stories">חדשות</a>
            <Link href="/scores">תוצאות</Link>
            <Link href="/world">עולם</Link>
            <Link href="/">English</Link>
          </nav>
        </div>
      </header>

      <div className={styles.pulseBar}>
        <div className={styles.pulseInner}>
          <span className={styles.liveDot} aria-hidden="true" />
          <strong>הדופק עכשיו</strong>
          <span>ארגנטינה תפגוש את ספרד בגמר המונדיאל ביום ראשון</span>
        </div>
      </div>

      <section className={styles.hero}>
        <Link className={styles.heroMedia} href={`/article/${lead.article.slug}`}>
          <Image
            alt={leadImage.alt}
            className={styles.backdrop}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 58vw"
            src={leadImage.src}
          />
          <Image
            alt={leadImage.alt}
            className={styles.fullImage}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 58vw"
            src={leadImage.src}
          />
        </Link>
        <div className={styles.heroCopy}>
          <span className={styles.category}>{lead.translation.category}</span>
          <h1>
            <Link href={`/article/${lead.article.slug}`}>{lead.translation.title}</Link>
          </h1>
          <p>{lead.translation.dek}</p>
          <div className={styles.meta}>
            <span>{formatLocalizedArticleDate(lead.article.publishedAt, "he", true)}</span>
            <span>{lead.article.readMinutes} דקות קריאה</span>
          </div>
        </div>
      </section>

      <section className={styles.scoreStrip} aria-label="המשחק הבא">
        <div>
          <span className={styles.scoreEyebrow}>גמר מונדיאל 2026</span>
          <strong>ארגנטינה</strong>
        </div>
        <div className={styles.fixtureCentre}>
          <span>יום ראשון</span>
          <b>גמר</b>
          <span>איסט רתרפורד</span>
        </div>
        <div>
          <strong>ספרד</strong>
          <Link href="/scores">למרכז התוצאות ←</Link>
        </div>
      </section>

      <section className={styles.latest} id="stories">
        <div className={styles.sectionHeading}>
          <div>
            <span>ILSP</span>
            <h2>הסיפורים החשובים</h2>
          </div>
          <Link href="/stories">לכל הכתבות ←</Link>
        </div>
        <div className={styles.storyGrid}>
          {secondaryStories.map(({ article, translation }) => {
            const image = getArticleImage(article);
            return (
              <article className={styles.card} key={article.id}>
                <Link className={styles.cardMedia} href={`/article/${article.slug}`}>
                  <Image
                    alt={image.alt}
                    className={styles.backdrop}
                    fill
                    sizes="(max-width: 720px) 100vw, 33vw"
                    src={image.src}
                  />
                  <Image
                    alt={image.alt}
                    className={styles.fullImage}
                    fill
                    sizes="(max-width: 720px) 100vw, 33vw"
                    src={image.src}
                  />
                </Link>
                <div className={styles.cardBody}>
                  <span className={styles.category}>{translation.category}</span>
                  <h3>
                    <Link href={`/article/${article.slug}`}>{translation.title}</Link>
                  </h3>
                  <p>{translation.dek}</p>
                  <span className={styles.cardDate}>
                    {formatLocalizedArticleDate(article.publishedAt, "he", true)}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <footer className={styles.footer}>
        <Image
          alt="Israel Sports Pulse"
          height={46}
          src="/brand/ilsp-lockup-white.svg?v=4"
          unoptimized
          width={210}
        />
        <p>הספורט הישראלי. בזמן אמת.</p>
        <Link href="/">לאתר באנגלית</Link>
      </footer>
    </main>
  );
}
