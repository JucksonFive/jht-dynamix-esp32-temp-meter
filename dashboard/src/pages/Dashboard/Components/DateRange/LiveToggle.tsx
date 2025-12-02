import React from "react";
import { useTranslation } from "react-i18next";
import { useAppContext } from "../../../../contexts/AppContext";

export const LiveToggle: React.FC = () => {
  const { t } = useTranslation();
  const { isLive, setLive, setIsLive } = useAppContext();

  return isLive ? (
    <button
      onClick={() => setIsLive(false)}
      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neon-green/10 border border-neon-green/20 hover:bg-neon-green/20 transition-colors cursor-pointer"
      title={t("pauseLive") || "Pause Live Updates"}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
      <span className="text-[10px] font-bold text-neon-green tracking-wider">
        LIVE
      </span>
    </button>
  ) : (
    <button
      onClick={setLive}
      className="text-[10px] font-bold text-neon-purple hover:text-neon-purple/80 transition-colors uppercase tracking-wider"
    >
      {t("resetToLive") || "Reset to Live"}
    </button>
  );
};
