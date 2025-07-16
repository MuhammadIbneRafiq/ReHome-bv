import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { FaUpload, FaTrash, FaShieldAlt, FaExclamationTriangle } from "react-icons/fa"
import { nsfwFilterService } from "../../services/nsfwFilterService"
import { toast } from "react-toastify"

export interface NSFWFileUploadProps {
  value: File[]
  onChange: (files: File[]) => void
  onRemove: (index: number) => void
  className?: string
  required?: boolean
  maxSizeInMB?: number
  disabled?: boolean
}

export function NSFWFileUpload({
  value,
  onChange,
  onRemove,
  className,
  required = false,
  maxSizeInMB = 2,
  disabled = false,
  ...props
}: NSFWFileUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isChecking, setIsChecking] = React.useState(false)
  const [checkingFiles, setCheckingFiles] = React.useState<Set<string>>(new Set())

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setError(null)
      setIsChecking(true)
      
      try {
        // Check for HEIC files and notify user
        const heicFiles = newFiles.filter(file => 
          file.name.toLowerCase().includes('.heic') || 
          file.name.toLowerCase().includes('.heif')
        )
        
        if (heicFiles.length > 0) {
          console.log(`📱 ${heicFiles.length} HEIC images detected. These will be automatically converted to web-compatible format during upload.`)
        }

        // Check each file for NSFW content
        const checkingFileNames = new Set(newFiles.map(f => f.name))
        setCheckingFiles(checkingFileNames)

        const checkResult = await nsfwFilterService.checkMultipleImages(newFiles)
        
        if (checkResult.allSafe) {
          // All files are safe, add them to the list
          onChange([...value, ...newFiles])
          toast.success(`✅ All ${newFiles.length} image${newFiles.length > 1 ? 's' : ''} passed content check`)
        } else {
          // Some files are unsafe
          const unsafeMessage = nsfwFilterService.getUnsafeImageMessage(checkResult.unsafeFiles)
          setError(unsafeMessage)
          
          // Only add safe files
          if (checkResult.safeFiles.length > 0) {
            onChange([...value, ...checkResult.safeFiles])
            toast.success(`✅ ${checkResult.safeFiles.length} image${checkResult.safeFiles.length > 1 ? 's' : ''} added successfully`)
          }
          
          // Show warning for unsafe files
          toast.error(`🚫 ${checkResult.unsafeFiles.length} image${checkResult.unsafeFiles.length > 1 ? 's' : ''} rejected due to inappropriate content`)
        }
      } catch (error) {
        console.error('Error checking images:', error)
        setError('Failed to check image content. Please try again.')
        toast.error('Content check failed. Please try uploading again.')
      } finally {
        setIsChecking(false)
        setCheckingFiles(new Set())
      }
    }
  }

  const handleRemove = (index: number) => {
    onRemove(index)
    setError(null)
  }

  const getFileStatus = (file: File) => {
    if (checkingFiles.has(file.name)) {
      return (
        <div className="absolute bottom-2 left-2 rounded bg-blue-500 px-2 py-1 text-xs text-white flex items-center gap-1">
          <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
          Checking...
        </div>
      )
    }
    
    const isHeic = file.name.toLowerCase().includes('.heic') || file.name.toLowerCase().includes('.heif')
    if (isHeic) {
      return (
        <div className="absolute bottom-2 left-2 rounded bg-blue-500 px-2 py-1 text-xs text-white">
          HEIC → JPG
        </div>
      )
    }
    
    return null
  }

  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          disabled={disabled || isChecking}
          className="flex items-center gap-2"
        >
          <FaUpload className="h-4 w-4" />
          {isChecking ? 'Checking Images...' : 'Upload Images'} {required && "*"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleChange}
          className="hidden"
          disabled={disabled || isChecking}
        />
        {isChecking && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <FaShieldAlt className="h-4 w-4" />
            <span>Content check in progress...</span>
          </div>
        )}
      </div>
      
      {required && value.length === 0 && !isChecking && (
        <p className="text-sm text-red-500">
          * At least one image is required
        </p>
      )}
      
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <FaExclamationTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">
            {error}
          </p>
        </div>
      )}
      
      <div className="space-y-2">
        <p className="text-xs text-gray-500">
          PNG, JPG, GIF images will be automatically optimized for web
        </p>
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <FaShieldAlt className="h-3 w-3" />
          All images are automatically checked for inappropriate content
        </p>
      </div>
      
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {value.map((file, index) => {
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
                {getFileStatus(file)}
                <div className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                  {fileSizeInMB}MB
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  disabled={isChecking}
                  className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 text-foreground/80 transition-colors hover:bg-background hover:text-foreground disabled:opacity-50"
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