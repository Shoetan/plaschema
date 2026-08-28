import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { cardShadow, btnPrimary, btnSecondary, thCell, tdCell, searchBar, tabGroup } from "@/components/admin/styles";
import { useAdminDataStore } from "@/stores/admin-data.store";
import { capitationRecords as initialCapitationRecords } from "@/mocks/admin-data";
import { StatusBadge } from "@/components/admin/status-badge";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const YEARS = [2024, 2025, 2026, 2027];
const LGAS = [...new Set(initialCapitationRecords.map((r) => r.lga))].sort();
const STATUS_TABS = ["All", "Paid", "Partially Paid", "Unpaid", "Approved", "Generated"];
const CAPITATION_RATE = 570;
const PAGE_SIZE = 10;

function formatNGN(amount: number) {
  return "₦" + amount.toLocaleString();
}

const selectCls = "border border-border rounded-[8px] px-3 py-2 text-sm bg-card outline-none focus:border-[#9fe870] transition-colors text-foreground";

// ─── Icons ───────────────────────────────────────────────────────────────────

function PrinterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 5V2h8v3M4 11H2V6h12v5h-2M4 9h8v5H4V9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2v8M5 7l3 3 3-3M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M3 8h10" stroke="#163300" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="4" r="1.2" fill="#737373" />
      <circle cx="8" cy="8" r="1.2" fill="#737373" />
      <circle cx="8" cy="12" r="1.2" fill="#737373" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <circle cx="28" cy="28" r="28" fill="#effefa" />
      <circle cx="28" cy="28" r="20" fill="#c6ede5" />
      <path d="M19 28l6 6 12-12" stroke="#287f6e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="5" stroke="#737373" strokeWidth="1.5" />
      <path d="M11 11L14 14" stroke="#737373" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function EmptyStateIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <rect width="80" height="80" rx="40" fill="#f5f5f5" />
      <rect x="18" y="26" width="44" height="32" rx="4" fill="#e5e5e5" />
      <rect x="24" y="32" width="20" height="3" rx="1.5" fill="#a3a3a3" />
      <rect x="24" y="39" width="32" height="3" rx="1.5" fill="#d4d4d4" />
      <rect x="24" y="46" width="26" height="3" rx="1.5" fill="#d4d4d4" />
    </svg>
  );
}

