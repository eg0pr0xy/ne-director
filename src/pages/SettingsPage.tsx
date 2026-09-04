import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppStore';
import { ThemeAppearance, InterfaceDensity, ProactivityLevel, AttentionLevel, AutonomyPermission } from '../types/settings';
import { cn } from '../utils/cn';
import { MemoryItemCard, MemoryItemData } from '../components/MemoryItemCard';
import { connectionApi, connectionApiEnabled, ConnectionCapability, ConnectionSourceAccount, DirectorConnection, ProviderOption } from '../services/connections';

const INITIAL_MEMORY_ITEMS: MemoryItemData[] = [
  {
    id: 'mem-1',
    tag: 'PREFERENCE • TRAVEL',
    statement: 'Avoid connecting flights after 18:00.',
    source: 'Explicit instruction',
    confidence: 'High',
    domain: 'TRAVEL',
    ruleDescription: 'Automatically filters draft flight bookings to eliminate connecting itineraries departing after 18:00. Prioritizes nonstop options or holds travel recommendations for next-morning departure.',
    systemBehavior: 'Active during itinerary generation, agency ticket verification, and Command Bar flight queries.',
    learnedDate: 'August 14, 2026 via Marcus directive',
    triggerCount: 8,
    appliesTo: ['Travel Coordinator', 'Daily Briefing', 'Command Bar']
  },
  {
    id: 'mem-2',
    tag: 'STANDING INSTRUCTION • CASTING',
    statement: 'Do not schedule casting sessions before 10:00.',
    source: 'Explicit instruction',
    confidence: 'High',
    domain: 'CASTING',
    ruleDescription: 'Protects morning rehearsal and creative reflection by deferring incoming calendar requests for auditions, chemistry reads, and callback appointments prior to 10:00 AM.',
    systemBehavior: 'Monitors incoming calendar invites and audition session submissions from Elena Rostova.',
    learnedDate: 'July 29, 2026 during Pre-production kick-off',
    triggerCount: 14,
    appliesTo: ['Calendar Coordination', 'ORDO Schedule', 'Elena Rostova']
  },
  {
    id: 'mem-3',
    tag: 'RELATIONSHIP CONTEXT • ANNA MEYER',
    statement: 'Discuss major budget changes personally rather than by email.',
    source: 'Observation',
    confidence: 'Medium',
    domain: 'BUDGET',
    ruleDescription: 'Flags outgoing email drafts or notifications regarding budget variances above €25,000. Prompts the director to place a direct phone call or schedule an in-person sync first.',
    systemBehavior: 'Triggered during budget contingency reviews and financial threshold notices in the Attention queue.',
    learnedDate: 'Synthesized from 3 producer discussions in August 2026',
    triggerCount: 5,
    appliesTo: ['Finance & Budget', 'Anna Meyer', 'Attention Queue']
  },
  {
    id: 'mem-4',
    tag: 'CREATIVE PREFERENCE • EDITING',
    statement: 'Keep rough cut assemblies under 130 minutes before first director pass.',
    source: 'Explicit instruction',
    confidence: 'High',
    domain: 'CREATIVE',
    ruleDescription: 'Advises editor Taro Tanaka to deliver condensed sequence blocks rather than exhaustive assemblies, focusing on core narrative momentum and character beats.',
    systemBehavior: 'Scanned during NARRATE assembly deliveries and edit room cut alerts.',
    learnedDate: 'August 02, 2026 editorial briefing',
    triggerCount: 3,
    appliesTo: ['NARRATE', 'Taro Tanaka', 'Assembly Reviews']
  }
];

const CATEGORIES = [
  { id: 'appearance', label: 'Appearance', section: 'GENERAL' },
  { id: 'languageTime', label: 'Language & Time', section: 'GENERAL' },
  { id: 'behavior', label: 'Behavior', section: 'CHIEF OF STAFF' },
  { id: 'attention', label: 'Attention', section: 'CHIEF OF STAFF' },
  { id: 'autonomy', label: 'Autonomy', section: 'CHIEF OF STAFF' },
  { id: 'focusModes', label: 'Focus Modes', section: 'CHIEF OF STAFF' },
  { id: 'projects', label: 'Projects', section: 'WORK' },
  { id: 'people', label: 'People', section: 'WORK' },
  { id: 'connections', label: 'Connections', section: 'WORK' },
  { id: 'memory', label: 'Memory', section: 'TRUST' },
  { id: 'privacy', label: 'Privacy', section: 'TRUST' },
  { id: 'notifications', label: 'Notifications', section: 'TRUST' },
  { id: 'audit', label: 'Audit', section: 'TRUST' },
];

