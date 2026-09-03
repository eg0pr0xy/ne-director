#!/bin/bash
sed -i -e '/case "notifications":/c\
    case "notifications":\
      return (\
        <div className="space-y-10 animate-in fade-in duration-300">\
          <header className="mb-8">\
            <h2 className="text-xl font-medium text-text-primary mb-2">Notifications</h2>\
          </header>\
          <div className="space-y-4">\
            <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl">\
              <div className="text-sm text-text-primary font-medium">Desktop</div>\
              <Toggle checked={settings.notifications.desktop} onChange={(c) => updateSettings({ ...settings, notifications: { ...settings.notifications, desktop: c } })} />\
            </div>\
            <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl">\
              <div className="text-sm text-text-primary font-medium">Mobile</div>\
              <Toggle checked={settings.notifications.mobile} onChange={(c) => updateSettings({ ...settings, notifications: { ...settings.notifications, mobile: c } })} />\
            </div>\
            <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl">\
              <div className="text-sm text-text-primary font-medium">Email Summary</div>\
              <Toggle checked={settings.notifications.emailSummary} onChange={(c) => updateSettings({ ...settings, notifications: { ...settings.notifications, emailSummary: c } })} />\
            </div>\
          </div>\
          <div className="pt-8 border-t border-border">\
            <div className="flex items-center justify-between mb-6">\
              <div>\
                <h3 className="text-sm font-semibold tracking-wider text-text-muted uppercase mb-1">Quiet Hours</h3>\
                <p className="text-xs text-text-secondary">Pause notifications during this window.</p>\
              </div>\
              <Toggle checked={settings.notifications.quietHoursEnabled} onChange={(c) => updateSettings({ ...settings, notifications: { ...settings.notifications, quietHoursEnabled: c } })} />\
            </div>\
            <div className="flex items-center gap-4 mb-6">\
              <input type="time" value={settings.notifications.quietHoursStart} onChange={(e) => updateSettings({ ...settings, notifications: { ...settings.notifications, quietHoursStart: e.target.value } })} className="bg-bg border border-border text-text-primary text-sm rounded-lg px-3 py-2 outline-none" />\
              <span className="text-text-muted">—</span>\
              <input type="time" value={settings.notifications.quietHoursEnd} onChange={(e) => updateSettings({ ...settings, notifications: { ...settings.notifications, quietHoursEnd: e.target.value } })} className="bg-bg border border-border text-text-primary text-sm rounded-lg px-3 py-2 outline-none" />\
            </div>\
            <label className="flex items-center gap-3 cursor-pointer group">\
              <div className={"w-5 h-5 rounded border flex items-center justify-center transition-colors " + (settings.notifications.allowCriticalAlerts ? "bg-bg-inverted border-bg-inverted" : "border-border group-hover:border-border-hover")}>\
                {settings.notifications.allowCriticalAlerts && <div className="w-2.5 h-2.5 bg-bg rounded-sm" />}\
              </div>\
              <span className="text-sm text-text-primary">Allow critical alerts</span>\
            </label>\
          </div>\
        </div>\
      );\
' src/pages/SettingsPage.tsx
