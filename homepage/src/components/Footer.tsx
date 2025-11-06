import React from "react";
import { useI18n } from "../locales/I18nProvider";
import { Link } from "./Link";

const LinkedinIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-5 w-5"
    aria-hidden="true"
  >
    <path d="M4.98 3.5a2.5 2.5 0 1 1-.02 5 2.5 2.5 0 0 1 .02-5Zm.02 5.75H2V21h3V9.25Zm5 0H7V21h3v-5.8c0-1.54.41-2.42 1.66-2.42 1.27 0 1.35 1.04 1.35 2.5V21h3v-6.27c0-3.02-.64-5.23-4.08-5.23-1.66 0-2.78.91-3.24 1.77h-.04l-.17-1.52Z" />
  </svg>
);

const GithubIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-5 w-5"
    aria-hidden="true"
  >
    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.24.79-.54v-1.88c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.26-1.68-1.26-1.68-1.03-.7.08-.68.08-.68 1.14.08 1.75 1.17 1.75 1.17 1.01 1.72 2.66 1.22 3.31.93.1-.73.4-1.22.72-1.5-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.29 1.16-3.1-.12-.29-.51-1.47.11-3.06 0 0 .96-.31 3.14 1.18a10.78 10.78 0 0 1 5.72 0c2.18-1.49 3.14-1.18 3.14-1.18.62 1.59.23 2.77.11 3.06.72.81 1.16 1.84 1.16 3.1 0 4.41-2.68 5.38-5.24 5.67.41.35.77 1.04.77 2.1v3.11c0 .3.21.65.8.54A11.5 11.5 0 0 0 12 .5Z" />
  </svg>
);

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
      </div>
    </footer>
  );
};
