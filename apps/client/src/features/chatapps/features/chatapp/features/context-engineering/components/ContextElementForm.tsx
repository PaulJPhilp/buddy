"use client";

import {
  type FileType,
  NamedFile,
  NamedPrompt,
} from "@/managers/context-engineering/types";
import { useCallback, useState } from "react";

interface ContextElementFormProps {
  element?: NamedPrompt | NamedFile;
  onSubmit: (element: NamedPrompt | NamedFile) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export function ContextElementForm({
  element,
  onSubmit,
  onCancel,
  isEditing = false,
}: ContextElementFormProps) {
  const [elementType, setElementType] = useState<"NamedPrompt" | "NamedFile">(
    (element as any)?._tag || "NamedPrompt",
  );
  const [id, setId] = useState(element?.id || "");
  const [name, setName] = useState(element?.name || "");
  const [content, setContent] = useState(
    (element as any)?._tag === "NamedPrompt"
      ? (element as NamedPrompt).content
      : (element as any)?._tag === "NamedFile"
        ? (element as NamedFile).content
        : "",
  );
  const [fileType, setFileType] = useState<FileType>(
    (element as any)?._tag === "NamedFile"
      ? (element as NamedFile).fileType
      : "Markdown",
  );
  const [fileName, setFileName] = useState(
    (element as any)?._tag === "NamedFile"
      ? (element as NamedFile).fileName || ""
      : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Set fileName if not already set
      if (!fileName.trim()) {
        setFileName(file.name);
      }

      // Detect file type based on extension
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (extension === "md" || extension === "markdown") {
        setFileType("Markdown");
      } else if (extension === "json") {
        setFileType("JSON");
      } else if (extension === "csv") {
        setFileType("CSV");
      } else if (extension === "xml") {
        setFileType("XML");
      }

      // Read file content
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileContent = event.target?.result as string;
        setContent(fileContent);
      };
      reader.readAsText(file);

      // Clear the input so the same file can be uploaded again
      e.target.value = "";
    },
    [fileName],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!id.trim() || !name.trim()) {
        alert("ID and name are required");
        return;
      }

      if (elementType === "NamedPrompt" && !content.trim()) {
        alert("Content is required for prompts");
        return;
      }

      if (elementType === "NamedFile" && !content.trim()) {
        alert("Content is required for files");
        return;
      }

      setIsSubmitting(true);

      try {
        let newElement: NamedPrompt | NamedFile;

        if (elementType === "NamedPrompt") {
          newElement = new NamedPrompt({
            _tag: "NamedPrompt",
            id: id.trim(),
            name: name.trim(),
            content: content.trim(),
          });
        } else {
          newElement = new NamedFile({
            _tag: "NamedFile",
            id: id.trim(),
            name: name.trim(),
            fileType,
            content: content.trim(),
            fileName: fileName.trim() || undefined,
          });
        }

        await onSubmit(newElement);

        // Reset form if not editing
        if (!isEditing) {
          setId("");
          setName("");
          setContent("");
          setFileType("Markdown");
          setFileName("");
        }
      } catch (error) {
        console.error("Failed to submit element:", error);
        alert("Failed to save element. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [elementType, id, name, content, fileType, fileName, onSubmit, isEditing],
  );

  const generateId = useCallback(() => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    setId(`${elementType.toLowerCase()}-${timestamp}-${randomStr}`);
  }, [elementType]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          {isEditing ? "Edit Element" : "Add New Element"}
        </h3>
        <div className="flex items-center space-x-2">
          <label
            className="text-sm font-medium text-gray-700"
            htmlFor="elementType"
          >
            Type:
          </label>
          <select
            id="elementType"
            value={elementType}
            onChange={(e) =>
              setElementType(e.target.value as "NamedPrompt" | "NamedFile")
            }
            disabled={isEditing}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="NamedPrompt">Named Prompt</option>
            <option value="NamedFile">Named File</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="element-id"
          >
            ID
          </label>
          <div className="flex space-x-2">
            <input
              id="element-id"
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="unique-element-id"
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="button"
              onClick={generateId}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
            >
              Generate
            </button>
          </div>
        </div>

        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="element-name"
          >
            Name
          </label>
          <input
            id="element-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Display name"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      {elementType === "NamedPrompt" && (
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="element-content"
          >
            Content
          </label>
          <textarea
            id="element-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter prompt content..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <div className="text-xs text-gray-500 mt-1">
            {content.length} / 10000 characters
          </div>
        </div>
      )}

      {elementType === "NamedFile" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="file-type"
              >
                File Type
              </label>
              <select
                id="file-type"
                value={fileType}
                onChange={(e) => setFileType(e.target.value as FileType)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Markdown">Markdown</option>
                <option value="JSON">JSON</option>
                <option value="CSV">CSV</option>
                <option value="XML">XML</option>
              </select>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="file-name"
              >
                File Name (optional)
              </label>
              <input
                id="file-name"
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="example.md"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="file-content">
              File Content
            </label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <label className="inline-flex items-center" htmlFor="file-upload">
                  <input
                    type="file"
                    accept=".md,.json,.csv,.xml,.txt"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                  <span className="px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 cursor-pointer">
                    📎 Upload File
                  </span>
                </label>
                <span className="text-xs text-gray-500">
                  or paste content below
                </span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Enter ${fileType.toLowerCase()} content...`}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                required
              />
              <div className="text-xs text-gray-500">
                {content.length} / 50000 characters
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : isEditing ? "Update" : "Add"}
        </button>
      </div>
    </form>
  );
}
