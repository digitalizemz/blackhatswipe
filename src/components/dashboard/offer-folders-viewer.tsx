'use client'

import { useState } from 'react'
import type { OfferFile } from '@/types/offer'

function getFileIcon(fileType: string | null, fileName: string): string {
  if (fileType === 'link') return '🔗'
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  if (['mp4', 'mov', 'webm'].includes(ext)) return '🎬'
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return '🖼'
  if (ext === 'pdf') return '📄'
  if (['doc', 'docx'].includes(ext)) return '📝'
  return '📎'
}

function FolderRow({ name, files }: { name: string; files: OfferFile[] }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border border-[#1A1A1A] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#111] hover:bg-[#141414] transition-colors select-none"
      >
        <div className="flex items-center gap-2.5">
          <span className={`text-zinc-500 text-xs transition-transform duration-200 ${open ? 'rotate-90' : ''}`}>▶</span>
          <span className="text-base">📁</span>
          <span className="text-sm font-medium text-white">{name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{files.length}</span>
        </div>
      </button>
      {open && (
        <div>
          {files.map((f) => (
            <a
              key={f.id}
              href={f.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 border-t border-[#1A1A1A] hover:bg-[#111] transition-colors group"
            >
              <span className="text-base shrink-0">{getFileIcon(f.file_type, f.file_name)}</span>
              <span className="text-sm text-zinc-300 group-hover:text-white truncate flex-1">{f.file_name}</span>
              <span className="text-xs text-zinc-600 group-hover:text-yellow-400 transition-colors shrink-0">
                {f.file_size ? `${(f.file_size / 1024).toFixed(0)} KB` : '↗'}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default function OfferFoldersViewer({ folderMap }: { folderMap: Record<string, OfferFile[]> }) {
  const entries = Object.entries(folderMap)
  if (entries.length === 0) return null
  return (
    <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
      <h2 className="text-base font-semibold text-white mb-4">📁 Files & Assets</h2>
      <div className="space-y-2">
        {entries.map(([folder, files]) => (
          <FolderRow key={folder} name={folder} files={files} />
        ))}
      </div>
    </div>
  )
}
