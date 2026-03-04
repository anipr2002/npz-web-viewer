'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'
import FileDropzone from './FileDropzone'
import UploadButton from './UploadButton'
import DataTable from '../data-table/DataTable'
import { parseFiles } from '@/lib/npz-parser'

interface ArrayData {
  size: any
  ndim: number
  data: any[]
}

export default function FileUploader() {
  const [files, setFiles] = useState<File[]>([])
  const [data, setData] = useState<Record<string, Record<string, ArrayData>> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  const handleSetFiles = (newFiles: File[]) => {
    setFiles(newFiles)
    setData(null)
    setParseError(null)
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files before uploading.')
      return
    }

    setIsLoading(true)
    setParseError(null)

    try {
      const result = await parseFiles(files)
      setData(result)
      toast.success('Files parsed successfully!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.'
      toast.error(message)
      setParseError(message)
      console.error('Error parsing files:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <FileDropzone files={files} setFiles={handleSetFiles} />
      {files.length > 0 && (
        <UploadButton
          isLoading={isLoading}
          onClick={handleUpload}
          disabled={isLoading}
        />
      )}

      {parseError && !isLoading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to parse files</AlertTitle>
          <AlertDescription>{parseError}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-4" />
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-5/6" />
                <div className="h-3 bg-muted rounded w-4/6" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {data && !isLoading && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Analysis Results</h2>
          <DataTable data={data} />
        </Card>
      )}
    </div>
  )
}
