import React, { useEffect, useRef, useState } from "react";

interface SlideBase {
  id: string;
  type: "image" | "video";
}
interface ImageSlide extends SlideBase {
  type: "image";
  src: string;
  alt: string;
}
interface VideoSlide extends SlideBase {
  type: "video";
  src: string;
  poster?: string;
}

type Slide = ImageSlide | VideoSlide;

const slides: Slide[] = [
  {
    id: "s1",
    type: "video",
    src: "/media/output.mp4",
  },
  {
    id: "s2",
    type: "video",
    src: "/media/rain.mp4",
  },
  {
    id: "s3",
    type: "video",
    src: "/media/couple_output.mp4",
  },
];

const INTERVAL = 6500;

export const MediaCarousel: React.FC<{
  background?: boolean;
  className?: string;
}> = ({ background = false, className = "" }) => {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, INTERVAL);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [index]);

  const baseClasses = background
    ? "absolute inset-0 w-full h-full overflow-hidden"
    : "relative w-full aspect-[4/3] md:aspect-[5/4] lg:aspect-[4/3] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card";

  return (
    <div className={`${baseClasses} ${className}`.trim()}>
      {slides.map((s, i) => {
        const isActive = i === index;
        return (
          <div
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
                key={s.src}
                className="w-full h-full object-cover"
                src={s.src}
                poster={s.poster}
                autoPlay
                playsInline
                muted
                loop
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
    </div>
  );
};