export const SettingsPage = () => {
  const { settings, updateSettings, resetSettings, projects, people, settingsCategory, setSettingsCategory } = useApp();
  const [activeCategory, setActiveCategory] = useState(settingsCategory || 'appearance');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (settingsCategory) {
      setActiveCategory(settingsCategory);
      setSettingsCategory(null); // consume it once
    }
  }, [settingsCategory, setSettingsCategory]);

  const sections = Array.from(new Set(CATEGORIES.map(c => c.section)));

  return (
    <div className="px-8 py-10 max-w-[1200px] mx-auto pb-32 h-full flex flex-col">
      <header className="mb-10 shrink-0">
        <h1 className="text-[28px] font-semibold tracking-tight text-text-primary uppercase mb-1">
          SETTINGS
        </h1>
        <p className="text-text-secondary text-sm tracking-wide">How should my Chief of Staff work for me?</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-12 flex-1 min-h-0">
        {/* LEFT Navigation */}
        <div className="w-full lg:w-64 shrink-0 overflow-y-auto">
          {sections.map(section => (
            <div key={section} className="mb-8">
              <h3 className="text-[11px] font-bold text-text-muted tracking-widest uppercase mb-3 px-3">
                {section}
              </h3>
              <div className="space-y-1">
                {CATEGORIES.filter(c => c.section === section).map(category => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      activeCategory === category.id
                        ? "bg-surface-hover text-text-primary font-medium"
                        : "text-text-secondary hover:text-text-primary hover:bg-border"
                    )}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-12 px-3 pb-8">
            {showResetConfirm ? (
              <div className="bg-surface border border-border p-4 rounded-xl">
                <p className="text-xs text-text-primary font-medium mb-3">Reset NE Director settings? This restores prototype defaults.</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowResetConfirm(false)} className="px-3 py-1.5 text-xs bg-border hover:bg-border-hover rounded text-text-primary">Cancel</button>
                  <button onClick={() => { resetSettings(); setShowResetConfirm(false); }} className="px-3 py-1.5 text-xs bg-[#E56A54] text-white rounded font-medium">Reset</button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowResetConfirm(true)}
                className="text-xs text-text-muted hover:text-text-primary transition-colors"
              >
                Reset Settings
              </button>
            )}
          </div>
        </div>

        {/* RIGHT Content */}
        <div className="flex-1 overflow-y-auto pb-20 pr-4">
          <SettingsContent 
            activeCategory={activeCategory} 
            settings={settings} 
            updateSettings={updateSettings}
            projects={projects}
            people={people}
          />
        </div>
      </div>
    </div>
  );
};

