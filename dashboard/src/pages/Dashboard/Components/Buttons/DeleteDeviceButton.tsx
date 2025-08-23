import React, { useState } from "react";
import { deleteUserDevice } from "../../../../services/api";
import { FiTrash2 } from "react-icons/fi";
import strings from "../../../../locale/strings";

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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;
    if (
      !confirm(
        `Poistetaanko laite ${deviceId}? Kaikki sen mittaukset poistetaan pysyvästi.`
      )
    )
      return;
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
    }
  };

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={handleDelete}
        title={loading ? strings.deleteAction : strings.deleteDevice}
        className={`p-1 rounded-md transition-colors text-red-400 hover:text-red-200 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500/40 ${
          loading ? "opacity-60 cursor-not-allowed" : ""
        }`}
        aria-label={`Delete device ${deviceId}`}
      >
        <FiTrash2 size={size} />
      </button>
      {error && (
        <span className="ml-1 text-[10px] text-red-400" title={error}>
          !
        </span>
      )}
    </div>
  );
};

export default DeleteDeviceButton;
