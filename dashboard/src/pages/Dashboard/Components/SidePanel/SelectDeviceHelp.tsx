import React from "react";
import { useTranslation } from "react-i18next";

export const SelectDeviceHelp: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="h-full min-h-[18rem] grid place-items-center border-2 border-dashed border-white/10 rounded-xl">
      <p className="text-gray-400 text-center px-6 text-sm">
        {t("selectDeviceHelp")}
      </p>
    </div>
  );
};

export default SelectDeviceHelp;
