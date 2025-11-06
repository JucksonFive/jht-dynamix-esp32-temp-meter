import { BarChart3, Cog, Lock, Shield } from "lucide-react";
import { useI18n } from "../locales/I18nProvider";
import { FeatureCard } from "./FeatureCard";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: Shield,
  lock: Lock,
  cog: Cog,
  chart: BarChart3,
};

export const Features: React.FC = () => {
  const { t } = useI18n();
  const featureData = t.app.features.list;

  return (
    <section id="ominaisuudet" className="relative py-24">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-white" />
      <div className="relative mx-auto max-w-7xl px-6">
        <h2 className="mb-14 text-center text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          {t.app.features.heading}
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featureData.map((f: any) => {
            const Icon = ICONS[f.icon] ?? Shield;
            return (
              <FeatureCard
                key={f.title}
                title={f.title}
                desc={f.desc}
                icon={<Icon className="h-5 w-5" />}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};
