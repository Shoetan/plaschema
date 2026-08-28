import { useNavigate } from "react-router-dom";
import { useAdminDataStore } from "@/stores/admin-data.store";
import { StatusBadge } from "@/components/admin/status-badge";
import { useState } from "react";
import { cardShadow, btnSecondary } from "@/components/admin/styles";

const tabs = ["Personal Information", "Enrollment Information", "Synchronization", "Activity History"];

interface BeneficiaryDetailViewProps {
  beneficiaryId: string;
}

export function BeneficiaryDetailView({ beneficiaryId }: BeneficiaryDetailViewProps) {
  const navigate = useNavigate();
  const beneficiaries = useAdminDataStore((store) => store.beneficiaries);
  const [tab, setTab] = useState("Personal Information");
  const b = beneficiaries.find((x) => x.id === beneficiaryId);

  if (!b) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Beneficiary not found.</p>
        <button onClick={() => navigate("/admin/beneficiaries")} className={btnSecondary}>Back to Beneficiaries</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 overflow-auto flex-1" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => navigate("/admin/beneficiaries")} className="hover:text-foreground">Beneficiaries</button>
        <span>/</span>
        <span className="text-foreground font-medium">{b.name}</span>
      </div>

      {/* Header */}
      <div className={`bg-card rounded-[12px] ${cardShadow} p-5 flex items-center gap-4`}>
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center shrink-0">
          <span className="text-muted-foreground text-xl font-semibold">{b.name.split(" ").map((n) => n[0]).join("")}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-foreground text-[22px] font-semibold tracking-[-0.44px]">{b.name}</h1>
            <StatusBadge status={b.status} />
            <StatusBadge status={b.syncStatus} />
          </div>
          <p className="text-muted-foreground text-sm font-mono mt-1">{b.id}</p>
        </div>
        <div className="flex gap-2">
          <button className={btnSecondary} disabled title="Editing is not available in the mock app">Edit Record</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${
              tab === t ? "text-foreground border-[#0a0a0a]" : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Personal Information" && (
        <div className={`bg-card rounded-[12px] ${cardShadow} p-5`}>
          <p className="text-foreground text-sm font-semibold mb-4">Personal Details</p>
          {[
            { label: "Full Name", value: b.name },
            { label: "Beneficiary ID", value: b.id },
            { label: "Date of Birth", value: "15 Mar 1985" },
            { label: "Gender", value: "Male" },
            { label: "NIN", value: "12345678901" },
            { label: "Phone", value: "+234 803 000 0001" },
            { label: "Address", value: "15 Gwagwalada Road, FCT" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2.5 border-b border-[#f5f5f5] last:border-0">
              <span className="text-muted-foreground text-sm">{label}</span>
              <span className="text-foreground text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "Enrollment Information" && (
        <div className={`bg-card rounded-[12px] ${cardShadow} p-5`}>
          <p className="text-foreground text-sm font-semibold mb-4">Enrollment Details</p>
          {[
            { label: "Community", value: b.community },
            { label: "Field Worker", value: b.fieldWorker },
            { label: "Enrollment Date", value: b.dateEnrolled },
            { label: "Enrollment Status", value: b.status, badge: true },
          ].map(({ label, value, badge }) => (
            <div key={label} className="flex justify-between py-2.5 border-b border-[#f5f5f5] last:border-0">
              <span className="text-muted-foreground text-sm">{label}</span>
              {badge ? <StatusBadge status={value} /> : <span className="text-foreground text-sm font-medium">{value}</span>}
            </div>
          ))}
        </div>
      )}

      {tab === "Synchronization" && (
        <div className={`bg-card rounded-[12px] ${cardShadow} p-5`}>
          <p className="text-foreground text-sm font-semibold mb-4">Sync Information</p>
          {[
            { label: "Sync Status", value: b.syncStatus, badge: true },
            { label: "Last Sync", value: b.dateEnrolled },
            { label: "Device ID", value: "DEVICE-AY-001" },
          ].map(({ label, value, badge }) => (
            <div key={label} className="flex justify-between py-2.5 border-b border-[#f5f5f5] last:border-0">
              <span className="text-muted-foreground text-sm">{label}</span>
              {badge ? <StatusBadge status={value} /> : <span className="text-foreground text-sm font-medium">{value}</span>}
            </div>
          ))}
        </div>
      )}

      {tab === "Activity History" && (
        <div className={`bg-card rounded-[12px] ${cardShadow} p-5`}>
          <div className="flex flex-col gap-4">
            {[
              { action: "Beneficiary enrolled", actor: b.fieldWorker, time: b.dateEnrolled },
              { action: "Record synchronized", actor: "System", time: b.dateEnrolled },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#f5f5f5] last:border-0">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
                <div className="flex-1">
                  <p className="text-foreground text-sm font-medium">{a.action}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">by {a.actor}</p>
                </div>
                <span className="text-muted-foreground text-xs">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
