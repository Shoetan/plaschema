import { useState } from "react";
import { cardShadow, btnPrimary, btnSecondary, tabGroup } from "@/components/admin/styles";

const reportTypes = [
  { id: "beneficiary", label: "Beneficiary Enrollment Report", desc: "Complete list of enrolled beneficiaries with demographic data" },
  { id: "community", label: "Community Enrollment Report", desc: "Enrollment performance by community" },
  { id: "fieldworker", label: "Field Worker Performance Report", desc: "Enrollment activity by field worker" },
  { id: "activity", label: "Enrollment Activity Report", desc: "Timeline of enrollment events" },
  { id: "sync", label: "Synchronization Report", desc: "Sync status and failure analysis" },
];

type State = "idle" | "generating" | "done" | "failed";

export function ReportsView() {
  const [selected, setSelected] = useState<string | null>(null);
  const [state, setState] = useState<State>("idle");
  const [format, setFormat] = useState("CSV");

  function generate() {
    setState("generating");
    setTimeout(() => setState("done"), 2000);
  }

  return (
    <div className="flex flex-col gap-6 p-6 overflow-auto flex-1" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
      <h1 className="text-foreground text-[24px] font-semibold tracking-[-0.48px]">Reports</h1>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        {/* Report Type Selection */}
        <div className="flex flex-col gap-4">
          <div className={`bg-card rounded-[12px] ${cardShadow}`}>
            <div className="px-4 py-3 border-b border-border">
              <p className="text-foreground text-sm font-semibold">Select Report Type</p>
            </div>
            <div className="divide-y divide-[#f5f5f5]">
              {reportTypes.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-start gap-3 px-4 py-4 cursor-pointer hover:bg-muted/40 transition-colors ${selected === r.id ? "bg-accent" : ""}`}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selected === r.id ? "border-[#9FE870] bg-primary" : "border-border"}`}>
                    {selected === r.id && <div className="w-2 h-2 rounded-full bg-[#163300]" />}
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-semibold">{r.label}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{r.desc}</p>
                  </div>
                  <input type="radio" className="sr-only" value={r.id} checked={selected === r.id} onChange={() => setSelected(r.id)} />
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Filters + Generate */}
        <div className="flex flex-col gap-4">
          <div className={`bg-card rounded-[12px] ${cardShadow} p-5 flex flex-col gap-4`}>
            <p className="text-foreground text-sm font-semibold">Report Filters</p>
            {[
              { label: "Date Range", options: ["All Time", "Last 30 Days", "Last 3 Months", "Custom"] },
              { label: "State", options: ["All States", "FCT", "Nasarawa", "Niger", "Kogi"] },
              { label: "LGA", options: ["All LGAs", "Gwagwalada", "Kuje", "Bwari", "Abaji"] },
            ].map(({ label, options }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <label className="text-foreground text-sm font-medium">{label}</label>
                <select className="w-full border border-border rounded-[8px] px-3 py-2.5 text-sm text-foreground bg-card outline-none focus:border-[#9FE870]">
                  {options.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div className="flex flex-col gap-1.5">
              <label className="text-foreground text-sm font-medium">Export Format</label>
              <div className={tabGroup}>
                {["CSV", "Excel"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`flex-1 px-4 h-[36px] text-[12px] font-semibold tracking-[0.24px] transition-colors ${
                      format === f ? "bg-card text-primary-foreground shadow-sm rounded-[8px] m-0.5" : "text-muted-foreground"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button + States */}
          {state === "idle" && (
            <button
              onClick={generate}
              disabled={!selected}
              className={`${btnPrimary} w-full justify-center disabled:opacity-50 text-primary-foreground`}
            >
              Generate Report
            </button>
          )}
          {state === "generating" && (
            <div className={`bg-card rounded-[12px] ${cardShadow} p-5 flex flex-col items-center gap-3`}>
              <div className="w-10 h-10 border-2 border-[#9FE870] border-t-transparent rounded-full animate-spin" />
              <p className="text-foreground text-sm font-semibold">Generating report…</p>
              <p className="text-muted-foreground text-xs text-center">This may take a few seconds.</p>
            </div>
          )}
          {state === "done" && (
            <div className="bg-success border border-[#c6ede5] rounded-[12px] p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" fill="#287f6e" /><path d="M6 10L9 13L14 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <p className="text-success-foreground text-sm font-semibold">Report ready</p>
              </div>
              <button className={`${btnPrimary} w-full justify-center text-primary-foreground`} disabled title="Downloads are not available in the mock app">
                Download {format}
              </button>
              <button onClick={() => setState("idle")} className={`${btnSecondary} w-full justify-center`}>Generate Another</button>
            </div>
          )}
          {state === "failed" && (
            <div className="bg-red-50 border border-red-200 rounded-[12px] p-5 flex flex-col gap-3">
              <p className="text-red-600 text-sm font-semibold">Report generation failed</p>
              <button onClick={() => setState("idle")} className="w-full border border-red-300 text-red-600 rounded-[8px] py-2 text-sm font-semibold">Retry</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
