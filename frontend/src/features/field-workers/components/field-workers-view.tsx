import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAdminDataStore } from "@/stores/admin-data.store";
import { StatusBadge } from "@/components/admin/status-badge";
import { cardShadow, btnPrimary, btnSecondary, thCell, tdCell, searchBar } from "@/components/admin/styles";

export function FieldWorkersView() {
  const navigate = useNavigate();
  const fieldWorkers = useAdminDataStore((store) => store.fieldWorkers);
  const communities = useAdminDataStore((store) => store.communities);
  const addFieldWorker = useAdminDataStore((store) => store.addFieldWorker);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(searchParams.get("action") === "add");
  const [form, setForm] = useState({ name: "", phone: "", email: "", community: "", status: "Active" });
  const [created, setCreated] = useState<string | null>(null);

  const filtered = fieldWorkers.filter((fw) => {
    const matchSearch = fw.name.toLowerCase().includes(search.toLowerCase()) || fw.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || fw.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function handleCreate() {
    const community = communities.find((ward) => ward.name === form.community);
    addFieldWorker({
      id: `FW${String(fieldWorkers.length + 1).padStart(3, "0")}`,
      name: form.name,
      phone: form.phone,
      email: form.email,
      community: form.community,
      communityId: community?.id ?? "",
      enrolled: 0,
      lastEnrollment: "No enrollments",
      lastSync: "Never",
      status: form.status,
    });
    setCreated(form.name);
    setShowAdd(false);
    setForm({ name: "", phone: "", email: "", community: "", status: "Active" });
  }

  return (
    <div className="flex flex-col gap-6 p-6 overflow-auto flex-1" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-[24px] font-semibold tracking-[-0.48px]">Field Workers</h1>
        <div className="flex gap-2">
          <button className={btnSecondary} disabled title="Bulk upload is not available in the mock app">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2V10M5 5L8 2L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            Upload CSV
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className={btnPrimary}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            Add Field Worker
          </button>
        </div>
      </div>

      {created && (
        <div className="flex items-center gap-3 bg-success border border-[#c6ede5] rounded-[8px] px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#287f6e" /><path d="M5 8L7 10L11 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <p className="text-success-foreground text-sm font-semibold">Field Worker "{created}" created successfully.</p>
          <button onClick={() => setCreated(null)} className="ml-auto text-success-foreground">×</button>
        </div>
      )}

      {/* Tabs + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className={searchBar + " flex-1 max-w-[300px]"}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="#a3a3a3" strokeWidth="1.5" /><path d="M10.5 10.5L13 13" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <input
            className="flex-1 bg-transparent text-sm font-medium placeholder-[#a3a3a3] outline-none text-foreground"
            placeholder="Search field workers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {["All", "Active", "Inactive"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-[100px] h-[40px] px-4 text-sm font-semibold transition-colors ${
              statusFilter === s ? "bg-[#0a0a0a] text-white" : "bg-card border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {s}
          </button>
        ))}
        <div className="ml-auto text-muted-foreground text-sm font-medium">{filtered.length} workers</div>
      </div>

      <div className={`bg-card rounded-[12px] ${cardShadow} overflow-hidden`}>
        <table className="w-full">
          <thead>
            <tr>
              <th className={thCell + " w-10"}><div className="w-5 h-5 rounded-[3px] border border-border bg-card" /></th>
              {["Field Worker", "Phone / Email", "Community", "Beneficiaries Enrolled", "Last Enrollment", "Last Sync", "Status", ""].map((h, i) => (
                <th key={i} className={thCell}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((fw) => (
              <tr
                key={fw.id}
                className="hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() => navigate(`/admin/field-workers/${fw.id}`)}
              >
                <td className={tdCell} onClick={(e) => e.stopPropagation()}><div className="w-5 h-5 rounded-[3px] border border-border bg-card" /></td>
                <td className={tdCell}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <span className="text-primary-foreground text-xs font-semibold">{fw.name.split(" ").map((n) => n[0]).join("")}</span>
                    </div>
                    <span className="text-foreground text-sm font-semibold">{fw.name}</span>
                  </div>
                </td>
                <td className={tdCell}>
                  <p className="text-foreground text-sm">{fw.phone}</p>
                  <p className="text-muted-foreground text-xs">{fw.email}</p>
                </td>
                <td className={tdCell + " text-muted-foreground"}>{fw.community}</td>
                <td className={tdCell + " font-semibold"}>{fw.enrolled}</td>
                <td className={tdCell + " text-muted-foreground"}>{fw.lastEnrollment}</td>
                <td className={tdCell + " text-muted-foreground"}>{fw.lastSync}</td>
                <td className={tdCell}><StatusBadge status={fw.status} /></td>
                <td className={tdCell}>
                  <button onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="8" r="1.5" fill="currentColor" /><circle cx="8" cy="8" r="1.5" fill="currentColor" /><circle cx="13" cy="8" r="1.5" fill="currentColor" /></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#f5f5f5]">
          <p className="text-muted-foreground text-sm">Page 1 of 1</p>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 rounded-[6px] bg-[#0a0a0a] text-white text-sm font-semibold">1</button>
          </div>
        </div>
      </div>

      {/* Add Field Worker Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-card rounded-[16px] shadow-2xl w-[480px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="text-foreground text-lg font-semibold">Add Field Worker</h2>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              {[
                { label: "Full Name", key: "name", required: true, placeholder: "e.g. Amina Yusuf" },
                { label: "Phone Number", key: "phone", required: true, placeholder: "e.g. +234 803 456 7890" },
                { label: "Email / Username", key: "email", required: true, placeholder: "e.g. amina.yusuf@cbhi.ng" },
              ].map(({ label, key, required, placeholder }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-foreground text-sm font-semibold">{label} {required && <span className="text-red-500">*</span>}</label>
                  <input
                    className="w-full border border-border rounded-[8px] px-3 py-2.5 text-sm text-foreground placeholder-[#a3a3a3] outline-none focus:border-[#9FE870] focus:ring-2 focus:ring-[#9FE870]/20"
                    placeholder={placeholder}
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-sm font-semibold">Assigned Community <span className="text-red-500">*</span></label>
                <select
                  className="w-full border border-border rounded-[8px] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[#9FE870] bg-card"
                  value={form.community}
                  onChange={(e) => setForm({ ...form, community: e.target.value })}
                >
                  <option value="">Select community</option>
                  {communities.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-sm font-semibold">Account Status</label>
                <select
                  className="w-full border border-border rounded-[8px] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[#9FE870] bg-card"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowAdd(false)} className={btnSecondary + " flex-1 justify-center"}>Cancel</button>
              <button
                onClick={handleCreate}
                disabled={!form.name || !form.phone || !form.email}
                className={btnPrimary + " flex-1 justify-center disabled:opacity-50"}
              >
                Create Field Worker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
