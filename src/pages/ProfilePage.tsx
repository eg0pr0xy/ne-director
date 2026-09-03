import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../store/AppStore';
import { 
  Camera, 
  Upload, 
  Check, 
  RotateCcw, 
  Clock, 
  Calendar, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  MessageSquare, 
  User, 
  ShieldCheck, 
  X, 
  ChevronLeft,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { cn } from '../utils/cn';
import { DirectorProfile, RepresentationStyle } from '../types/profile';
import { MOCK_AVATAR_PRESETS } from '../mocks/defaultProfile';
import { AnimatePresence, motion } from 'motion/react';

const ROLE_OPTIONS = [
  'Director',
  'Showrunner',
  'Producer',
  'Executive Producer',
  'Creative Director',
  'Writer / Director',
  'Other'
];

const TIMEZONE_OPTIONS = [
  'Europe / Berlin',
  'Europe / London',
  'Europe / Paris',
  'America / New York',
  'America / Los Angeles',
  'Asia / Tokyo'
];

const BUFFER_OPTIONS = [15, 30, 45, 60];

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const ProfilePage: React.FC = () => {
  const { profile, updateProfile, resetProfile, setCurrentPage, showToast } = useApp();

  // Local form state initialized with profile from store
  const [formData, setFormData] = useState<DirectorProfile>(profile);
  const [isDirty, setIsDirty] = useState(false);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Address mode state: 'first_name' | 'formal' | 'custom'
  const [addressMode, setAddressMode] = useState<'first_name' | 'formal' | 'custom'>(() => {
    if (profile.preferredAddress === profile.displayName) return 'first_name';
    if (profile.preferredAddress.startsWith('Mr.') || profile.preferredAddress.startsWith('Ms.')) return 'formal';
    return 'custom';
  });

  // Avatar Modal State
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>(profile.avatar || 'https://i.pravatar.cc/150?u=marcus');
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset Confirmation Modal State
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  // Sync formData when store profile updates
  useEffect(() => {
    setFormData(profile);
    setAvatarPreview(profile.avatar || 'https://i.pravatar.cc/150?u=marcus');
  }, [profile]);

  // Check dirty state
  useEffect(() => {
    const isDifferent = JSON.stringify(formData) !== JSON.stringify(profile);
    setIsDirty(isDifferent);
  }, [formData, profile]);

  const handleChange = <K extends keyof DirectorProfile>(key: K, value: DirectorProfile[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleNestedHoursChange = (field: 'start' | 'end', value: string) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [field]: value
      }
    }));
  };

  const handleNestedAvailabilityChange = (field: 'avoidBefore' | 'avoidAfter' | 'minBufferMinutes', value: any) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [field]: value
      }
    }));
  };

  const toggleWorkingDay = (day: string) => {
    setFormData(prev => {
      const exists = prev.workingDays.includes(day);
      const nextDays = exists 
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day];
      return { ...prev, workingDays: nextDays };
    });
  };

  const handleSave = () => {
    updateProfile(formData);
    setIsDirty(false);
    setIsSavedRecently(true);
    showToast("Profile changes saved");
    setTimeout(() => setIsSavedRecently(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setAvatarError(null);
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError("Please select a valid image file (PNG, JPEG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be smaller than 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreview(reader.result);
      }
    };
    reader.onerror = () => {
      setAvatarError("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  const applyAvatar = () => {
    handleChange('avatar', avatarPreview);
    updateProfile({ avatar: avatarPreview });
    setIsAvatarModalOpen(false);
    showToast("Profile photo updated");
  };

  const handleAddressModeSelect = (mode: 'first_name' | 'formal' | 'custom') => {
    setAddressMode(mode);
    if (mode === 'first_name') {
      handleChange('preferredAddress', formData.displayName || 'Marcus');
    } else if (mode === 'formal') {
      const nameParts = (formData.displayName || 'Marcus Sterling').trim().split(' ');
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'Sterling';
      handleChange('preferredAddress', `Mr. ${lastName}`);
    }
  };

  const activeRoleDisplay = formData.professionalRole === 'Other' && formData.customRole 
    ? formData.customRole 
    : formData.professionalRole;

  return (
    <div className="px-6 md:px-10 py-10 max-w-[1200px] mx-auto pb-36 min-h-full">
      {/* Top Bar Navigation & Save Action */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <button
          onClick={() => setCurrentPage('TODAY')}
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors py-1.5 px-3 rounded-lg hover:bg-surface-hover"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Today</span>
        </button>

        <div className="flex items-center gap-3">
          {isSavedRecently && (
            <span className="inline-flex items-center gap-1.5 text-xs text-green-500 font-medium bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full animate-in fade-in duration-200">
              <Check className="w-3.5 h-3.5" /> All changes saved
            </span>
          )}

          <button
            id="save-profile-btn"
            onClick={handleSave}
            disabled={!isDirty}
            className={cn(
              "px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-sm flex items-center gap-2",
              isDirty
                ? "bg-bg-inverted text-text-inverted hover:opacity-90 cursor-pointer"
                : "bg-surface border border-border text-text-muted cursor-not-allowed opacity-60"
            )}
          >
            <Check className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Main Header */}
      <header className="mb-10">
        <h1 className="text-[28px] font-semibold tracking-tight text-text-primary uppercase mb-1">
          MY PROFILE
        </h1>
        <p className="text-text-secondary text-sm tracking-wide">
          Your professional identity and working context.
        </p>
      </header>

      {/* 1. PROFILE HERO */}
      <section className="mb-12 bg-surface border border-border rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 relative overflow-hidden">
        {/* Avatar with subtle edit overlay */}
        <div className="relative group shrink-0">
          <img
            src={formData.avatar || 'https://i.pravatar.cc/150?u=marcus'}
            alt={formData.displayName}
            className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover ring-2 ring-border shadow-md bg-surface-hover"
          />
          <button
            type="button"
            onClick={() => {
              setAvatarPreview(formData.avatar || 'https://i.pravatar.cc/150?u=marcus');
              setAvatarError(null);
              setIsAvatarModalOpen(true);
            }}
            aria-label="Change avatar"
            className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 backdrop-blur-xs cursor-pointer"
          >
            <Camera className="w-5 h-5 text-white" />
            <span className="text-[11px] font-medium tracking-wide">Change</span>
          </button>
        </div>

        {/* Identity Details */}
        <div className="flex-1 text-center md:text-left space-y-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-text-primary uppercase">
                {formData.displayName || 'Marcus'}
              </h2>
              <p className="text-sm font-medium text-text-secondary mt-0.5 flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span>{activeRoleDisplay || 'Director'}</span>
                <span className="text-text-muted">•</span>
                <span>{formData.organization || 'Neue Episteme'}</span>
                <span className="text-text-muted">•</span>
                <span>{formData.location || 'Berlin'}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setAvatarPreview(formData.avatar || 'https://i.pravatar.cc/150?u=marcus');
                setAvatarError(null);
                setIsAvatarModalOpen(true);
              }}
              className="text-xs text-text-secondary hover:text-text-primary border border-border hover:border-border-hover bg-surface-hover px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 self-center md:self-start"
            >
              <Camera className="w-3.5 h-3.5" /> Edit Avatar
            </button>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {formData.timezone}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> {formData.workingHours.start} — {formData.workingHours.end}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Representation: {formData.representationStyle.toUpperCase()}
            </span>
          </div>
        </div>
      </section>

      <div className="space-y-12">
        {/* 2. PROFESSIONAL IDENTITY */}
        <section className="bg-surface border border-border rounded-2xl p-6 md:p-8 space-y-6">
          <div className="border-b border-border pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold tracking-widest text-text-muted uppercase">
                PROFESSIONAL IDENTITY
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                Core identity parameters registered with the Chief of Staff agent.
              </p>
            </div>
            <span className="text-[11px] text-text-muted bg-surface-hover border border-border px-2.5 py-1 rounded-full font-mono">
              CONFIDENTIAL
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Display Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleChange('displayName', e.target.value)}
                  placeholder="e.g. Marcus"
                  className="w-full bg-surface border border-border text-text-primary text-sm rounded-xl px-4 py-2.5 outline-none focus:border-border-focus transition-colors"
                />
                <User className="w-4 h-4 text-text-muted absolute right-3.5 top-3" />
              </div>
            </div>

            {/* Professional Role */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Professional Role
              </label>
              <div className="space-y-2">
                <select
                  value={formData.professionalRole}
                  onChange={(e) => handleChange('professionalRole', e.target.value)}
                  className="w-full bg-surface border border-border text-text-primary text-sm rounded-xl px-4 py-2.5 outline-none focus:border-border-focus transition-colors cursor-pointer"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>

                {formData.professionalRole === 'Other' && (
                  <input
                    type="text"
                    value={formData.customRole || ''}
                    onChange={(e) => handleChange('customRole', e.target.value)}
                    placeholder="Specify custom role (e.g. Creator / Producer)"
                    className="w-full bg-surface border border-border text-text-primary text-sm rounded-xl px-4 py-2 outline-none focus:border-border-focus transition-colors text-xs"
                  />
                )}
              </div>
            </div>

            {/* Company / Studio */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Company / Studio
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.organization || ''}
                  onChange={(e) => handleChange('organization', e.target.value)}
                  placeholder="e.g. Neue Episteme"
                  className="w-full bg-surface border border-border text-text-primary text-sm rounded-xl px-4 py-2.5 outline-none focus:border-border-focus transition-colors"
                />
                <Briefcase className="w-4 h-4 text-text-muted absolute right-3.5 top-3" />
              </div>
            </div>

            {/* Location / Base */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Location / Base
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g. Berlin"
                  className="w-full bg-surface border border-border text-text-primary text-sm rounded-xl px-4 py-2.5 outline-none focus:border-border-focus transition-colors"
                />
                <MapPin className="w-4 h-4 text-text-muted absolute right-3.5 top-3" />
              </div>
            </div>

            {/* Professional Email */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Professional Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="marcus@neue-episteme.com"
                  className="w-full bg-surface border border-border text-text-primary text-sm rounded-xl px-4 py-2.5 outline-none focus:border-border-focus transition-colors"
                />
                <Mail className="w-4 h-4 text-text-muted absolute right-3.5 top-3" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Phone
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+49 30 8920 4410"
                  className="w-full bg-surface border border-border text-text-primary text-sm rounded-xl px-4 py-2.5 outline-none focus:border-border-focus transition-colors font-mono"
                />
                <Phone className="w-4 h-4 text-text-muted absolute right-3.5 top-3" />
              </div>
            </div>

            {/* Primary Time Zone */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Primary Time Zone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="w-full md:w-80 bg-surface border border-border text-text-primary text-sm rounded-xl px-4 py-2.5 outline-none focus:border-border-focus transition-colors cursor-pointer"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* 3. HOW THE CHIEF OF STAFF ADDRESSES ME */}
        <section className="bg-surface border border-border rounded-2xl p-6 md:p-8 space-y-6">
          <div className="border-b border-border pb-4">
            <h3 className="text-sm font-bold tracking-widest text-text-muted uppercase">
              HOW SHOULD THE CHIEF OF STAFF ADDRESS YOU?
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Determines the salutation style used across daily briefings, overview headlines, and notifications.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: First Name */}
              <button
                type="button"
                onClick={() => handleAddressModeSelect('first_name')}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2",
                  addressMode === 'first_name'
                    ? "border-border-focus bg-surface-hover ring-1 ring-border-focus"
                    : "border-border hover:border-border-hover bg-surface"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-text-primary">First Name</span>
                  {addressMode === 'first_name' && <Check className="w-4 h-4 text-text-primary" />}
                </div>
                <span className="text-xs text-text-muted">Direct & concise ({formData.displayName || 'Marcus'})</span>
              </button>

              {/* Option 2: Formal */}
              <button
                type="button"
                onClick={() => handleAddressModeSelect('formal')}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2",
                  addressMode === 'formal'
                    ? "border-border-focus bg-surface-hover ring-1 ring-border-focus"
                    : "border-border hover:border-border-hover bg-surface"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-text-primary">Formal</span>
                  {addressMode === 'formal' && <Check className="w-4 h-4 text-text-primary" />}
                </div>
                <span className="text-xs text-text-muted">Honorific salutation (Mr. / Ms.)</span>
              </button>

              {/* Option 3: Custom */}
              <button
                type="button"
                onClick={() => handleAddressModeSelect('custom')}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2",
                  addressMode === 'custom'
                    ? "border-border-focus bg-surface-hover ring-1 ring-border-focus"
                    : "border-border hover:border-border-hover bg-surface"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-text-primary">Custom</span>
                  {addressMode === 'custom' && <Check className="w-4 h-4 text-text-primary" />}
                </div>
                <span className="text-xs text-text-muted">Personalized title or moniker</span>
              </button>
            </div>

            {/* Address Input Field */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Active Preferred Form of Address
              </label>
              <input
                type="text"
                value={formData.preferredAddress}
                onChange={(e) => {
                  handleChange('preferredAddress', e.target.value);
                  setAddressMode('custom');
                }}
                placeholder="e.g. Marcus, Mr. Sterling, Director"
                className="w-full md:w-96 bg-surface border border-border text-text-primary text-sm rounded-xl px-4 py-2.5 outline-none focus:border-border-focus transition-colors"
              />
            </div>

            {/* Live Greeting Preview Card */}
            <div className="p-4 rounded-xl bg-surface-hover border border-border flex items-center gap-3 mt-3">
              <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xs">
                <span className="text-text-muted font-medium block">Today Header Greeting Preview:</span>
                <span className="text-text-primary font-mono font-semibold tracking-wide uppercase text-sm">
                  GOOD MORNING, {(formData.preferredAddress || 'MARCUS').toUpperCase()}.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. EXTERNAL REPRESENTATION */}
        <section className="bg-surface border border-border rounded-2xl p-6 md:p-8 space-y-6">
          <div className="border-b border-border pb-4">
            <h3 className="text-sm font-bold tracking-widest text-text-muted uppercase">
              EXTERNAL REPRESENTATION
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Define how the Chief of Staff should identify itself when preparing communication on your behalf.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
              REPRESENTATION STYLE
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* PERSONAL */}
              <button
                type="button"
                onClick={() => handleChange('representationStyle', 'personal')}
                className={cn(
                  "p-5 rounded-xl border text-left transition-all flex flex-col justify-between gap-3",
                  formData.representationStyle === 'personal'
                    ? "border-border-focus bg-surface-hover ring-1 ring-border-focus"
                    : "border-border hover:border-border-hover bg-surface"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-text-primary uppercase tracking-wide">PERSONAL</span>
                    {formData.representationStyle === 'personal' && <Check className="w-4 h-4 text-text-primary" />}
                  </div>
                  <p className="text-xs text-text-primary font-medium mb-2">
                    Write drafts as if they come directly from me.
                  </p>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Dispatches, notes, and replies speak with your immediate voice, using first-person pronouns without assistant signature.
                  </p>
                </div>
              </button>

              {/* ASSISTED */}
              <button
                type="button"
                onClick={() => handleChange('representationStyle', 'assisted')}
                className={cn(
                  "p-5 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 relative",
                  formData.representationStyle === 'assisted'
                    ? "border-border-focus bg-surface-hover ring-1 ring-border-focus"
                    : "border-border hover:border-border-hover bg-surface"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-text-primary uppercase tracking-wide">ASSISTED</span>
                    {formData.representationStyle === 'assisted' && <Check className="w-4 h-4 text-text-primary" />}
                  </div>
                  <p className="text-xs text-text-primary font-medium mb-2">
                    Identify communication as prepared by my office when appropriate.
                  </p>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Routine scheduling, coordination, and preliminary replies carry the badge of the Director's Office, reserving personal notes for key creatives.
                  </p>
                </div>
              </button>

              {/* EXPLICIT ASSISTANT */}
              <button
                type="button"
                onClick={() => handleChange('representationStyle', 'explicit_assistant')}
                className={cn(
                  "p-5 rounded-xl border text-left transition-all flex flex-col justify-between gap-3",
                  formData.representationStyle === 'explicit_assistant'
                    ? "border-border-focus bg-surface-hover ring-1 ring-border-focus"
                    : "border-border hover:border-border-hover bg-surface"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-text-primary uppercase tracking-wide">EXPLICIT ASSISTANT</span>
                    {formData.representationStyle === 'explicit_assistant' && <Check className="w-4 h-4 text-text-primary" />}
                  </div>
                  <p className="text-xs text-text-primary font-medium mb-2">
                    Clearly identify the Chief of Staff as acting on my behalf.
                  </p>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Transparent operational communication. All external correspondence clearly states it is sent by the Chief of Staff under Marcus's instruction.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* 5. COMMUNICATION IDENTITY */}
        <section className="bg-surface border border-border rounded-2xl p-6 md:p-8 space-y-6">
          <div className="border-b border-border pb-4">
            <h3 className="text-sm font-bold tracking-widest text-text-muted uppercase">
              COMMUNICATION
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Language defaults and standard correspondence sign-offs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Preferred Language */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Preferred Language
              </label>
              <div className="flex gap-3">
                {[
                  { code: 'en', label: 'English' },
                  { code: 'de', label: 'Deutsch' }
                ].map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleChange('preferredLanguage', lang.code as 'en' | 'de')}
                    className={cn(
                      "px-6 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center gap-2",
                      formData.preferredLanguage === lang.code
                        ? "border-border-focus bg-surface-hover text-text-primary font-semibold"
                        : "border-border text-text-secondary hover:border-border-hover bg-surface"
                    )}
                  >
                    <span>{lang.label}</span>
                    {formData.preferredLanguage === lang.code && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-muted mt-2">
                Drafts and briefs will prioritize this language style.
              </p>
            </div>

            {/* Default Sign-off */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Default Sign-off
                </label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleChange('defaultSignOff', `Best,\n${formData.displayName || 'Marcus'}`)}
                    className="text-[10px] text-text-muted hover:text-text-primary bg-surface-hover px-2 py-0.5 rounded border border-border"
                  >
                    Best
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('defaultSignOff', `Viele Grüße,\n${formData.displayName || 'Marcus'}`)}
                    className="text-[10px] text-text-muted hover:text-text-primary bg-surface-hover px-2 py-0.5 rounded border border-border"
                  >
                    Viele Grüße
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('defaultSignOff', `Warmly,\n${formData.displayName || 'Marcus'}`)}
                    className="text-[10px] text-text-muted hover:text-text-primary bg-surface-hover px-2 py-0.5 rounded border border-border"
                  >
                    Warmly
                  </button>
                </div>
              </div>
              <textarea
                rows={3}
                value={formData.defaultSignOff}
                onChange={(e) => handleChange('defaultSignOff', e.target.value)}
                placeholder="Best,&#10;Marcus"
                className="w-full bg-surface border border-border text-text-primary text-sm rounded-xl p-3.5 outline-none focus:border-border-focus transition-colors font-sans"
              />
            </div>
          </div>
        </section>

        {/* 6. WORKING CONTEXT */}
        <section className="bg-surface border border-border rounded-2xl p-6 md:p-8 space-y-6">
          <div className="border-b border-border pb-4">
            <h3 className="text-sm font-bold tracking-widest text-text-muted uppercase">
              WORKING CONTEXT
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Operational boundary parameters used to calculate calendar density and scheduling conflicts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Working Hours */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Working Hours
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={formData.workingHours.start}
                  onChange={(e) => handleNestedHoursChange('start', e.target.value)}
                  className="bg-surface border border-border text-text-primary text-sm rounded-xl px-4 py-2.5 outline-none focus:border-border-focus font-mono"
                />
                <span className="text-text-muted text-sm">—</span>
                <input
                  type="time"
                  value={formData.workingHours.end}
                  onChange={(e) => handleNestedHoursChange('end', e.target.value)}
                  className="bg-surface border border-border text-text-primary text-sm rounded-xl px-4 py-2.5 outline-none focus:border-border-focus font-mono"
                />
              </div>
              <p className="text-xs text-text-muted mt-2">
                Standard window for proactive scheduling and team availability.
              </p>
            </div>

            {/* Default Calendar Buffer */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Default Calendar Buffer
              </label>
              <div className="flex flex-wrap gap-2">
                {BUFFER_OPTIONS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleChange('defaultCalendarBufferMinutes', mins)}
                    className={cn(
                      "px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                      formData.defaultCalendarBufferMinutes === mins
                        ? "border-border-focus bg-surface-hover text-text-primary font-semibold"
                        : "border-border text-text-secondary hover:border-border-hover bg-surface"
                    )}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-muted mt-2">
                Spacing inserted between calendar engagements.
              </p>
            </div>

            {/* Working Days */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Working Days
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = formData.workingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWorkingDay(day)}
                      className={cn(
                        "w-12 h-11 rounded-xl border text-sm font-medium transition-all flex items-center justify-center",
                        isSelected
                          ? "border-border-focus bg-surface-hover text-text-primary font-semibold ring-1 ring-border-focus"
                          : "border-border text-text-muted hover:text-text-secondary hover:border-border-hover bg-surface"
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 7. AVAILABILITY PREFERENCES */}
        <section className="bg-surface border border-border rounded-2xl p-6 md:p-8 space-y-6">
          <div className="border-b border-border pb-4">
            <h3 className="text-sm font-bold tracking-widest text-text-muted uppercase">
              AVAILABILITY
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Restrained boundaries for external requests and team invitations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Avoid meetings before
              </label>
              <input
                type="time"
                value={formData.availability.avoidBefore}
                onChange={(e) => handleNestedAvailabilityChange('avoidBefore', e.target.value)}
                className="w-full bg-surface border border-border text-text-primary text-sm rounded-xl px-4 py-2.5 outline-none focus:border-border-focus font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Avoid meetings after
              </label>
              <input
                type="time"
                value={formData.availability.avoidAfter}
                onChange={(e) => handleNestedAvailabilityChange('avoidAfter', e.target.value)}
                className="w-full bg-surface border border-border text-text-primary text-sm rounded-xl px-4 py-2.5 outline-none focus:border-border-focus font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Minimum buffer between meetings
              </label>
              <select
                value={formData.availability.minBufferMinutes}
                onChange={(e) => handleNestedAvailabilityChange('minBufferMinutes', Number(e.target.value))}
                className="w-full bg-surface border border-border text-text-primary text-sm rounded-xl px-4 py-2.5 outline-none focus:border-border-focus cursor-pointer"
              >
                <option value={10}>10 min</option>
                <option value={15}>15 min</option>
                <option value={20}>20 min</option>
                <option value={30}>30 min</option>
              </select>
            </div>
          </div>
        </section>

        {/* 8. ADVANCED / RESTORE PROTOTYPE PROFILE */}
        <section className="p-6 rounded-2xl border border-dashed border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-text-primary">
              Prototype Reset
            </h4>
            <p className="text-xs text-text-muted mt-0.5">
              Reset all personal preferences, working context, and avatar back to the standard Marcus Director prototype.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowResetConfirmModal(true)}
            className="text-xs font-medium text-text-secondary hover:text-text-primary border border-border hover:border-border-hover bg-surface hover:bg-surface-hover px-4 py-2 rounded-xl transition-colors inline-flex items-center gap-2 self-start sm:self-center shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Prototype Profile</span>
          </button>
        </section>
      </div>

      {/* AVATAR SELECTION MODAL */}
      <AnimatePresence>
        {isAvatarModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-overlay backdrop-blur-xs"
              onClick={() => setIsAvatarModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-lg bg-surface border border-border-hover rounded-2xl shadow-2xl p-6 z-10 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="text-base font-semibold text-text-primary">Update Profile Image</h3>
                  <p className="text-xs text-text-secondary mt-0.5">Choose a curated preset or upload a local file</p>
                </div>
                <button
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-hover transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-5 p-4 rounded-xl bg-surface-hover border border-border">
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-border bg-surface shrink-0"
                />
                <div>
                  <div className="text-sm font-semibold text-text-primary">Active Preview</div>
                  <div className="text-xs text-text-muted mt-0.5">Stored locally in your client environment</div>
                </div>
              </div>

              {avatarError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{avatarError}</span>
                </div>
              )}

              {/* Curated Presets */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2.5">
                  Curated Presets
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {MOCK_AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setAvatarPreview(preset.url);
                        setAvatarError(null);
                      }}
                      className={cn(
                        "group p-1.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5",
                        avatarPreview === preset.url
                          ? "border-border-focus bg-surface-hover ring-2 ring-border-focus"
                          : "border-border hover:border-border-hover bg-surface"
                      )}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-12 h-12 rounded-lg object-cover bg-border shrink-0"
                      />
                      <span className="text-[10px] text-text-secondary group-hover:text-text-primary truncate w-full">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Local File */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2.5">
                  Upload From Computer
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 border border-dashed border-border hover:border-border-hover rounded-xl text-center text-xs text-text-secondary hover:text-text-primary transition-colors flex flex-col items-center justify-center gap-2 bg-surface hover:bg-surface-hover"
                >
                  <Upload className="w-5 h-5 text-text-muted" />
                  <span>Select an image file (PNG, JPG, WebP)</span>
                </button>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyAvatar}
                  className="px-5 py-2 rounded-xl text-xs font-medium bg-bg-inverted text-text-inverted hover:opacity-90 transition-opacity"
                >
                  Apply Avatar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RESTORE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showResetConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-overlay backdrop-blur-xs"
              onClick={() => setShowResetConfirmModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-md bg-surface border border-border-hover rounded-2xl shadow-2xl p-6 z-10 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-text-primary">
                    Restore Prototype Profile?
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    This will reset all identity and working context settings to Marcus (Director).
                  </p>
                </div>
              </div>

              <p className="text-xs text-text-muted leading-relaxed">
                Your custom display name, sign-offs, working hours, and avatar will return to the initial prototype defaults.
              </p>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetProfile();
                    setShowResetConfirmModal(false);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-medium bg-bg-inverted text-text-inverted hover:opacity-90 transition-opacity"
                >
                  Confirm Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
