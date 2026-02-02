import { useState, useRef, useCallback, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Relatorio } from '@/types'

interface ReportViewerProps {
  relatorio: Relatorio
  refreshKey: number
}

export function ReportViewer({ relatorio, refreshKey }: ReportViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const handleLoad = useCallback(() => {
    setIsLoading(false)
  }, [])

  // Reset loading state when relatorio or refreshKey changes
  useEffect(() => {
    setIsLoading(true)
  }, [relatorio.id, refreshKey])

  return (
    <div className="relative w-full h-full">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10 animate-fade-in">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-700 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-primary-500 rounded-full border-t-transparent animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">Carregando relatório...</p>
              <p className="text-sm text-gray-500">{relatorio.nome}</p>
            </div>
          </div>
        </div>
      )}

      {/* Iframe */}
      <iframe
        ref={iframeRef}
        key={`${relatorio.id}-${refreshKey}`}
        src={relatorio.url}
        onLoad={handleLoad}
        className={cn(
          "w-full h-full border-0 rounded-xl bg-gray-800 transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        title={relatorio.nome}
        allow="fullscreen"
      />
    </div>
  )
}
