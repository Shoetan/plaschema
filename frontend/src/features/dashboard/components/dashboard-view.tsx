import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { recentActivity, enrollmentTrendData } from "@/mocks/admin-data";
import { useAdminDataStore } from "@/stores/admin-data.store";
import { StatusBadge } from "@/components/admin/status-badge";
import { cardShadow, btnSecondary, thCell, tdCell, tabGroup } from "@/components/admin/styles";
import { useEnrollments } from "@/features/enrollments/hooks";
import { formatEnrollmentDate, statusLabel } from "@/features/enrollments/utils";

const selectCls = "border border-border rounded-[8px] px-3 py-2 text-sm font-medium text-foreground bg-card outline-none";

const trendPeriods = ["Daily", "Weekly", "Monthly"];

const categoryBreakdown = [
  { label: "IDPs", value: 3 },
  { label: "Indigents / Very Poor / Others", value: 4 },
  { label: "Elderly 65+", value: 3 },
  { label: "Other", value: 2 },
];

const maxCategory = Math.max(...categoryBreakdown.map((c) => c.value));

export function DashboardView() {
  const navigate = useNavigate();
  const communities = useAdminDataStore((store) => store.communities);
  const fieldWorkers = useAdminDataStore((store) => store.fieldWorkers);
  const facilities = useAdminDataStore((store) => store.facilities);
  const recentEnrollmentsQuery = useEnrollments({ limit: 5 });
  const [trendPeriod, setTrendPeriod] = useState("Monthly");
  const [filterState, setFilterState] = useState("All States");
  const [filterLGA, setFilterLGA] = useState("All LGAs");
  const [filterWard, setFilterWard] = useState("All Wards");
  const [filterDate, setFilterDate] = useState("Last 30 Days");

  const maxVal = Math.max(...enrollmentTrendData.map((d) => d.enrollments));
  const sortedFacilities = [...facilities].sort((a, b) => b.beneficiaries - a.beneficiaries);
  const totalFacilityBeneficiaries = facilities.reduce((s, f) => s + f.beneficiaries, 0);
  const activeFacilities = facilities.filter((f) => f.status === "Active").length;
  const sortedFieldWorkers = [...fieldWorkers].sort((a, b) => b.enrolled - a.enrolled);
  const totalEnrolled = fieldWorkers.reduce((s, fw) => s + fw.enrolled, 0);
  const avgPerWorker = Math.round(totalEnrolled / Math.max(fieldWorkers.length, 1));
  const maxBeneficiaries = Math.max(...communities.map((c) => c.beneficiaries));
  const lgaData = communities.reduce((acc, community) => {
    acc[community.lga] = (acc[community.lga] || 0) + community.beneficiaries;
    return acc;
  }, {} as Record<string, number>);
  const lgaList = Object.entries(lgaData).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxLga = lgaList[0]?.[1] ?? 1;
  const recentBeneficiaries = recentEnrollmentsQuery.data?.items ?? [];

  return (
    <div
      className="flex flex-col gap-6 p-6 overflow-auto flex-1"
      style={{ fontFamily: "'Inter Tight', sans-serif" }}
    >
      {/* ── Section 1: Header + Global Filters ── */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-foreground text-[24px] font-semibold tracking-[-0.48px] leading-[1.3]">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor enrollment, coverage, facilities, field operations and programme performance.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select className={selectCls} value={filterState} onChange={(e) => setFilterState(e.target.value)}>
            <option>All States</option>
            <option>Plateau</option>
          </select>
          <select className={selectCls} value={filterLGA} onChange={(e) => setFilterLGA(e.target.value)}>
            <option>All LGAs</option>
            <option>Jos North</option>
            <option>Jos South</option>
            <option>Riyom</option>
            <option>Barkin Ladi</option>
            <option>Pankshin</option>
            <option>Langtang North</option>
            <option>Mikang</option>
          </select>
          <select className={selectCls} value={filterWard} onChange={(e) => setFilterWard(e.target.value)}>
            <option>All Wards</option>
          </select>
          <select className={selectCls} value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 3 Months</option>
            <option>Last 6 Months</option>
            <option>Last Year</option>
          </select>
        </div>
      </div>

      {/* ── Section 2: Primary KPI Cards ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Enrollments", value: "2,299", change: "+8.5%", positive: true, nav: null },
          { label: "Active Beneficiaries", value: "2,044", change: "+5.2%", positive: true, nav: "/admin/beneficiaries" },
          { label: "Inactive Beneficiaries", value: "255", change: "-2.1%", positive: false, nav: "/admin/beneficiaries" },
          { label: "New Enrollments (Month)", value: "257", change: "+12%", positive: true, nav: null },
          { label: "Total Facilities", value: "10", change: "0%", positive: true, nav: null },
          { label: "Field Workers", value: "8", change: "+3", positive: true, nav: null },
        ].map((k) => (
          <div
            key={k.label}
            className={`bg-card rounded-[12px] ${cardShadow} p-4 flex flex-col gap-3 ${k.nav ? "cursor-pointer hover:bg-muted/40" : ""}`}
            onClick={() => k.nav && navigate(k.nav)}
          >
            <p className="text-muted-foreground text-sm font-medium tracking-[0.28px]">{k.label}</p>
            <div className="flex items-end gap-2">
              <span className="text-foreground text-[24px] tracking-[-0.48px] font-semibold">{k.value}</span>
              <span className={`text-sm font-semibold mb-0.5 ${k.positive ? "text-success-foreground" : "text-[#dc2626]"}`}>
                {k.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Section 3: Enrollment Trend + Recent Activity ── */}
      <div className="grid grid-cols-[1fr_340px] gap-4">
        {/* Enrollment Trend Chart */}
        <div className={`bg-card rounded-[12px] ${cardShadow} flex flex-col`}>
          <div className="flex items-center gap-4 p-4 border-b border-border">
            <div className="flex flex-col gap-1 flex-1">
              <p className="text-foreground text-sm font-semibold tracking-[0.28px]">Enrollment Trend</p>
              <p className="text-foreground text-[24px] tracking-[-0.48px] font-semibold">2,299 <span className="text-muted-foreground text-sm font-medium">total enrollments</span></p>
            </div>
            <div className={tabGroup}>
              {trendPeriods.map((p) => (
                <button
                  key={p}
                  onClick={() => setTrendPeriod(p)}
                  className={`px-3 py-2 h-[38px] text-[12px] tracking-[0.24px] transition-colors ${
                    trendPeriod === p ? "bg-card font-semibold text-foreground" : "font-medium text-muted-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4">
            <div className="relative h-[220px]">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-[21px] flex flex-col justify-between items-end pr-3">
                {["800", "600", "400", "200", "0"].map((l) => (
                  <span key={l} className="text-muted-foreground text-[12px] font-medium">{l}</span>
                ))}
              </div>
              {/* Chart area */}
              <div className="absolute left-[44px] right-0 top-0 bottom-[21px]">
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-full h-px bg-muted" />
                  ))}
                </div>
                {/* Avg line */}
                <div className="absolute left-0 right-0 flex items-center" style={{ top: "38%" }}>
                  <div className="flex items-start shrink-0">
                    <div className="bg-[#455c33] flex items-center pl-1 pr-0.5 py-px rounded-l-[4px]">
                      <span className="text-white text-[11px] font-normal whitespace-nowrap">Avg</span>
                    </div>
                  </div>
                  <div className="flex-1 h-px border-t border-dashed border-[#455c33]" />
                </div>
                {/* Bars */}
                <div className="absolute bottom-0 left-2 right-0 top-4 flex items-end gap-2">
                  {enrollmentTrendData.map((d) => (
                    <div key={d.month} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-muted-foreground text-[10px]">{d.enrollments}</span>
                      <div
                        className="w-full rounded-[6px] transition-all"
                        style={{
                          height: `${(d.enrollments / maxVal) * 130}px`,
                          background: d.month === "Aug" ? "#9FE870" : "#f5f5f5",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              {/* X-axis labels */}
              <div className="absolute bottom-0 left-[44px] right-0 flex gap-2">
                {enrollmentTrendData.map((d) => (
                  <div key={d.month} className="flex-1 text-center">
                    <span className="text-muted-foreground text-[11px] font-medium">{d.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className={`bg-card rounded-[12px] ${cardShadow} flex flex-col`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-foreground text-sm font-semibold tracking-[0.28px]">Recent Activity</p>
          </div>
          <div className="flex-1 divide-y divide-[#f5f5f5] overflow-y-auto">
            {recentActivity.map((a) => (
              <div key={a.id} className="px-4 py-3 flex gap-3 items-start">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    a.type === "enrollment" ? "bg-accent" :
                    a.type === "sync"       ? "bg-[#eff6ff]" : "bg-muted"
                  }`}
                >
                  <span className="text-[10px]">
                    {a.type === "enrollment" ? "✓" :
                     a.type === "sync"       ? "↑" :
                     a.type === "worker"     ? "👷" :
                     a.type === "community"  ? "🏘️" : "✏️"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-[13px] font-medium leading-[1.4]">{a.message}</p>
                  <p className="text-muted-foreground text-[12px] tracking-[0.24px] mt-0.5">
                    Ward: {a.community} · {a.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 4: Enrollment Breakdown ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Enrollment by Category */}
        <div className={`bg-card rounded-[12px] ${cardShadow}`}>
          <div className="px-4 py-3 border-b border-border">
            <p className="text-foreground text-sm font-semibold">Enrollment by Category</p>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {categoryBreakdown.map((c) => (
              <div key={c.label} className="flex items-center gap-3">
                <span className="text-muted-foreground text-xs w-44 shrink-0 truncate">{c.label}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(c.value / maxCategory) * 100}%` }}
                  />
                </div>
                <span className="text-foreground text-xs font-semibold w-6 text-right">{c.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Enrollment by Status */}
        <div className={`bg-card rounded-[12px] ${cardShadow}`}>
          <div className="px-4 py-3 border-b border-border">
            <p className="text-foreground text-sm font-semibold">Enrollment by Status</p>
          </div>
          <div className="p-4 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-xs w-16 shrink-0">Active</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: "89%" }} />
              </div>
              <span className="text-foreground text-xs font-semibold w-24 text-right">2,044 (89%)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-xs w-16 shrink-0">Inactive</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#f87171]" style={{ width: "11%" }} />
              </div>
              <span className="text-foreground text-xs font-semibold w-24 text-right">255 (11%)</span>
            </div>
            {/* Visual donut */}
            <div className="flex items-center gap-6 mt-2">
              <div className="relative w-20 h-20 shrink-0">
                <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#9FE870" strokeWidth="4"
                    strokeDasharray="89 11" strokeDashoffset="0" />
                  <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#f87171" strokeWidth="4"
                    strokeDasharray="11 89" strokeDashoffset="-89" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-foreground text-[11px] font-semibold">2,299</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-muted-foreground text-xs">Active</span>
                  <span className="text-foreground text-xs font-semibold ml-2">89%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#f87171]" />
                  <span className="text-muted-foreground text-xs">Inactive</span>
                  <span className="text-foreground text-xs font-semibold ml-2">11%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 5: Geographic Performance ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Enrollment by Ward */}
        <div className={`bg-card rounded-[12px] ${cardShadow}`}>
          <div className="px-4 py-3 border-b border-border">
            <p className="text-foreground text-sm font-semibold">Enrollment by Ward</p>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {[...communities].sort((a, b) => b.beneficiaries - a.beneficiaries).map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="text-muted-foreground text-xs w-32 shrink-0 truncate">{c.name}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(c.beneficiaries / maxBeneficiaries) * 100}%` }}
                  />
                </div>
                <span className="text-foreground text-xs font-semibold w-10 text-right">{c.beneficiaries}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top LGAs */}
        <div className={`bg-card rounded-[12px] ${cardShadow}`}>
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-foreground text-sm font-semibold">Top LGAs by Enrollment</p>
            <button
              onClick={() => navigate("/admin/wards")}
              className="text-muted-foreground text-[12px] font-medium hover:text-foreground"
            >
              View All
            </button>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {lgaList.map(([lga, count]) => (
              <div
                key={lga}
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => navigate("/admin/wards")}
              >
                <span className="text-muted-foreground text-xs w-32 shrink-0 truncate group-hover:text-foreground transition-colors">{lga}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0a0a0a]"
                    style={{ width: `${(count / maxLga) * 100}%` }}
                  />
                </div>
                <span className="text-foreground text-xs font-semibold w-10 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 6: Facility Overview ── */}
      <div className={`bg-card rounded-[12px] ${cardShadow}`}>
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="text-foreground text-sm font-semibold">Facility Overview</p>
          <button
            onClick={() => navigate("/admin/facilities")}
            className="text-muted-foreground text-[12px] font-medium hover:text-foreground"
          >
            View All
          </button>
        </div>
        {/* Facility KPI row */}
        <div className="grid grid-cols-3 gap-4 p-4 border-b border-[#f5f5f5]">
          {[
            { label: "Total Facilities", value: "10" },
            { label: "Active Facilities", value: String(activeFacilities) },
            { label: "Total Facility Beneficiaries", value: totalFacilityBeneficiaries.toLocaleString() },
          ].map((k) => (
            <div key={k.label} className="flex flex-col gap-1">
              <p className="text-muted-foreground text-xs font-medium">{k.label}</p>
              <p className="text-foreground text-[20px] font-semibold tracking-[-0.4px]">{k.value}</p>
            </div>
          ))}
        </div>
        {/* Top Facilities table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {["Facility", "LGA", "Ward", "Beneficiaries"].map((h) => (
                  <th key={h} className={thCell}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedFacilities.slice(0, 5).map((f) => (
                <tr
                  key={f.id}
                  className="hover:bg-muted/40 cursor-pointer transition-colors"
                  onClick={() => navigate(`/admin/facilities/${f.id}`)}
                >
                  <td className={`${tdCell} font-semibold`}>{f.name}</td>
                  <td className={`${tdCell} text-muted-foreground`}>{f.lga}</td>
                  <td className={`${tdCell} text-muted-foreground`}>{f.ward}</td>
                  <td className={`${tdCell} font-semibold`}>{f.beneficiaries.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 7: Field Worker Performance ── */}
      <div className={`bg-card rounded-[12px] ${cardShadow}`}>
        <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-3">
          <p className="text-foreground text-sm font-semibold">Field Worker Performance</p>
          <div className="flex items-center gap-4 flex-wrap">
            {[
              { label: "Total Field Workers", value: "8" },
              { label: "Active", value: "7" },
              { label: "Total Enrolled", value: totalEnrolled.toLocaleString() },
              { label: "Avg per Worker", value: String(avgPerWorker) },
            ].map((k) => (
              <div key={k.label} className="flex items-center gap-1.5 bg-muted rounded-[8px] px-3 py-1.5">
                <span className="text-muted-foreground text-xs font-medium">{k.label}:</span>
                <span className="text-foreground text-xs font-semibold">{k.value}</span>
              </div>
            ))}
            <button
              onClick={() => navigate("/admin/field-workers")}
              className="text-muted-foreground text-[12px] font-medium hover:text-foreground"
            >
              View All
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {["Field Worker", "Enrolled", "Last Activity", "Status"].map((h) => (
                  <th key={h} className={thCell}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedFieldWorkers.map((fw) => (
                <tr
                  key={fw.id}
                  className="hover:bg-muted/40 cursor-pointer transition-colors"
                  onClick={() => navigate(`/admin/field-workers/${fw.id}`)}
                >
                  <td className={tdCell}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                        <span className="text-primary-foreground text-[12px] font-semibold">
                          {fw.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      <span className="text-foreground text-sm font-medium">{fw.name}</span>
                    </div>
                  </td>
                  <td className={`${tdCell} font-semibold`}>{fw.enrolled}</td>
                  <td className={`${tdCell} text-muted-foreground`}>{fw.lastEnrollment}</td>
                  <td className={tdCell}><StatusBadge status={fw.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 8: Recent Enrollments ── */}
      <div className={`bg-card rounded-[12px] ${cardShadow}`}>
        <div className="flex items-center justify-between px-4 h-[56px] border-b border-border">
          <p className="text-foreground text-sm font-semibold">Recent Enrollments</p>
          <button
            className={btnSecondary}
            onClick={() => navigate("/admin/beneficiaries")}
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {["Beneficiary Name", "Enrollment ID", "Category", "LGA", "Ward", "Facility", "Date", "Status"].map((h) => (
                  <th key={h} className={thCell}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBeneficiaries.map((b) => (
                <tr
                  key={b.id}
                  className="hover:bg-muted/40 cursor-pointer transition-colors"
                  onClick={() => navigate(`/admin/beneficiaries/${b.id}`)}
                >
                  <td className={`${tdCell} font-semibold`}>{b.beneficiaryName}</td>
                  <td className={`${tdCell} text-muted-foreground font-mono text-[13px]`}>{b.enrollmentId}</td>
                  <td className={`${tdCell} text-muted-foreground`}>{b.category}</td>
                  <td className={`${tdCell} text-muted-foreground`}>{b.healthFacility.ward.lga}</td>
                  <td className={`${tdCell} text-muted-foreground`}>{b.healthFacility.ward.name}</td>
                  <td className={`${tdCell} text-muted-foreground`}>{b.healthFacility.name}</td>
                  <td className={`${tdCell} text-muted-foreground`}>{formatEnrollmentDate(b.createdAt)}</td>
                  <td className={tdCell}><StatusBadge status={statusLabel(b.status)} /></td>
                </tr>
              ))}
              {!recentEnrollmentsQuery.isPending && recentBeneficiaries.length === 0 && (
                <tr><td className="px-6 py-10 text-center text-sm text-muted-foreground" colSpan={8}>No recent enrollments are available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
