import { useState, useEffect } from 'react'

interface VersionInfo {
  version: string
  buildDate?: string
  commitMessage?: string
}

export function VersionBadge() {
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    fetch('/version.json')
      .then(res => res.ok ? res.json() : null)
      .then((data: VersionInfo | null) => data?.version && setVersion(data.version))
      .catch(() => {})
  }, [])

  if (!version) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-40 px-2.5 py-1 rounded-md text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100/80 dark:bg-white/[0.06] backdrop-blur-sm border border-gray-200/60 dark:border-white/[0.06] select-none"
      title={`Versão ${version}`}
    >
      v{version}
    </div>
  )
}
