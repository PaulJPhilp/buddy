"use client";

import type {
  ContextElement,
  NamedFile,
  NamedPrompt,
} from "../managers/types";
import { useCallback, useState } from "react";

interface ContextElementListProps {
  elements: readonly ContextElement[];
  section: "prePrompt" | "postPrompt";
  onEdit: (element: NamedPrompt | NamedFile) => void;
  onRemove: (elementId: string) => void;
  onReorder: (elementIds: string[]) => void;
}

export function ContextElementList({
  elements,
  section,
  onEdit,
  onRemove,
  onReorder,
}: ContextElementListProps): React.ReactElement {
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent, elementId: string) => {
      setDraggedElementId(elementId);
      e.dataTransfer.effectAllowed = "move";
    },
    [],
  );

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();

      if (!draggedElementId) return;

      const draggedIndex = elements.findIndex((e) => e.id === draggedElementId);
      if (draggedIndex === -1 || draggedIndex === dropIndex) return;

      // Create new order
      const newElements = [...elements];
      const [draggedElement] = newElements.splice(draggedIndex, 1);
      newElements.splice(dropIndex, 0, draggedElement);

      // Update order
      onReorder(newElements.map((e) => e.id));

      setDraggedElementId(null);
      setDragOverIndex(null);
    },
    [elements, draggedElementId, onReorder],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedElementId(null);
    setDragOverIndex(null);
  }, []);

  const handleRemove = useCallback(
    (elementId: string) => {
      if (confirm("Are you sure you want to remove this element?")) {
        onRemove(elementId);
      }
    },
    [onRemove],
  );

  if (elements.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📝</div>
        <p className="text-lg font-medium">No elements yet</p>
        <p className="text-sm">
          Add your first{" "}
          {section === "prePrompt" ? "pre-prompt" : "post-prompt"} element to
          get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {elements.map((element, index) => (
        <div
          key={element.id}
          draggable
          onDragStart={(e) => handleDragStart(e, element.id)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={`
            bg-white border border-gray-200 rounded-lg p-4 cursor-move
            hover:shadow-md transition-shadow
            ${draggedElementId === element.id ? "opacity-50" : ""}
            ${dragOverIndex === index ? "border-blue-500 bg-blue-50" : ""}
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-700">
                  {element._tag === "NamedPrompt" ? "Prompt" : "File"}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {element.name}
                </span>
                <span className="text-xs text-gray-500">#{index + 1}</span>
              </div>

              <div className="text-xs text-gray-500 mb-2">ID: {element.id}</div>

              {element._tag === "NamedPrompt" && (
                <div className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                  <div className="font-medium mb-1">Content:</div>
                  <div className="whitespace-pre-wrap break-words">
                    {(element as NamedPrompt).content.length > 200
                      ? `${(element as NamedPrompt).content.substring(0, 200)}...`
                      : (element as NamedPrompt).content}
                  </div>
                  {(element as NamedPrompt).content.length > 200 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {(element as NamedPrompt).content.length} characters total
                    </div>
                  )}
                </div>
              )}

              {element._tag === "NamedFile" && (
                <div className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium">File Type:</span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                      {(element as NamedFile).fileType}
                    </span>
                    {(element as NamedFile).fileName && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="font-mono text-xs">
                          {(element as NamedFile).fileName}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="font-medium mb-1">Content:</div>
                  <div className="font-mono text-xs whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                    {(element as NamedFile).content.length > 300
                      ? `${(element as NamedFile).content.substring(0, 300)}...`
                      : (element as NamedFile).content}
                  </div>
                  {(element as NamedFile).content.length > 300 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {(element as NamedFile).content.length} characters total
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <button
                type="button"
                onClick={() => onEdit(element)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="Edit element"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => handleRemove(element.id)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                title="Remove element"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>

              <div
                className="text-gray-400 cursor-move"
                title="Drag to reorder"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
