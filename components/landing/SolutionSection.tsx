"use client";

import { motion } from "framer-motion";
import { Users, RefreshCw, UserCheck } from "lucide-react";

const SOLUTIONS = [
  {
    icon: Users,
    title: "Cohort Learning",
    description:
      "Join a structured 6-week cohort with peers at the same stage. Learn frameworks, complete modules, and build accountability through group progress.",
    accent: "bg-primary-50 text-primary-600",
    border: "border-primary-100",
  },
  {
    icon: RefreshCw,
    title: "Peer Execution Loops",
    description:
      "Weekly execution cycles with your peer group. Share blockers, celebrate wins, and hold each other accountable to weekly tasks and milestones.",
    accent: "bg-secondary-50 text-secondary-600",
    border: "border-secondary-100",
  },
  {
    icon: UserCheck,
    title: "Mentor Guidance",
    description:
      "Get matched with domain experts who have built real companies. Book 1-on-1 sessions, get idea feedback, and access curated mentor networks.",
    accent: "bg-violet-50 text-violet-600",
    border: "border-violet-100",
  },
];

export function SolutionSection() {
  return (
    <section className="section-padding bg-canvas">
      <div className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <span className="text-xs font-semibold text-primary-600 uppercase tracking-widest">
                The GSF Way
              </span>
              <h2 className="text-4xl sm:text-5xl font-semibold text-text-primary leading-tight tracking-tight text-balance">
                GSF builds founder readiness{" "}
                <span className="text-text-secondary font-normal">
                  before startups begin.
                </span>
              </h2>
              <p className="text-lg text-text-secondary leading-relaxed">
                We give students the structure, tools, and people they need to
                move from &quot;I have an idea&quot; to &quot;I have evidence.&quot; No MBA required.
              </p>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-2">
                {["bg-primary-400", "bg-secondary-400", "bg-amber-400", "bg-rose-400", "bg-emerald-400"].map(
                  (c, i) => (
                    <div
                      key={i}
                      className={`size-9 rounded-full ${c} border-2 border-white flex items-center justify-center text-white text-xs font-semibold`}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  )
                )}
              </div>
              <p className="text-sm text-text-secondary">
                <span className="font-semibold text-text-primary">500+ students</span>{" "}
                already on their founder journey
              </p>
            </div>
          </motion.div>

          {/* Right — solution cards */}
          <div className="space-y-4">
            {SOLUTIONS.map((sol, i) => {
              const Icon = sol.icon;
              return (
                <motion.div
                  key={sol.title}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className={`flex items-start gap-4 p-5 rounded-xl bg-white border ${sol.border} shadow-card`}
                >
                  <div
                    className={`size-10 rounded-xl ${sol.accent} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      {sol.title}
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {sol.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
