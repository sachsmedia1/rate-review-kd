import { CircleCheck, AlertCircle, Circle } from "lucide-react";
import { useState } from "react";

export const getStatusIcon = (status: string | null) => {
  const statusLower = status?.toLowerCase() || "";
  
  if (statusLower === "veröffentlicht" || statusLower === "published") {
    return {
      Icon: CircleCheck,
      className: "w-5 h-5 text-green-500",
      label: "Veröffentlicht"
    };
  }
  
  if (statusLower === "entwurf" || statusLower === "ausstehend" || 
      statusLower === "draft" || statusLower === "pending") {
    return {
      Icon: AlertCircle,
      className: "w-5 h-5 text-yellow-500",
      label: status || "Entwurf"
    };
  }
  
  // Default: Nicht veröffentlicht / Leer
  return {
    Icon: Circle,
    className: "w-5 h-5 text-gray-400",
    label: "Nicht veröffentlicht"
  };
};

// Simple status icon display component
export const StatusIcon = ({ status }: { status: string | null }) => {
  const { Icon, className, label } = getStatusIcon(status);
  return (
    <div className="flex items-center" title={label}>
      <Icon className={className} />
    </div>
  );
};

// Clickable status cycle button component
export const StatusCycleButton = ({ 
  status, 
  onStatusChange 
}: { 
  status: string | null;
  onStatusChange: (newStatus: string | null) => Promise<void>;
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { Icon, className } = getStatusIcon(status);
  
  const getNextStatus = (current: string | null) => {
    const currentLower = current?.toLowerCase() || "";
    if (currentLower === "veröffentlicht" || currentLower === "published") return "draft";
    if (currentLower === "entwurf" || currentLower === "draft") return null;
    return "published";
  };

  const handleClick = async () => {
    setIsUpdating(true);
    const nextStatus = getNextStatus(status);
    await onStatusChange(nextStatus);
    setIsUpdating(false);
  };

  const nextStatusLabel = getStatusIcon(getNextStatus(status)).label;

  return (
    <button
      onClick={handleClick}
      disabled={isUpdating}
      className="hover:opacity-70 transition-opacity disabled:opacity-50"
      title={`Wechseln zu: ${nextStatusLabel}`}
    >
      <Icon className={className} />
    </button>
  );
};
