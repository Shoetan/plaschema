import { useNavigate } from "react-router-dom";
import { useAdminDataStore } from "@/stores/admin-data.store";
import { StatusBadge } from "@/components/admin/status-badge";
import { useState } from "react";
import { cardShadow, btnPrimary, btnSecondary, thCell, tdCell } from "@/components/admin/styles";

const tabs = ["Overview", "Communities", "Enrollment Activity", "Beneficiaries", "Sync Activity"];

interface FieldWorkerDetailViewProps {
  fieldWorkerId: string;
}

export function FieldWorkerDetailView({ fieldWorkerId }: FieldWorkerDetailViewProps) {
  const navigate = useNavigate();
  const fieldWorkers = useAdminDataStore((store) => store.fieldWorkers);
  const beneficiaries = useAdminDataStore((store) => store.beneficiaries);
  const [tab, setTab] = useState("Overview");
  const fw = fieldWorkers.find((w) => w.id === fieldWorkerId);

  if (!fw) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Field worker not found.</p>
        <button onClick={() => navigate("/admin/field-workers")} className={btnSecondary}>Back to Field Workers</button>
      </div>
    );
  }
  const workerBeneficiaries = beneficiaries.filter((b) => b.fieldWorkerId === fw.id);

  return (
    <div className="flex flex-col gap-6 p-6 overflow-auto flex-1" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => navigate("/admin/field-workers")} className="hover:text-foreground">Field Workers</button>
        <span>/</span>
        <span className="text-foreground font-medium">{fw.name}</span>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
            <span className="text-primary-foreground text-xl font-semibold">{fw.name.split(" ").map((n) => n[0]).join("")}</span>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-foreground text-[24px] font-semibold tracking-[-0.48px]">{fw.name}</h1>
              <StatusBadge status={fw.status} />
            </div>
            <p className="text-muted-foreground text-sm font-medium mt-1">{fw.id} · {fw.community}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className={btnSecondary} disabled title="Editing is not available in the mock app">Edit</button>
          <button className={btnSecondary} disabled title="Reassignment is not available in the mock app">Reassign Community</button>
          <button className={btnPrimary} disabled title="Status changes are not available in this view">
            {fw.status === "Active" ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Enrolled", value: String(fw.enrolled) },
          { label: "Enrollments This Month", value: String(Math.floor(fw.enrolled * 0.2)) },
          { label: "Last Enrollment", value: fw.lastEnrollment },
          { label: "Last Sync", value: fw.lastSync },
        ].map(({ label, value }) => (
          <div key={label} className={`bg-card rounded-[12px] ${cardShadow} p-4`}>
            <p className="text-muted-foreground text-sm font-medium">{label}</p>
            <p className="text-foreground text-[20px] font-semibold tracking-[-0.4px] mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 ${
              tab === t ? "text-foreground border-[#0a0a0a]" : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className={`bg-card rounded-[12px] ${cardShadow} p-5`}>
          <p className="text-foreground text-sm font-semibold mb-4">Worker Information</p>
          {[
            { label: "Full Name", value: fw.name },
            { label: "Worker ID", value: fw.id },
            { label: "Phone", value: fw.phone },
            { label: "Email", value: fw.email },
            { label: "Assigned Community", value: fw.community },
            { label: "Account Status", value: fw.status },
            { label: "Date Created", value: "01 Jun 2024" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2.5 border-b border-[#f5f5f5] last:border-0">
              <span className="text-muted-foreground text-sm">{label}</span>
              {label === "Account Status" ? <StatusBadge status={value} /> : <span className="text-foreground text-sm font-medium">{value}</span>}
            </div>
          ))}
        </div>
      )}

      {tab === "Beneficiaries" && (
        <div className={`bg-card rounded-[12px] ${cardShadow}`}>
          <table className="w-full">
            <thead>
              <tr>
                {["Name", "ID", "Community", "Date Enrolled", "Sync Status"].map((h) => (
                  <th key={h} className={thCell}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workerBeneficiaries.map((b) => (
                <tr key={b.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => navigate(`/admin/beneficiaries/${b.id}`)}>
                  <td className={tdCell}>{b.name}</td>
                  <td className={tdCell + " text-muted-foreground font-mono"}>{b.id}</td>
                  <td className={tdCell + " text-muted-foreground"}>{b.community}</td>
                  <td className={tdCell + " text-muted-foreground"}>{b.dateEnrolled}</td>
                  <td className={tdCell}><StatusBadge status={b.syncStatus} /></td>
                </tr>
              ))}
              {workerBeneficiaries.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">No beneficiaries enrolled by this field worker.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {(tab === "Communities" || tab === "Enrollment Activity" || tab === "Sync Activity") && (
        <div className={`bg-card rounded-[12px] ${cardShadow} p-5`}>
          {tab === "Communities" && (
            <div className="flex items-center justify-between py-3 border-b border-[#f5f5f5]">
              <div>
                <p className="text-foreground text-sm font-semibold">{fw.community}</p>
                <p className="text-muted-foreground text-xs mt-0.5">Primary assignment</p>
              </div>
              <StatusBadge status="Active" />
            </div>
          )}
          {tab !== "Communities" && <p className="text-muted-foreground text-sm text-center py-8">No recent activity.</p>}
        </div>
      )}
    </div>
  );
}
