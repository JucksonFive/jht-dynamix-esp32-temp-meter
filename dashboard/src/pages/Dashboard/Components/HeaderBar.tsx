import React from "react";
import { useTranslation } from "react-i18next";

interface HeaderBarProps {
  actionsRight?: React.ReactNode;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ actionsRight }) => {
  const { t } = useTranslation();
  return (
    <header className="flex justify-between items-center mb-4 pb-4 border-b border-neutral-200 dark:border-[#2d2626]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-100 dark:bg-[#3d1a25] border border-primary-200 dark:border-[#4d2233] rounded-xl flex items-center justify-center text-primary-600 dark:text-[#f43f5e] text-xl animate-pulse-subtle">
          ▣
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-[#f5f0f0]">
            {t("appTitle")}
          </h1>
          <span className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-[#a39999]">
            Temperature Monitor v2.0
          </span>
        </div>
      </div>
      {actionsRight && (
        <div className="flex items-center gap-3">{actionsRight}</div>
      )}
    </header>
  );
};

export default HeaderBar;
