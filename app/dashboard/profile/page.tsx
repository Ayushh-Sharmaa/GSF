"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useProfile } from "@/lib/hooks/useProfile";
import { useUser } from "@clerk/nextjs";
import { User, Edit3, Save, Mail, Globe, Link2, MapPin, Camera } from "lucide-react";
import Image from "next/image";
import { calculateProfileCompletion } from "@/lib/utils/profileCompletion";
import ProfileCompletionBar from "@/components/ProfileCompletionBar";

const fadeUp = (d = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: d, duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

export default function ProfilePage() {
  const { profile, loading, saving, updateProfile, refetch } = useProfile();
  const percent = calculateProfileCompletion(profile, "FOUNDER");
  const { user: clerkUser } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [editing, setEditing] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [form, setForm] = useState({
    name:       "",
    bio:        "",
    university: "",
    year:       "",
    location:   "",
    email:      "",
    linkedin:   "",
    website:    "",
  });

  // Sync form when profile loads
  useEffect(() => {
    if (profile) {
      setForm({
        name:       profile.name,
        bio:        profile.bio,
        university: profile.university,
        year:       profile.year,
        location:   profile.location,
        email:      profile.email,
        linkedin:   profile.linkedin,
        website:    profile.website,
      });
    }
  }, [profile]);

  async function handleSave() {
    const ok = await updateProfile({
      name:       form.name,
      bio:        form.bio,
      university: form.university,
      year:       form.year,
      location:   form.location,
      linkedin:   form.linkedin,
      website:    form.website,
    });
    if (ok) {
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !clerkUser) return;
    setUploadingPhoto(true);
    try {
      await clerkUser.setProfileImage({ file });
      // clerkUser.imageUrl updates automatically via useUser() — no refetch needed
    } catch (err) {
      console.error("Photo upload failed:", err);
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const avatarInitials = form.name
    ? form.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  if (loading) {
    return (
      <DashboardShell role="founder">
        <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 w-48 rounded-xl" style={{ backgroundColor: "var(--bg-surface-2)" }} />
          <div className="card p-6 h-32" />
          <div className="grid grid-cols-2 gap-6">
            <div className="card p-6 h-64" />
            <div className="card p-6 h-64" />
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="founder">
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div {...fadeUp(0)} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>
              My Profile
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Your public founder profile visible to experts and investors.
            </p>
          </div>
          <ProfileCompletionBar percent={percent} />
          <div className="flex items-center gap-2">
            {saved && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-emerald-500 font-medium">
                ✓ Saved
              </motion.span>
            )}
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="btn-outline text-sm py-2 px-4">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2 px-5 flex items-center gap-1.5">
                  <Save className="size-3.5" /> {saving ? "Saving…" : "Save"}
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="btn-primary text-sm py-2 px-5 flex items-center gap-1.5">
                <Edit3 className="size-3.5" /> Edit Profile
              </button>
            )}
          </div>
        </motion.div>

        {/* Avatar + name */}
        <motion.div {...fadeUp(0.05)} className="card p-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              {/* Hidden file input for photo upload */}
              <input
                type="file"
                accept="image/*"
                hidden
                ref={fileInputRef}
                onChange={handlePhotoChange}
              />
              {/* Use clerkUser.imageUrl — reactive, updates instantly after upload */}
              {clerkUser?.imageUrl ? (
                <Image
                  src={clerkUser.imageUrl}
                  alt={form.name || "Profile"}
                  width={80}
                  height={80}
                  className="size-20 rounded-2xl object-cover flex-shrink-0"
                  unoptimized
                />
              ) : (
                <div className="size-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #5B6CFF, #4FD1C5)" }}>
                  {avatarInitials}
                </div>
              )}
              {/* Camera button always visible — clicking opens file picker */}
              <button
                title="Change profile photo"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute -bottom-1 -right-1 size-7 rounded-lg flex items-center justify-center shadow-md transition-transform hover:scale-110"
                style={{ backgroundColor: "var(--bg-card)", border: "1.5px solid var(--border-default)" }}>
                {uploadingPhoto
                  ? <span className="size-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  : <Camera className="size-3.5" style={{ color: "var(--text-muted)" }} />}
              </button>
            </div>
            <div className="flex-1">
              {editing ? (
                <input className="input text-lg font-bold mb-2" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} />
              ) : (
                <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>{form.name}</h2>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="badge badge-blue text-xs">Founder</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{form.university} · {form.year}</span>
                {form.location && (
                  <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                    <MapPin className="size-3" />{form.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bio */}
          <motion.div {...fadeUp(0.1)} className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="size-4" style={{ color: "var(--accent-indigo)" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>About</h3>
            </div>
            {[
              { label: "Bio",        key: "bio",        multiline: true },
              { label: "University", key: "university"               },
              { label: "Year",       key: "year"                    },
              { label: "Location",   key: "location"                },
            ].map(({ label, key, multiline }) => (
              <div key={key} className="mb-4 last:mb-0">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>{label}</label>
                {editing ? (
                  multiline ? (
                    <textarea className="input textarea text-sm" value={(form as Record<string, string>)[key]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })} />
                  ) : (
                    <input className="input text-sm" value={(form as Record<string, string>)[key]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })} />
                  )
                ) : (
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {(form as Record<string, string>)[key] || "—"}
                  </p>
                )}
              </div>
            ))}
          </motion.div>

          {/* Contact */}
          <motion.div {...fadeUp(0.15)} className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="size-4" style={{ color: "var(--accent-indigo)" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Contact & Links</h3>
            </div>
            {[
              { label: "Email",    key: "email",    icon: Mail,  type: "email" },
              { label: "LinkedIn", key: "linkedin", icon: Link2, type: "url"   },
              { label: "Website",  key: "website",  icon: Globe, type: "url"   },
            ].map(({ label, key, icon: Icon, type }) => (
              <div key={key} className="mb-4 last:mb-0">
                <label className="block text-xs font-medium mb-1.5 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                  <Icon className="size-3" />{label}
                </label>
                {editing ? (
                  <input type={type} className="input text-sm" value={(form as Record<string, string>)[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    disabled={key === "email"} />
                ) : (
                  <p className="text-sm" style={{ color: (form as Record<string, string>)[key] ? "var(--accent-indigo)" : "var(--text-muted)" }}>
                    {(form as Record<string, string>)[key] || "Not added"}
                  </p>
                )}
              </div>
            ))}

            {/* Plan badge */}
            <div className="mt-4 p-3 rounded-xl"
              style={{ backgroundColor: "rgba(91,108,255,0.08)", border: "1px solid rgba(91,108,255,0.2)" }}>
              <p className="text-xs font-semibold" style={{ color: "var(--accent-indigo)" }}>
                {profile?.plan ?? "free"} Plan
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                {profile?.credits ?? 0} credits remaining
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardShell>
  );
}
