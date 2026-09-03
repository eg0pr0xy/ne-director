#!/bin/bash
sed -i -e '/case "audit":/c\
    case "audit":\
      return (\
        <div className="space-y-8 animate-in fade-in duration-300">\
          <header className="mb-8">\
            <h2 className="text-xl font-medium text-text-primary mb-2">Audit & Activity</h2>\
            <p className="text-text-secondary">Review actions performed by you and by your Chief of Staff.</p>\
          </header>\
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">\
            {["Everything", "Me", "Chief of Staff", "Approved", "Denied", "Failed"].map((f, i) => (\
              <button key={f} className={"px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors " + (i === 0 ? "bg-bg-inverted text-text-inverted" : "bg-border text-text-primary hover:bg-border-hover")}>\
                {f}\
              </button>\
            ))}\
          </div>\
          <div className="space-y-4">\
            <div className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between">\
              <div className="flex items-center gap-4">\
                <div className="text-xs text-text-muted w-12 shrink-0">10:03</div>\
                <div>\
                  <div className="text-sm font-medium text-text-primary mb-1">Producer informed</div>\
                  <div className="text-xs text-text-secondary">Chief of Staff</div>\
                </div>\
              </div>\
              <div className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded">Approved by Marcus</div>\
            </div>\
            <div className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between">\
              <div className="flex items-center gap-4">\
                <div className="text-xs text-text-muted w-12 shrink-0">09:45</div>\
                <div>\
                  <div className="text-sm font-medium text-text-primary mb-1">ORDO context accessed</div>\
                  <div className="text-xs text-text-secondary">Read only</div>\
                </div>\
              </div>\
            </div>\
            <div className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between opacity-70">\
              <div className="flex items-center gap-4">\
                <div className="text-xs text-text-muted w-12 shrink-0">Yesterday</div>\
                <div>\
                  <div className="text-sm font-medium text-text-primary mb-1">Meeting change proposed</div>\
                  <div className="text-xs text-text-secondary">Chief of Staff</div>\
                </div>\
              </div>\
              <div className="text-xs text-[#E56A54] bg-[#E56A54]/10 px-2 py-1 rounded">Denied</div>\
            </div>\
          </div>\
        </div>\
      );\
' src/pages/SettingsPage.tsx
