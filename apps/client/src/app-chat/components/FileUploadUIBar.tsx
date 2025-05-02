"use client"

import { Effect } from "effect"
import { UploadIcon } from "lucide-react"
import { useRef, useState } from "react"
import { Button } from "../../../../../src/components/components/ui/button"
import { UIBarServiceApi } from "../services/UIBarService"

interface FileUploadUIBarProps {
    onFileSelect?: (files: File[]) => void
}

function FileUploadUIBar({ onFileSelect }: FileUploadUIBarProps) {
    const [uploadStatus, setUploadStatus] = useState<string>("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (!files?.length) return

        const selectedFiles = Array.from(files)
        onFileSelect?.(selectedFiles)

        // Update status
        setUploadStatus(`${selectedFiles.length} file(s) selected`)

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
                <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                >
                    <UploadIcon className="h-4 w-4" />
                    Upload Files
                </Button>
                {uploadStatus && (
                    <span className="text-sm text-muted-foreground">
                        {uploadStatus}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>Ready to upload</span>
            </div>
        </div>
    )
}

export class FileUploadUIBarService extends Effect.Service<UIBarServiceApi>()(
    "FileUploadUIBarService",
    {
        effect: Effect.succeed({
            render: () => <FileUploadUIBar />
        }),
        dependencies: []
    }
) { } 