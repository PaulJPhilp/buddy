import { icons } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Icon,
  IconName,
} from "ui";

export interface ChatAppFormValues {
  name: string;
  description?: string;
  icon: {
    name: string;
    color: string;
    size: number;
    strokeWidth: number;
  };
  color?: string;
}

interface ChatAppFormProps {
  initialValues?: ChatAppFormValues;
  onSubmit: (values: ChatAppFormValues) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ChatAppForm({
  initialValues,
  onSubmit,
  onCancel,
  loading,
}: ChatAppFormProps) {
  const [values, setValues] = useState<ChatAppFormValues>(
    initialValues || {
      name: "",
      description: "",
      icon: {
        name: "Bot",
        color: "#007bff",
        size: 24,
        strokeWidth: 2,
      },
      color: "#007bff",
    },
  );
  const [error, setError] = useState<string | null>(null);
  const [iconDialogOpen, setIconDialogOpen] = useState(false);
  const [iconDraft, setIconDraft] = useState(values.icon);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) {
      setError("Name is required");
      return;
    }
    setError(null);
    onSubmit(values);
  }

  function handleIconButtonClick() {
    setIconDraft(values.icon);
    setIconDialogOpen(true);
  }

  function handleIconDialogConfirm() {
    setValues((prev) => ({ ...prev, icon: iconDraft }));
    setIconDialogOpen(false);
  }

  // Helper for icon name autocomplete
  const iconNames = Object.keys(icons) as IconName[];
  const [iconNameSearch, setIconNameSearch] = useState("");
  const filteredIconNames = iconNames.filter((name) =>
    name.includes(iconNameSearch.toLowerCase()),
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name *</label>
        <input
          name="name"
          value={values.name}
          onChange={handleChange}
          className="w-full border rounded px-2 py-1"
          required
          disabled={loading}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          name="description"
          value={values.description}
          onChange={handleChange}
          className="w-full border rounded px-2 py-1"
          rows={2}
          disabled={loading}
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Icon</label>
          <button
            type="button"
            className="w-full border rounded px-2 py-1 flex items-center gap-2"
            disabled={loading}
            onClick={handleIconButtonClick}
          >
            <Icon
              name={values.icon.name as IconName}
              size={values.icon.size}
              color={values.icon.color}
              strokeWidth={values.icon.strokeWidth}
            />
            <span className="ml-2">Choose Icon</span>
          </button>
          <Dialog open={iconDialogOpen} onOpenChange={setIconDialogOpen}>
            <DialogContent>
              <DialogTitle>Choose Icon</DialogTitle>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm w-20">Name</label>
                  <input
                    type="text"
                    value={iconNameSearch}
                    onChange={(e) => setIconNameSearch(e.target.value)}
                    placeholder="Search icon..."
                    className="border rounded px-2 py-1 flex-1"
                  />
                </div>
                <div className="max-h-32 overflow-y-auto border rounded p-1 grid grid-cols-6 gap-2 bg-gray-50">
                  {filteredIconNames.slice(0, 24).map((name) => (
                    <button
                      key={name}
                      type="button"
                      className={`flex flex-col items-center p-1 rounded hover:bg-blue-100 ${iconDraft.name === name ? "bg-blue-200" : ""}`}
                      onClick={() => setIconDraft({ ...iconDraft, name })}
                    >
                      <Icon
                        name={name}
                        size={24}
                        color={iconDraft.color}
                        strokeWidth={iconDraft.strokeWidth}
                      />
                      <span className="text-xs mt-1 truncate w-12">{name}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm w-20">Color</label>
                  <input
                    type="color"
                    value={iconDraft.color}
                    onChange={(e) =>
                      setIconDraft({ ...iconDraft, color: e.target.value })
                    }
                  />
                  <span className="ml-2">{iconDraft.color}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm w-20">Size</label>
                  <input
                    type="number"
                    min={12}
                    max={64}
                    value={iconDraft.size}
                    onChange={(e) =>
                      setIconDraft({
                        ...iconDraft,
                        size: Number(e.target.value),
                      })
                    }
                    className="border rounded px-2 py-1 w-20"
                  />
                  <span className="ml-2">px</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm w-20">Stroke</label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={iconDraft.strokeWidth}
                    onChange={(e) =>
                      setIconDraft({
                        ...iconDraft,
                        strokeWidth: Number(e.target.value),
                      })
                    }
                    className="border rounded px-2 py-1 w-20"
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm w-20">Preview</span>
                  <Icon
                    name={iconDraft.name as IconName}
                    size={iconDraft.size}
                    color={iconDraft.color}
                    strokeWidth={iconDraft.strokeWidth}
                  />
                </div>
              </div>
              <DialogFooter>
                <button
                  type="button"
                  className="px-3 py-1 rounded bg-blue-600 text-white"
                  onClick={handleIconDialogConfirm}
                >
                  Save
                </button>
                <DialogClose asChild>
                  <button
                    type="button"
                    className="px-3 py-1 rounded bg-gray-200"
                  >
                    Cancel
                  </button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Color</label>
          <input
            name="color"
            value={values.color}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            disabled={loading}
            type="color"
          />
        </div>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 rounded bg-gray-200"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3 py-1 rounded bg-blue-600 text-white"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
