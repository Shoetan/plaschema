import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAdminDataStore, type Beneficiary } from "@/stores/admin-data.store"
import { StatusBadge } from "@/components/admin/status-badge"
import {
  cardShadow,
  btnPrimary,
  btnSecondary,
  thCell,
  tdCell,
  searchBar,
  tabGroup,
} from "@/components/admin/styles"

type PrintState = "idle" | "preview" | "printing" | "done"

function IDCard({ b }: { b: Beneficiary }) {
  const initials = b.name
    .split(" ")
    .map((n) => n[0])
    .join("")
  return (
    <div
      className="bg-card rounded-[12px] overflow-hidden flex flex-col"
      style={{
        width: "340px",
        boxShadow: "0px 0px 0px 1px #e5e5e5",
        fontFamily: "'Inter Tight', sans-serif",
        pageBreakInside: "avoid",
      }}
    >
      {/* Card header band */}
      <div className="bg-[#163300] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="PLASCHEMA"
            style={{ width: 24, height: 24, objectFit: "contain" }}
          />
          <span className="text-white text-[11px] font-semibold tracking-[0.5px]">
            PLASCHEMA
          </span>
        </div>
        <span className="text-[#9FE870] text-[10px] font-semibold tracking-[0.4px]">
          HEALTH INSURANCE CARD
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-4 flex gap-4 items-start">
        {/* Avatar */}
        <div
          className="rounded-[10px] flex items-center justify-center shrink-0"
          style={{
            width: 64,
            height: 72,
            background: "#ECFAE2",
            border: "2px solid #9FE870",
          }}
        >
          <span className="text-primary-foreground text-[22px] font-semibold">
            {initials}
          </span>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <p className="text-foreground text-[15px] font-semibold leading-tight">
            {b.name}
          </p>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-[10px] font-medium w-[52px] shrink-0">
                ID
              </span>
              <span className="text-foreground text-[11px] font-mono font-semibold">
                {b.id}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-[10px] font-medium w-[52px] shrink-0">
                Ward
              </span>
              <span className="text-foreground text-[11px] font-medium truncate">
                {b.ward}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-[10px] font-medium w-[52px] shrink-0">
                Enrolled
              </span>
              <span className="text-foreground text-[11px] font-medium">
                {b.dateEnrolled}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-[10px] font-medium w-[52px] shrink-0">
                State
              </span>
              <span className="text-foreground text-[11px] font-medium">
                Plateau State
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-muted/40 border-t border-border px-4 py-2 flex items-center justify-between">
        <span className="text-muted-foreground text-[9px] font-medium tracking-[0.3px]">
          Plateau State Community Health Insurance
        </span>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-success-foreground text-[9px] font-semibold">
            {b.status}
          </span>
        </div>
      </div>
    </div>
  )
}