// ─── Modal Shell ─────────────────────────────────────────────────────────────

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-card rounded-[16px] w-full max-w-[560px] flex flex-col max-h-[88vh] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, step, totalSteps, onClose }: { title: string; step?: number; totalSteps?: number; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
      <div>
        <h2 className="text-foreground text-[16px] font-semibold">{title}</h2>
        {step !== undefined && totalSteps !== undefined && (
          <p className="text-muted-foreground text-[12px] font-medium mt-0.5">Step {step} of {totalSteps}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

function ModalBody({ children }: { children: React.ReactNode }) {
  return <div className="overflow-auto flex-1 px-6 py-5">{children}</div>;
}

function ModalFooter({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">{children}</div>;
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all ${i < current ? "bg-primary w-6" : i === current ? "bg-[#163300] w-6" : "bg-[#e5e5e5] w-4"}`}
        />
      ))}
    </div>
  );
}

// ─── Generate Modal ───────────────────────────────────────────────────────────

type GenScope = "all" | "lga" | "specific";

function GenerateModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0); // 0–3 wizard, 4 = success
  const [month, setMonth] = useState("August");
  const [year, setYear] = useState(2026);
  const [scope, setScope] = useState<GenScope>("all");
  const [selectedLGAs, setSelectedLGAs] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const TOTAL_STEPS = 4;

  const totalBen = 1913;
  const totalCap = totalBen * CAPITATION_RATE;

  const previewRows = initialCapitationRecords.slice(0, 5);

  function toggleLGA(lga: string) {
    setSelectedLGAs((prev) =>
      prev.includes(lga) ? prev.filter((l) => l !== lga) : [...prev, lga]
    );
  }

  // Step 0: Select Period
  if (step === 0) {
    return (
      <Modal onClose={onClose}>
        <ModalHeader title="Generate Capitation" step={1} totalSteps={TOTAL_STEPS} onClose={onClose} />
        <ModalBody>
          <StepDots current={0} total={TOTAL_STEPS} />
          <h3 className="text-foreground text-[14px] font-semibold mb-1">Select Period</h3>
          <p className="text-muted-foreground text-[13px] mb-4">Select the capitation period to generate records for.</p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Month</label>
              <select className={`${selectCls} w-full`} value={month} onChange={(e) => setMonth(e.target.value)}>
                {MONTHS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="w-28">
              <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Year</label>
              <select className={`${selectCls} w-full`} value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {YEARS.map((y) => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <button className={btnSecondary} onClick={onClose}>Cancel</button>
          <button className={btnPrimary} onClick={() => setStep(1)}>Next</button>
        </ModalFooter>
      </Modal>
    );
  }

  // Step 1: Select Scope
  if (step === 1) {
    return (
      <Modal onClose={onClose}>
        <ModalHeader title="Generate Capitation" step={2} totalSteps={TOTAL_STEPS} onClose={onClose} />
        <ModalBody>
          <StepDots current={1} total={TOTAL_STEPS} />
          <h3 className="text-foreground text-[14px] font-semibold mb-1">Select Scope</h3>
          <p className="text-muted-foreground text-[13px] mb-4">Choose which facilities to include in this capitation run.</p>
          <div className="flex flex-col gap-3">
            {(["all", "lga", "specific"] as GenScope[]).map((s) => (
              <label key={s} className="flex items-start gap-3 p-3 border border-border rounded-[10px] cursor-pointer hover:border-[#9fe870] transition-colors">
                <input
                  type="radio"
                  name="scope"
                  className="mt-0.5"
                  checked={scope === s}
                  onChange={() => setScope(s)}
                />
                <div>
                  <p className="text-[14px] font-semibold text-foreground">
                    {s === "all" ? "All Facilities" : s === "lga" ? "By LGA" : "Specific Facilities"}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {s === "all"
                      ? "Generate capitation for all participating healthcare facilities."
                      : s === "lga"
                      ? "Select one or more Local Government Areas."
                      : "Choose individual facilities to include."}
                  </p>
                </div>
              </label>
            ))}
          </div>
          {scope === "lga" && (
            <div className="mt-4 border border-border rounded-[10px] p-4">
              <p className="text-[12px] font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Select LGAs</p>
              <div className="grid grid-cols-2 gap-2">
                {LGAS.map((lga) => (
                  <label key={lga} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedLGAs.includes(lga)}
                      onChange={() => toggleLGA(lga)}
                      className="rounded"
                    />
                    <span className="text-[13px] text-foreground">{lga}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <button className={btnSecondary} onClick={() => setStep(0)}>Back</button>
          <button className={btnPrimary} onClick={() => setStep(2)}>Next</button>
        </ModalFooter>
      </Modal>
    );
  }

  // Step 2: Preview
  if (step === 2) {
    return (
      <Modal onClose={onClose}>
        <ModalHeader title="Generate Capitation" step={3} totalSteps={TOTAL_STEPS} onClose={onClose} />
        <ModalBody>
          <StepDots current={2} total={TOTAL_STEPS} />
          <h3 className="text-foreground text-[14px] font-semibold mb-1">Preview</h3>
          <p className="text-muted-foreground text-[13px] mb-4">Review the capitation summary before generating.</p>

          <div className="bg-muted rounded-[10px] p-4 flex gap-6 mb-5">
            <div>
              <p className="text-[12px] text-muted-foreground font-medium">Facilities</p>
              <p className="text-[20px] font-semibold text-foreground">9</p>
            </div>
            <div>
              <p className="text-[12px] text-muted-foreground font-medium">Beneficiaries</p>
              <p className="text-[20px] font-semibold text-foreground">1,913</p>
            </div>
            <div>
              <p className="text-[12px] text-muted-foreground font-medium">Estimated Capitation</p>
              <p className="text-[20px] font-semibold text-foreground">{formatNGN(totalCap)}</p>
            </div>
          </div>

          <div className="border border-border rounded-[10px] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={thCell}>Code</th>
                  <th className={thCell}>Facility</th>
                  <th className={thCell}>Beneficiaries</th>
                  <th className={thCell}>Rate</th>
                  <th className={thCell}>Est. Amount</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/40">
                    <td className={`${tdCell} font-mono text-[11px] text-muted-foreground`}>{r.code}</td>
                    <td className={`${tdCell} text-[13px]`}>{r.facilityName}</td>
                    <td className={tdCell}>{r.beneficiaries.toLocaleString()}</td>
                    <td className={`${tdCell} text-muted-foreground`}>{formatNGN(r.rate)}</td>
                    <td className={`${tdCell} font-semibold`}>{formatNGN(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModalBody>
        <ModalFooter>
          <button className={btnSecondary} onClick={() => setStep(1)}>Back</button>
          <button className={btnPrimary} onClick={() => setStep(3)}>Confirm &amp; Generate</button>
        </ModalFooter>
      </Modal>
    );
  }

  // Step 3: Confirm dialog inside modal
  if (step === 3 && !showConfirm) {
    return (
      <Modal onClose={onClose}>
        <ModalHeader title="Generate Capitation" step={4} totalSteps={TOTAL_STEPS} onClose={onClose} />
        <ModalBody>
          <StepDots current={3} total={TOTAL_STEPS} />
          <h3 className="text-foreground text-[16px] font-semibold mb-2">
            Generate capitation for {month} {year}?
          </h3>
          <p className="text-muted-foreground text-[13px] leading-relaxed">
            Capitation will be calculated for eligible beneficiaries assigned to participating healthcare
            facilities for this period.
          </p>
        </ModalBody>
        <ModalFooter>
          <button className={btnSecondary} onClick={() => setStep(2)}>Back</button>
          <button className={btnPrimary} onClick={() => setShowConfirm(true)}>Generate Capitation</button>
        </ModalFooter>
      </Modal>
    );
  }

  // Success state
  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Capitation Generated" onClose={onClose} />
      <ModalBody>
        <div className="flex flex-col items-center text-center py-4">
          <CheckCircleIcon />
          <h3 className="text-foreground text-[18px] font-semibold mt-4 mb-1">Capitation generated successfully</h3>
          <p className="text-muted-foreground text-[13px] mb-6">
            Capitation records for {month} {year} are now available for review.
          </p>
          <div className="w-full bg-muted rounded-[12px] p-5 grid grid-cols-2 gap-4 text-left">
            {[
              { label: "Facilities Processed", value: "9" },
              { label: "Beneficiaries Included", value: "1,913" },
              { label: "Total Capitation", value: formatNGN(totalCap) },
              { label: "Exceptions", value: "2" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[12px] text-muted-foreground font-medium">{label}</p>
                <p className="text-[16px] font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <button className={btnSecondary} disabled title="Exceptions are not available in the mock app">View Exceptions</button>
        <button className={btnPrimary} onClick={onClose}>View Capitation</button>
      </ModalFooter>
    </Modal>
  );
}

// ─── Regenerate Modal ─────────────────────────────────────────────────────────

function RegenerateModal({ month, year, onClose }: { month: string; year: number; onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Regenerate Capitation" onClose={onClose} />
      <ModalBody>
        <h3 className="text-foreground text-[16px] font-semibold mb-2">
          Regenerate capitation for {month} {year}?
        </h3>
        <p className="text-muted-foreground text-[13px] leading-relaxed mb-4">
          This will recalculate the capitation records for the selected period using the latest eligible
          beneficiary and facility information. Existing records for this period will be overwritten.
        </p>
        <span className="inline-flex items-center gap-1.5 bg-[#fffbeb] border border-[#fde68a] text-[#b45309] px-3 py-1.5 rounded-[8px] text-[12px] font-semibold">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2L13 12H1L7 2z" stroke="#b45309" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M7 6v3M7 10.5v.5" stroke="#b45309" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          This action cannot be undone
        </span>
      </ModalBody>
      <ModalFooter>
        <button className={btnSecondary} onClick={onClose}>Cancel</button>
        <button
          className="bg-[#ef4444] rounded-[100px] px-[16px] h-[40px] text-white text-[12px] font-semibold flex items-center gap-2 shrink-0 hover:bg-[#dc2626] transition-colors"
          onClick={onClose}
        >
          Regenerate Capitation
        </button>
      </ModalFooter>
    </Modal>
  );
}

// ─── Actions Menu ─────────────────────────────────────────────────────────────

function ActionsMenu({ facilityId, onClose }: { facilityId: string; onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="absolute right-4 top-12 z-20 bg-card border border-border rounded-[10px] shadow-lg w-[180px] py-1" onClick={(e) => e.stopPropagation()}>
      <button
        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-foreground hover:bg-muted"
        onClick={() => { navigate(`/admin/facilities/${facilityId}`); onClose(); }}
      >
        View Facility
      </button>
      <button
        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-foreground hover:bg-muted"
        onClick={onClose}
      >
        Mark as Paid
      </button>
      <button
        className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-foreground hover:bg-muted"
        onClick={onClose}
      >
        View Breakdown
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CapitationView() {
  const navigate = useNavigate();
  const capitationRecords = useAdminDataStore((store) => store.capitationRecords);

  // Period
  const [periodMonth, setPeriodMonth] = useState("August");
  const [periodYear, setPeriodYear] = useState(2026);

  // Filters
  const [search, setSearch] = useState("");
  const [lgaFilter, setLgaFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Pagination
  const [page, setPage] = useState(1);

  // Modals
  const [showGenerate, setShowGenerate] = useState(false);
  const [showRegenerate, setShowRegenerate] = useState(false);

  // Actions menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Derived data
  const filtered = useMemo(() => {
    return capitationRecords.filter((r) => {
      const matchSearch =
        r.facilityName.toLowerCase().includes(search.toLowerCase()) ||
        r.code.toLowerCase().includes(search.toLowerCase()) ||
        r.lga.toLowerCase().includes(search.toLowerCase());
      const matchLGA = lgaFilter === "All" || r.lga === lgaFilter;
      const matchStatus = statusFilter === "All" || r.status === statusFilter;
      return matchSearch && matchLGA && matchStatus;
    });
  }, [capitationRecords, search, lgaFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // KPIs
  const totalBeneficiaries = capitationRecords.reduce((s, r) => s + r.beneficiaries, 0);
  const totalAmount = capitationRecords.reduce((s, r) => s + r.amount, 0);
  const paidAmount = capitationRecords.filter((r) => r.status === "Paid").reduce((s, r) => s + r.amount, 0);
  const unpaidAmount = capitationRecords
    .filter((r) => r.status === "Unpaid" || r.status === "Partially Paid")
    .reduce((s, r) => s + r.amount, 0);

  const kpis = [
    { label: "Total Facilities", value: String(capitationRecords.length) },
    { label: "Total Beneficiaries", value: totalBeneficiaries.toLocaleString() },
    { label: "Total Capitation", value: formatNGN(totalAmount) },
    { label: "Paid", value: formatNGN(paidAmount) },
    { label: "Unpaid", value: formatNGN(unpaidAmount) },
  ];

  return (
    <div
      className="flex flex-col gap-6 p-6 overflow-auto flex-1"
      style={{ fontFamily: "'Inter Tight', sans-serif" }}
      onClick={() => setOpenMenuId(null)}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground text-[24px] font-semibold tracking-[-0.48px]">Capitation</h1>
          <p className="text-muted-foreground text-[14px] font-medium tracking-[0.28px] mt-0.5">
            Manage and review capitation payments for participating healthcare facilities.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className={btnSecondary} disabled title="Printing is not available in the mock app">
            <PrinterIcon />
            Print
          </button>
          <button className={btnSecondary} disabled title="Export is not available in the mock app">
            <DownloadIcon />
            Export
          </button>
          <button className={btnPrimary} onClick={() => setShowGenerate(true)}>
            <PlusIcon />
            Generate Capitation
          </button>
        </div>
      </div>

      {/* ── Period Selector ── */}
      <div className="flex items-center gap-3 bg-card rounded-[12px] border border-border px-5 py-4 w-fit">
        <span className="text-[13px] font-semibold text-foreground shrink-0">Capitation Period:</span>
        <select
          className={selectCls}
          value={periodMonth}
          onChange={(e) => setPeriodMonth(e.target.value)}
        >
          {MONTHS.map((m) => <option key={m}>{m}</option>)}
        </select>
        <select
          className={selectCls}
          value={periodYear}
          onChange={(e) => setPeriodYear(Number(e.target.value))}
        >
          {YEARS.map((y) => <option key={y}>{y}</option>)}
        </select>
        <button
          className="text-[12px] font-semibold text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors ml-2"
          onClick={() => setShowRegenerate(true)}
        >
          Regenerate
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-5 gap-4">
        {kpis.map(({ label, value }) => (
          <div key={label} className={`bg-card rounded-[12px] ${cardShadow} px-5 py-4 flex flex-col gap-1`}>
            <p className="text-muted-foreground text-[12px] font-medium tracking-[0.24px]">{label}</p>
            <p className="text-foreground text-[20px] font-semibold tracking-[-0.4px]">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className={searchBar}>
          <SearchIcon />
          <input
            className="bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground outline-none w-[200px]"
            placeholder="Search facility..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className={selectCls}
          value={lgaFilter}
          onChange={(e) => { setLgaFilter(e.target.value); setPage(1); }}
        >
          <option value="All">All LGAs</option>
          {LGAS.map((l) => <option key={l}>{l}</option>)}
        </select>
        <div className={tabGroup}>
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-4 h-[38px] text-[12px] font-semibold tracking-[0.24px] transition-colors ${
                statusFilter === s
                  ? "bg-card text-foreground shadow-[0px_0px_0px_1px_#e5e5e5] rounded-[8px]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <div className={`bg-card rounded-[12px] ${cardShadow} flex flex-col items-center justify-center py-20 gap-4`}>
          <EmptyStateIllustration />
          <div className="text-center">
            <p className="text-foreground text-[16px] font-semibold mb-1">No capitation records yet</p>
            <p className="text-muted-foreground text-[13px] mb-4">Capitation has not been generated for this period.</p>
            <button className={btnPrimary} onClick={() => setShowGenerate(true)}>
              <PlusIcon />
              Generate Capitation
            </button>
          </div>
        </div>
      ) : (
        <div className={`bg-card rounded-[12px] ${cardShadow} overflow-hidden`}>
          <table className="w-full">
            <thead>
              <tr>
                <th className={thCell}>HCP Code</th>
                <th className={thCell}>Facility Name</th>
                <th className={thCell}>Capitation Month</th>
                <th className={thCell}>No. of Beneficiaries</th>
                <th className={thCell}>Capitation Rate</th>
                <th className={thCell}>Capitation Amount</th>
                <th className={thCell}>Status</th>
                <th className={thCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((r) => (
                <tr key={r.id} className="hover:bg-muted/40 transition-colors relative">
                  <td className={`${tdCell} font-mono text-[12px] text-muted-foreground`}>{r.code}</td>
                  <td className={tdCell}>
                    <button
                      className="font-semibold text-foreground hover:text-primary-foreground hover:underline text-left transition-colors"
                      onClick={() => navigate(`/admin/facilities/${r.facilityId}`)}
                    >
                      {r.facilityName}
                    </button>
                  </td>
                  <td className={`${tdCell} text-muted-foreground`}>{r.period}</td>
                  <td className={tdCell}>{r.beneficiaries.toLocaleString()}</td>
                  <td className={`${tdCell} text-muted-foreground`}>{formatNGN(CAPITATION_RATE)}</td>
                  <td className={`${tdCell} font-semibold`}>{formatNGN(r.amount)}</td>
                  <td className={tdCell}>
                    <StatusBadge status={r.status} />
                  </td>
                  <td className={`${tdCell} relative`}>
                    <button
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === r.id ? null : r.id); }}
                    >
                      <DotsIcon />
                    </button>
                    {openMenuId === r.id && (
                      <ActionsMenu facilityId={r.facilityId} onClose={() => setOpenMenuId(null)} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-[12px] text-muted-foreground font-medium">
              Showing {Math.min(filtered.length, (page - 1) * PAGE_SIZE + paginated.length)} of {filtered.length} facilities
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-[6px] text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 flex items-center justify-center rounded-[6px] text-[12px] font-semibold transition-colors ${
                    page === i + 1 ? "bg-[#163300] text-white" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-[6px] text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showGenerate && <GenerateModal onClose={() => setShowGenerate(false)} />}
      {showRegenerate && (
        <RegenerateModal
          month={periodMonth}
          year={periodYear}
          onClose={() => setShowRegenerate(false)}
        />
      )}
    </div>
  );
}
