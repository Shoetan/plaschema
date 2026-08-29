import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { beneficiaries as initialBeneficiaries } from "@/mocks/admin-data";
import { useAdminDataStore, type Beneficiary } from "@/stores/admin-data.store";
import { StatusBadge } from "@/components/admin/status-badge";
import { cardShadow, btnPrimary, btnSecondary, thCell, tdCell, searchBar } from "@/components/admin/styles";

const MAX_SELECTION = 9;

const CATEGORIES = ["All Categories", "IDPs", "Indigents / Very Poor / Others", "Elderly 65+"];
const PRINTED_OPTIONS = ["All", "Printed", "Not Printed"];
const LGAS = ["All LGAs", ...Array.from(new Set(initialBeneficiaries.map((b) => b.lga))).sort()];
const WARDS = ["All Wards", ...Array.from(new Set(initialBeneficiaries.map((b) => b.ward))).sort()];

/* ─── ID Card (print + preview) ─────────────────────────────────────── */
function IDCard({ b }: { b: Beneficiary }) {
  return (
    <div
      className="bg-card rounded-[12px] overflow-hidden flex flex-col shrink-0"
      style={{ width: 320, boxShadow: "0px 0px 0px 1px #e5e5e5", fontFamily: "'Inter Tight', sans-serif", pageBreakInside: "avoid" }}
    >
      <div className="bg-[#163300] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="PLASCHEMA" style={{ width: 22, height: 22, objectFit: "contain" }} />
          <span className="text-white text-[11px] font-semibold tracking-[0.5px]">PLASCHEMA</span>
        </div>
        <span className="text-[#9FE870] text-[10px] font-semibold tracking-[0.4px]">HEALTH INSURANCE CARD</span>
      </div>
      <div className="px-4 py-4 flex gap-4 items-start">
        <div className="rounded-[10px] flex items-center justify-center shrink-0" style={{ width: 60, height: 68, background: "#ECFAE2", border: "2px solid #9FE870" }}>
          <span className="text-primary-foreground text-[20px] font-semibold">{b.name.split(" ").map((n) => n[0]).join("")}</span>
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <p className="text-foreground text-[14px] font-semibold leading-tight">{b.name}</p>
          {[
            ["Enrollment ID", b.enrollmentId],
            ["Category", b.category],
            ["Gender", b.gender],
            ["LGA", b.lga],
            ["Ward", b.ward],
            ["Facility", b.facility],
          ].map(([label, value]) => (
            <div key={label} className="flex items-start gap-1.5">
              <span className="text-muted-foreground text-[10px] font-medium shrink-0" style={{ width: 60 }}>{label}</span>
              <span className="text-foreground text-[10px] font-medium leading-tight truncate">{value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-muted/40 border-t border-border px-4 py-2 flex items-center justify-between">
        <span className="text-muted-foreground text-[9px] font-medium tracking-[0.3px]">Plateau State Community Health Insurance</span>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-success-foreground text-[9px] font-semibold">{b.status}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Generate Modal ─────────────────────────────────────────────────── */
function GenerateModal({
  selected,
  onCancel,
  onGenerate,
}: {
  selected: Beneficiary[];
  onCancel: () => void;
  onGenerate: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className={`bg-card rounded-[16px] ${cardShadow} flex flex-col overflow-hidden`} style={{ width: 520, maxHeight: "80vh" }}>
        <div className="px-6 py-5 border-b border-border">
          <p className="text-foreground text-[16px] font-semibold">Generate ID Cards</p>
          <p className="text-muted-foreground text-[13px] mt-1">Review the selected beneficiaries before generating their ID cards.</p>
        </div>
        <div className="px-6 py-4 flex-1 overflow-y-auto">
          <div className="flex items-center gap-2 bg-accent rounded-[8px] px-3 py-2 mb-4">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#9FE870" /><path d="M5 8L7 10L11 6" stroke="#163300" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <p className="text-primary-foreground text-[13px] font-semibold">{selected.length} ID card{selected.length !== 1 ? "s" : ""} will be generated</p>
          </div>
          <div className="flex flex-col gap-2">
            {selected.map((b) => (
              <div key={b.id} className="flex items-center gap-3 border border-border rounded-[8px] px-3 py-2.5">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-muted-foreground text-xs font-semibold">{b.name.split(" ").map((n) => n[0]).join("")}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-semibold">{b.name}</p>
                  <p className="text-muted-foreground text-xs font-mono">{b.enrollmentId}</p>
                </div>
                {b.hasPrinted && (
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Reprint</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
          <button className={btnSecondary} onClick={onCancel}>Cancel</button>
          <button className={btnPrimary} onClick={onGenerate}>Generate Cards</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Print Preview Modal ────────────────────────────────────────────── */
function PrintPreviewModal({
  cards,
  onClose,
  onMarkPrinted,
}: {
  cards: Beneficiary[];
  onClose: () => void;
  onMarkPrinted: (ids: string[]) => void;
}) {
  const [cardIndex, setCardIndex] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [printed, setPrinted] = useState(false);

  function handlePrint() {
    window.print();
    setShowConfirm(true);
  }

  function handleMarkPrinted() {
    onMarkPrinted(cards.map((c) => c.id));
    setPrinted(true);
    setShowConfirm(false);
  }

  return (
    <>
      <style>{`
        @media print {
          body > *:not(#id-print-portal) { display: none !important; }
          #id-print-portal { display: block !important; }
          @page { size: A4; margin: 16mm; }
        }
      `}</style>
      <div id="id-print-portal" style={{ display: "none" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {cards.map((b) => <IDCard key={b.id} b={b} />)}
        </div>
      </div>

      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
        <div className={`bg-card rounded-[16px] ${cardShadow} flex flex-col overflow-hidden`} style={{ width: 600, maxHeight: "90vh" }}>
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <p className="text-foreground text-[16px] font-semibold">ID Card Preview</p>
              <p className="text-muted-foreground text-[13px] mt-0.5">
                {printed ? "Cards marked as printed" : `Card ${cardIndex + 1} of ${cards.length}`}
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-muted flex flex-col items-center gap-6">
            {printed ? (
              <div className="flex flex-col items-center gap-4 py-12">
                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" fill="#9FE870" /><path d="M10 16L14 20L22 12" stroke="#163300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <p className="text-foreground text-[16px] font-semibold">ID cards generated successfully</p>
                <p className="text-muted-foreground text-sm">Your ID cards are ready to print or download.</p>
              </div>
            ) : (
              <IDCard b={cards[cardIndex]} />
            )}

            {!printed && cards.length > 1 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCardIndex((i) => Math.max(0, i - 1))}
                  disabled={cardIndex === 0}
                  className={btnSecondary + " disabled:opacity-40"}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Prev
                </button>
                <span className="text-muted-foreground text-sm font-medium">{cardIndex + 1} / {cards.length}</span>
                <button
                  onClick={() => setCardIndex((i) => Math.min(cards.length - 1, i + 1))}
                  disabled={cardIndex === cards.length - 1}
                  className={btnSecondary + " disabled:opacity-40"}
                >
                  Next
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            )}
          </div>

          {!printed && (
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <button className={btnSecondary} onClick={onClose}>Close</button>
              <div className="flex gap-2">
                <button className={btnSecondary} onClick={handlePrint}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="6" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" /><path d="M5 6V3H11V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M5 10H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  Print ID Cards
                </button>
                <button className={btnPrimary} onClick={handlePrint}>Download PDF</button>
              </div>
            </div>
          )}
          {printed && (
            <div className="px-6 py-4 border-t border-border flex justify-center">
              <button className={btnPrimary} onClick={onClose}>Done</button>
            </div>
          )}
        </div>
      </div>

      {/* Mark as Printed confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className={`bg-card rounded-[16px] ${cardShadow} p-6`} style={{ width: 400 }}>
            <p className="text-foreground text-[16px] font-semibold mb-2">Mark these ID cards as printed?</p>
            <p className="text-muted-foreground text-sm mb-5">This will update the printing status for the {cards.length} selected beneficiar{cards.length === 1 ? "y" : "ies"}.</p>
            <div className="flex justify-end gap-2">
              <button className={btnSecondary} onClick={() => setShowConfirm(false)}>Not Yet</button>
              <button className={btnPrimary} onClick={handleMarkPrinted}>Mark as Printed</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Printed badge ──────────────────────────────────────────────────── */
function PrintedBadge({ printed }: { printed: boolean }) {
  return (
    <span className={`inline-flex items-center justify-center px-2 h-[22px] rounded-[6px] text-[11px] font-semibold ${printed ? "bg-accent text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
      {printed ? "Yes" : "No"}
    </span>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────── */
export function IDCardGenerationView() {
  const navigate = useNavigate();
  const beneficiaries = useAdminDataStore((store) => store.beneficiaries);
  const markBeneficiariesPrinted = useAdminDataStore((store) => store.markBeneficiariesPrinted);

  // Filters
  const [category, setCategory] = useState("All Categories");
  const [printedStatus, setPrintedStatus] = useState("All");
  const [lga, setLga] = useState("All LGAs");
  const [ward, setWard] = useState("All Wards");
  const [nameSearch, setNameSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [applied, setApplied] = useState(false);

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ID search
  const [idSearch, setIdSearch] = useState("");

  // Modals
  const [showGenerate, setShowGenerate] = useState(false);
  const [printCards, setPrintCards] = useState<Beneficiary[] | null>(null);

  const enriched = beneficiaries;

  const filtered = useMemo(() => {
    return enriched.filter((b) => {
      if (category !== "All Categories" && b.category !== category) return false;
      if (printedStatus === "Printed" && !b.hasPrinted) return false;
      if (printedStatus === "Not Printed" && b.hasPrinted) return false;
      if (lga !== "All LGAs" && b.lga !== lga) return false;
      if (ward !== "All Wards" && b.ward !== ward) return false;
      if (nameSearch && !b.name.toLowerCase().includes(nameSearch.toLowerCase())) return false;
      const enrollmentTime = Date.parse(b.dateEnrolled);
      if (applied && dateFrom && enrollmentTime < Date.parse(dateFrom)) return false;
      if (applied && dateTo && enrollmentTime > Date.parse(dateTo)) return false;
      return true;
    });
  }, [enriched, category, printedStatus, lga, ward, nameSearch, dateFrom, dateTo, applied]);

  const idSearchResult = idSearch.trim()
    ? enriched.filter((b) => b.enrollmentId.toLowerCase().includes(idSearch.toLowerCase()))
    : [];

  const selectedList = enriched.filter((b) => selected.has(b.id));
  const atMax = selected.size >= MAX_SELECTION;

  function toggleOne(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) { next.delete(id); }
      else if (next.size < MAX_SELECTION) { next.add(id); }
      return next;
    });
  }

  function toggleAll() {
    const allSelected = filtered.every((b) => selected.has(b.id));
    setSelected((s) => {
      const next = new Set(s);
      if (allSelected) {
        filtered.forEach((b) => next.delete(b.id));
      } else {
        filtered.forEach((b) => { if (next.size < MAX_SELECTION) next.add(b.id); });
      }
      return next;
    });
  }

  function clearFilters() {
    setCategory("All Categories");
    setPrintedStatus("All");
    setLga("All LGAs");
    setWard("All Wards");
    setNameSearch("");
    setDateFrom("");
    setDateTo("");
    setApplied(false);
  }

  function handleGenerate() {
    setShowGenerate(false);
    setPrintCards(selectedList);
  }

  function handleMarkPrinted(ids: string[]) {
    markBeneficiariesPrinted(ids);
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every((b) => selected.has(b.id));

  return (
    <div className="flex flex-col gap-6 p-6 overflow-auto flex-1" style={{ fontFamily: "'Inter Tight', sans-serif" }}>

      {showGenerate && (
        <GenerateModal selected={selectedList} onCancel={() => setShowGenerate(false)} onGenerate={handleGenerate} />
      )}
      {printCards && (
        <PrintPreviewModal
          cards={printCards}
          onClose={() => { setPrintCards(null); setSelected(new Set()); }}
          onMarkPrinted={handleMarkPrinted}
        />
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => navigate("/admin/beneficiaries")} className="hover:text-foreground transition-colors">CBHI Enrolments</button>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span className="text-foreground font-medium">ID Card Generation</span>
      </div>

      {/* Page header */}
      <div>
        <h1 className="text-foreground text-[24px] font-semibold tracking-[-0.48px]">ID Card Generation</h1>
        <p className="text-muted-foreground text-sm mt-1">Find enrolled beneficiaries and generate ready-to-print membership ID cards.</p>
      </div>

      {/* Filter card */}
      <div className={`bg-card rounded-[12px] ${cardShadow} p-5`}>
        <p className="text-foreground text-sm font-semibold mb-4">Filter Beneficiaries</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-muted-foreground text-xs font-medium">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-border rounded-[8px] px-3 py-2.5 text-sm font-medium text-foreground bg-card outline-none focus:border-[#9FE870]"
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-muted-foreground text-xs font-medium">Printed Status</label>
            <select
              value={printedStatus}
              onChange={(e) => setPrintedStatus(e.target.value)}
              className="border border-border rounded-[8px] px-3 py-2.5 text-sm font-medium text-foreground bg-card outline-none focus:border-[#9FE870]"
            >
              {PRINTED_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-muted-foreground text-xs font-medium">LGA</label>
            <select
              value={lga}
              onChange={(e) => setLga(e.target.value)}
              className="border border-border rounded-[8px] px-3 py-2.5 text-sm font-medium text-foreground bg-card outline-none focus:border-[#9FE870]"
            >
              {LGAS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-muted-foreground text-xs font-medium">Ward</label>
            <select
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              className="border border-border rounded-[8px] px-3 py-2.5 text-sm font-medium text-foreground bg-card outline-none focus:border-[#9FE870]"
            >
              {WARDS.map((w) => <option key={w}>{w}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="text-muted-foreground text-xs font-medium">Beneficiary Name</label>
            <div className={searchBar}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="#a3a3a3" strokeWidth="1.5" /><path d="M10.5 10.5L13 13" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" /></svg>
              <input
                className="flex-1 bg-transparent text-sm font-medium placeholder-[#a3a3a3] outline-none text-foreground"
                placeholder="Search beneficiary name"
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-muted-foreground text-xs font-medium">Date Created From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-border rounded-[8px] px-3 py-2.5 text-sm font-medium text-foreground bg-card outline-none focus:border-[#9FE870]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-muted-foreground text-xs font-medium">Date Created To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-border rounded-[8px] px-3 py-2.5 text-sm font-medium text-foreground bg-card outline-none focus:border-[#9FE870]"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-[#f5f5f5]">
          <button className={btnSecondary} onClick={clearFilters}>Clear Filters</button>
          <button className={btnPrimary} onClick={() => setApplied(true)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="#163300" strokeWidth="1.5" /><path d="M10.5 10.5L13 13" stroke="#163300" strokeWidth="1.5" strokeLinecap="round" /></svg>
            Search
          </button>
        </div>
      </div>

      {/* Results summary */}
      <p className="text-muted-foreground text-sm font-medium">{filtered.length} beneficiar{filtered.length === 1 ? "y" : "ies"} found</p>

      {/* ID Search + selected chips */}
      <div className={`bg-card rounded-[12px] ${cardShadow} p-5`}>
        <div className="flex items-start gap-6">
          <div className="flex-1">
            <p className="text-foreground text-sm font-semibold mb-2">Search by Enrollment ID</p>
            <div className={searchBar + " max-w-[400px]"}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="#a3a3a3" strokeWidth="1.5" /><path d="M10.5 10.5L13 13" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" /></svg>
              <input
                className="flex-1 bg-transparent text-sm font-medium placeholder-[#a3a3a3] outline-none text-foreground"
                placeholder="Enter Enrollment ID e.g. PL/BHCPF/…"
                value={idSearch}
                onChange={(e) => setIdSearch(e.target.value)}
              />
              {idSearch && (
                <button onClick={() => setIdSearch("")} className="text-muted-foreground hover:text-muted-foreground">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </button>
              )}
            </div>
            {idSearch && idSearchResult.length > 0 && (
              <div className="mt-2 border border-border rounded-[8px] overflow-hidden max-w-[400px]">
                {idSearchResult.slice(0, 5).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { toggleOne(b.id); setIdSearch(""); }}
                    disabled={atMax && !selected.has(b.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors text-left border-b border-[#f5f5f5] last:border-0 disabled:opacity-50"
                  >
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-muted-foreground text-[10px] font-semibold">{b.name.split(" ").map((n) => n[0]).join("")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-sm font-medium">{b.name}</p>
                      <p className="text-muted-foreground text-xs font-mono">{b.enrollmentId}</p>
                    </div>
                    {selected.has(b.id) && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7L6 10L11 4" stroke="#163300" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    )}
                  </button>
                ))}
              </div>
            )}
            {idSearch && idSearchResult.length === 0 && (
              <p className="text-muted-foreground text-sm mt-2">No matching enrollment ID found.</p>
            )}
          </div>

          {/* Selected chips panel */}
          <div className="w-[260px] shrink-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-foreground text-sm font-semibold">Selected Beneficiaries</p>
              <span className="text-muted-foreground text-xs font-medium">{selected.size} / {MAX_SELECTION}</span>
            </div>
            {selected.size > 0 ? (
              <>
                <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto">
                  {selectedList.map((b) => (
                    <div key={b.id} className="flex items-center gap-2 bg-muted rounded-[6px] px-2.5 py-1.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-xs font-semibold truncate">{b.name}</p>
                        <p className="text-muted-foreground text-[10px] font-mono truncate">{b.enrollmentId}</p>
                      </div>
                      <button onClick={() => toggleOne(b.id)} className="text-muted-foreground hover:text-muted-foreground shrink-0">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setSelected(new Set())} className="text-muted-foreground text-xs font-medium hover:text-foreground mt-2 transition-colors">
                  Clear All
                </button>
              </>
            ) : (
              <p className="text-muted-foreground text-xs">No beneficiaries selected yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Selection toolbar + table */}
      <div className={`bg-card rounded-[12px] ${cardShadow} overflow-hidden`}>
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <button
            onClick={toggleAll}
            className={`w-5 h-5 rounded-[3px] border flex items-center justify-center transition-colors shrink-0 ${allFilteredSelected ? "bg-[#163300] border-[#163300]" : "border-border hover:border-[#a3a3a3]"}`}
          >
            {allFilteredSelected && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </button>
          <p className="text-muted-foreground text-sm font-medium flex-1">
            {selected.size === 0 ? "Select beneficiaries to generate ID cards" : `${selected.size} / ${MAX_SELECTION} beneficiar${selected.size === 1 ? "y" : "ies"} selected`}
          </p>
          {atMax && (
            <span className="text-amber-700 bg-amber-50 border border-amber-200 text-xs font-medium px-2 py-1 rounded-[6px]">
              Max {MAX_SELECTION} reached
            </span>
          )}
          {selected.size > 0 && (
            <button onClick={() => setSelected(new Set())} className="text-muted-foreground text-xs font-medium hover:text-foreground transition-colors">
              Clear Selection
            </button>
          )}
          <button
            onClick={() => setShowGenerate(true)}
            disabled={selected.size === 0}
            className={btnPrimary + " disabled:opacity-40 disabled:cursor-not-allowed"}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="10" rx="1.5" stroke="#163300" strokeWidth="1.5" /><path d="M2 8H14" stroke="#163300" strokeWidth="1.5" /><path d="M5 11H7" stroke="#163300" strokeWidth="1.5" strokeLinecap="round" /></svg>
            Generate ID Cards{selected.size > 0 ? ` (${selected.size})` : ""}
          </button>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="8" y="12" width="24" height="18" rx="3" stroke="#e5e5e5" strokeWidth="2" /><path d="M8 18H32" stroke="#e5e5e5" strokeWidth="2" /><path d="M13 24H18" stroke="#e5e5e5" strokeWidth="2" strokeLinecap="round" /></svg>
            <p className="text-foreground text-sm font-semibold">No matching beneficiaries</p>
            <p className="text-muted-foreground text-sm">Try adjusting your search or filters.</p>
            <button className={btnSecondary} onClick={clearFilters}>Clear Filters</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={thCell + " w-10"} />
                  <th className={thCell}>S/N</th>
                  <th className={thCell}>Enrollment ID</th>
                  <th className={thCell}>Beneficiary Name</th>
                  <th className={thCell}>Category</th>
                  <th className={thCell}>LGA</th>
                  <th className={thCell}>Ward</th>
                  <th className={thCell}>Date Created</th>
                  <th className={thCell}>Has Printed</th>
                  <th className={thCell}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, idx) => {
                  const isSelected = selected.has(b.id);
                  const isDisabled = atMax && !isSelected;
                  return (
                    <tr
                      key={b.id}
                      onClick={() => !isDisabled && toggleOne(b.id)}
                      className={`transition-colors ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${isSelected ? "bg-accent" : "hover:bg-muted/40"}`}
                    >
                      <td className={tdCell} onClick={(e) => e.stopPropagation()}>
                        <button
                          disabled={isDisabled}
                          onClick={() => !isDisabled && toggleOne(b.id)}
                          className={`w-5 h-5 rounded-[3px] border flex items-center justify-center transition-colors ${isSelected ? "bg-[#163300] border-[#163300]" : "border-border hover:border-[#a3a3a3]"} disabled:cursor-not-allowed`}
                        >
                          {isSelected && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </button>
                      </td>
                      <td className={tdCell + " text-muted-foreground"}>{idx + 1}</td>
                      <td className={tdCell}>
                        <span className="text-primary-foreground font-mono text-xs font-semibold bg-accent px-2 py-0.5 rounded-[4px]">{b.enrollmentId}</span>
                      </td>
                      <td className={tdCell}>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <span className="text-muted-foreground text-[10px] font-semibold">{b.name.split(" ").map((n) => n[0]).join("")}</span>
                          </div>
                          <span className="text-foreground text-sm font-semibold">{b.name}</span>
                        </div>
                      </td>
                      <td className={tdCell + " text-muted-foreground"}>{b.category}</td>
                      <td className={tdCell + " text-muted-foreground"}>{b.lga}</td>
                      <td className={tdCell + " text-muted-foreground"}>{b.ward}</td>
                      <td className={tdCell + " text-muted-foreground"}>{b.dateEnrolled}</td>
                      <td className={tdCell}><PrintedBadge printed={b.hasPrinted} /></td>
                      <td className={tdCell}><StatusBadge status={b.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-muted-foreground text-sm">Page 1 of 1 · {filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 rounded-[6px] bg-[#0a0a0a] text-white text-sm font-semibold">1</button>
          </div>
        </div>
      </div>
    </div>
  );
}
