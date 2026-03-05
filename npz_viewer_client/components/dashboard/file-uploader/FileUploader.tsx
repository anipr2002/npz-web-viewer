'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { AlertCircle, Crown } from 'lucide-react'
import FileDropzone from './FileDropzone'
import UploadButton from './UploadButton'
import DataTable from '../data-table/DataTable'
import { parseFiles, FREE_LIMITS, PREMIUM_LIMITS, LARGE_DATASET_THRESHOLD, type ParseLimits } from '@/lib/npz-parser'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAuth } from '@clerk/nextjs'
import RateLimitedCheckoutButton from '@/components/RateLimitedCheckoutButton'

interface ArrayData {
  size: any
  ndim: number
  dtype: string
  data: any[]
}

export default function FileUploader() {
  const { isSignedIn } = useAuth()
  const premium = useQuery(api.polar.isPremium, isSignedIn ? {} : 'skip')
  const isPremium = premium === true
  const limits: ParseLimits = isPremium ? PREMIUM_LIMITS : FREE_LIMITS

  const [files, setFiles] = useState<File[]>([])
  const [data, setData] = useState<Record<string, Record<string, ArrayData>> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

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
      setShowUpgradePrompt(false)
      const result = await parseFiles(files, limits)
      setData(result)

      // Check total cells across all arrays and warn if large
      let totalCells = 0
      for (const arrays of Object.values(result)) {
        for (const arr of Object.values(arrays)) {
          const cells = arr.size.reduce((a: number, b: number) => a * b, 1)
          totalCells += cells
        }
      }

      if (totalCells >= LARGE_DATASET_THRESHOLD) {
        toast.warning(
          `Large dataset (${(totalCells / 1000).toFixed(0)}K cells) — rendering may take a moment.`,
          { duration: 5000 }
        )
      } else {
        toast.success('Files parsed successfully!')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.'
      // Check if the error is about dimension limits and user is on free tier
      if (!isPremium && message.includes('exceeds the')) {
        setShowUpgradePrompt(true)
      }
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

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          Max dimensions: {limits.maxRows}x{limits.maxCols}
        </span>
        {isPremium && (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 text-indigo-700 dark:text-indigo-300">
            <Crown className="h-3 w-3" /> Pro
          </span>
        )}
      </div>

      {files.length > 0 && (
        <UploadButton
          isLoading={isLoading}
          onClick={handleUpload}
          disabled={isLoading}
        />
      )}

      {showUpgradePrompt && !isLoading && (
        <Alert>
          <Crown className="h-4 w-4" />
          <AlertTitle>File exceeds free tier limits</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>
              Free accounts support arrays up to {FREE_LIMITS.maxRows}x{FREE_LIMITS.maxCols}.
              Upgrade to Pro for {PREMIUM_LIMITS.maxRows}x{PREMIUM_LIMITS.maxCols} support.
            </span>
            {isSignedIn ? (
              <RateLimitedCheckoutButton
                className="inline-flex w-fit items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                Unlock for $3.49
              </RateLimitedCheckoutButton>
            ) : (
              <span className="text-xs">Sign in to upgrade.</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {parseError && !showUpgradePrompt && !isLoading && (
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
