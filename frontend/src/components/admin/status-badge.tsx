interface StatusBadgeProps {
  status: string;
}

/* Exact badge/chip styles from Figma design context */
const styles: Record<string, string> = {
  Active:   "bg-success border border-[#c6ede5] text-success-foreground",
  Inactive: "bg-muted border border-border text-muted-foreground",
  Enrolled: "bg-success border border-[#c6ede5] text-success-foreground",
  Pending:  "bg-[#fff7ed] border border-[#fed7aa] text-[#c2410c]",
  Queued:   "bg-[#fff7ed] border border-[#fed7aa] text-[#c2410c]",
  Processing: "bg-[#eff6ff] border border-[#bfdbfe] text-[#2563eb]",
  Completed: "bg-success border border-[#c6ede5] text-success-foreground",
  Failed:   "bg-[#fef2f2] border border-[#fecaca] text-[#dc2626]",
  Disabled: "bg-muted border border-border text-muted-foreground",
  Deceased: "bg-muted border border-border text-muted-foreground",
  Synced:   "bg-success border border-[#c6ede5] text-success-foreground",
  Syncing:  "bg-[#eff6ff] border border-[#bfdbfe] text-[#2563eb]",
  Scheduled:"bg-[#f4f0ff] border border-[#e9e2ff] text-[#936dff]",
  Suspended:"bg-[#fff7ed] border border-[#fed7aa] text-[#c2410c]",
  Draft:           "bg-muted border border-border text-muted-foreground",
  Generated:       "bg-[#eff6ff] border border-[#bfdbfe] text-[#2563eb]",
  Approved:        "bg-[#f4f0ff] border border-[#e9e2ff] text-[#936dff]",
  Unpaid:          "bg-[#fff7ed] border border-[#fed7aa] text-[#c2410c]",
  "Partially Paid":"bg-[#fffbeb] border border-[#fde68a] text-[#b45309]",
  Paid:            "bg-success border border-[#c6ede5] text-success-foreground",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const cls = styles[status] ?? "bg-muted border border-border text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center justify-center px-[8px] h-[24px] rounded-[6px] whitespace-nowrap ${cls}`}
      style={{ fontFamily: "'Inter Tight'", fontWeight: 600, fontSize: 12, letterSpacing: "0.24px", lineHeight: 1.5 }}
    >
      {status}
    </span>
  );
}
