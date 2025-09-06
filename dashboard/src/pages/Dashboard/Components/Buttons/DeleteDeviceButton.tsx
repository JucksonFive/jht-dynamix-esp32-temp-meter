import React, { useState } from "react";
import { deleteUserDevice } from "../../../../services/api";
import { FiTrash2 } from "react-icons/fi";
import strings from "../../../../locale/strings";
import ConfirmDialog from "../../../../ui/Elements/Modal/ConfirmDialog";
import ErrorIndicator from "./ErrorIndicator";

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
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

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
        title={loading ? strings.deleteAction : strings.deleteDevice}
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
        title={strings.deleteDevice}
        description={strings.deleteAction}
        confirmLabel={strings.confirm}
        cancelLabel={strings.cancel}
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
