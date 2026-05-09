/**
 * store/audit-store.ts
 * Zustand store with localStorage persistence.
 * Form state survives page reloads — required by the assignment spec.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ToolId, UseCase } from "@/lib/pricing-registry";

export interface ToolEntry {
  toolId: ToolId;
  planId: string;
  seats: number;
  monthlySpend: number;
}

export interface AuditFormState {
  // Step tracking
  currentStep: 1 | 2 | 3;

  // Step 1: Which tools are selected
  selectedTools: ToolId[];

  // Step 2: Per-tool configuration
  toolEntries: Record<ToolId, Omit<ToolEntry, "toolId">>;

  // Step 3: Team context
  teamSize: number;
  primaryUseCase: UseCase;

  // Actions
  setStep: (step: 1 | 2 | 3) => void;
  toggleTool: (toolId: ToolId) => void;
  updateToolEntry: (
    toolId: ToolId,
    data: Partial<Omit<ToolEntry, "toolId">>
  ) => void;
  setTeamSize: (size: number) => void;
  setUseCase: (useCase: UseCase) => void;
  resetForm: () => void;

  // Derived
  getToolEntries: () => ToolEntry[];
}

const DEFAULT_TOOL_ENTRY = {
  planId: "",
  seats: 1,
  monthlySpend: 0,
};

export const useAuditStore = create<AuditFormState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      selectedTools: [],
      toolEntries: {} as Record<ToolId, Omit<ToolEntry, "toolId">>,
      teamSize: 1,
      primaryUseCase: "mixed",

      setStep: (step) => set({ currentStep: step }),

      toggleTool: (toolId) =>
        set((state) => {
          const isSelected = state.selectedTools.includes(toolId);
          return {
            selectedTools: isSelected
              ? state.selectedTools.filter((id) => id !== toolId)
              : [...state.selectedTools, toolId],
            toolEntries: isSelected
              ? state.toolEntries
              : {
                  ...state.toolEntries,
                  [toolId]: { ...DEFAULT_TOOL_ENTRY },
                },
          };
        }),

      updateToolEntry: (toolId, data) =>
        set((state) => ({
          toolEntries: {
            ...state.toolEntries,
            [toolId]: {
              ...(state.toolEntries[toolId] ?? DEFAULT_TOOL_ENTRY),
              ...data,
            },
          },
        })),

      setTeamSize: (teamSize) => set({ teamSize }),
      setUseCase: (primaryUseCase) => set({ primaryUseCase }),

      resetForm: () =>
        set({
          currentStep: 1,
          selectedTools: [],
          toolEntries: {} as Record<ToolId, Omit<ToolEntry, "toolId">>,
          teamSize: 1,
          primaryUseCase: "mixed",
        }),

      getToolEntries: () => {
        const { selectedTools, toolEntries } = get();
        return selectedTools.map((toolId) => ({
          toolId,
          ...(toolEntries[toolId] ?? DEFAULT_TOOL_ENTRY),
        }));
      },
    }),
    {
      name: "spentsight-audit-form", // localStorage key
        partialize: (state) => ({
        // Don't persist currentStep — always start fresh on reload
        selectedTools: state.selectedTools,
        toolEntries: state.toolEntries,
        teamSize: state.teamSize,
        primaryUseCase: state.primaryUseCase,
      }),
    }
  )
);