function PrintModal({
  selected,
  onClose,
}: {
  selected: Beneficiary[]
  onClose: () => void
}) {
  const [state, setState] = useState<PrintState>("preview")

  function handlePrint() {
    setState("printing")
    setTimeout(() => {
      window.print()
      setState("done")
    }, 600)
  }

  return (
    <>
      {/* Print styles injected via style tag */}
      <style>{`
        @media print {
          body > *:not(#print-portal) { display: none !important; }
          #print-portal { display: block !important; }
          #print-portal .no-print { display: none !important; }
          @page { size: A4; margin: 16mm; }
        }
      `}</style>

      {/* Modal overlay */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center no-print"
        style={{ background: "rgba(0,0,0,0.4)" }}
      >
        <div
          className={`bg-card rounded-[16px] ${cardShadow} flex flex-col overflow-hidden`}
          style={{ width: 640, maxHeight: "88vh" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div>
              <p className="text-foreground text-[16px] font-semibold">
                Print ID Cards
              </p>
              <p className="text-muted-foreground text-[13px] mt-0.5">
                {selected.length} card{selected.length !== 1 ? "s" : ""}{" "}
                selected
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 4L12 12M12 4L4 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Preview grid */}
          <div className="flex-1 overflow-y-auto p-6 bg-muted">
            {state === "done" ? (
              <div className="flex flex-col items-center gap-4 py-12">
                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="14" fill="#9FE870" />
                    <path
                      d="M10 16L14 20L22 12"
                      stroke="#163300"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-foreground text-[16px] font-semibold">
                    Sent to printer
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {selected.length} ID card{selected.length !== 1 ? "s" : ""}{" "}
                    queued for printing
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 justify-center">
                {selected.map((b) => (
                  <IDCard key={b.id} b={b} />
                ))}
              </div>
            )}
          </div>

          {/* Footer actions */}
          {state !== "done" && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border shrink-0 bg-card">
              <p className="text-muted-foreground text-sm">
                Cards will print at A4 size, 2 per row
              </p>
              <div className="flex gap-2">
                <button className={btnSecondary} onClick={onClose}>
                  Cancel
                </button>
                <button
                  className={btnPrimary}
                  onClick={handlePrint}
                  disabled={state === "printing"}
                >
                  {state === "printing" ? (
                    <>
                      <svg
                        className="animate-spin"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <circle
                          cx="8"
                          cy="8"
                          r="6"
                          stroke="#163300"
                          strokeWidth="2"
                          strokeDasharray="24"
                          strokeDashoffset="8"
                        />
                      </svg>
                      Printing…
                    </>
                  ) : (
                    <>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <rect
                          x="3"
                          y="6"
                          width="10"
                          height="7"
                          rx="1"
                          stroke="#163300"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M5 6V3H11V6"
                          stroke="#163300"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M5 10H11M5 12H9"
                          stroke="#163300"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      Print {selected.length} Card
                      {selected.length !== 1 ? "s" : ""}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          {state === "done" && (
            <div className="flex justify-center px-6 py-4 border-t border-border shrink-0 bg-card">
              <button className={btnPrimary} onClick={onClose}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Print portal — only this renders when printing */}
      <div id="print-portal" style={{ display: "none" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, padding: 0 }}>
          {selected.map((b) => (
            <IDCard key={b.id} b={b} />
          ))}
        </div>
      </div>
    </>
  )
}

export function BeneficiariesView() {
  const navigate = useNavigate()
  const beneficiaries = useAdminDataStore((store) => store.beneficiaries)
  const communities = useAdminDataStore((store) => store.communities)
  const setBeneficiaryStatus = useAdminDataStore((store) => store.setBeneficiaryStatus)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"all" | "community">("all")
  const [communityFilter, setCommunityFilter] = useState("All")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showPrint, setShowPrint] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [activateTarget, setActivateTarget] = useState<string | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<string | null>(null)

  const filtered = beneficiaries.filter((b) => {
    const matchSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase())
    const matchCommunity =
      communityFilter === "All" || b.community === communityFilter
    return matchSearch && matchCommunity
  })

  const communityGroups = communities.map((c) => ({
    ...c,
    bens: beneficiaries.filter((b) => b.communityId === c.id),
  }))

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((b) => selected.has(b.id))

  function toggleAll() {
    if (allFilteredSelected) {
      setSelected((s) => {
        const next = new Set(s)
        filtered.forEach((b) => next.delete(b.id))
        return next
      })
    } else {
      setSelected((s) => {
        const next = new Set(s)
        filtered.forEach((b) => next.add(b.id))
        return next
      })
    }
  }

  function toggleOne(id: string) {
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedBeneficiaries = beneficiaries.filter((b) => selected.has(b.id))

  return (
    <div
      className="flex flex-col gap-6 p-6 overflow-auto flex-1"
      style={{ fontFamily: "'Inter Tight', sans-serif" }}
    >
      {showPrint && (
        <PrintModal
          selected={selectedBeneficiaries}
          onClose={() => setShowPrint(false)}
        />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-[24px] font-semibold tracking-[-0.48px]">
          CBHI Enrolments
        </h1>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button className={btnPrimary} onClick={() => setShowPrint(true)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect
                  x="3"
                  y="6"
                  width="10"
                  height="7"
                  rx="1"
                  stroke="#163300"
                  strokeWidth="1.5"
                />
                <path
                  d="M5 6V3H11V6"
                  stroke="#163300"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M5 10H11M5 12H9"
                  stroke="#163300"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Print ID Cards ({selected.size})
            </button>
          )}
          <button className={btnSecondary} disabled title="Export is not available in the mock app">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 10V2M5 7L8 10L11 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12H14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Bulk action bar — shown when items selected */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-[#163300] rounded-[10px] px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8L6.5 11.5L13 5"
              stroke="#9FE870"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-white text-sm font-semibold flex-1">
            {selected.size} beneficiar{selected.size === 1 ? "y" : "ies"}{" "}
            selected
          </p>
          <button
            onClick={() => setShowPrint(true)}
            className="flex items-center gap-1.5 bg-primary rounded-[6px] px-3 py-1.5 text-primary-foreground text-xs font-semibold hover:bg-[#8de05c] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect
                x="3"
                y="6"
                width="10"
                height="7"
                rx="1"
                stroke="#163300"
                strokeWidth="1.5"
              />
              <path
                d="M5 6V3H11V6"
                stroke="#163300"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M5 10H11M5 12H9"
                stroke="#163300"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            Print ID Cards
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-muted-foreground hover:text-white text-xs font-medium transition-colors"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* View Toggle + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className={tabGroup}>
          {(["all", "community"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm font-semibold transition-colors ${
                view === v
                  ? "bg-card text-foreground shadow-sm rounded-[8px]"
                  : "text-muted-foreground"
              }`}
            >
              {v === "all" ? "All Beneficiaries" : "By Ward"}
            </button>
          ))}
        </div>
        <div className={searchBar + " flex-1 max-w-[280px]"}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="#a3a3a3" strokeWidth="1.5" />
            <path
              d="M10.5 10.5L13 13"
              stroke="#a3a3a3"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            className="flex-1 bg-transparent text-sm font-medium placeholder-[#a3a3a3] outline-none text-foreground"
            placeholder="Search beneficiary..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-border rounded-[8px] px-3 py-2 text-sm font-medium text-foreground bg-card outline-none"
          value={communityFilter}
          onChange={(e) => setCommunityFilter(e.target.value)}
        >
          <option value="All">All Wards</option>
          {communities.map((c) => (
            <option key={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="ml-auto text-muted-foreground text-sm font-medium">
          {filtered.length} beneficiaries
        </div>
      </div>

      {view === "all" ? (
        <div
          className={`bg-card rounded-[12px] ${cardShadow} overflow-hidden`}
        >
          <table className="w-full">
            <thead>
              <tr>
                {/* Select-all checkbox */}
                <th className={thCell + " w-10"}>
                  <button
                    onClick={toggleAll}
                    className={`w-5 h-5 rounded-[3px] border flex items-center justify-center transition-colors ${
                      allFilteredSelected
                        ? "bg-[#163300] border-[#163300]"
                        : "border-border hover:border-[#a3a3a3]"
                    }`}
                  >
                    {allFilteredSelected && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                      >
                        <path
                          d="M2 5L4 7L8 3"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </th>
                {[
                  "Enrollment ID",
                  "Beneficiary Name",
                  "Category",
                  "LGA",
                  "Facility",
                  "Ward",
                  "Current Status",
                ].map((h, i) => (
                  <th key={i} className={thCell}>
                    {h}
                  </th>
                ))}
                <th className={thCell + " w-10"} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const isSelected = selected.has(b.id)
                const effectiveStatus = b.status
                const isInactive = b.status === "Inactive"
                return (
                  <tr
                    key={b.id}
                    className={`cursor-pointer transition-colors ${
                      isSelected && !isInactive
                        ? "bg-accent"
                        : "hover:bg-muted/40"
                    }`}
                    onClick={() => navigate(`/admin/beneficiaries/${b.id}`)}
                  >
                    <td
                      className={tdCell}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleOne(b.id)
                      }}
                    >
                      <button
                        className={`w-5 h-5 rounded-[3px] border flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-[#163300] border-[#163300]"
                            : "border-border hover:border-[#a3a3a3]"
                        }`}
                      >
                        {isSelected && (
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 10 10"
                            fill="none"
                          >
                            <path
                              d="M2 5L4 7L8 3"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                    </td>
                    <td
                      className={tdCell + " font-mono text-xs text-muted-foreground"}
                    >
                      {b.enrollmentId}
                    </td>
                    <td className={tdCell}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <span className="text-muted-foreground text-xs font-semibold">
                            {b.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                        <span className="text-foreground text-sm font-semibold">
                          {b.name}
                        </span>
                      </div>
                    </td>
                    <td className={tdCell + " text-muted-foreground"}>{b.category}</td>
                    <td className={tdCell + " text-muted-foreground"}>{b.lga}</td>
                    <td className={tdCell + " text-muted-foreground"}>{b.facility}</td>
                    <td className={tdCell + " text-muted-foreground"}>{b.ward}</td>
                    <td className={tdCell}>
                      <StatusBadge status={effectiveStatus} />
                    </td>
                    <td className={tdCell} onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveMenu(activeMenu === b.id ? null : b.id)
                          }
                          className="w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-muted text-muted-foreground"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                          >
                            <circle cx="3" cy="8" r="1.5" fill="currentColor" />
                            <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                            <circle
                              cx="13"
                              cy="8"
                              r="1.5"
                              fill="currentColor"
                            />
                          </svg>
                        </button>
                        {activeMenu === b.id && (
                          <div className="absolute right-0 top-9 z-20 bg-card rounded-[10px] shadow-[0px_8px_24px_-4px_rgba(0,0,0,0.15),0px_0px_0px_1px_#e5e5e5] py-1 w-[160px]">
                            <button
                              onClick={() => {
                                navigate(`/admin/beneficiaries/${b.id}`)
                                setActiveMenu(null)
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/40"
                            >
                              View Details
                            </button>
                            {effectiveStatus === "Enrolled" ||
                            effectiveStatus === "Active" ? (
                              <button
                                onClick={() => {
                                  setDeactivateTarget(b.id)
                                  setActiveMenu(null)
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm font-medium text-[#dc2626] hover:bg-muted/40"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setActivateTarget(b.id)
                                  setActiveMenu(null)
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm font-medium text-success-foreground hover:bg-muted/40"
                              >
                                Activate
                              </button>
                            )}
                            <button
                              onClick={() => {
                                navigate(`/admin/id-cards`)
                                setActiveMenu(null)
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/40 flex items-center gap-2"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 16 16"
                                fill="none"
                              >
                                <rect
                                  x="3"
                                  y="6"
                                  width="10"
                                  height="7"
                                  rx="1"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                />
                                <path
                                  d="M5 6V3H11V6"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                />
                              </svg>
                              Print ID
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-muted-foreground text-sm">Page 1 of 1</p>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 rounded-[6px] bg-[#0a0a0a] text-white text-sm font-semibold">
                1
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {communityGroups
            .filter((c) => c.bens.length > 0)
            .map((c) => (
              <div
                key={c.id}
                className={`bg-card rounded-[12px] ${cardShadow} p-4 cursor-pointer hover:shadow-[0px_8px_16px_-8px_rgba(0,0,0,0.2),0px_0px_0px_1px_#d4d4d4] transition-all`}
                onClick={() => navigate(`/admin/wards/${c.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-foreground text-sm font-semibold">
                      {c.name}
                    </p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {c.lga} LGA · {c.state}
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-muted-foreground text-xs">Total</p>
                    <p className="text-foreground text-lg font-semibold">
                      {c.beneficiaries}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">New</p>
                    <p className="text-success-foreground text-lg font-semibold">
                      +{c.newEnrollments}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Workers</p>
                    <p className="text-foreground text-lg font-semibold">
                      {c.fieldWorkers}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {activateTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <div className="bg-card rounded-[16px] shadow-[0px_4px_8px_-5px_rgba(0,0,0,0.15),0px_0px_0px_1px_#e5e5e5] p-6 w-[400px]">
            <p className="text-foreground text-[16px] font-semibold mb-2">
              Activate beneficiary?
            </p>
            <p className="text-muted-foreground text-sm mb-5">
              This beneficiary will regain active coverage under the programme.
            </p>
            <div className="flex items-center gap-2 mb-4 bg-accent rounded-[8px] px-3 py-2.5 text-primary-foreground text-sm font-medium">
              {beneficiaries.find((b) => b.id === activateTarget)?.name}
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="bg-card rounded-[100px] px-[16px] h-[40px] shadow-[0px_4px_8px_-5px_rgba(0,0,0,0.15),0px_0px_0px_1px_#e5e5e5] text-foreground text-[12px] font-semibold"
                onClick={() => setActivateTarget(null)}
              >
                Cancel
              </button>
              <button
                className="bg-primary rounded-[100px] px-[16px] h-[40px] text-primary-foreground text-[12px] font-semibold"
                onClick={() => {
                  setBeneficiaryStatus(activateTarget, "Enrolled")
                  setActivateTarget(null)
                }}
              >
                Activate Beneficiary
              </button>
            </div>
          </div>
        </div>
      )}
      {deactivateTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <div className="bg-card rounded-[16px] shadow-[0px_4px_8px_-5px_rgba(0,0,0,0.15),0px_0px_0px_1px_#e5e5e5] p-6 w-[400px]">
            <p className="text-foreground text-[16px] font-semibold mb-2">
              Deactivate beneficiary?
            </p>
            <p className="text-muted-foreground text-sm mb-4">
              This beneficiary will no longer have active coverage until they
              are reactivated.
            </p>
            <div className="flex flex-col gap-1.5 mb-5">
              <label className="text-foreground text-sm font-semibold">
                Reason for deactivation
              </label>
              <select className="border border-border rounded-[8px] px-3 py-2 text-sm font-medium text-foreground bg-card outline-none">
                <option>Select a reason</option>
                <option>Duplicate record</option>
                <option>Deceased</option>
                <option>Relocated</option>
                <option>Programme exit</option>
                <option>Other</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="bg-card rounded-[100px] px-[16px] h-[40px] shadow-[0px_4px_8px_-5px_rgba(0,0,0,0.15),0px_0px_0px_1px_#e5e5e5] text-foreground text-[12px] font-semibold"
                onClick={() => setDeactivateTarget(null)}
              >
                Cancel
              </button>
              <button
                className="bg-[#dc2626] rounded-[100px] px-[16px] h-[40px] text-white text-[12px] font-semibold"
                onClick={() => {
                  setBeneficiaryStatus(deactivateTarget, "Inactive")
                  setDeactivateTarget(null)
                }}
              >
                Deactivate Beneficiary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
