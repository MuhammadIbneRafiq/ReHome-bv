import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { FaUpload, FaTrash } from "react-icons/fa"

export interface FileUploadProps {
  value: File[]
  onChange: (files: File[]) => void
  onRemove: (index: number) => void
  className?: string
}

export function FileUpload({
  value,
  onChange,
  onRemove,
  className,
  ...props
}: FileUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
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
          Upload Images
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
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {value.map((file, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg border bg-muted"
            >
              <img
                src={URL.createObjectURL(file)}
                alt={`Preview ${index + 1}`}
                className="h-full w-full rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 text-foreground/80 transition-colors hover:bg-background hover:text-foreground"
              >
                <FaTrash className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 