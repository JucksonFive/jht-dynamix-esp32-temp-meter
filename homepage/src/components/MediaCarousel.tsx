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

const slides: Slide[] = [
  { id: "s1", type: "video", src: "/media/output.mp4" },
  { id: "s2", type: "video", src: "/media/rain.mp4" },
  { id: "s3", type: "video", src: "/media/couple_output.mp4" },
];

const IMAGE_MS = 5000;
const FADE_MS = 600;
const MIN_MS = 1200;

export const MediaCarousel: React.FC<{
  background?: boolean;
  className?: string;
}> = ({ background = false, className = "" }) => {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<number | null>(null);
  const fadeTimerRef = useRef<number | null>(null);

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const durations = useRef<Record<string, number>>({});

  const next = () => setIndex((i) => (i + 1) % slides.length);

  const schedule = (ms: number) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(next, ms);
  };

  const clearAllTimers = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (fadeTimerRef.current) window.clearTimeout(fadeTimerRef.current);
    timerRef.current = null;
    fadeTimerRef.current = null;
  };

  useEffect(() => {
    clearAllTimers();

    slides.forEach((s, i) => {
      if (s.type !== "video") return;
      const v = videoRefs.current[s.id];
      if (!v) return;
      if (i === index) {
        try {
          v.currentTime = 0;
        } catch {}
        v.muted = true;
        v.playsInline = true as any;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });

    const active = slides[index];
    let ms: number;

    if (active.type === "image") {
      const imgMs = active.durationMs ?? IMAGE_MS;
      ms = Math.max(imgMs, MIN_MS);
    } else {
      const durSec = durations.current[active.id];

      const fallback = 6500;
      const raw = durSec ? durSec * 1000 : fallback;
      ms = Math.max(raw - FADE_MS, MIN_MS);
    }

    fadeTimerRef.current = window.setTimeout(() => {
      const el = document.getElementById(`slide-${active.id}`);
      if (el) el.classList.add("fading");
    }, Math.max(ms - FADE_MS, 0));

    schedule(ms);

    return clearAllTimers;
  }, [index]);

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
        return (
          <div
            id={`slide-${s.id}`}
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              isActive ? "opacity-100" : "opacity-0"
            } flex items-center justify-center`}
            aria-hidden={!isActive}
          >
            {s.type === "image" ? (
              <img
                src={s.src}
                alt={s.alt}
                className="w-full h-full object-cover object-center select-none"
                draggable={false}
              />
            ) : (
              <video
                ref={setVideoRef(s.id)}
                className="w-full h-full object-cover"
                src={s.src}
                poster={s.poster}
                autoPlay
                playsInline
                muted
                preload="auto"
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  durations.current[s.id] = isFinite(v.duration)
                    ? v.duration
                    : 0;
                }}
                onEnded={() => {
                  next();
                }}
              />
            )}
          </div>
        );
      })}

      {!background && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
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
        /* Kun .fading lisätään aktiiviseen slidiin hieman ennen loppua */
        #slide-${slides[index].id}.fading { opacity: 0.0; transition: opacity ${FADE_MS}ms ease-out; }
      `}</style>
    </div>
  );
};
