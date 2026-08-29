import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { recentActivity } from "@/mocks/admin-data";
import { useAdminDataStore } from "@/stores/admin-data.store";
import { StatusBadge } from "@/components/admin/status-badge";
import { cardShadow, btnPrimary, btnSecondary, thCell, tdCell, tabGroup } from "@/components/admin/styles";

const TABS = ["Overview", "Beneficiaries", "Capitation", "Activity"] as const;
type Tab = (typeof TABS)[number];

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1 py-3 border-b border-border last:border-b-0">
      <span className="text-muted-foreground text-[12px]">{label}</span>
      <span className="text-foreground text-[14px] font-medium">{value}</span>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={`bg-card rounded-[12px] ${cardShadow} px-6 py-5 flex flex-col gap-1`}>
      <span className="text-muted-foreground text-[12px] font-medium tracking-[0.24px]">{label}</span>
      <span className="text-foreground text-[24px] font-semibold tracking-[-0.48px]">{value}</span>
    </div>
  );
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const ini = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (
    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[11px] font-semibold shrink-0">
      {ini.toUpperCase()}
    </div>
  );
}

interface FacilityDetailViewProps {
  facilityId: string;
}

export function FacilityDetailView({ facilityId }: FacilityDetailViewProps) {
  const navigate = useNavigate();
  const facilities = useAdminDataStore((store) => store.facilities);
  const beneficiaries = useAdminDataStore((store) => store.beneficiaries);
  const capitationRecords = useAdminDataStore((store) => store.capitationRecords);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const facility = facilities.find((f) => f.id === facilityId);

  if (!facility) {
    return (
      <div
        className="flex flex-col items-center justify-center flex-1 gap-4"
        style={{ fontFamily: "'Inter Tight', sans-serif" }}
      >
        <p className="text-muted-foreground text-[16px]">Facility not found.</p>
        <button onClick={() => navigate("/admin/facilities")} className={btnSecondary}>
          Back to Facilities
        </button>
      </div>
    );
  }

  const facCapitation = capitationRecords.filter((r) => r.facilityId === facility.id);
  const totalCapitation = facCapitation.reduce((sum, r) => sum + r.amount, 0);

  const filteredBeneficiaries = beneficiaries.filter((b) => {
    const matchSearch =
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div
      className="flex flex-col gap-6 p-6 overflow-auto flex-1"
      style={{ fontFamily: "'Inter Tight', sans-serif" }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-[12px] text-muted-foreground">
        <Link to="/admin/facilities" className="hover:text-foreground transition-colors">
          Facilities
        </Link>
        <span>/</span>
        <span className="text-foreground">{facility.name}</span>
      </div>

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground text-[24px] font-semibold tracking-[-0.48px]">
            {facility.name}
          </h1>
          <span className="font-mono text-muted-foreground text-[14px]">{facility.code}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StatusBadge status={facility.status} />
          <button className={btnSecondary} disabled title="Editing is not available in the mock app">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M9.917 1.75a1.237 1.237 0 0 1 1.75 1.75L4.083 11.083 1.167 11.667l.583-2.917L9.917 1.75Z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Edit Facility
          </button>
          {facility.status === "Active" ? (
            <button className={btnSecondary} disabled title="Status changes are not available in the mock app">Deactivate</button>
          ) : (
            <button className={btnPrimary} disabled title="Status changes are not available in the mock app">Activate</button>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Assigned Beneficiaries" value={facility.beneficiaries.toLocaleString()} />
        <KpiCard
          label="Current Capitation"
          value={totalCapitation > 0 ? `₦${totalCapitation.toLocaleString()}` : "₦0"}
        />
        <KpiCard label="Enrollments This Month" value={facility.beneficiaries.toLocaleString()} />
      </div>

      {/* Tab bar */}
      <div className={tabGroup}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 h-[38px] text-[12px] font-semibold transition-colors ${
              activeTab === tab
                ? "bg-card text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === "Overview" && (
        <div className="grid grid-cols-2 gap-4">
          {/* Facility Information */}
          <div className={`bg-card rounded-[12px] ${cardShadow} px-6 py-5`}>
            <h2 className="text-foreground text-[14px] font-semibold mb-3">
              Facility Information
            </h2>
            <InfoRow label="Facility Name" value={facility.name} />
            <InfoRow label="Facility Code" value={facility.code} />
            <InfoRow label="Facility Type" value={facility.type} />
            <InfoRow label="Facility Level" value={facility.level} />
            <InfoRow label="Ownership" value={facility.ownership} />
            <InfoRow label="Status" value={facility.status} />
          </div>

          {/* Location */}
          <div className={`bg-card rounded-[12px] ${cardShadow} px-6 py-5`}>
            <h2 className="text-foreground text-[14px] font-semibold mb-3">Location</h2>
            <InfoRow label="State" value={facility.state} />
            <InfoRow label="LGA" value={facility.lga} />
            <InfoRow label="Ward" value={facility.ward} />
            <InfoRow label="Community" value={facility.community} />
            <InfoRow label="Address" value={facility.address} />
          </div>

          {/* Contact Information — full width */}
          <div className={`col-span-2 bg-card rounded-[12px] ${cardShadow} px-6 py-5`}>
            <h2 className="text-foreground text-[14px] font-semibold mb-3">
              Contact Information
            </h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-[12px]">Contact Person</span>
                <span className="text-foreground text-[14px] font-medium">
                  {facility.contactPerson}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-[12px]">Phone</span>
                <span className="text-foreground text-[14px] font-medium">{facility.phone}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-[12px]">Email</span>
                <span className="text-foreground text-[14px] font-medium">{facility.email}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BENEFICIARIES ── */}
      {activeTab === "Beneficiaries" && (
        <div className={`bg-card rounded-[12px] ${cardShadow} overflow-hidden`}>
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2 bg-muted border border-border rounded-[100px] px-3 h-[36px] flex-1 max-w-[280px]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="#737373" strokeWidth="1.2" />
                <path d="M9.5 9.5L12 12" stroke="#737373" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <input
                className="bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground outline-none flex-1"
                placeholder="Search beneficiaries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="bg-card border border-border rounded-[8px] px-3 h-[36px] text-[12px] text-foreground outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All</option>
              <option>Enrolled</option>
              <option>Pending</option>
            </select>
          </div>

          {filteredBeneficiaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <p className="text-muted-foreground text-[14px]">No beneficiaries found.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className={thCell}>Beneficiary Name</th>
                  <th className={thCell}>Beneficiary ID</th>
                  <th className={thCell}>Community</th>
                  <th className={thCell}>Enrollment Date</th>
                  <th className={thCell}>Status</th>
                  <th className={thCell}></th>
                </tr>
              </thead>
              <tbody>
                {filteredBeneficiaries.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/40 transition-colors">
                    <td className={tdCell}>
                      <button
                        className="flex items-center gap-2 hover:underline text-left"
                        onClick={() => navigate(`/admin/beneficiaries/${b.id}`)}
                      >
                        <Initials name={b.name} />
                        {b.name}
                      </button>
                    </td>
                    <td className={tdCell}>
                      <span className="font-mono text-[13px] text-muted-foreground">{b.id}</span>
                    </td>
                    <td className={tdCell}>{b.community}</td>
                    <td className={tdCell}>{b.dateEnrolled}</td>
                    <td className={tdCell}>
                      <StatusBadge status={b.status} />
                    </td>
                    <td className={tdCell}>
                      <button
                        className={btnSecondary}
                        onClick={() => navigate(`/admin/beneficiaries/${b.id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── CAPITATION ── */}
      {activeTab === "Capitation" && (
        <div className={`bg-card rounded-[12px] ${cardShadow} overflow-hidden`}>
          {facCapitation.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <p className="text-muted-foreground text-[14px]">
                No capitation records for this facility.
              </p>
            </div>
          ) : (
            <>
              {/* Summary strip */}
              <div className="flex items-center gap-6 px-6 py-4 border-b border-border bg-muted/40">
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground text-[11px] font-medium tracking-[0.22px]">
                    TOTAL CAPITATION
                  </span>
                  <span className="text-foreground text-[18px] font-semibold">
                    ₦{totalCapitation.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground text-[11px] font-medium tracking-[0.22px]">
                    RECORDS
                  </span>
                  <span className="text-foreground text-[18px] font-semibold">
                    {facCapitation.length}
                  </span>
                </div>
              </div>

              <table className="w-full">
                <thead>
                  <tr>
                    <th className={thCell}>Period</th>
                    <th className={thCell}>Beneficiaries</th>
                    <th className={thCell}>Rate (₦)</th>
                    <th className={thCell}>Amount (₦)</th>
                    <th className={thCell}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {facCapitation.map((rec) => (
                    <tr key={rec.id} className="hover:bg-muted/40 transition-colors">
                      <td className={tdCell}>{rec.period}</td>
                      <td className={tdCell}>{rec.beneficiaries.toLocaleString()}</td>
                      <td className={tdCell}>{rec.rate.toLocaleString()}</td>
                      <td className={tdCell}>{rec.amount.toLocaleString()}</td>
                      <td className={tdCell}>
                        <StatusBadge status={rec.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* ── ACTIVITY ── */}
      {activeTab === "Activity" && (
        <div className={`bg-card rounded-[12px] ${cardShadow} px-6 py-5`}>
          <h2 className="text-foreground text-[14px] font-semibold mb-4">Recent Activity</h2>
          <div className="flex flex-col gap-0">
            {recentActivity.map((item, idx) => {
              const iconColor =
                item.type === "enrollment"
                  ? "#9fe870"
                  : item.type === "sync"
                  ? "#60a5fa"
                  : item.type === "worker"
                  ? "#fbbf24"
                  : "#e5e5e5";

              const icon =
                item.type === "enrollment" ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M7 1a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM1.5 13a5.5 5.5 0 0 1 11 0"
                      stroke="#163300"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : item.type === "sync" ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2 7a5 5 0 0 1 9.33-2.5M12 7a5 5 0 0 1-9.33 2.5M2 4.5V2m0 2.5H4.5M12 9.5V12m0-2.5H9.5"
                      stroke="white"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="4" stroke="white" strokeWidth="1.3" />
                  </svg>
                );

              return (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 py-3 ${idx < recentActivity.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: iconColor }}
                  >
                    {icon}
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="text-foreground text-[13px] font-medium">{item.message}</span>
                    <span className="text-muted-foreground text-[12px]">{item.community}</span>
                  </div>
                  <span className="text-muted-foreground text-[12px] shrink-0">{item.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
