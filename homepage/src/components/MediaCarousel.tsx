import React, { RefCallback, useEffect, useRef, useState } from "react";

interface SlideBase {
  id: string;
  type: "image" | "video";
}
interface ImageSlide extends SlideBase {
  type: "image";
  src: string;
  alt: string;
  durationMs?: number;
}
interface VideoSlide extends SlideBase {
  type: "video";
  src: string;
  poster?: string;
}
type Slide = ImageSlide | VideoSlide;

const FALLBACK_POSTER = "/glowing_data_poster.jpg";

const slides: Slide[] = [
  {
    id: "s1",
    type: "video",
    src: "/glowing_data.mp4",
    poster: "/glowing_data_poster.jpg",
  },
  {
    id: "s2",
    type: "video",
    src: "/construction_site.mp4",
  },
  {
    id: "s3",
    type: "video",
    src: "/couple_output.mp4",
  },

  { id: "s4", type: "video", src: "/rain.mp4" },
];

const FADE_MS = 600;
const MIN_MS = 1200;

export const MediaCarousel: React.FC<{
  background?: boolean;
  className?: string;
}> = ({ background = false, className = "" }) => {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const timerRef = useRef<number | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const durations = useRef<Record<string, number>>({});

  const next = () => setIndex((i) => (i + 1) % slides.length);

  const schedule = (ms: number) => {
    if (timerRef.current) globalThis.clearTimeout(timerRef.current!);
    timerRef.current = globalThis.setTimeout(next, ms);
  };
  const clearAllTimers = () => {
    if (timerRef.current) globalThis.clearTimeout(timerRef.current!);
    if (fadeTimerRef.current) globalThis.clearTimeout(fadeTimerRef.current!);
    timerRef.current = null;
    fadeTimerRef.current = null;
  };

  useEffect(() => {
    clearAllTimers();

    for (const [i, s] of slides.entries()) {
      if (s.type !== "video") continue;
      const v = videoRefs.current[s.id];
      if (!v) continue;

      if (i === index) {
        try {
          v.currentTime = 0;
        } catch {}
        v.muted = true;
        (v as any).playsInline = true;
        if (loaded[s.id]) v.play().catch(() => {});
      } else {
        v.pause();
      }
    }

    const active = slides[index];
    let ms: number;
    if (active.type === "image") {
      ms = Math.max(active.durationMs ?? 5000, MIN_MS);
    } else {
      const durSec = durations.current[active.id];
      const raw = durSec ? durSec * 1000 : 6500;
      ms = Math.max(raw - FADE_MS, MIN_MS);
    }

    fadeTimerRef.current = globalThis.setTimeout(() => {
      const el = document.getElementById(`slide-${active.id}`);
      if (el) el.classList.add("fading");
    }, Math.max(ms - FADE_MS, 0));

    schedule(ms);
    return clearAllTimers;
  }, [index, loaded]);

  useEffect(() => () => clearAllTimers(), []);

  const baseClasses = background
    ? "absolute inset-0 w-full h-full overflow-hidden"
    : "relative w-full aspect-[4/3] md:aspect-[5/4] lg:aspect-[4/3] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card";

  const setVideoRef =
    (id: string): RefCallback<HTMLVideoElement> =>
    (el) => {
      videoRefs.current[id] = el;
    };

  return (
    <div className={`${baseClasses} ${className}`.trim()}>
      {slides.map((s, i) => {
        const isActive = i === index;
        const vidLoaded = s.type === "video" ? !!loaded[s.id] : true;

        return (
          <div
            id={`slide-${s.id}`}
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={!isActive}
          >
            {/* Poster-kerros: näkyy kunnes video on ladattu */}
            {s.type === "video" && (
              <img
                alt=""
                aria-hidden="true"
                src={s.poster ?? FALLBACK_POSTER}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  vidLoaded ? "opacity-0" : "opacity-100"
                }`}
              />
            )}

            {s.type === "video" ? (
              <video
                ref={setVideoRef(s.id)}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  vidLoaded ? "opacity-100" : "opacity-0"
                }`}
                src={s.src}
                poster={s.poster ?? FALLBACK_POSTER}
                playsInline
                muted
                preload="metadata"
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  durations.current[s.id] = Number.isFinite(v.duration)
                    ? v.duration
                    : 0;
                }}
                onLoadedData={(e) => {
                  setLoaded((prev) => ({ ...prev, [s.id]: true }));
                  if (isActive) e.currentTarget.play().catch(() => {});
                }}
                onEnded={next}
                onError={() => {
                  console.warn("Failed to load video", s.id, s.src);
                  if (slides.length > 1) next();
                }}
              />
            ) : (
              <img
                alt={s.alt}
                src={s.src}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        );
      })}

      {!background && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index
                  ? "bg-brand-primary w-8"
                  : "bg-gray-300 w-2 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      <style>{`
        #slide-${slides[index].id}.fading { opacity: 0.0; transition: opacity ${FADE_MS}ms ease-out; }
      `}</style>
    </div>
  );
};
