import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminDataStore } from "@/stores/admin-data.store";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  cardShadow,
  btnPrimary,
  btnSecondary,
  thCell,
  tdCell,
  searchBar,
  tabGroup,
} from "@/components/admin/styles";

const plateauLGAs = [
  "Barikin Ladi","Bassa","Bokkos","Jos East","Jos North","Jos South",
  "Kanam","Kanke","Langtang North","Langtang South","Mangu","Mikang",
  "Pankshin","Qua'an Pan","Riyom","Shendam","Wase",
];

const facilityTypes = [
  "Primary Health Centre","Clinic","Hospital",
  "Specialist Hospital","Maternity Centre","Diagnostic Centre",
];

const inputCls =
  "w-full border border-border rounded-[8px] px-3 py-2.5 text-sm outline-none focus:border-[#9FE870] bg-card";
const labelCls = "block text-foreground text-[13px] font-medium mb-1";
const sectionHeadCls =
  "text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.5px] mb-3";

type ModalType = "add" | "upload" | null;

const emptyForm = {
  name: "",
  code: "",
  type: "",
  level: "",
  ownership: "",
  state: "Plateau",
  lga: "",
  ward: "",
  community: "",
  address: "",
  contactPerson: "",
  phone: "",
  email: "",
  status: "Active",
  onboardingDate: "",
};

const uploadPreviewRows = [
  { code: "HCP/BAS/P/011", name: "Bassa PHC", type: "Primary Health Centre", lga: "Bassa", error: "" },
  { code: "HCP/BKS/P/012", name: "Bokkos Clinic", type: "Clinic", lga: "Bokkos", error: "Duplicate code" },
  { code: "HCP/KAN/G/013", name: "Kanam General Hospital", type: "Hospital", lga: "Kanam", error: "Missing level" },
  { code: "HCP/WAS/P/014", name: "Wase PHC", type: "Primary Health Centre", lga: "Wase", error: "" },
];

