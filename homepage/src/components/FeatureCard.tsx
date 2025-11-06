export const FeatureCard: React.FC<{
  title: string;
  desc: string;
  icon: React.ReactNode;
}> = ({ title, desc, icon }) => {
  return (
    <div
      className="
        group relative rounded-2xl
        transition-transform duration-300 ease-out
        hover:-translate-y-1 hover:shadow-xl
      "
    >
      {/* gradient border on hover */}
      <div
        className="
          absolute inset-0 -z-10 rounded-2xl
          bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/20 to-rose-500/20
          opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-100
        "
      />
      <div
        className="
          relative h-full rounded-2xl border border-slate-200/70 bg-white/70
          p-6 shadow-sm backdrop-blur
        "
      >
        {/* subtle inner border */}
        <div
          className="
            pointer-events-none absolute inset-0 rounded-2xl
            ring-1 ring-inset ring-white/60
          "
          aria-hidden
        />

        {/* icon */}
        <div
          className="
            mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl
            bg-gradient-to-br from-slate-100 to-white
            ring-1 ring-slate-200/80 shadow-sm
          "
          aria-hidden
        >
          <span className="text-2xl">{icon}</span>
        </div>

        <h3 className="mb-2 text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm leading-6 text-slate-600">{desc}</p>

        {/* hover glow accent */}
        <div
          className="
            pointer-events-none absolute -bottom-8 left-1/2 h-10 w-2/3 -translate-x-1/2
            rounded-full bg-gradient-to-r from-indigo-500/20 via-fuchsia-500/20 to-rose-500/20
            opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100
          "
          aria-hidden
        />
      </div>
    </div>
  );
};
