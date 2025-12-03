import React from "react";
import { useTranslation } from "react-i18next";
import { FaPlay, FaStop } from "react-icons/fa";
import { useAppContext } from "../../../../contexts/AppContext";

export const LiveToggle: React.FC = () => {
  const { t } = useTranslation();
  const { isLive, setLive, setIsLive } = useAppContext();

  return (
    <button
      onClick={() => (isLive ? setIsLive(false) : setLive())}
      className={`flex items-center justify-center w-7 h-7 rounded-full border transition-all ${
        isLive
          ? "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
          : "bg-green-800/80 border-green-800/20 text-neon-green hover:bg-green-800 shadow-[0_0_10px_rgba(74,222,128,0.2)]"
      }`}
      title={isLive ? t("stopLive") : t("startLive")}
    >
      {isLive ? <FaStop size={10} /> : <FaPlay size={10} className="ml-0.5" />}
    </button>
  );
};