export function FacilitiesView() {
  const navigate = useNavigate();
  const facilities = useAdminDataStore((store) => store.facilities);
  const addFacility = useAdminDataStore((store) => store.addFacility);
  const [search, setSearch] = useState("");
  const [lgaFilter, setLgaFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modal, setModal] = useState<ModalType>(null);
  const [form, setForm] = useState(emptyForm);
  const [addSuccess, setAddSuccess] = useState(false);
  const [uploadStep, setUploadStep] = useState(1);
  const [uploadFilter, setUploadFilter] = useState("Show All");
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = facilities.filter((f) => {
    const q = search.toLowerCase();
    const matchSearch =
      f.name.toLowerCase().includes(q) ||
      f.code.toLowerCase().includes(q) ||
      f.lga.toLowerCase().includes(q);
    const matchLga = !lgaFilter || f.lga === lgaFilter;
    const matchType = !typeFilter || f.type === typeFilter;
    const matchStatus = statusFilter === "All" || f.status === statusFilter;
    return matchSearch && matchLga && matchType && matchStatus;
  });

  const totalFacilities = facilities.length;
  const activeFacilities = facilities.filter((f) => f.status === "Active").length;
  const totalBeneficiaries = facilities.reduce((s, f) => s + f.beneficiaries, 0);

  function openModal(m: ModalType) {
    setModal(m);
    setAddSuccess(false);
    setUploadStep(1);
    setFileName("");
    setUploadFilter("Show All");
    setForm(emptyForm);
  }

  function closeModal() {
    setModal(null);
    setAddSuccess(false);
    setOpenMenu(null);
  }

  function handleAddFacility() {
    addFacility({
      ...form,
      id: `FAC${String(facilities.length + 1).padStart(3, "0")}`,
      beneficiaries: 0,
      onboardingDate: form.onboardingDate || "Today",
    });
    setAddSuccess(true);
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) { setFileName(file.name); setUploadStep(2); }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) { setFileName(file.name); setUploadStep(2); }
  }

  const previewFiltered = uploadPreviewRows.filter((r) => {
    if (uploadFilter === "Valid") return !r.error;
    if (uploadFilter === "Errors") return r.error === "Missing level";
    if (uploadFilter === "Duplicates") return r.error === "Duplicate code";
    return true;
  });

  return (
    <div
      className="flex flex-col gap-6 p-6 overflow-auto flex-1"
      style={{ fontFamily: "'Inter Tight', sans-serif" }}
      onClick={() => openMenu && setOpenMenu(null)}
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-foreground text-[24px] font-semibold tracking-[-0.48px]">Facilities</h1>
          <p className="text-muted-foreground text-[14px] mt-0.5">Manage healthcare facilities participating in the programme.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openModal("upload")} className={btnSecondary}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2V10M5 5L8 2L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Upload Facilities
          </button>
          <button onClick={() => openModal("add")} className={btnPrimary}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M3 8H13" stroke="#163300" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Add Facility
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Facilities", value: totalFacilities },
          { label: "Active Facilities", value: activeFacilities },
          { label: "Total Beneficiaries", value: totalBeneficiaries.toLocaleString() },
        ].map((kpi) => (
          <div key={kpi.label} className={`bg-card rounded-[12px] p-5 flex flex-col gap-1 ${cardShadow}`}>
            <p className="text-muted-foreground text-[13px] font-medium">{kpi.label}</p>
            <p className="text-foreground text-[28px] font-semibold tracking-[-0.56px]">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className={searchBar} style={{ flex: "1 1 0", maxWidth: "280px" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="#a3a3a3" strokeWidth="1.5" />
            <path d="M10.5 10.5L13 13" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            className="flex-1 bg-transparent text-sm font-medium placeholder-[#a3a3a3] outline-none text-foreground"
            placeholder="Search facilities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={lgaFilter}
          onChange={(e) => setLgaFilter(e.target.value)}
          className="h-[40px] px-3 border border-border rounded-[100px] text-[13px] font-medium text-foreground bg-card outline-none"
        >
          <option value="">All LGAs</option>
          {plateauLGAs.map((l) => <option key={l}>{l}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-[40px] px-3 border border-border rounded-[100px] text-[13px] font-medium text-foreground bg-card outline-none"
        >
          <option value="">All Types</option>
          {facilityTypes.map((t) => <option key={t}>{t}</option>)}
        </select>
        <div className={tabGroup}>
          {["All", "Active", "Inactive"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 h-[40px] rounded-[100px] text-[12px] font-semibold tracking-[0.24px] transition-colors ${
                statusFilter === s ? "bg-[#0a0a0a] text-white" : "text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="text-muted-foreground text-[13px] font-medium ml-auto">{filtered.length} facilities</span>
      </div>

      {/* Table */}
      <div className={`bg-card rounded-[12px] overflow-hidden ${cardShadow}`}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Facility Code","Facility Name","Type","Level","LGA","Beneficiaries","Status","Actions"].map((h) => (
                  <th key={h} className={thCell}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr
                  key={f.id}
                  className="hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/facilities/${f.id}`)}
                >
                  <td className={tdCell}>
                    <span className="font-mono text-[13px] text-muted-foreground">{f.code}</span>
                  </td>
                  <td className={tdCell}>
                    <span className="font-semibold text-foreground hover:text-primary-foreground">{f.name}</span>
                  </td>
                  <td className={tdCell}>
                    <span className="text-muted-foreground">{f.type}</span>
                  </td>
                  <td className={tdCell}>
                    <span className="text-muted-foreground">{f.level}</span>
                  </td>
                  <td className={tdCell}>
                    <span className="text-muted-foreground">{f.lga}</span>
                  </td>
                  <td className={tdCell}>
                    <span>{f.beneficiaries.toLocaleString()}</span>
                  </td>
                  <td className={tdCell}>
                    <StatusBadge status={f.status} />
                  </td>
                  <td className={`${tdCell} relative`} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setOpenMenu(openMenu === f.id ? null : f.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="3" r="1.2" fill="#737373" />
                        <circle cx="8" cy="8" r="1.2" fill="#737373" />
                        <circle cx="8" cy="13" r="1.2" fill="#737373" />
                      </svg>
                    </button>
                    {openMenu === f.id && (
                      <div className="absolute right-4 top-10 z-20 bg-card rounded-[10px] shadow-[0px_8px_24px_rgba(0,0,0,0.12),0px_0px_0px_1px_#e5e5e5] py-1 min-w-[180px]">
                        {[
                          { label: "View Facility", action: () => navigate(`/admin/facilities/${f.id}`) },
                          { label: "Edit Facility", action: () => {} },
                          { label: "View Beneficiaries", action: () => {} },
                          { label: f.status === "Active" ? "Deactivate" : "Activate", action: () => {} },
                        ].map((item) => (
                          <button
                            key={item.label}
                            onClick={() => { item.action(); setOpenMenu(null); }}
                            className={`w-full text-left px-4 py-2.5 text-[13px] font-medium hover:bg-muted transition-colors ${
                              item.label === "Deactivate" ? "text-[#ef4444]" : "text-foreground"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground text-[14px]">
                    No facilities found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Facility Modal */}
      {modal === "add" && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={closeModal}>
          <div
            className="bg-card rounded-[16px] w-full max-w-[560px] max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-foreground text-[16px] font-semibold tracking-[-0.32px]">Add Facility</h2>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4L12 12M12 4L4 12" stroke="#737373" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {addSuccess ? (
              <div className="flex flex-col items-center gap-4 py-12 px-8 text-center">
                <div className="w-14 h-14 rounded-full bg-success flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="13" fill="#287f6e" />
                    <path d="M8 14L12 18L20 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-foreground text-[17px] font-semibold tracking-[-0.34px]">Facility added successfully</p>
                  <p className="text-muted-foreground text-[13px] mt-1 max-w-[360px]">
                    The facility is now available for beneficiary assignment and programme operations.
                  </p>
                </div>
                <div className="flex gap-2 mt-2">
                  <button className={btnSecondary} onClick={closeModal}>View Facility</button>
                  <button
                    className={btnPrimary}
                    onClick={() => { setAddSuccess(false); setForm(emptyForm); }}
                  >
                    Add Another Facility
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-auto flex-1 px-6 py-5 flex flex-col gap-6">
                  {/* Basic Information */}
                  <div>
                    <p className={sectionHeadCls}>Basic Information</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className={labelCls}>Facility Name <span className="text-red-500">*</span></label>
                        <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Tudun Wada PHC" />
                      </div>
                      <div>
                        <label className={labelCls}>Facility Code <span className="text-red-500">*</span></label>
                        <input className={inputCls} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. HCP/JOS/N/011" />
                      </div>
                      <div>
                        <label className={labelCls}>Facility Type <span className="text-red-500">*</span></label>
                        <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                          <option value="">Select type</option>
                          {facilityTypes.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Facility Level</label>
                        <select className={inputCls} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                          <option value="">Select level</option>
                          {["Primary","Secondary","Tertiary"].map((l) => <option key={l}>{l}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Ownership Type</label>
                        <select className={inputCls} value={form.ownership} onChange={(e) => setForm({ ...form, ownership: e.target.value })}>
                          <option value="">Select ownership</option>
                          {["Public","Private","Faith-Based","Other"].map((o) => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <p className={sectionHeadCls}>Location</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>State</label>
                        <select className={inputCls} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
                          <option>Plateau</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>LGA</label>
                        <select className={inputCls} value={form.lga} onChange={(e) => setForm({ ...form, lga: e.target.value })}>
                          <option value="">Select LGA</option>
                          {plateauLGAs.map((l) => <option key={l}>{l}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Ward</label>
                        <input className={inputCls} value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} placeholder="Ward name" />
                      </div>
                      <div>
                        <label className={labelCls}>Community</label>
                        <input className={inputCls} value={form.community} onChange={(e) => setForm({ ...form, community: e.target.value })} placeholder="Community name" />
                      </div>
                      <div className="col-span-2">
                        <label className={labelCls}>Address</label>
                        <textarea
                          className={`${inputCls} resize-none h-[80px]`}
                          value={form.address}
                          onChange={(e) => setForm({ ...form, address: e.target.value })}
                          placeholder="Full address"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <p className={sectionHeadCls}>Contact Information</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className={labelCls}>Contact Person</label>
                        <input className={inputCls} value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="e.g. Dr. Fatima Suleiman" />
                      </div>
                      <div>
                        <label className={labelCls}>Phone Number</label>
                        <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234 803 000 0000" />
                      </div>
                      <div>
                        <label className={labelCls}>Email Address</label>
                        <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="facility@example.ng" />
                      </div>
                    </div>
                  </div>

                  {/* Programme Information */}
                  <div>
                    <p className={sectionHeadCls}>Programme Information</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Status</label>
                        <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                          <option>Active</option>
                          <option>Inactive</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Onboarding Date</label>
                        <input type="date" className={inputCls} value={form.onboardingDate} onChange={(e) => setForm({ ...form, onboardingDate: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
                  <button onClick={closeModal} className={btnSecondary}>Cancel</button>
                  <button
                    onClick={handleAddFacility}
                    disabled={!form.name || !form.code || !form.type}
                    className={`${btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Add Facility
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Upload Facilities Modal */}
      {modal === "upload" && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={closeModal}>
          <div
            className="bg-card rounded-[16px] w-full max-w-[560px] max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-4">
                <h2 className="text-foreground text-[16px] font-semibold tracking-[-0.32px]">Upload Facilities</h2>
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center gap-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                        uploadStep >= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>{step}</div>
                      {step < 3 && <div className={`w-8 h-[2px] rounded ${uploadStep > step ? "bg-primary" : "bg-[#e5e5e5]"}`} />}
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4L12 12M12 4L4 12" stroke="#737373" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="overflow-auto flex-1 px-6 py-5">
              {uploadStep === 1 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <p className="text-foreground text-[15px] font-semibold">Upload facility data</p>
                    <p className="text-muted-foreground text-[13px] mt-1">
                      Upload a CSV or XLSX file to import multiple facilities at once.{" "}
                      <button className="cursor-not-allowed font-semibold text-muted-foreground underline underline-offset-2" disabled title="Template download is not available in the mock app">Download Template</button>
                    </p>
                  </div>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-[12px] p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
                      dragging ? "border-[#9fe870] bg-[#f6fff0]" : "border-border hover:border-[#9fe870] hover:bg-muted/40"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 4V16M8 8L12 4L16 8" stroke="#737373" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4 18H20" stroke="#737373" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-foreground text-[14px] font-medium">Drag and drop your file here</p>
                      <p className="text-muted-foreground text-[12px] mt-0.5">or</p>
                      <p className="text-primary-foreground text-[13px] font-semibold mt-0.5">Browse Files</p>
                    </div>
                    <p className="text-muted-foreground text-[12px]">Supports CSV, XLSX</p>
                    <input ref={fileInputRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={handleFileChange} />
                  </div>
                </div>
              )}

              {uploadStep === 2 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <p className="text-foreground text-[15px] font-semibold">Validation results</p>
                    <p className="text-muted-foreground text-[13px] mt-1">
                      File: <span className="text-foreground font-medium">{fileName || "facilities.csv"}</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                    {[
                      { label: "Total", value: 250, color: "text-foreground", bg: "bg-muted" },
                      { label: "Valid", value: 238, color: "text-success-foreground", bg: "bg-success" },
                      { label: "Errors", value: 8, color: "text-[#ef4444]", bg: "bg-[#fef2f2]" },
                      { label: "Duplicates", value: 4, color: "text-[#f59e0b]", bg: "bg-[#fffbeb]" },
                    ].map((s) => (
                      <div key={s.label} className={`${s.bg} rounded-[10px] p-3 text-center`}>
                        <p className={`text-[22px] font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-[11px] font-medium text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className={tabGroup}>
                      {["Show All", "Valid", "Errors", "Duplicates"].map((f) => (
                        <button
                          key={f}
                          onClick={() => setUploadFilter(f)}
                          className={`px-3 h-[36px] rounded-[8px] text-[12px] font-semibold transition-colors ${
                            uploadFilter === f ? "bg-[#0a0a0a] text-white" : "text-muted-foreground"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                    <button className={`${btnSecondary} text-[12px] h-[36px] px-3`} disabled title="Error report download is not available in the mock app">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M8 2V10M5 7L8 10L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 13H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      Download Error Report
                    </button>
                  </div>
                  <div className="overflow-x-auto rounded-[8px] border border-border">
                    <table className="w-full border-collapse text-[13px]">
                      <thead>
                        <tr>
                          {["Code","Facility Name","Type","LGA","Status"].map((h) => (
                            <th key={h} className="bg-muted/40 border-b border-border text-left px-3 py-2 text-[11px] font-medium text-muted-foreground tracking-[0.22px] whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewFiltered.map((r, i) => (
                          <tr key={i} className={r.error ? "bg-[#fef9f9]" : ""}>
                            <td className="border-b border-border px-3 py-2.5 font-mono text-[12px] text-muted-foreground">{r.code}</td>
                            <td className="border-b border-border px-3 py-2.5 font-medium text-foreground">{r.name}</td>
                            <td className="border-b border-border px-3 py-2.5 text-muted-foreground">{r.type}</td>
                            <td className="border-b border-border px-3 py-2.5 text-muted-foreground">{r.lga}</td>
                            <td className="border-b border-border px-3 py-2.5">
                              {r.error ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#ef4444] bg-[#fef2f2] rounded-full px-2 py-0.5">{r.error}</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success-foreground bg-success rounded-full px-2 py-0.5">Valid</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {uploadStep === 3 && (
                <div className="flex flex-col items-center gap-5 py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <circle cx="16" cy="16" r="15" fill="#287f6e" />
                      <path d="M9 16L14 21L23 11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-foreground text-[18px] font-semibold tracking-[-0.36px]">Facilities uploaded successfully</p>
                    <p className="text-muted-foreground text-[13px] mt-1">Your facility data has been processed and imported.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 w-full max-w-[360px]">
                    {[
                      { label: "Added", value: 238, color: "text-success-foreground", bg: "bg-success" },
                      { label: "Failed", value: 8, color: "text-[#ef4444]", bg: "bg-[#fef2f2]" },
                      { label: "Skipped", value: 4, color: "text-[#f59e0b]", bg: "bg-[#fffbeb]" },
                    ].map((s) => (
                      <div key={s.label} className={`${s.bg} rounded-[10px] py-3 text-center`}>
                        <p className={`text-[22px] font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-[11px] font-medium text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 w-full items-center">
                    <button className={btnPrimary} onClick={closeModal}>View Facilities</button>
                    <button className={btnSecondary} disabled title="Error report download is not available in the mock app">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M8 2V10M5 7L8 10L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 13H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      Download Error Report
                    </button>
                    <button
                      className="text-muted-foreground text-[13px] font-medium hover:text-foreground transition-colors"
                      onClick={() => { setUploadStep(1); setFileName(""); }}
                    >
                      Upload Another File
                    </button>
                  </div>
                </div>
              )}
            </div>

            {uploadStep < 3 && (
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
                {uploadStep === 2 ? (
                  <>
                    <button onClick={() => setUploadStep(1)} className={btnSecondary}>Back</button>
                    <button onClick={() => setUploadStep(3)} className={btnPrimary}>
                      Import 238 Valid Facilities
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={closeModal} className={btnSecondary}>Cancel</button>
                    {fileName && (
                      <button onClick={() => setUploadStep(2)} className={btnPrimary}>
                        Validate File
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
