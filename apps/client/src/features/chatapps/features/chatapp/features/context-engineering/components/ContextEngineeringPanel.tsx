"use client";

import { NamedFile, NamedPrompt } from "../managers/types";
import React, { useCallback, useState } from "react";
import { ContextElementForm } from "./ContextElementForm";
import { ContextElementList } from "./ContextElementList";
import { useContextEngineeringManager } from "../hooks/useContextEngineeringManager";

interface ContextEngineeringPanelProps {
  chatAppId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ContextEngineeringPanel({
  chatAppId,
  isOpen,
  onClose,
}: ContextEngineeringPanelProps) {
  const {
    prePromptElements,
    postPromptElements,
    addPrePromptElement,
    addPostPromptElement,
    updatePrePromptElement,
    updatePostPromptElement,
    removePrePromptElement,
    removePostPromptElement,
    reorderPrePromptElements,
    reorderPostPromptElements,
    clear,
    exportData,
    importData,
    initialize,
    isInitialized,
    isLoading,
    error,
    stats,
  } = useContextEngineeringManager();

  const [activeTab, setActiveTab] = useState<"prePrompt" | "postPrompt">(
    "prePrompt",
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingElement, setEditingElement] = useState<{
    element: NamedPrompt | NamedFile;
    section: "prePrompt" | "postPrompt";
  } | null>(null);

  // Initialize manager when component mounts
  React.useEffect(() => {
    if (!isInitialized && chatAppId) {
      initialize(chatAppId);
    }
  }, [isInitialized, chatAppId, initialize]);

  const handleAddElement = useCallback(
    async (element: NamedPrompt | NamedFile) => {
      if (activeTab === "prePrompt") {
        await addPrePromptElement(element);
      } else {
        await addPostPromptElement(element);
      }
      setShowAddForm(false);
    },
    [activeTab, addPrePromptElement, addPostPromptElement],
  );

  const handleUpdateElement = useCallback(
    async (elementId: string, updates: Partial<NamedPrompt | NamedFile>) => {
      if (editingElement?.section === "prePrompt") {
        await updatePrePromptElement(elementId, updates);
      } else if (editingElement?.section === "postPrompt") {
        await updatePostPromptElement(elementId, updates);
      }
      setEditingElement(null);
    },
    [editingElement, updatePrePromptElement, updatePostPromptElement],
  );

  const handleRemoveElement = useCallback(
    async (elementId: string, section: "prePrompt" | "postPrompt") => {
      if (section === "prePrompt") {
        await removePrePromptElement(elementId);
      } else {
        await removePostPromptElement(elementId);
      }
    },
    [removePrePromptElement, removePostPromptElement],
  );

  const handleReorderElements = useCallback(
    async (elementIds: string[], section: "prePrompt" | "postPrompt") => {
      if (section === "prePrompt") {
        await reorderPrePromptElements(elementIds);
      } else {
        await reorderPostPromptElements(elementIds);
      }
    },
    [reorderPrePromptElements, reorderPostPromptElements],
  );

  const handleExport = useCallback(async () => {
    const data = await exportData();
    if (data) {
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `context-engineering-${chatAppId}-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [exportData, chatAppId]);

  const handleImport = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const text = await file.text();
        await importData(text);
        // Reset the input
        event.target.value = "";
      }
    },
    [importData],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="w-full bg-white rounded-t-xl shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Context Engineering
            </h2>
            {stats && (
              <div className="text-sm text-gray-500">
                {stats.totalElements} elements ({stats.prePromptCount} pre,{" "}
                {stats.postPromptCount} post)
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-file"
            />
            <label
              htmlFor="import-file"
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 cursor-pointer"
            >
              Import
            </label>
            <button
              type="button"
              onClick={handleExport}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Export
            </button>
            <button
              type="button"
              onClick={clear}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="p-4 bg-blue-50 border-l-4 border-blue-400">
            <div className="text-sm text-blue-700">Loading...</div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab("prePrompt")}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "prePrompt"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Pre-Prompt ({prePromptElements.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("postPrompt")}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "postPrompt"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Post-Prompt ({postPromptElements.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Add Button */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Add {activeTab === "prePrompt" ? "Pre-Prompt" : "Post-Prompt"}{" "}
              Element
            </button>
          </div>

          {/* Add/Edit Form */}
          {(showAddForm || editingElement) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <ContextElementForm
                element={editingElement?.element}
                onSubmit={
                  editingElement
                    ? (updates) =>
                        handleUpdateElement(editingElement.element.id, updates)
                    : handleAddElement
                }
                onCancel={() => {
                  setShowAddForm(false);
                  setEditingElement(null);
                }}
                isEditing={!!editingElement}
              />
            </div>
          )}

          {/* Element List */}
          <ContextElementList
            elements={
              activeTab === "prePrompt" ? prePromptElements : postPromptElements
            }
            section={activeTab}
            onEdit={(element) =>
              setEditingElement({ element, section: activeTab })
            }
            onRemove={(elementId) => handleRemoveElement(elementId, activeTab)}
            onReorder={(elementIds) =>
              handleReorderElements(elementIds, activeTab)
            }
          />
        </div>
      </div>
    </div>
  );
}
