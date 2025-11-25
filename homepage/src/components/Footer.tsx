import React from "react";
import { useI18n } from "../locales/I18nProvider";
import { Link } from "./Link";

export const Footer: React.FC = () => {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  const columns = [
    {
      title: t.app.footer.columns.product.title,
      links: [{ label: t.app.nav.dashboard, href: "/dashboard" }],
    },
    {
      title: t.app.footer.columns.company.title,
      links: [
        { label: t.app.footer.columns.company.about, href: "#meista" },
        { label: t.app.footer.columns.company.blog, href: "#blogi" },
      ],
    },
  ];

  const contactItems = [
    {
      label: t.app.footer.contact.emailLabel,
      value: t.app.footer.contact.email,
      href: `mailto:${t.app.footer.contact.email}`,
    },
    {
      label: t.app.footer.contact.phoneLabel,
      value: t.app.footer.contact.phone,
      href: `tel:${t.app.footer.contact.phone.replace(/\s+/g, "")}`,
    },
  ];

  return (
    <footer className="relative mt-20 border-t border-slate-800/60 bg-gradient-to-b from-[#0f172a] via-[#111827] to-[#0b1120] text-slate-300">
      <div className="absolute inset-x-0 top-0 -translate-y-1/2">
        <div className="mx-auto h-px w-11/12 bg-gradient-to-r from-transparent via-brand-primary/50 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col gap-16">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-primary">
                {t.app.name}
              </span>
              <h2 className="mt-4 text-2xl font-semibold text-white">
                {t.app.footer.intro.tagline}
              </h2>
              <p className="mt-4 text-sm text-slate-300">
                {t.app.footer.intro.description}
              </p>
              <Link
                href={t.app.footer.intro.ctaHref}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-900 shadow-sm shadow-black/20 transition hover:bg-slate-200"
              >
                {t.app.footer.intro.ctaLabel}
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="flex flex-1 flex-col gap-10 sm:grid sm:grid-cols-2 lg:grid-cols-3">
              {columns.map((column) => (
                <div key={column.title}>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    {column.title}
                  </h3>
                  <ul className="mt-4 space-y-3 text-sm text-slate-300">
                    {column.links.map((item) => (
                      <li key={item.label}>
                        <Link href={item.href} className="text-slate-300">
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {t.app.footer.columns.support.title}
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-300">
                  {contactItems.map((item) => (
                    <li key={item.label}>
                      <span className="block text-xs uppercase tracking-wide text-slate-400">
                        {item.label}
                      </span>
                      <Link href={item.href} className="text-slate-200">
                        {item.value}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <span className="block text-xs uppercase tracking-wide text-slate-400">
                      {t.app.footer.contact.addressLabel}
                    </span>
                    <p className="text-slate-200">
                      {t.app.footer.contact.address}
                    </p>
                    <p className="text-xs text-slate-400">
                      {t.app.footer.contact.availability}
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-slate-800/60 pt-6 text-xs text-center text-slate-500">
          {t.app.footer.copyright(year)}
        </div>
      </div>
    </footer>
  );
};
