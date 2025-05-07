"use client";

import { XIcon } from "lucide-react";

interface CharacterActivityProps {
  isOpen: boolean;
  onCloseAction: () => void;
  threadId: string;
}

const leftOperations = [
  {
    id: 1,
    agent: "AI Sage",
    task: "Analyzing neural network architecture patterns",
    timestamp: "2024-03-20 14:23:45",
    status: "completed",
  },
  {
    id: 2,
    agent: "AI Sage",
    task: "Reviewing latest ML papers on transformers",
    timestamp: "2024-03-20 14:25:12",
    status: "in-progress",
  },
  {
    id: 3,
    agent: "AI Mentor",
    task: "Preparing curriculum for advanced ML concepts",
    timestamp: "2024-03-20 14:26:30",
    status: "pending",
  },
  {
    id: 4,
    agent: "AI Analyst",
    task: "Evaluating resource allocation for GPU clusters",
    timestamp: "2024-03-20 14:27:15",
    status: "completed",
  },
];

const rightOperations = [
  {
    id: 1,
    agent: "Rand Godin",
    task: "Analyzing neural network architecture patterns",
    timestamp: "2024-03-20 14:23:45",
    status: "completed",
  },
  {
    id: 2,
    agent: "Rand Godin",
    task: "Reviewing latest ML papers on transformers",
    timestamp: "2024-03-20 14:25:12",
    status: "in-progress",
  },
  {
    id: 3,
    agent: "Gary Patel",
    task: "Preparing curriculum for advanced ML concepts",
    timestamp: "2024-03-20 14:26:30",
    status: "pending",
  },
  {
    id: 4,
    agent: "Mirch Benes",
    task: "Evaluating resource allocation for GPU clusters",
    timestamp: "2024-03-20 14:27:15",
    status: "completed",
  },
];

export function CharacterActivity({
  isOpen,
  onCloseAction,
  threadId,
}: CharacterActivityProps) {
  const operations = threadId === "thread1" ? leftOperations : rightOperations;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-[400px] p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[8pt] font-medium">Character Activity</h2>
          <button
            type="button"
            onClick={onCloseAction}
            className="text-muted-foreground hover:text-foreground"
          >
            <XIcon className="h-3 w-3" />
          </button>
        </div>
        <div className="space-y-2">
          {operations.map((op) => (
            <div
              key={op.id}
              className="text-[6pt] p-2 rounded bg-muted/20 border border-border/50"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-primary">{op.agent}</span>
                <span className="text-muted-foreground">{op.timestamp}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{op.task}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[5pt] ${
                    op.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : op.status === "in-progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {op.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
