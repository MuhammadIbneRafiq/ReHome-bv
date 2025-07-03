import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { FaUpload, FaTrash } from "react-icons/fa"

export interface FileUploadProps {
  value: File[]
  onChange: (files: File[]) => void
  onRemove: (index: number) => void
  className?: string
  required?: boolean
  maxSizeInMB?: number
}

export function FileUpload({
  value,
  onChange,
  onRemove,
  className,
  required = false,
  maxSizeInMB = 2,
  ...props
}: FileUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [error, setError] = React.useState<string | null>(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setError(null)
      
      // Check for HEIC files and notify user
      const heicFiles = newFiles.filter(file => 
        file.name.toLowerCase().includes('.heic') || 
        file.name.toLowerCase().includes('.heif')
      )
      
      if (heicFiles.length > 0) {
        console.log(`📱 ${heicFiles.length} HEIC images detected. These will be automatically converted to web-compatible format during upload.`)
      }
      
      onChange([...value, ...newFiles])
    }
  }

  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          className="flex items-center gap-2"
        >
          <FaUpload className="h-4 w-4" />
          Upload Images {required && "*"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
      </div>
      
      {required && value.length === 0 && (
        <p className="text-sm text-red-500">
          * At least one image is required
        </p>
      )}
      
      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}
      
      <p className="text-xs text-gray-500">
        PNG, JPG, GIF images will be automatically optimized for web
      </p>
      
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {value.map((file, index) => {
            const isHeic = file.name.toLowerCase().includes('.heic') || file.name.toLowerCase().includes('.heif')
            const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2)
            return (
              <div
                key={index}
                className="relative aspect-square rounded-lg border bg-muted"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className="h-full w-full rounded-lg object-cover"
                />
                {isHeic && (
                  <div className="absolute bottom-2 left-2 rounded bg-blue-500 px-2 py-1 text-xs text-white">
                    HEIC → JPG
                  </div>
                )}
                <div className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                  {fileSizeInMB}MB
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 text-foreground/80 transition-colors hover:bg-background hover:text-foreground"
                >
                  <FaTrash className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
} 