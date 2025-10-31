import { Check, Clock, X } from "lucide-react";
import { useState } from "react";

export const getStatusIcon = (status: string | null) => {
  const statusLower = status?.toLowerCase() || "";
  
  if (statusLower === "veröffentlicht" || statusLower === "published") {
    return {
      Icon: Check,
      iconClassName: "w-5 h-5 text-green-600 stroke-[3]",
      badgeClassName: "inline-flex items-center justify-center w-8 h-8 rounded-full border border-green-600",
      label: "Veröffentlicht"
    };
  }
  
  // Pending / Unbearbeitet
  if (statusLower === "ausstehend" || statusLower === "unbearbeitet" || statusLower === "pending") {
    return {
      Icon: Clock,
      iconClassName: "w-5 h-5 text-gray-400 stroke-[2.5]",
      badgeClassName: "inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-400",
      label: "Unbearbeitet"
    };
  }
  
  // Draft / Nicht veröffentlicht
  if (statusLower === "entwurf" || statusLower === "draft" || statusLower === "nicht veröffentlicht" || statusLower === "nicht-veröffentlicht") {
    return {
      Icon: X,
      iconClassName: "w-5 h-5 text-red-600 stroke-[3]",
      badgeClassName: "inline-flex items-center justify-center w-8 h-8 rounded-full border border-red-600",
      label: "Nicht veröffentlicht"
    };
  }
  
  // Default: Nicht veröffentlicht / Leer
  return {
    Icon: X,
    iconClassName: "w-5 h-5 text-red-600 stroke-[3]",
    badgeClassName: "inline-flex items-center justify-center w-8 h-8 rounded-full border border-red-600",
    label: "Nicht veröffentlicht"
  };
};

// Simple status icon display component
export const StatusIcon = ({ status }: { status: string | null }) => {
  const { Icon, iconClassName, badgeClassName, label } = getStatusIcon(status);
  return (
    <div className={badgeClassName} title={label}>
      <Icon className={iconClassName} />
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
  const { Icon, iconClassName, badgeClassName } = getStatusIcon(status);
  
  const getNextStatus = (current: string | null) => {
    const currentLower = current?.toLowerCase() || "";
    if (currentLower === "veröffentlicht" || currentLower === "published") return "draft";
    if (currentLower === "entwurf" || currentLower === "draft" || currentLower === "nicht veröffentlicht") return "pending";
    // pending/unbearbeitet oder null
    return "published";
  };

  const handleClick = async () => {
    setIsUpdating(true);
    const nextStatus = getNextStatus(status);
    await onStatusChange(nextStatus);
    setIsUpdating(false);
  };

  const { label: currentLabel } = getStatusIcon(status);

  return (
    <button
      onClick={handleClick}
      disabled={isUpdating}
      className="hover:scale-110 transition-transform disabled:opacity-50"
      title={currentLabel}
    >
      <div className={badgeClassName}>
        <Icon className={iconClassName} />
      </div>
    </button>
  );
};
