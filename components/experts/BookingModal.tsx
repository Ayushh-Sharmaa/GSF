"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Video, X, ChevronRight, Info } from "lucide-react";
import { toast } from "sonner";

interface Slot {
  id: string;
  expertClerkId: string;
  expertName: string;
  startAt: string;
  endAt: string;
  notes?: string;
  isBooked: boolean;
}

interface Expert {
  id: string;
  clerkId: string;
  name: string;
  title?: string;
  sessionRate: number;
  avatarUrl?: string;
}

interface BookingModalProps {
  expert: Expert | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sessionId: string) => void;
}

export default function BookingModal({ expert, isOpen, onClose, onSuccess }: BookingModalProps) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [booking, setBooking] = useState(false);

  async function loadSlots() {
    if (!expert) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/expert-availability?expertId=${expert.clerkId}`);
      if (!res.ok) throw new Error("Failed to load slots");
      const data = await res.json();
      setSlots(data.filter((s: Slot) => !s.isBooked));
    } catch (error) {
      console.error(error);
      toast.error("Could not load availability slots");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen && expert) {
      loadSlots();
    } else {
      setSlots([]);
      setSelectedSlot(null);
    }
  }, [isOpen, expert]);

  async function handleConfirmBooking() {
    if (!selectedSlot || !expert) return;

    setBooking(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expertClerkId: expert.clerkId,
          slotId: selectedSlot.id,
          scheduledAt: selectedSlot.startAt,
          duration: 30, // Default duration, or calculate from slot
          creditsCost: expert.sessionRate,
          expertName: expert.name,
          // founderName & ventureName handled by backend or could be passed if known
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Booking failed");
      }

      const session = await res.json();
      toast.success("Session booked successfully!");
      onSuccess(session.id);
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setBooking(false);
    }
  }

  if (!isOpen || !expert) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-[var(--border-soft)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gradient-to-br from-[var(--accent-indigo)] to-[var(--accent-teal)] flex items-center justify-center text-white font-bold text-sm">
                {expert.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Book with {expert.name}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">{expert.title || "Expert Mentor"}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[var(--bg-surface-2)] rounded-full transition-colors">
              <X className="size-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar">
            <div className="mb-6 flex items-center gap-2 p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20">
              <Info className="size-4 text-indigo-500 shrink-0" />
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                1 session ({expert.sessionRate} credits) will be deducted upon booking.
              </p>
            </div>

            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Calendar className="size-4 text-[var(--accent-indigo)]" /> Available Slots
            </h4>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 rounded-2xl bg-[var(--bg-surface-2)] animate-pulse" />
                ))}
              </div>
            ) : slots.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {slots.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                      selectedSlot?.id === slot.id
                        ? "border-[var(--accent-indigo)] bg-indigo-50/30 dark:bg-indigo-900/10 ring-1 ring-[var(--accent-indigo)]"
                        : "border-[var(--border-default)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-surface-2)]"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(slot.startAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                        <Clock className="size-3" />
                        {new Date(slot.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {" - "}
                        {new Date(slot.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {selectedSlot?.id === slot.id ? (
                      <div className="size-5 rounded-full bg-[var(--accent-indigo)] flex items-center justify-center">
                        <ChevronRight className="size-3 text-white" />
                      </div>
                    ) : (
                      <ChevronRight className="size-4 text-[var(--text-muted)]" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 opacity-60">
                <p className="text-sm">No available slots at the moment.</p>
                <p className="text-xs mt-1">Check back later or message the expert.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[var(--border-soft)] bg-[var(--bg-surface-2)]/30 flex items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Total Cost</p>
              <p className="text-lg font-bold text-[var(--accent-indigo)]">{expert.sessionRate} Credits</p>
            </div>
            <button
              disabled={!selectedSlot || booking}
              onClick={handleConfirmBooking}
              className="btn-primary py-3 px-8 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {booking ? (
                <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <Video className="size-4" />
              )}
              {booking ? "Confirming..." : "Confirm Booking"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
