"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Download,
  Upload,
  Trash2,
  ArrowUpDown,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import MilestoneCard from "./MilestoneCard";
import MilestoneEditor from "./MilestoneEditor";
import type { Milestone, MilestoneStatus, RoadmapConfig } from "@/lib/types/roadmap";
import { MILESTONE_TEMPLATES } from "@/lib/types/roadmap";
import {
  saveRoadmapConfig,
  loadRoadmapConfig,
  clearRoadmapConfig,
  exportRoadmapConfig,
  importRoadmapConfig,
} from "@/lib/utils/roadmap-storage";

export default function RoadmapTracker() {
  const [config, setConfig] = useState<RoadmapConfig | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [ventureName, setVentureName] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadRoadmapConfig();
    if (loaded) {
      setConfig(loaded);
      setVentureName(loaded.ventureName);
    }
    setIsInitializing(false);
  }, []);

  // Save to localStorage whenever config changes
  useEffect(() => {
    if (config && !isInitializing) {
      saveRoadmapConfig(config);
    }
  }, [config, isInitializing]);

  const handleInitialize = () => {
    if (!ventureName.trim()) {
      alert("Please enter a venture name");
      return;
    }

    const newConfig: RoadmapConfig = {
      id: crypto.randomUUID(),
      ventureName: ventureName.trim(),
      milestones: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setConfig(newConfig);
  };

  const handleAddMilestone = () => {
    setSelectedMilestone(null);
    setIsEditorOpen(true);
  };

  const handleEditMilestone = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setIsEditorOpen(true);
  };

  const handleSaveMilestone = (milestone: Milestone) => {
    if (!config) return;

    const existingIndex = config.milestones.findIndex((m) => m.id === milestone.id);

    let updatedMilestones: Milestone[];
    if (existingIndex >= 0) {
      // Update existing
      updatedMilestones = [...config.milestones];
      updatedMilestones[existingIndex] = milestone;
    } else {
      // Add new
      const newMilestone = {
        ...milestone,
        order: config.milestones.length,
      };
      updatedMilestones = [...config.milestones, newMilestone];
    }

    setConfig({
      ...config,
      milestones: updatedMilestones,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteMilestone = (id: string) => {
    if (!config) return;
    if (!confirm("Are you sure you want to delete this milestone?")) return;

    const updatedMilestones = config.milestones
      .filter((m) => m.id !== id)
      .map((m, index) => ({ ...m, order: index }));

    setConfig({
      ...config,
      milestones: updatedMilestones,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleStatusChange = (id: string, status: MilestoneStatus) => {
    if (!config) return;

    const updatedMilestones = config.milestones.map((m) => {
      if (m.id === id) {
        return {
          ...m,
          status,
          completedDate: status === "completed" ? new Date().toISOString() : undefined,
        };
      }
      return m;
    });

    setConfig({
      ...config,
      milestones: updatedMilestones,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleReorder = (fromIndex: number, direction: "up" | "down") => {
    if (!config) return;

    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= config.milestones.length) return;

    const updatedMilestones = [...config.milestones];
    [updatedMilestones[fromIndex], updatedMilestones[toIndex]] = [
      updatedMilestones[toIndex],
      updatedMilestones[fromIndex],
    ];

    // Update order values
    updatedMilestones.forEach((m, index) => {
      m.order = index;
    });

    setConfig({
      ...config,
      milestones: updatedMilestones,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleLoadTemplates = () => {
    if (!config) return;
    if (config.milestones.length > 0) {
      if (!confirm("This will replace your current milestones. Continue?")) return;
    }

    const templateMilestones: Milestone[] = MILESTONE_TEMPLATES.map((template, index) => ({
      ...template,
      id: crypto.randomUUID(),
      order: index,
    }));

    setConfig({
      ...config,
      milestones: templateMilestones,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleExport = () => {
    if (!config) return;
    exportRoadmapConfig(config);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importRoadmapConfig(file);
      setConfig(imported);
      setVentureName(imported.ventureName);
      alert("Roadmap imported successfully!");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to import roadmap");
    }

    // Reset input
    e.target.value = "";
  };

  const handleReset = () => {
    if (!confirm("This will delete your entire roadmap. Are you sure?")) return;
    clearRoadmapConfig();
    setConfig(null);
    setVentureName("");
  };

  // Calculate progress stats
  const stats = config
    ? {
        total: config.milestones.length,
        completed: config.milestones.filter((m) => m.status === "completed").length,
        inProgress: config.milestones.filter((m) => m.status === "in-progress").length,
        pending: config.milestones.filter((m) => m.status === "pending").length,
        progress:
          config.milestones.length > 0
            ? Math.round(
                (config.milestones.filter((m) => m.status === "completed").length /
                  config.milestones.length) *
                  100
              )
            : 0,
      }
    : null;

  // Initialization screen
  if (!config) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="card max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent-indigo to-accent-teal flex items-center justify-center">
            <TrendingUp className="size-8 text-white" />
          </div>
          <h2 className="text-2xl font-display font-bold text-primary mb-2">
            Create Your Roadmap
          </h2>
          <p className="text-secondary mb-6">
            Map out your venture&apos;s strategic milestones and track progress visually
          </p>
          <div className="space-y-4">
            <input
              type="text"
              className="input"
              placeholder="Enter your venture name"
              value={ventureName}
              onChange={(e) => setVentureName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleInitialize();
              }}
            />
            <button onClick={handleInitialize} className="btn-primary w-full">
              <Sparkles className="size-4" />
              Initialize Roadmap
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-default" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted">or</span>
              </div>
            </div>
            <label className="btn-outline w-full cursor-pointer">
              <Upload className="size-4" />
              Import Existing Roadmap
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-primary mb-2">
              {config.ventureName}
            </h1>
            <p className="text-secondary">Strategic Milestone Roadmap</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleLoadTemplates}
              className="btn-outline"
              title="Load template milestones"
            >
              <Sparkles className="size-4" />
              Templates
            </button>
            <button onClick={handleExport} className="btn-outline" title="Export roadmap">
              <Download className="size-4" />
            </button>
            <label className="btn-outline cursor-pointer" title="Import roadmap">
              <Upload className="size-4" />
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </label>
            <button
              onClick={handleReset}
              className="btn-outline text-red-600 hover:text-red-700 hover:border-red-300"
              title="Reset roadmap"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && stats.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-xs text-muted">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-xs text-muted">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              <div className="text-xs text-muted">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
              <div className="text-xs text-muted">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent-indigo">{stats.progress}%</div>
              <div className="text-xs text-muted">Progress</div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {stats && stats.total > 0 && (
          <div className="mt-4">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-primary">Milestone Timeline</h2>
          <button onClick={handleAddMilestone} className="btn-primary">
            <Plus className="size-4" />
            Add Milestone
          </button>
        </div>

        {config.milestones.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-2 flex items-center justify-center">
              <TrendingUp className="size-8 text-muted" />
            </div>
            <p className="text-secondary mb-4">No milestones yet</p>
            <button onClick={handleAddMilestone} className="btn-outline">
              <Plus className="size-4" />
              Create Your First Milestone
            </button>
          </div>
        ) : (
          <div className="space-y-0">
            {config.milestones.map((milestone, index) => (
              <div key={milestone.id} className="relative">
                <MilestoneCard
                  milestone={milestone}
                  isFirst={index === 0}
                  isLast={index === config.milestones.length - 1}
                  onEdit={handleEditMilestone}
                  onDelete={handleDeleteMilestone}
                  onStatusChange={handleStatusChange}
                />
                {/* Reorder buttons */}
                {config.milestones.length > 1 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 hover:opacity-100 transition-opacity">
                    {index > 0 && (
                      <button
                        onClick={() => handleReorder(index, "up")}
                        className="p-1 rounded bg-surface hover:bg-surface-2 text-muted hover:text-primary transition-colors"
                        title="Move up"
                      >
                        <ArrowUpDown className="size-3" />
                      </button>
                    )}
                    {index < config.milestones.length - 1 && (
                      <button
                        onClick={() => handleReorder(index, "down")}
                        className="p-1 rounded bg-surface hover:bg-surface-2 text-muted hover:text-primary transition-colors"
                        title="Move down"
                      >
                        <ArrowUpDown className="size-3 rotate-180" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <MilestoneEditor
        milestone={selectedMilestone}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedMilestone(null);
        }}
        onSave={handleSaveMilestone}
      />
    </div>
  );
}
