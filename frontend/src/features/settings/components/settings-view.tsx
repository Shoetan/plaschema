import { useState } from "react";
import { cardShadow, btnPrimary, btnSecondary, tabGroup } from "@/components/admin/styles";

const tabs = ["General", "Notifications", "Security"];

export function SettingsView() {
  const [tab, setTab] = useState("General");
  const [notifications, setNotifications] = useState({
    newEnrollment: true,
    syncComplete: true,
    syncFailed: true,
    newFieldWorker: false,
    weeklyReport: true,
    systemAlerts: true,
  });

  return (
    <div className="flex flex-col gap-6 p-6 overflow-auto flex-1" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-[24px] font-semibold tracking-[-0.48px]">Settings</h1>
        <div className="flex gap-2">
          <button className={btnSecondary} disabled title="Saving is not available in the mock app">Cancel</button>
          <button className={`${btnPrimary} text-primary-foreground`} disabled title="Saving is not available in the mock app">Save Changes</button>
        </div>
      </div>

      <div className={`${tabGroup} self-start`}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 h-[36px] text-[12px] font-semibold tracking-[0.24px] transition-colors ${
              tab === t ? "bg-card text-primary-foreground shadow-sm rounded-[8px] m-0.5" : "text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "General" && (
        <div className="flex flex-col gap-4 max-w-xl">
          <div className={`bg-card rounded-[12px] ${cardShadow} p-5 flex flex-col gap-4`}>
            <p className="text-foreground text-sm font-semibold">Program Information</p>
            {[
              { label: "Program Name", value: "CBHI Enrollment Program", placeholder: "Program name" },
              { label: "Organization", value: "Federal Ministry of Health", placeholder: "Organization name" },
              { label: "Contact Email", value: "admin@cbhi.gov.ng", placeholder: "admin@example.com" },
            ].map(({ label, value, placeholder }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <label className="text-foreground text-sm font-semibold">{label}</label>
                <input
                  className="w-full border border-border rounded-[8px] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[#9FE870] focus:ring-2 focus:ring-[#9FE870]/20"
                  defaultValue={value}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Notifications" && (
        <div className="flex flex-col gap-4 max-w-xl">
          <div className={`bg-card rounded-[12px] ${cardShadow} p-5`}>
            <p className="text-foreground text-sm font-semibold mb-1">Notification Preferences</p>
            <p className="text-muted-foreground text-sm mb-4">Manage alerts sent to your account</p>
            <div className="flex flex-col gap-0 divide-y divide-[#f5f5f5]">
              {[
                { key: "newEnrollment", label: "New Enrollment", desc: "Alert when a new beneficiary is enrolled" },
                { key: "syncComplete", label: "Sync Complete", desc: "Alert when field worker synchronizes records" },
                { key: "syncFailed", label: "Sync Failures", desc: "Alert when records fail to synchronize" },
                { key: "newFieldWorker", label: "New Field Worker", desc: "Alert when a new field worker is created" },
                { key: "weeklyReport", label: "Weekly Summary", desc: "Receive weekly enrollment summary report" },
                { key: "systemAlerts", label: "System Alerts", desc: "Critical system notifications" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-foreground text-sm font-semibold">{label}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key as keyof typeof n] }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${notifications[key as keyof typeof notifications] ? "bg-primary" : "bg-[#e5e5e5]"}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-card rounded-full shadow transition-transform ${notifications[key as keyof typeof notifications] ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "Security" && (
        <div className="flex flex-col gap-4 max-w-xl">
          <div className={`bg-card rounded-[12px] ${cardShadow} p-5 flex flex-col gap-4`}>
            <p className="text-foreground text-sm font-semibold">Change Password</p>
            {["Current Password", "New Password", "Confirm New Password"].map((label) => (
              <div key={label} className="flex flex-col gap-1.5">
                <label className="text-foreground text-sm font-semibold">{label}</label>
                <input type="password" className="w-full border border-border rounded-[8px] px-3 py-2.5 text-sm outline-none focus:border-[#9FE870]" placeholder="••••••••" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
