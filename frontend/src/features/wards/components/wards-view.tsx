import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAdminDataStore } from "@/stores/admin-data.store";
import { StatusBadge } from "@/components/admin/status-badge";
import { cardShadow, btnPrimary, btnSecondary, thCell, tdCell, searchBar, tabGroup } from "@/components/admin/styles";

type ModalType = "add" | "upload" | null;

export function WardsView() {
  const navigate = useNavigate();
  const communities = useAdminDataStore((store) => store.communities);
  const addWard = useAdminDataStore((store) => store.addWard);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modal, setModal] = useState<ModalType>(searchParams.get("action") === "add" ? "add" : null);
  const [form, setForm] = useState({ name: "", state: "", lga: "", status: "Active" });
  const [created, setCreated] = useState<string | null>(null);
  const [uploadStep, setUploadStep] = useState(1);

  const filtered = communities.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.lga.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function handleCreate() {
    addWard({
      id: `C${String(communities.length + 1).padStart(3, "0")}`,
      name: form.name,
      state: form.state,
      lga: form.lga,
      status: form.status,
      beneficiaries: 0,
      fieldWorkers: 0,
      newEnrollments: 0,
      lastActivity: "Just now",
    });
    setCreated(form.name);
    setModal(null);
    setForm({ name: "", state: "", lga: "", status: "Active" });
  }

  return (
    <div className="flex flex-col gap-6 p-6 overflow-auto flex-1" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-[24px] font-semibold tracking-[-0.48px]">Wards</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setModal("upload")}
            className={btnSecondary}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2V10M5 5L8 2L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            Upload CSV
          </button>
          <button
            onClick={() => setModal("add")}
            className={btnPrimary}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3 8H13" stroke="#163300" strokeWidth="2" strokeLinecap="round" /></svg>
            Add Ward
          </button>
        </div>
      </div>

      {created && (
        <div className="flex items-center gap-3 bg-success border border-[#c6ede5] rounded-[8px] px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#287f6e" /><path d="M5 8L7 10L11 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <p className="text-success-foreground text-sm font-semibold">"{created}" community created successfully.</p>
          <button onClick={() => setCreated(null)} className="ml-auto text-success-foreground">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className={searchBar} style={{ flex: "1 1 0", maxWidth: "300px" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="#a3a3a3" strokeWidth="1.5" /><path d="M10.5 10.5L13 13" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <input
            className="flex-1 bg-transparent text-sm font-medium placeholder-[#a3a3a3] outline-none text-foreground"
            placeholder="Search wards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={tabGroup}>
          {["All", "Active", "Inactive"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 h-[40px] rounded-[100px] text-[12px] font-semibold tracking-[0.24px] transition-colors ${
                statusFilter === s
                  ? "bg-[#0a0a0a] text-white"
                  : "text-muted-foreground hover:bg-[#ebebeb]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="ml-auto text-muted-foreground text-sm font-medium">{filtered.length} wards</div>
      </div>

      {/* Table */}
      <div className={`bg-card rounded-[12px] ${cardShadow} overflow-hidden`}>
        <table className="w-full">
          <thead>
            <tr>
              <th className={thCell + " w-10"}>
                <div className="w-5 h-5 rounded-[3px] border border-border bg-card" />
              </th>
              {["Ward Name", "State", "LGA", "Field Workers", "Beneficiaries", "New Enrollments", "Status", "Actions"].map((h) => (
                <th key={h} className={thCell}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                className="hover:bg-muted/40 transition-colors"
              >
                <td className={tdCell}>
                  <div className="w-5 h-5 rounded-[3px] border border-border bg-card" />
                </td>
                <td
                  className={tdCell + " font-semibold cursor-pointer hover:text-primary-foreground"}
                  onClick={() => navigate(`/admin/wards/${c.id}`)}
                >
                  {c.name}
                </td>
                <td className={tdCell + " text-muted-foreground"}>{c.state}</td>
                <td className={tdCell + " text-muted-foreground"}>{c.lga}</td>
                <td className={tdCell}>{c.fieldWorkers}</td>
                <td className={tdCell + " font-semibold"}>{c.beneficiaries.toLocaleString()}</td>
                <td className={tdCell + " text-success-foreground font-semibold"}>+{c.newEnrollments}</td>
                <td className={tdCell}><StatusBadge status={c.status} /></td>
                <td className={tdCell}>
                  <button
                    onClick={() => navigate(`/admin/wards/${c.id}`)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="8" r="1.5" fill="currentColor" /><circle cx="8" cy="8" r="1.5" fill="currentColor" /><circle cx="13" cy="8" r="1.5" fill="currentColor" /></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-muted-foreground text-sm">Page 1 of 1</p>
          <div className="flex items-center gap-1">
            {[1].map((p) => (
              <button key={p} className="w-8 h-8 rounded-[6px] bg-[#0a0a0a] text-white text-sm font-semibold">{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Add Ward Modal */}
      {modal === "add" && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setModal(null)}>
          <div className="bg-card rounded-[16px] shadow-2xl w-[480px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="text-foreground text-lg font-semibold">Add Ward</h2>
              <button onClick={() => setModal(null)} className="text-muted-foreground hover:text-foreground">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              {[
                { label: "Ward Name", key: "name", required: true, placeholder: "e.g. Gwagwalada Central" },
                { label: "State", key: "state", required: true, placeholder: "e.g. FCT" },
                { label: "LGA", key: "lga", required: true, placeholder: "e.g. Gwagwalada" },
              ].map(({ label, key, required, placeholder }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-foreground text-sm font-semibold">
                    {label} {required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    className="w-full border border-border rounded-[8px] px-3 py-2.5 text-sm text-foreground placeholder-[#a3a3a3] outline-none focus:border-[#9FE870] focus:ring-2 focus:ring-[#9FE870]/20 transition-all"
                    placeholder={placeholder}
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-sm font-semibold">Status <span className="text-red-500">*</span></label>
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
            <div className="flex items-center gap-3 px-6 pb-6">
              <button onClick={() => setModal(null)} className={btnSecondary + " flex-1 justify-center"}>Cancel</button>
              <button
                onClick={handleCreate}
                disabled={!form.name || !form.state || !form.lga}
                className={btnPrimary + " flex-1 justify-center disabled:opacity-50"}
              >
                Create Ward
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload CSV Modal */}
      {modal === "upload" && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => { setModal(null); setUploadStep(1); }}>
          <div className="bg-card rounded-[16px] shadow-2xl w-[560px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="text-foreground text-lg font-semibold">Upload Wards CSV</h2>
              <button onClick={() => { setModal(null); setUploadStep(1); }} className="text-muted-foreground hover:text-foreground">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>

            {/* Steps indicator */}
            <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
              {["Upload", "Validate", "Review", "Import", "Results"].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                    uploadStep > i + 1 ? "bg-primary text-primary-foreground" : uploadStep === i + 1 ? "bg-[#0a0a0a] text-white" : "bg-muted text-muted-foreground"
                  }`}>{uploadStep > i + 1 ? "✓" : i + 1}</div>
                  <span className={`text-xs font-medium ${uploadStep === i + 1 ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
                  {i < 4 && <div className="w-4 h-px bg-[#e5e5e5]" />}
                </div>
              ))}
            </div>

            <div className="p-6">
              {uploadStep === 1 && (
                <div className="border-2 border-dashed border-border rounded-[12px] p-8 flex flex-col items-center gap-4">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3V15M8 7L12 3L16 7" stroke="#163300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M3 18H21" stroke="#163300" strokeWidth="2" strokeLinecap="round" /></svg>
                  </div>
                  <div className="text-center">
                    <p className="text-foreground text-sm font-semibold">Drag and drop your CSV file here</p>
                    <p className="text-muted-foreground text-sm mt-1">or click to browse files</p>
                  </div>
                  <button className="cursor-not-allowed text-sm font-medium text-muted-foreground underline opacity-50" disabled title="Template download is not available in the mock app">Download CSV Template</button>
                </div>
              )}
              {uploadStep === 2 && (
                <div className="flex flex-col gap-4">
                  <p className="text-foreground text-sm font-medium">Validating 24 rows…</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ label: "Total Rows", val: "24", color: "text-foreground" }, { label: "Valid Rows", val: "21", color: "text-success-foreground" }, { label: "Invalid Rows", val: "2", color: "text-red-500" }, { label: "Duplicates", val: "1", color: "text-amber-600" }].map(({ label, val, color }) => (
                      <div key={label} className="bg-muted/40 border border-border rounded-[8px] p-3">
                        <p className="text-muted-foreground text-xs font-medium">{label}</p>
                        <p className={`text-2xl font-semibold ${color}`}>{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {uploadStep === 3 && (
                <div className="flex flex-col gap-3">
                  <p className="text-foreground text-sm font-semibold">Row-level errors</p>
                  {[{ row: 5, error: "Missing LGA field" }, { row: 12, error: "Invalid state code 'FCT-X'" }, { row: 18, error: "Duplicate: 'Kuje Central' already exists" }].map(({ row, error }) => (
                    <div key={row} className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-[8px] px-3 py-2">
                      <span className="text-red-600 text-xs font-semibold">Row {row}</span>
                      <span className="text-red-600 text-sm">{error}</span>
                    </div>
                  ))}
                  <p className="text-muted-foreground text-sm mt-2">You can continue with 21 valid records or fix the source file.</p>
                </div>
              )}
              {uploadStep === 4 && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center animate-pulse">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 4V12M8 8L12 4L16 8" stroke="#163300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <p className="text-foreground text-sm font-semibold">Importing 21 wards…</p>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full w-2/3 transition-all" />
                  </div>
                </div>
              )}
              {uploadStep === 5 && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-success-foreground">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" fill="#EFFEFA" stroke="#287f6e" strokeWidth="1.5" /><path d="M6 10L9 13L14 7" stroke="#287f6e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span className="font-semibold">Import complete</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ label: "Imported", val: "21", color: "text-success-foreground" }, { label: "Failed", val: "2", color: "text-red-500" }, { label: "Duplicates Skipped", val: "1", color: "text-amber-600" }, { label: "Total Processed", val: "24", color: "text-foreground" }].map(({ label, val, color }) => (
                      <div key={label} className="bg-muted/40 border border-border rounded-[8px] p-3">
                        <p className="text-muted-foreground text-xs font-medium">{label}</p>
                        <p className={`text-2xl font-semibold ${color}`}>{val}</p>
                      </div>
                    ))}
                  </div>
                  <button className="cursor-not-allowed text-sm font-medium text-muted-foreground underline opacity-50" disabled title="Error report download is not available in the mock app">Download Error Report</button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 px-6 pb-6">
              {uploadStep > 1 && (
                <button onClick={() => setUploadStep(uploadStep - 1)} className={btnSecondary}>Back</button>
              )}
              {uploadStep < 5 ? (
                <button onClick={() => setUploadStep(uploadStep + 1)} className={btnPrimary + " flex-1 justify-center"}>
                  {uploadStep === 1 ? "Upload File" : uploadStep === 2 ? "Review Errors" : uploadStep === 3 ? "Import Valid Records" : "Continue"}
                </button>
              ) : (
                <button onClick={() => { setModal(null); setUploadStep(1); }} className={btnPrimary + " flex-1 justify-center"}>Done</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
