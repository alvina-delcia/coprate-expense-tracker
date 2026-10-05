import React from "react";
import { CheckCircle2, Clock, XCircle, FileText } from "lucide-react";

// Status pill used throughout the app (expense status, review state, etc.)
const config = {
  approved: { cls: "badge-approved", icon: CheckCircle2 },
  pending: { cls: "badge-pending", icon: Clock },
  rejected: { cls: "badge-rejected", icon: XCircle },
  draft: { cls: "badge-draft", icon: FileText },
};

const Badge = ({ status }) => {
  const entry = config[status] || config.draft;
  const Icon = entry.icon;

  return (
    <span className={`${entry.cls} capitalize`}>
      <Icon size={12} strokeWidth={2.5} />
      {status}
    </span>
  );
};

export default Badge;
