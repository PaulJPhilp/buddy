import { FileIcon, UploadIcon, XIcon } from 'lucide-react'
import { type DropzoneOptions, useDropzone } from 'react-dropzone'

import { cn } from '../../utils/cn'
import { Button } from './button'

export interface DocumentPickerProps extends Omit<DropzoneOptions, 'disabled'> {
    className?: string
    dropzoneClassName?: string
    value?: File[]
    disabled?: boolean
    onChange?: (files: File[]) => void
    onRemove?: (file: File) => void
    preview?: boolean
    accept?: Record<string, string[]>
}

const defaultAccept = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
        '.docx',
    ],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': [
        '.pptx',
    ],
    'text/plain': ['.txt'],
}

export function DocumentPicker({
    className,
    dropzoneClassName,
    value = [],
    disabled = false,
    onChange,
    onRemove,
    preview = true,
    accept = defaultAccept,
    ...props
}: DocumentPickerProps) {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        ...props,
        accept,
        disabled,
        onDrop: (acceptedFiles) => {
            onChange?.(acceptedFiles)
        },
    })

    const getFileIcon = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase()
        switch (extension) {
            case 'pdf':
                return 'PDF'
            case 'doc':
            case 'docx':
                return 'DOC'
            case 'xls':
            case 'xlsx':
                return 'XLS'
            case 'ppt':
            case 'pptx':
                return 'PPT'
            case 'txt':
                return 'TXT'
            default:
                return 'FILE'
        }
    }

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
                            <p>Drop the documents here ...</p>
                        ) : (
                            <p>Drag & drop documents here, or click to select</p>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT
                    </div>
                </div>
            </div>

            {preview && value.length > 0 && (
                <div className="grid gap-4">
                    {value.map((file) => (
                        <div
                            key={`${file.name}-${file.size}`}
                            className="flex items-center gap-4 rounded-md border p-4"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted">
                                <FileIcon className="h-5 w-5" />
                                <span className="sr-only">{getFileIcon(file.name)}</span>
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                            {onRemove && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
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