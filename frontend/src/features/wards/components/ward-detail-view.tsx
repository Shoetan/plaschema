import { useNavigate } from "react-router-dom";
import { useAdminDataStore } from "@/stores/admin-data.store";
import { StatusBadge } from "@/components/admin/status-badge";
import { useState } from "react";
import { cardShadow, btnPrimary, btnSecondary, thCell, tdCell } from "@/components/admin/styles";

const tabs = ["Overview", "Beneficiaries", "Field Workers", "Health Facility", "Enrollment Activity", "Activity Log"];

interface WardDetailViewProps {
  wardId: string;
}

export function WardDetailView({ wardId }: WardDetailViewProps) {
  const navigate = useNavigate();
  const communities = useAdminDataStore((store) => store.communities);
  const beneficiaries = useAdminDataStore((store) => store.beneficiaries);
  const fieldWorkers = useAdminDataStore((store) => store.fieldWorkers);
  const facilities = useAdminDataStore((store) => store.facilities);
  const [tab, setTab] = useState("Overview");

  const community = communities.find((c) => c.id === wardId);

  if (!community) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Ward not found.</p>
        <button onClick={() => navigate("/admin/wards")} className={btnSecondary}>Back to Wards</button>
      </div>
    );
  }
  const communityBeneficiaries = beneficiaries.filter((b) => b.communityId === community.id);
  const communityWorkers = fieldWorkers.filter((fw) => fw.communityId === community.id);
  const communityFacilities = facilities.filter((f) => f.lga === community.lga);

  return (
    <div className="flex flex-col gap-6 p-6 overflow-auto flex-1" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => navigate("/admin/wards")} className="hover:text-foreground">Wards</button>
        <span>/</span>
        <span className="text-foreground font-medium">{community.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-[12px] bg-accent flex items-center justify-center">
            <span className="text-primary-foreground text-xl">🏘️</span>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-foreground text-[24px] font-semibold tracking-[-0.48px]">{community.name}</h1>
              <StatusBadge status={community.status} />
            </div>
            <p className="text-muted-foreground text-sm font-medium mt-1">{community.lga} LGA · {community.state}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className={btnSecondary} disabled title="Editing is not available in the mock app">Edit Ward</button>
          <button className={btnPrimary} disabled title="Assignment is not available in the mock app">Assign Field Worker</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Beneficiaries", value: community.beneficiaries.toLocaleString() },
          { label: "Active Field Workers", value: String(community.fieldWorkers) },
          { label: "Enrollments This Month", value: String(community.newEnrollments) },
          { label: "Last Activity", value: community.lastActivity },
        ].map(({ label, value }) => (
          <div key={label} className={`bg-card rounded-[12px] ${cardShadow} p-4`}>
            <p className="text-muted-foreground text-sm font-medium">{label}</p>
            <p className="text-foreground text-[22px] font-semibold tracking-[-0.44px] mt-1">{value}</p>
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
        <div className="grid grid-cols-2 gap-4">
          <div className={`bg-card rounded-[12px] ${cardShadow} p-5`}>
            <p className="text-foreground text-sm font-semibold mb-4">Ward Information</p>
            {[
              { label: "Ward Name", value: community.name },
              { label: "State", value: community.state },
              { label: "LGA", value: community.lga },
              { label: "Status", value: community.status },
              { label: "Date Created", value: "01 Jan 2024" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-[#f5f5f5] last:border-0">
                <span className="text-muted-foreground text-sm">{label}</span>
                {label === "Status" ? <StatusBadge status={value} /> : <span className="text-foreground text-sm font-medium">{value}</span>}
              </div>
            ))}
          </div>
          <div className={`bg-card rounded-[12px] ${cardShadow} p-5`}>
            <p className="text-foreground text-sm font-semibold mb-4">Enrollment Trend</p>
            <div className="flex items-end gap-2 h-[120px]">
              {[40, 55, 48, 72, 65, 81, 70, community.newEnrollments].map((v, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-full rounded-t-[3px]" style={{ height: `${(v / 90) * 100}px`, background: i === 7 ? "#9FE870" : "#e5e5e5" }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "Beneficiaries" && (
        <div className={`bg-card rounded-[12px] ${cardShadow}`}>
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Beneficiaries ({communityBeneficiaries.length})</p>
            <button className={btnPrimary} disabled title="Export is not available in the mock app">Export</button>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                {["Beneficiary Name", "ID", "Field Worker", "Date Enrolled", "Sync Status"].map((h) => (
                  <th key={h} className={thCell}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {communityBeneficiaries.map((b) => (
                <tr key={b.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => navigate(`/admin/beneficiaries/${b.id}`)}>
                  <td className={tdCell}>{b.name}</td>
                  <td className={tdCell + " text-muted-foreground font-mono"}>{b.id}</td>
                  <td className={tdCell + " text-muted-foreground"}>{b.fieldWorker}</td>
                  <td className={tdCell + " text-muted-foreground"}>{b.dateEnrolled}</td>
                  <td className={tdCell}><StatusBadge status={b.syncStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Field Workers" && (
        <div className={`bg-card rounded-[12px] ${cardShadow}`}>
          <table className="w-full">
            <thead>
              <tr>
                {["Field Worker", "Phone", "Enrolled", "Last Sync", "Status"].map((h) => (
                  <th key={h} className={thCell}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {communityWorkers.map((fw) => (
                <tr key={fw.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => navigate(`/admin/field-workers/${fw.id}`)}>
                  <td className={tdCell}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                        <span className="text-primary-foreground text-xs font-semibold">{fw.name.split(" ").map((n) => n[0]).join("")}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{fw.name}</span>
                    </div>
                  </td>
                  <td className={tdCell + " text-muted-foreground"}>{fw.phone}</td>
                  <td className={tdCell + " font-semibold"}>{fw.enrolled}</td>
                  <td className={tdCell + " text-muted-foreground"}>{fw.lastSync}</td>
                  <td className={tdCell}><StatusBadge status={fw.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Health Facility" && (
        <div className={`bg-card rounded-[12px] ${cardShadow}`}>
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Health Facilities in {community.lga} LGA ({communityFacilities.length})</p>
          </div>
          {communityFacilities.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No facilities found for this LGA.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  {["Facility Name", "Code", "Type", "Level", "Ward", "Beneficiaries", "Status"].map((h) => (
                    <th key={h} className={thCell}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {communityFacilities.map((f) => (
                  <tr key={f.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => navigate(`/admin/facilities/${f.id}`)}>
                    <td className={tdCell + " font-semibold"}>{f.name}</td>
                    <td className={tdCell + " text-muted-foreground font-mono text-xs"}>{f.code}</td>
                    <td className={tdCell + " text-muted-foreground"}>{f.type}</td>
                    <td className={tdCell + " text-muted-foreground"}>{f.level}</td>
                    <td className={tdCell + " text-muted-foreground"}>{f.ward}</td>
                    <td className={tdCell + " font-semibold"}>{f.beneficiaries}</td>
                    <td className={tdCell}><StatusBadge status={f.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {(tab === "Enrollment Activity" || tab === "Activity Log") && (
        <div className={`bg-card rounded-[12px] ${cardShadow} p-5`}>
          <p className="text-muted-foreground text-sm text-center py-8">No recent activity to display.</p>
        </div>
      )}
    </div>
  );
}
