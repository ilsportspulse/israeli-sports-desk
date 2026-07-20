import Image from "next/image";

import type { MediaAsset, StoryTheme } from "@/lib/types";

type StoryVisualProps = {
  theme: StoryTheme;
  label: string;
  priority?: boolean;
  image?: MediaAsset;
};

export function StoryVisual({ theme, label, priority, image }: StoryVisualProps) {
  if (image) {
    // Portrait photographs are almost always player/person shots: keep the
    // face in frame by focusing the crop near the top. Landscape images
    // (stadiums, action) stay centred.
    const isPortrait = Boolean(image.width && image.height && image.height > image.width * 1.02);
    const focus = isPortrait ? "center 14%" : "center 45%";
    return (
      <figure className={`story-visual story-photo visual-${theme}`}>
        <Image
          src={image.src}
          alt=""
          fill
          priority={priority}
          unoptimized={image.src.endsWith(".svg")}
          aria-hidden="true"
          className="story-photo-backdrop"
          sizes={priority ? "(max-width: 760px) 100vw, 64vw" : "(max-width: 760px) 42vw, 28vw"}
        />
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority={priority}
          unoptimized={image.src.endsWith(".svg")}
          className="story-photo-image"
          style={{ objectPosition: focus }}
          sizes={priority ? "(max-width: 760px) 100vw, 64vw" : "(max-width: 760px) 42vw, 28vw"}
        />
      </figure>
    );
  }

  return (
    <div className={`story-visual visual-${theme}`} aria-hidden="true">
      <div className="visual-grid" />
      <div className="visual-orbit visual-orbit-one" />
      <div className="visual-orbit visual-orbit-two" />
      <div className="visual-ball" />
      {priority ? <div className="visual-silhouette" /> : null}
      <span className="visual-label">{label}</span>
      <span className="visual-watermark">ILSP</span>
    </div>
  );
}