const SettingsContent = ({ activeCategory, settings, updateSettings, projects, people }: any) => {
  const updateApp = (key: string, value: any) => {
    updateSettings({ ...settings, appearance: { ...settings.appearance, [key]: value } });
  };
  const updateCoS = (key: string, value: any) => {
    updateSettings({ ...settings, chiefOfStaff: { ...settings.chiefOfStaff, [key]: value } });
  };
  const updateAtt = (key: string, value: any) => {
    updateSettings({ ...settings, attention: { ...settings.attention, [key]: value } });
  };
  const updateAttInt = (key: string, value: any) => {
    updateSettings({ ...settings, attention: { ...settings.attention, interruptions: { ...settings.attention.interruptions, [key]: value } } });
  };
  const updateAuto = (section: string, key: string, value: any) => {
    updateSettings({ ...settings, autonomy: { ...settings.autonomy, [section]: { ...settings.autonomy[section], [key]: value } } });
  };

  switch (activeCategory) {
    case 'appearance':
      return (
        <div className="space-y-10 animate-in fade-in duration-300">
          <div>
            <h2 className="text-lg font-medium text-text-primary mb-6">Interface Theme</h2>
            <div className="flex gap-4">
              {['Black', 'White', 'System'].map(t => (
                <button 
                  key={t}
                  onClick={() => updateApp('theme', t)}
                  className={cn(
                    "px-6 py-3 rounded-xl border text-sm font-medium transition-all",
                    settings.appearance.theme === t ? "border-border-focus bg-surface text-text-primary" : "border-border bg-transparent text-text-secondary hover:border-border-hover"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-medium text-text-primary mb-6">Interface Density</h2>
            <div className="flex gap-4">
              {['Comfortable', 'Compact'].map(t => (
                <button 
                  key={t}
                  onClick={() => updateApp('density', t)}
                  className={cn(
                    "px-6 py-3 rounded-xl border text-sm font-medium transition-all",
                    settings.appearance.density === t ? "border-border-focus bg-surface text-text-primary" : "border-border bg-transparent text-text-secondary hover:border-border-hover"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-border">
            <div>
              <div className="text-text-primary font-medium">Reduce Motion</div>
              <div className="text-text-secondary text-sm">Reduce drawer animation and transitions</div>
            </div>
            <Toggle 
              checked={settings.appearance.reduceMotion} 
              onChange={(c) => updateApp('reduceMotion', c)} 
            />
          </div>
        </div>
      );

    case 'languageTime':
      return (
        <div className="space-y-10 animate-in fade-in duration-300">
          <div>
            <h2 className="text-lg font-medium text-text-primary mb-6">Language</h2>
            <select className="bg-surface border border-border text-text-primary text-sm rounded-lg px-4 py-2 outline-none w-64">
              <option>English</option>
              <option>Deutsch</option>
            </select>
          </div>
          <div>
            <h2 className="text-lg font-medium text-text-primary mb-6">Time Format</h2>
            <select className="bg-surface border border-border text-text-primary text-sm rounded-lg px-4 py-2 outline-none w-64">
              <option>24 hour</option>
              <option>12 hour</option>
            </select>
          </div>
          <div>
            <h2 className="text-lg font-medium text-text-primary mb-6">Date Format</h2>
            <select className="bg-surface border border-border text-text-primary text-sm rounded-lg px-4 py-2 outline-none w-64">
              <option>DD.MM.YYYY</option>
              <option>MM/DD/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </div>
          <div>
            <h2 className="text-lg font-medium text-text-primary mb-6">Time Zone</h2>
            <select className="bg-surface border border-border text-text-primary text-sm rounded-lg px-4 py-2 outline-none w-64">
              <option>Europe / Berlin</option>
              <option>Europe / London</option>
              <option>America / Los_Angeles</option>
            </select>
          </div>
        </div>
      );
      
    case 'behavior':
      return (
        <div className="space-y-10 animate-in fade-in duration-300">
          <header className="mb-8">
            <h2 className="text-xl font-medium text-text-primary mb-2">Chief of Staff Behavior</h2>
            <p className="text-text-secondary">Control how proactively your Chief of Staff works.</p>
          </header>

          <div>
            <h3 className="text-sm font-semibold tracking-wider text-text-muted uppercase mb-4">Proactivity</h3>
            <div className="space-y-3">
              {[
                { id: 'QUIET', label: 'Quiet', desc: 'Only surface issues that clearly require your attention.' },
                { id: 'BALANCED', label: 'Balanced', desc: 'Surface important decisions, deadlines and emerging risks.' },
                { id: 'PROACTIVE', label: 'Proactive', desc: 'Actively identify potential issues and suggest next actions early.' }
              ].map(opt => (
                <div 
                  key={opt.id}
                  onClick={() => updateCoS('proactivity', opt.id)}
                  className={cn(
                    "p-4 border rounded-xl cursor-pointer transition-colors",
                    settings.chiefOfStaff.proactivity === opt.id ? "border-border-focus bg-surface-hover" : "border-border hover:border-border-hover bg-surface"
                  )}
                >
                  <div className="font-medium text-text-primary mb-1 uppercase text-sm tracking-wider">{opt.label}</div>
                  <div className="text-sm text-text-secondary">{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-text-primary font-medium">Daily Brief</div>
                <div className="text-text-secondary text-sm">Prepare a daily overview of decisions, deadlines, risks and schedule.</div>
              </div>
              <Toggle checked={settings.chiefOfStaff.dailyBrief} onChange={(c) => updateCoS('dailyBrief', c)} />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-text-primary font-medium">End of Day Review</div>
                <div className="text-text-secondary text-sm">Summarize unresolved items, decisions and what carries into tomorrow.</div>
              </div>
              <Toggle checked={settings.chiefOfStaff.endOfDayReview} onChange={(c) => updateCoS('endOfDayReview', c)} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-text-primary font-medium">Automatic Meeting Preparation</div>
                <div className="text-text-secondary text-sm">Prepare meeting context before meetings.</div>
              </div>
              <div className="flex gap-4 items-center">
                <select className="bg-surface border border-border text-text-primary text-sm rounded-lg px-3 py-1.5 outline-none">
                  <option>15 min</option>
                  <option>30 min</option>
                  <option>60 min</option>
                  <option>120 min</option>
                </select>
                <Toggle checked={settings.chiefOfStaff.autoMeetingPrep} onChange={(c) => updateCoS('autoMeetingPrep', c)} />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-text-primary font-medium">Follow-up Threshold</div>
                <div className="text-text-secondary text-sm">When should unanswered requests begin appearing in Waiting For?</div>
              </div>
              <select 
                className="bg-surface border border-border text-text-primary text-sm rounded-lg px-3 py-1.5 outline-none"
                value={settings.chiefOfStaff.followUpThresholdHours}
                onChange={(e) => updateCoS('followUpThresholdHours', Number(e.target.value))}
              >
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
                <option value={48}>48 hours</option>
                <option value={72}>72 hours</option>
              </select>
            </div>
          </div>
        </div>
      );

    case 'attention':
      return (
        <div className="space-y-10 animate-in fade-in duration-300">
          <header className="mb-8">
            <h2 className="text-xl font-medium text-text-primary mb-2">Attention</h2>
            <p className="text-text-secondary">Control what is allowed to interrupt you.</p>
          </header>

          <div>
            <h3 className="text-sm font-semibold tracking-wider text-text-muted uppercase mb-4">Attention Level</h3>
            <div className="space-y-3">
              {[
                { id: 'ONLY CRITICAL', desc: 'Only blockers, urgent deadlines, and schedule disruptions.' },
                { id: 'STANDARD', desc: 'Default operational awareness.' },
                { id: 'HIGH AWARENESS', desc: 'Also surface emerging risks, weak dependencies, and prep.' }
              ].map(opt => (
                <div 
                  key={opt.id}
                  onClick={() => updateAtt('level', opt.id)}
                  className={cn(
                    "p-4 border rounded-xl cursor-pointer transition-colors",
                    settings.attention.level === opt.id ? "border-border-focus bg-surface-hover" : "border-border hover:border-border-hover bg-surface"
                  )}
                >
                  <div className="font-medium text-text-primary mb-1 uppercase text-sm tracking-wider">{opt.id}</div>
                  <div className="text-sm text-text-secondary">{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-border">
            <h3 className="text-sm font-semibold tracking-wider text-text-muted uppercase mb-4">Allow immediate interruption for:</h3>
            <div className="space-y-4">
              {[
                { k: 'productionBlockers', l: 'Production blockers' },
                { k: 'decisionsRequiringMe', l: 'Decisions requiring me' },
                { k: 'travelDisruption', l: 'Travel disruption' },
                { k: 'deadlinesUnder2Hours', l: 'Deadlines under 2 hours' },
                { k: 'priorityContacts', l: 'Priority contacts' },
                { k: 'generalFYI', l: 'General FYI' },
                { k: 'routineUpdates', l: 'Routine project updates' },
              ].map(opt => (
                <label key={opt.k} className="flex items-center gap-3 cursor-pointer group">
                  <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", 
                    (settings.attention.interruptions as any)[opt.k] ? "bg-bg-inverted border-bg-inverted" : "border-border group-hover:border-border-hover"
                  )}>
                    {(settings.attention.interruptions as any)[opt.k] && <div className="w-2.5 h-2.5 bg-bg rounded-sm" />}
                  </div>
                  <span className="text-sm text-text-primary">{opt.l}</span>
                  <input type="checkbox" className="hidden" 
                    checked={(settings.attention.interruptions as any)[opt.k]} 
                    onChange={(e) => updateAttInt(opt.k, e.target.checked)} 
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-border">
            <div>
              <div className="text-text-primary font-medium">Show FYI items on Today</div>
            </div>
            <Toggle checked={settings.attention.showFyiOnToday} onChange={(c) => updateAtt('showFyiOnToday', c)} />
          </div>
        </div>
      );

    case 'autonomy':
      return (
        <div className="space-y-10 animate-in fade-in duration-300">
          <header className="mb-4">
            <h2 className="text-xl font-medium text-text-primary mb-2">Autonomy & Approvals</h2>
            <p className="text-text-secondary">Choose what your Chief of Staff may do without asking you first.</p>
          </header>

          <div className="bg-surface border border-border p-5 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="font-medium text-text-primary mb-1">Pause Autonomous Actions</h3>
              <p className="text-sm text-text-secondary">Chief of Staff may continue to observe and prepare actions, but may not execute external actions.</p>
            </div>
            <button 
              onClick={() => updateSettings({ ...settings, autonomy: { ...settings.autonomy, isPaused: !settings.autonomy.isPaused } })}
              className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                settings.autonomy.isPaused ? "bg-[#E56A54]/10 text-[#E56A54] border-[#E56A54]/20" : "bg-surface hover:bg-border border-border text-text-primary"
              )}
            >
              {settings.autonomy.isPaused ? "Paused" : "Pause"}
            </button>
          </div>

          {[
            { id: 'calendar', label: 'Calendar Permissions', keys: [
              { k: 'createInternalHolds', l: 'Create internal calendar holds' },
              { k: 'moveInternalMeetings', l: 'Move internal meetings' },
              { k: 'moveExternalMeetings', l: 'Move external meetings' },
              { k: 'cancelMeetings', l: 'Cancel meetings' },
            ]},
            { id: 'communication', label: 'Communication Permissions', keys: [
              { k: 'draftInternalReplies', l: 'Draft internal replies' },
              { k: 'sendInternalReplies', l: 'Send internal replies' },
              { k: 'draftExternalReplies', l: 'Draft external replies' },
              { k: 'sendExternalReplies', l: 'Send external replies' },
              { k: 'sendFollowUps', l: 'Send follow-ups' },
            ]},
            { id: 'production', label: 'Production Actions', keys: [
              { k: 'updateInternalState', l: 'Update internal task state' },
              { k: 'resolveDependency', l: 'Resolve production dependency' },
              { k: 'changeSchedule', l: 'Change production schedule' },
            ]},
            { id: 'financial', label: 'Financial / Booking', note: 'Financial actions require explicit authorization.', keys: [
              { k: 'bookTravel', l: 'Book travel' },
              { k: 'approveSpending', l: 'Approve spending' },
              { k: 'makePurchases', l: 'Make purchases' },
            ]}
          ].map(section => (
            <div key={section.id} className="pt-6 border-t border-border">
              <h3 className="text-sm font-semibold tracking-wider text-text-muted uppercase mb-1">{section.label}</h3>
              {section.note && <p className="text-xs text-text-muted mb-4">{section.note}</p>}
              {!section.note && <div className="h-4" />}
              
              <div className="space-y-4">
                {section.keys.map(item => (
                  <div key={item.k} className="flex items-center justify-between">
                    <span className="text-sm text-text-primary">{item.l}</span>
                    <select 
                      className="bg-surface border border-border text-text-primary text-sm rounded-lg px-3 py-1.5 outline-none"
                      value={(settings.autonomy as any)[section.id][item.k]}
                      onChange={(e) => updateAuto(section.id, item.k, e.target.value)}
                    >
                      <option>Suggest Only</option>
                      <option>Approval Required</option>
                      <option>Allowed</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );

    case 'projects':
      return (
        <div className="space-y-8 animate-in fade-in duration-300">
          <header className="mb-8">
            <h2 className="text-xl font-medium text-text-primary mb-2">Projects</h2>
          </header>
          <div className="space-y-4">
            {projects.map((p: any) => (
              <div key={p.id} className="bg-surface border border-border p-5 rounded-2xl">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-medium text-text-primary uppercase tracking-wide">{p.name}</h3>
                  <select className="bg-bg border border-border text-text-primary text-xs rounded px-2 py-1 outline-none">
                    <option>Priority: HIGH</option>
                    <option>Priority: MEDIUM</option>
                    <option>Priority: LOW</option>
                  </select>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-text-secondary">Show on Today</span>
                  <Toggle checked={true} onChange={() => {}} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Include in cross-project attention</span>
                  <Toggle checked={true} onChange={() => {}} />
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'memory':
      return <MemorySettingsSection />;

    case "people":
      return (
        <div className="space-y-8 animate-in fade-in duration-300">
          <header className="mb-8">
            <h2 className="text-xl font-medium text-text-primary mb-2">People</h2>
          </header>
          <div className="space-y-4">
            {people.map((p: any) => (
              <div key={p.id} className="bg-surface border border-border p-5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} className="w-10 h-10 rounded-full" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-border flex items-center justify-center text-text-primary font-medium">{p.name.charAt(0)}</div>
                  )}
                  <div>
                    <div className="font-medium text-text-primary">{p.name}</div>
                    <div className="text-xs text-text-secondary">{p.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked={p.id === "p1"} className="rounded border-border" />
                    <span className="text-sm text-text-primary">Priority Contact</span>
                  </label>
                  <select className="bg-bg border border-border text-text-primary text-xs rounded px-2 py-1 outline-none">
                    <option>Preferred: Email</option>
                    <option>Preferred: Message</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "focusModes":
      return (
        <div className="space-y-10 animate-in fade-in duration-300">
          <header className="mb-8">
            <h2 className="text-xl font-medium text-text-primary mb-2">Focus Modes</h2>
          </header>
          {["Normal", "On Set", "Development", "Travel", "Deep Work"].map(mode => (
            <div key={mode} className="bg-surface border border-border p-5 rounded-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-text-primary uppercase tracking-wide">{mode}</h3>
                <button className="text-xs text-text-muted hover:text-text-primary">Edit Configuration</button>
              </div>
              <div className="text-sm text-text-secondary mb-3">Visible categories:</div>
              <div className="flex flex-wrap gap-2">
                {["Production blockers", "Decisions", mode === "Deep Work" ? "" : "Calendar", "Travel"].filter(Boolean).map(c => (
                  <span key={c} className="px-2 py-1 bg-border rounded text-xs text-text-primary">{c}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      );

    case "privacy":
      return (
        <div className="space-y-10 animate-in fade-in duration-300">
          <header className="mb-8">
            <h2 className="text-xl font-medium text-text-primary mb-2">Privacy & Confidentiality</h2>
          </header>
          <div className="flex items-center justify-between py-4 border-b border-border">
            <div>
              <div className="text-text-primary font-medium">Keep personal and professional context separated</div>
              <div className="text-text-secondary text-sm">Professional and personal memory domains remain strictly isolated.</div>
            </div>
            <Toggle checked={true} onChange={() => {}} />
          </div>
          <div className="pt-6">
            <h3 className="text-sm font-semibold tracking-wider text-text-muted uppercase mb-4">Strict Confidentiality Projects</h3>
            <div className="space-y-3">
              {projects.map((p: any) => (
                <label key={p.id} className="flex items-center gap-3 cursor-pointer group">
                  <div className={"w-5 h-5 rounded border flex items-center justify-center transition-colors " + (p.id === "p1" ? "bg-bg-inverted border-bg-inverted" : "border-border")}>
                    {p.id === "p1" && <div className="w-2.5 h-2.5 bg-bg rounded-sm" />}
                  </div>
                  <span className="text-sm text-text-primary uppercase tracking-wide">{p.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-4">Strict Confidentiality applies tighter sharing and agent-action restrictions.</p>
          </div>
          <div className="pt-6 border-t border-border">
            <h3 className="text-sm font-semibold tracking-wider text-text-muted uppercase mb-4">Activity History</h3>
            <select className="bg-surface border border-border text-text-primary text-sm rounded-lg px-4 py-2 outline-none w-64">
              <option>30 days</option>
              <option>90 days</option>
              <option>1 year</option>
              <option>Keep until manually deleted</option>
            </select>
          </div>
        </div>
      );

    case "notifications":
      return (
        <div className="space-y-10 animate-in fade-in duration-300">
          <header className="mb-8">
            <h2 className="text-xl font-medium text-text-primary mb-2">Notifications</h2>
          </header>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl">
              <div className="text-sm text-text-primary font-medium">Desktop</div>
              <Toggle checked={settings.notifications.desktop} onChange={(c) => updateSettings({ ...settings, notifications: { ...settings.notifications, desktop: c } })} />
            </div>
            <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl">
              <div className="text-sm text-text-primary font-medium">Mobile</div>
              <Toggle checked={settings.notifications.mobile} onChange={(c) => updateSettings({ ...settings, notifications: { ...settings.notifications, mobile: c } })} />
            </div>
            <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl">
              <div className="text-sm text-text-primary font-medium">Email Summary</div>
              <Toggle checked={settings.notifications.emailSummary} onChange={(c) => updateSettings({ ...settings, notifications: { ...settings.notifications, emailSummary: c } })} />
            </div>
          </div>
          <div className="pt-8 border-t border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold tracking-wider text-text-muted uppercase mb-1">Quiet Hours</h3>
                <p className="text-xs text-text-secondary">Pause notifications during this window.</p>
              </div>
              <Toggle checked={settings.notifications.quietHoursEnabled} onChange={(c) => updateSettings({ ...settings, notifications: { ...settings.notifications, quietHoursEnabled: c } })} />
            </div>
            <div className="flex items-center gap-4 mb-6">
              <input type="time" value={settings.notifications.quietHoursStart} onChange={(e) => updateSettings({ ...settings, notifications: { ...settings.notifications, quietHoursStart: e.target.value } })} className="bg-bg border border-border text-text-primary text-sm rounded-lg px-3 py-2 outline-none" />
              <span className="text-text-muted">—</span>
              <input type="time" value={settings.notifications.quietHoursEnd} onChange={(e) => updateSettings({ ...settings, notifications: { ...settings.notifications, quietHoursEnd: e.target.value } })} className="bg-bg border border-border text-text-primary text-sm rounded-lg px-3 py-2 outline-none" />
            </div>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={"w-5 h-5 rounded border flex items-center justify-center transition-colors " + (settings.notifications.allowCriticalAlerts ? "bg-bg-inverted border-bg-inverted" : "border-border group-hover:border-border-hover")}>
                {settings.notifications.allowCriticalAlerts && <div className="w-2.5 h-2.5 bg-bg rounded-sm" />}
              </div>
              <span className="text-sm text-text-primary">Allow critical alerts</span>
            </label>
          </div>
        </div>
      );

    case "audit":
      return (
        <div className="space-y-8 animate-in fade-in duration-300">
          <header className="mb-8">
            <h2 className="text-xl font-medium text-text-primary mb-2">Audit & Activity</h2>
            <p className="text-text-secondary">Review actions performed by you and by your Chief of Staff.</p>
          </header>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {["Everything", "Me", "Chief of Staff", "Approved", "Denied", "Failed"].map((f, i) => (
              <button key={f} className={"px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors " + (i === 0 ? "bg-bg-inverted text-text-inverted" : "bg-border text-text-primary hover:bg-border-hover")}>
                {f}
              </button>
            ))}
          </div>
          <div className="space-y-4">
            <div className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-xs text-text-muted w-12 shrink-0">10:03</div>
                <div>
                  <div className="text-sm font-medium text-text-primary mb-1">Producer informed</div>
                  <div className="text-xs text-text-secondary">Chief of Staff</div>
                </div>
              </div>
              <div className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded">Approved by Marcus</div>
            </div>
            <div className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-xs text-text-muted w-12 shrink-0">09:45</div>
                <div>
                  <div className="text-sm font-medium text-text-primary mb-1">ORDO context accessed</div>
                  <div className="text-xs text-text-secondary">Read only</div>
                </div>
              </div>
            </div>
            <div className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between opacity-70">
              <div className="flex items-center gap-4">
                <div className="text-xs text-text-muted w-12 shrink-0">Yesterday</div>
                <div>
                  <div className="text-sm font-medium text-text-primary mb-1">Meeting change proposed</div>
                  <div className="text-xs text-text-secondary">Chief of Staff</div>
                </div>
              </div>
              <div className="text-xs text-[#E56A54] bg-[#E56A54]/10 px-2 py-1 rounded">Denied</div>
            </div>
          </div>
        </div>
      );

      return (
        <div className="space-y-10 animate-in fade-in duration-300">
          <header className="mb-8">
            <h2 className="text-xl font-medium text-text-primary mb-2 capitalize">{activeCategory}</h2>
            <p className="text-text-secondary">Workspace configuration for {activeCategory}.</p>
          </header>
        </div>
      );

    case 'connections':
      return <ConnectionsSettingsSection />;

    default:
      return (
        <div className="text-center py-20 text-text-muted">
          Workspace configuration for {activeCategory}
        </div>
      );
  }
};

const stateClass = (state: string) => state === 'CONNECTED' ? 'bg-green-500/10 text-green-500' : state === 'DEGRADED' || state === 'AUTH_REQUIRED' ? 'bg-amber-500/10 text-amber-600' : state === 'DISABLED' || state === 'REVOKED' ? 'bg-[#E56A54]/10 text-[#E56A54]' : 'bg-border text-text-secondary';
const sourceLabel = (capability: string) => capability === 'COMMUNICATION' ? 'Mail' : capability === 'SCHEDULE' ? 'Calendar' : 'Contacts';

const ConnectionsSettingsSection = () => {
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [connections, setConnections] = useState<DirectorConnection[]>([]);
  const [accounts, setAccounts] = useState<ConnectionSourceAccount[]>([]);
  const [loading, setLoading] = useState(connectionApiEnabled);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [accountIdentifier, setAccountIdentifier] = useState('');
  const [providerId, setProviderId] = useState('GOOGLE');
  const [capabilities, setCapabilities] = useState<ConnectionCapability[]>(['MAIL', 'CALENDAR']);
  const [mailboxes, setMailboxes] = useState<string[]>(['INBOX']);
  const [calendars, setCalendars] = useState<string[]>(['primary']);

  const refresh = async () => {
    if (!connectionApiEnabled) return;
    setLoading(true);
    try {
      const [providerItems, connectionItems, accountItems] = await Promise.all([connectionApi.providers(), connectionApi.connections(), connectionApi.accounts()]);
      setProviders(providerItems); setConnections(connectionItems); setAccounts(accountItems); setError(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'CONNECTIONS_UNAVAILABLE'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void refresh(); }, []);
  const selectedProvider = providers.find(provider => provider.id === providerId);
  const toggleCapability = (capability: ConnectionCapability) => {
    if (capability === 'CONTACTS') return;
    setCapabilities(previous => previous.includes(capability) ? previous.filter(item => item !== capability) : [...previous, capability]);
  };
  const toggleSelection = (value: string, current: string[], setCurrent: (value: string[]) => void) => setCurrent(current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  const addConnection = async () => {
    if (!displayName.trim() || !accountIdentifier.trim() || !capabilities.length) return;
    try {
      await connectionApi.create({ displayName: displayName.trim(), provider: providerId, accountIdentifier: accountIdentifier.trim(), capabilities, selectionMetadata: { includedMailboxes: capabilities.includes('MAIL') ? mailboxes : [], includedCalendars: capabilities.includes('CALENDAR') ? calendars : [] } });
      setShowAdd(false); setDisplayName(''); setAccountIdentifier(''); await refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'CONNECTION_CREATE_FAILED'); }
  };
  const run = async (operation: () => Promise<unknown>) => { try { await operation(); await refresh(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'CONNECTION_ACTION_FAILED'); } };
  const authorize = async (connection: DirectorConnection) => {
    try {
      const result = await connectionApi.authorizationIntent(connection.id) as { authorizationUrl?: string };
      if (!result.authorizationUrl) throw new Error('AUTHORIZATION_HANDOFF_MISSING');
      window.location.assign(result.authorizationUrl);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'CONNECTION_ACTION_FAILED'); }
  };

  if (!connectionApiEnabled) return <div className="space-y-4 animate-in fade-in duration-300"><h2 className="text-xl font-medium text-text-primary">Connections</h2><div className="border border-dashed border-border rounded-2xl p-6 text-sm text-text-secondary">Connections require API runtime mode. Mock mode intentionally has no connection authority or simulated provider state.</div></div>;

  return <div className="space-y-6 animate-in fade-in duration-300">
    <header className="flex items-start justify-between gap-6">
      <div><h2 className="text-xl font-medium text-text-primary mb-2">Connections</h2><p className="text-sm text-text-secondary">Provider connections are read-only ingress configuration. Authorization and health come from the API.</p></div>
      <button onClick={() => setShowAdd(true)} className="px-3 py-2 bg-bg-inverted text-text-inverted text-xs rounded font-medium shrink-0">Add connection</button>
    </header>
    {error && <div className="border border-[#E56A54]/30 bg-[#E56A54]/10 text-[#E56A54] p-3 rounded-lg text-xs flex justify-between gap-3"><span>{error}</span><button onClick={() => setError(null)}>Dismiss</button></div>}
    {showAdd && <section className="p-5 border border-border rounded-2xl bg-surface space-y-5">
      <div className="flex justify-between"><div><h3 className="text-sm font-medium text-text-primary">Add connection</h3><p className="text-xs text-text-secondary mt-1">Provider choice is yours. No password, token, or app-specific password is entered here.</p></div><button onClick={() => setShowAdd(false)} className="text-xs text-text-muted">Cancel</button></div>
      <div className="grid sm:grid-cols-2 gap-4"><label className="text-xs text-text-secondary">Display name<input value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="Marcus Private" className="mt-1 w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary" /></label><label className="text-xs text-text-secondary">Account identifier<input value={accountIdentifier} onChange={event => setAccountIdentifier(event.target.value)} placeholder="name@example.com" className="mt-1 w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary" /></label></div>
      <label className="text-xs text-text-secondary block">Provider<select value={providerId} onChange={event => setProviderId(event.target.value)} className="mt-1 w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary">{providers.map(provider => <option key={provider.id} value={provider.id}>{provider.displayName} — {provider.implementationStatus === 'AVAILABLE' ? 'available' : 'adapter unavailable'}</option>)}</select></label>
      {selectedProvider && <p className={cn('text-xs rounded p-3', selectedProvider.implementationStatus === 'AVAILABLE' ? 'text-green-600 bg-green-500/10' : 'text-amber-600 bg-amber-500/10')}>{selectedProvider.detail} {selectedProvider.implementationStatus === 'AVAILABLE' ? 'Authorize only after the local Google OAuth configuration has been approved.' : 'The connection will remain unconfigured until a verified adapter is added.'}</p>}
      <div><div className="text-xs text-text-secondary mb-2">Capabilities</div><div className="flex flex-wrap gap-2">{(['MAIL', 'CALENDAR'] as ConnectionCapability[]).map(capability => <button key={capability} onClick={() => toggleCapability(capability)} className={cn('px-3 py-2 border rounded text-xs', capabilities.includes(capability) ? 'bg-bg-inverted text-text-inverted border-bg-inverted' : 'border-border text-text-secondary')}>{capability === 'MAIL' ? 'Mail' : 'Calendar'}</button>)}<span className="px-3 py-2 border border-border rounded text-xs text-text-muted">Contacts — coming later</span></div></div>
      {capabilities.includes('MAIL') && <SelectionRow label="Included mailboxes (planned defaults; verify after provider discovery)" values={['INBOX', 'Archive', 'Sent']} selected={mailboxes} onToggle={value => toggleSelection(value, mailboxes, setMailboxes)} />}
      {capabilities.includes('CALENDAR') && <SelectionRow label="Included calendars (planned defaults; verify after provider discovery)" values={['primary', 'Private', 'Birthdays']} selected={calendars} onToggle={value => toggleSelection(value, calendars, setCalendars)} />}
      <button disabled={!displayName.trim() || !accountIdentifier.trim() || !capabilities.length} onClick={() => void addConnection()} className="px-3 py-2 bg-border hover:bg-border-hover disabled:opacity-50 text-text-primary text-xs rounded font-medium">Save connection configuration</button>
    </section>}
    {loading ? <div className="text-sm text-text-muted">Loading connections…</div> : connections.length === 0 ? <div className="border border-dashed border-border rounded-2xl p-8 text-center"><div className="text-sm text-text-primary">No connections configured</div><p className="text-xs text-text-secondary mt-2">Add a provider configuration to begin a verified authorization flow when its adapter is available.</p></div> : <div className="space-y-4">{connections.map(connection => {
      const sourceAccounts = accounts.filter(account => account.connectionId === connection.id);
      return <article key={connection.id} className="p-5 border border-border rounded-2xl bg-surface space-y-4"><div className="flex items-start justify-between gap-4"><div><h3 className="text-sm font-medium text-text-primary">{connection.displayName}</h3><p className="text-xs text-text-secondary mt-1">{connection.provider} · {connection.accountIdentifier}</p></div><div className="text-right space-y-1"><span className={cn('inline-block px-2 py-1 rounded text-[10px] font-bold tracking-wider', stateClass(connection.connectionState))}>{connection.connectionState}</span><div className="text-[10px] text-text-muted">{connection.authorizationState}</div></div></div>
        <div className="grid sm:grid-cols-2 gap-3 text-xs"><div><span className="text-text-muted">Capabilities</span><div className="mt-1 text-text-primary">{connection.capabilities.join(' · ')}</div></div><div><span className="text-text-muted">Last successful sync</span><div className="mt-1 text-text-primary">{connection.lastSuccessfulSyncAt ? new Date(connection.lastSuccessfulSyncAt).toLocaleString() : 'Not yet synced'}</div></div>{connection.lastErrorCode && <div className="sm:col-span-2"><span className="text-text-muted">Safe last error</span><div className="mt-1 text-[#E56A54]">{connection.lastErrorCode}</div></div>}</div>
        <div className="space-y-2">{sourceAccounts.map(account => <div key={account.id} className="flex items-center justify-between gap-4 border-t border-border pt-3 text-xs"><div><span className="font-medium text-text-primary">{sourceLabel(account.capability)}</span><span className="text-text-secondary"> · {JSON.stringify(account.selectionMetadata ?? {})}</span></div><span className={cn('px-2 py-1 rounded text-[10px]', stateClass(account.connectionState))}>{account.enabled ? account.connectionState : 'DISABLED'}</span></div>)}</div>
        <div className="flex flex-wrap gap-2 pt-1"><button onClick={() => void run(async () => { await Promise.all(sourceAccounts.filter(account => account.enabled).map(account => connectionApi.sync(account.id))); })} className="px-3 py-1.5 border border-border rounded text-xs text-text-primary">Sync now</button><button onClick={() => void authorize(connection)} disabled={connection.provider !== 'GOOGLE'} className="px-3 py-1.5 border border-border rounded text-xs text-text-primary disabled:opacity-50">Authorize</button><button onClick={() => void run(() => connectionApi.updateConnection(connection.id, { enabled: !connection.enabled }))} className="px-3 py-1.5 border border-border rounded text-xs text-text-primary">{connection.enabled ? 'Disable' : 'Enable'}</button><button onClick={() => void run(() => connectionApi.revoke(connection.id))} className="px-3 py-1.5 border border-[#E56A54]/30 text-[#E56A54] rounded text-xs">Revoke locally</button></div>
      </article>;
    })}</div>}
  </div>;
};

const SelectionRow = ({ label, values, selected, onToggle }: { label: string; values: string[]; selected: string[]; onToggle: (value: string) => void }) => <div><div className="text-xs text-text-secondary mb-2">{label}</div><div className="flex flex-wrap gap-3">{values.map(value => <label key={value} className="text-xs text-text-primary flex items-center gap-1.5"><input type="checkbox" checked={selected.includes(value)} onChange={() => onToggle(value)} />{value}</label>)}</div></div>;

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (c: boolean) => void }) => (
  <button
    onClick={() => onChange(!checked)}
    className={cn(
      "w-11 h-6 rounded-full transition-colors relative",
      checked ? "bg-bg-inverted" : "bg-border-focus"
    )}
  >
    <div className={cn(
      "w-5 h-5 rounded-full bg-bg absolute top-0.5 transition-transform",
      checked ? "left-[22px]" : "left-0.5"
    )} />
  </button>
);

const MemorySettingsSection = () => {
  const { showToast } = useApp();
  const [memoryItems, setMemoryItems] = useState<MemoryItemData[]>(INITIAL_MEMORY_ITEMS);
  const [memoryFilter, setMemoryFilter] = useState<string>('ALL');

  const filteredMemories = memoryFilter === 'ALL'
    ? memoryItems
    : memoryItems.filter(m => m.domain === memoryFilter);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <header className="mb-6">
        <h2 className="text-xl font-medium text-text-primary mb-2">Memory</h2>
        <p className="text-text-secondary text-sm">
          Review what your Chief of Staff remembers. Memory helps retain preferences, instructions, commitments and relationship context across all production domains.
        </p>
      </header>

      {/* Domain Filter Pills */}
      <div className="flex items-center gap-2 pb-1 overflow-x-auto">
        {['ALL', 'TRAVEL', 'CASTING', 'BUDGET', 'CREATIVE'].map((filter) => {
          const count = filter === 'ALL' 
            ? memoryItems.length 
            : memoryItems.filter(m => m.domain === filter).length;
          return (
            <button
              key={filter}
              onClick={() => setMemoryFilter(filter)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                memoryFilter === filter
                  ? "bg-bg-inverted text-text-inverted"
                  : "bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-border"
              )}
            >
              {filter === 'ALL' ? `All (${count})` : `${filter.charAt(0) + filter.slice(1).toLowerCase()} (${count})`}
            </button>
          );
        })}
      </div>

      {/* Memory items with fluid height transitions */}
      <div className="space-y-4">
        {filteredMemories.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-2xl text-text-muted text-sm">
            No active memory items found for this filter.
          </div>
        ) : (
          filteredMemories.map((item, index) => (
            <MemoryItemCard
              key={item.id}
              item={item}
              defaultExpanded={index === 0}
              onForget={(id) => {
                setMemoryItems(prev => prev.filter(m => m.id !== id));
                showToast("Memory deleted from Chief of Staff context");
              }}
              onEdit={() => {
                showToast("Memory editor opened");
              }}
            />
          ))
        )}
      </div>

      <div className="pt-6 border-t border-border flex items-center justify-between">
        <button 
          onClick={() => {
            if (memoryItems.length > 0) {
              setMemoryItems([]);
              showToast("All remembered preferences cleared");
            }
          }}
          className="text-sm text-[#E56A54] font-medium hover:opacity-80 transition-opacity"
        >
          Clear all remembered preferences...
        </button>
        <div className="text-xs text-text-muted">
          {memoryItems.length} {memoryItems.length === 1 ? 'rule' : 'rules'} active in persistent context
        </div>
      </div>
    </div>
  );
};
