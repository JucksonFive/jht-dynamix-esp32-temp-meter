import React from "react";
import { useTranslation } from "react-i18next";

export const SelectDeviceHelp: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="h-full min-h-[18rem] grid place-items-center border-2 border-dashed border-neutral-200 dark:border-[#2d2626] rounded-xl">
      <p className="text-neutral-500 dark:text-[#a39999] text-center px-6 text-sm">
        {t("selectDeviceHelp")}
      </p>
    </div>
  );
};

export default SelectDeviceHelp;
