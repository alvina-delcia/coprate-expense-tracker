import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

// KPI card used across all dashboards.
// `trend` is optional: { direction: "up" | "down", label: "+12.4% from last month" }
const accentMap = {
  brand: "bg-brand-500/12 text-brand-400",
  teal: "bg-teal-600/12 text-teal-400",
  amber: "bg-status-pendingBg text-status-pending",
  emerald: "bg-status-approvedBg text-status-approved",
  red: "bg-status-rejectedBg text-status-rejected",
};

const StatCard = ({ label, value, sub, icon: Icon, accent = "brand", trend }) => {
  return (
    <div className="card card-hover">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-400 uppercase tracking-wide">
            {label}
          </p>
          <p className="text-[26px] leading-tight font-bold text-ink-900 mt-1.5 truncate">
            {value}
          </p>
        </div>
        {Icon && (
          <div
            className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center ${accentMap[accent]}`}
          >
            <Icon size={19} strokeWidth={2} />
          </div>
        )}
      </div>

      {(sub || trend) && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 font-medium ${
                trend.direction === "up" ? "text-status-approved" : "text-status-rejected"
              }`}
            >
              {trend.direction === "up" ? (
                <ArrowUpRight size={13} />
              ) : (
                <ArrowDownRight size={13} />
              )}
              {trend.label}
            </span>
          )}
          {sub && !trend && <span className="text-ink-400">{sub}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;
