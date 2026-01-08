import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiTrash2 } from "react-icons/fi";
import { deleteUserDevice } from "src/services/api";
import ConfirmDialog from "src/ui/Elements/Modal/ConfirmDialog";
import { Nullable } from "src/utils/types";
import ErrorIndicator from "src/pages/Dashboard/Components/Buttons/ErrorIndicator";

interface DeleteDeviceButtonProps {
  deviceId: string;
  onDeleted?: (deviceId: string) => void;
  size?: number;
}

export const DeleteDeviceButton: React.FC<DeleteDeviceButtonProps> = ({
  deviceId,
  onDeleted,
  size = 16,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Nullable<string>>(null);
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const handleDelete = async () => {
    if (loading) return;
    try {
      setError(null);
      setLoading(true);
      await deleteUserDevice(deviceId);
      onDeleted?.(deviceId);
    } catch (err: any) {
      console.error("Delete device failed", err);
      setError(err.message || "Delete failed");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        title={loading ? t("deleteAction") : t("deleteDevice")}
        className={`p-1 rounded-md transition-colors text-red-400 hover:text-red-200 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500/40 ${
          loading ? "opacity-60 cursor-not-allowed" : ""
        }`}
        aria-label={`Delete device ${deviceId}`}
      >
        <FiTrash2 size={size} />
      </button>
      {error && <ErrorIndicator title={error} size={14} className="ml-1" />}
      <ConfirmDialog
        open={open}
        title={t("deleteDevice")}
        description={t("deleteAction")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        destructive
        icon={<FiTrash2 />}
        loading={loading}
        onCancel={() => setOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default DeleteDeviceButton;
