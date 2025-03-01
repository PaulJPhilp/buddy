import { UploadIcon, XIcon } from 'lucide-react'
import { type DropzoneOptions, useDropzone } from 'react-dropzone'

import { cn } from '../../utils/cn'
import { Button } from './button'

export interface FilePickerProps extends Omit<DropzoneOptions, 'disabled'> {
    className?: string
    dropzoneClassName?: string
    value?: File[]
    disabled?: boolean
    onChange?: (files: File[]) => void
    onRemove?: (file: File) => void
    preview?: boolean
}

export function FilePicker({
    className,
    dropzoneClassName,
    value = [],
    disabled = false,
    onChange,
    onRemove,
    preview = true,
    ...props
}: FilePickerProps) {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        ...props,
        disabled,
        onDrop: (acceptedFiles) => {
            onChange?.(acceptedFiles)
        },
    })

    return (
        <div className={cn('space-y-4', className)}>
            <div
                {...getRootProps()}
                className={cn(
                    'flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-8 text-center transition-colors hover:bg-accent/50',
                    isDragActive && 'border-primary bg-accent',
                    disabled && 'cursor-not-allowed opacity-60',
                    dropzoneClassName,
                )}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2">
                    <UploadIcon className="h-8 w-8 text-muted-foreground" />
                    <div className="text-base">
                        {isDragActive ? (
                            <p>Drop the files here ...</p>
                        ) : (
                            <p>Drag & drop files here, or click to select files</p>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {props.maxFiles && props.maxFiles === 1
                            ? 'Upload 1 file'
                            : `Upload up to ${props.maxFiles} files`}
                    </div>
                </div>
            </div>

            {preview && value.length > 0 && (
                <div className="grid gap-4">
                    {value.map((file, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-2 rounded-md border p-2"
                        >
                            <div className="flex-1 truncate text-sm">
                                {file.name} - {(file.size / 1024 / 1024).toFixed(2)}MB
                            </div>
                            {onRemove && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => onRemove(file)}
                                >
                                    <XIcon className="h-4 w-4" />
                                    <span className="sr-only">Remove file</span>
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
} 