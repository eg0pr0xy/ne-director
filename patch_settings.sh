#!/bin/bash

# We will just append the missing cases to the switch statement in SettingsPage.tsx
sed -i -e '/case \x27services\x27:/i\
    case "people":\
      return (\
        <div className="space-y-8 animate-in fade-in duration-300">\
          <header className="mb-8">\
            <h2 className="text-xl font-medium text-text-primary mb-2">People</h2>\
          </header>\
          <div className="space-y-4">\
            {people.map((p: any) => (\
              <div key={p.id} className="bg-surface border border-border p-5 rounded-2xl flex items-center justify-between">\
                <div className="flex items-center gap-4">\
                  {p.avatarUrl ? (\
                    <img src={p.avatarUrl} className="w-10 h-10 rounded-full" alt="" />\
                  ) : (\
                    <div className="w-10 h-10 rounded-full bg-border flex items-center justify-center text-text-primary font-medium">{p.name.charAt(0)}</div>\
                  )}\
                  <div>\
                    <div className="font-medium text-text-primary">{p.name}</div>\
                    <div className="text-xs text-text-secondary">{p.role}</div>\
                  </div>\
                </div>\
                <div className="flex items-center gap-6">\
                  <label className="flex items-center gap-2 cursor-pointer">\
                    <input type="checkbox" defaultChecked={p.id === "p1"} className="rounded border-border" />\
                    <span className="text-sm text-text-primary">Priority Contact</span>\
                  </label>\
                  <select className="bg-bg border border-border text-text-primary text-xs rounded px-2 py-1 outline-none">\
                    <option>Preferred: Email</option>\
                    <option>Preferred: Message</option>\
                  </select>\
                </div>\
              </div>\
            ))}\
          </div>\
        </div>\
      );\
\
    case "focusModes":\
      return (\
        <div className="space-y-10 animate-in fade-in duration-300">\
          <header className="mb-8">\
            <h2 className="text-xl font-medium text-text-primary mb-2">Focus Modes</h2>\
          </header>\
          {["Normal", "On Set", "Development", "Travel", "Deep Work"].map(mode => (\
            <div key={mode} className="bg-surface border border-border p-5 rounded-2xl">\
              <div className="flex justify-between items-center mb-4">\
                <h3 className="font-medium text-text-primary uppercase tracking-wide">{mode}</h3>\
                <button className="text-xs text-text-muted hover:text-text-primary">Edit Configuration</button>\
              </div>\
              <div className="text-sm text-text-secondary mb-3">Visible categories:</div>\
              <div className="flex flex-wrap gap-2">\
                {["Production blockers", "Decisions", mode === "Deep Work" ? "" : "Calendar", "Travel"].filter(Boolean).map(c => (\
                  <span key={c} className="px-2 py-1 bg-border rounded text-xs text-text-primary">{c}</span>\
                ))}\
              </div>\
            </div>\
          ))}\
        </div>\
      );\
\
    case "privacy":\
      return (\
        <div className="space-y-10 animate-in fade-in duration-300">\
          <header className="mb-8">\
            <h2 className="text-xl font-medium text-text-primary mb-2">Privacy & Confidentiality</h2>\
          </header>\
          <div className="flex items-center justify-between py-4 border-b border-border">\
            <div>\
              <div className="text-text-primary font-medium">Keep personal and professional context separated</div>\
              <div className="text-text-secondary text-sm">Professional and personal memory domains remain strictly isolated.</div>\
            </div>\
            <Toggle checked={true} onChange={() => {}} />\
          </div>\
          <div className="pt-6">\
            <h3 className="text-sm font-semibold tracking-wider text-text-muted uppercase mb-4">Strict Confidentiality Projects</h3>\
            <div className="space-y-3">\
              {projects.map((p: any) => (\
                <label key={p.id} className="flex items-center gap-3 cursor-pointer group">\
                  <div className={"w-5 h-5 rounded border flex items-center justify-center transition-colors " + (p.id === "p1" ? "bg-bg-inverted border-bg-inverted" : "border-border")}>\
                    {p.id === "p1" && <div className="w-2.5 h-2.5 bg-bg rounded-sm" />}\
                  </div>\
                  <span className="text-sm text-text-primary uppercase tracking-wide">{p.name}</span>\
                </label>\
              ))}\
            </div>\
            <p className="text-xs text-text-muted mt-4">Strict Confidentiality applies tighter sharing and agent-action restrictions.</p>\
          </div>\
          <div className="pt-6 border-t border-border">\
            <h3 className="text-sm font-semibold tracking-wider text-text-muted uppercase mb-4">Activity History</h3>\
            <select className="bg-surface border border-border text-text-primary text-sm rounded-lg px-4 py-2 outline-none w-64">\
              <option>30 days</option>\
              <option>90 days</option>\
              <option>1 year</option>\
              <option>Keep until manually deleted</option>\
            </select>\
          </div>\
        </div>\
      );\
\
    case "notifications":\
    case "audit":\
      return (\
        <div className="space-y-10 animate-in fade-in duration-300">\
          <header className="mb-8">\
            <h2 className="text-xl font-medium text-text-primary mb-2 capitalize">{activeCategory}</h2>\
            <p className="text-text-secondary">Workspace configuration for {activeCategory}.</p>\
          </header>\
        </div>\
      );\
' src/pages/SettingsPage.tsx
