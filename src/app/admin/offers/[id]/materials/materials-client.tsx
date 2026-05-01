'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { OfferFile } from '@/types/offer'

const DEFAULT_FOLDERS = ['Ads', 'VSL', 'Checkout', 'Transcriptions']

interface FolderState {
  name: string
  expanded: boolean
  showAddLink: boolean
  uploading: boolean
}
interface LinkForm { name: string; url: string }

// ─── helpers ─────────────────────────────────────────────────────────────────

function getFileIcon(fileType: string | null, fileName: string): string {
  if (fileType === 'link') return '🔗'
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  if (['mp4', 'mov', 'webm'].includes(ext)) return '🎬'
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return '🖼'
  if (ext === 'pdf') return '📄'
  if (['doc', 'docx'].includes(ext)) return '📝'
  return '📎'
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
  return m ? m[1] : null
}

function isImageUrl(url: string, fileType: string | null) {
  return fileType === 'image' || /\.(jpg|jpeg|png|webp|gif)$/i.test(url)
}

function isVideoUrl(url: string, fileType: string | null) {
  return fileType === 'video' || /\.(mp4|mov|webm)$/i.test(url)
}

function Toast({ msg, onDismiss }: { msg: string; onDismiss: () => void }) {
  return (
    <div
      onClick={onDismiss}
      className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border bg-green-900/90 border-green-700/60 text-green-300 cursor-pointer"
    >
      ✓ {msg}
    </div>
  )
}

// ─── Creative card ────────────────────────────────────────────────────────────

function CreativeCard({ creative, onDelete }: { creative: OfferFile; onDelete: (id: string) => void }) {
  const parts = creative.file_name.split(' | ')
  const name  = parts[0] ?? ''
  const angle = parts[1] ?? ''
  const ytId  = extractYouTubeId(creative.file_url)

  return (
    <div className="bg-[#111111] border border-[#1C1C1C] rounded-xl overflow-hidden cursor-pointer hover:border-zinc-600 transition-colors">
      {/* Media preview */}
      <div className="h-36 relative bg-zinc-900">
        {ytId ? (
          <>
            <img
              src={`https://img.youtube.com/vi/${ytId}/0.jpg`}
              alt={name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                <span className="text-black text-sm ml-0.5">▶</span>
              </div>
            </div>
          </>
        ) : isImageUrl(creative.file_url, creative.file_type) ? (
          <img src={creative.file_url} alt={name} className="w-full h-full object-cover" />
        ) : isVideoUrl(creative.file_url, creative.file_type) ? (
          <>
            <video src={creative.file_url} className="w-full h-full object-cover" muted preload="metadata" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                <span className="text-black text-sm ml-0.5">▶</span>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
            <span className="text-3xl">🎬</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium text-white truncate">{name || 'Untitled'}</p>
        {angle && <p className="text-xs text-zinc-500 truncate mt-0.5">{angle}</p>}
        {creative.file_type && (
          <span className="inline-block text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-md mt-1 capitalize">
            {creative.file_type}
          </span>
        )}
        <div className="flex items-center gap-3 mt-2">
          <a
            href={creative.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-400 hover:text-yellow-400 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            View →
          </a>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(creative.id) }}
            className="text-zinc-600 hover:text-red-400 text-sm transition-colors cursor-pointer"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MaterialsClient({ offerId }: { offerId: string }) {
  const router   = useRouter()
  const supabase = createClient()
  const fileInputRefs    = useRef<Record<string, HTMLInputElement | null>>({})
  const creativeInputRef = useRef<HTMLInputElement>(null)

  const [offerTitle, setOfferTitle] = useState('')
  const [loading,    setLoading]    = useState(true)
  const [toast,      setToast]      = useState<string | null>(null)

  // Creatives
  const [creatives,    setCreatives]    = useState<OfferFile[]>([])
  const [showAddForm,  setShowAddForm]  = useState(false)
  const [creativeName, setCreativeName] = useState('')
  const [creativeType, setCreativeType] = useState('video')
  const [angle,        setAngle]        = useState('')
  const [mediaTab,     setMediaTab]     = useState<'url' | 'upload'>('url')
  const [mediaUrl,     setMediaUrl]     = useState('')
  const [fileSize,     setFileSize]     = useState<number | null>(null)
  const [creativeUploading, setCreativeUploading] = useState(false)
  const [savingCreative,    setSavingCreative]    = useState(false)

  // Folders
  const [files,         setFiles]         = useState<OfferFile[]>([])
  const [folders,       setFolders]       = useState<FolderState[]>([])
  const [newFolderName, setNewFolderName] = useState('')
  const [linkForms,     setLinkForms]     = useState<Record<string, LinkForm>>({})

  // Fetch on mount
  useEffect(() => {
    if (!offerId) return
    Promise.all([
      supabase.from('offers').select('title').eq('id', offerId).single(),
      supabase.from('offer_files').select('*').eq('offer_id', offerId).order('created_at', { ascending: false }),
    ]).then(([offerRes, filesRes]) => {
      if (offerRes.data) setOfferTitle((offerRes.data as { title: string }).title)

      const allFiles   = (filesRes.data ?? []) as OfferFile[]
      const cFiles     = allFiles.filter((f) => f.folder_name === '__creatives__')
      const folderFiles = allFiles.filter((f) => f.folder_name !== '__creatives__')

      setCreatives(cFiles)
      setFiles(folderFiles)

      const existingFolders = Array.from(new Set(folderFiles.map((f) => f.folder_name))).sort()
      const initNames = existingFolders.length > 0 ? existingFolders : DEFAULT_FOLDERS
      setFolders(initNames.map((n) => ({ name: n, expanded: true, showAddLink: false, uploading: false })))

      setLoading(false)
    })
  }, [offerId]) // eslint-disable-line react-hooks/exhaustive-deps

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ─── Creatives ────────────────────────────────────────────────────────────

  function resetCreativeForm() {
    setCreativeName('')
    setCreativeType('video')
    setAngle('')
    setMediaTab('url')
    setMediaUrl('')
    setFileSize(null)
    setShowAddForm(false)
  }

  async function handleCreativeUpload(file: File) {
    setCreativeUploading(true)
    const path = `${offerId}/creatives/${Date.now()}-${file.name}`
    const { data: upload, error: err } = await supabase.storage
      .from('offer-assets')
      .upload(path, file, { upsert: true })
    if (err) {
      showToast(err.message.includes('bucket') ? 'Storage not configured.' : `Upload failed: ${err.message}`)
      setCreativeUploading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('offer-assets').getPublicUrl(upload.path)
    setMediaUrl(publicUrl)
    setFileSize(file.size)
    setCreativeUploading(false)
  }

  async function saveCreative() {
    if (!mediaUrl.trim()) { showToast('Add a media URL or upload a file first'); return }
    setSavingCreative(true)
    const fileName = `${creativeName.trim() || 'Creative'}${angle.trim() ? ` | ${angle.trim()}` : ''}`
    const { data: inserted } = await supabase
      .from('offer_files')
      .insert({
        offer_id:    offerId,
        folder_name: '__creatives__',
        file_name:   fileName,
        file_url:    mediaUrl.trim(),
        file_type:   creativeType,
        file_size:   fileSize,
      })
      .select('*')
      .single()
    if (inserted) setCreatives((prev) => [inserted as OfferFile, ...prev])
    setSavingCreative(false)
    resetCreativeForm()
    showToast('Creative saved')
  }

  async function deleteCreative(id: string) {
    await supabase.from('offer_files').delete().eq('id', id)
    setCreatives((prev) => prev.filter((c) => c.id !== id))
  }

  // ─── Folders ──────────────────────────────────────────────────────────────

  function getFolderFiles(name: string) {
    return files.filter((f) => f.folder_name === name)
  }

  function toggleFolder(name: string) {
    setFolders((prev) => prev.map((f) => f.name === name ? { ...f, expanded: !f.expanded } : f))
  }

  function toggleAddLink(name: string) {
    setFolders((prev) => prev.map((f) => f.name === name ? { ...f, showAddLink: !f.showAddLink } : f))
    if (!linkForms[name]) setLinkForms((prev) => ({ ...prev, [name]: { name: '', url: '' } }))
  }

  function setUploading(name: string, val: boolean) {
    setFolders((prev) => prev.map((f) => f.name === name ? { ...f, uploading: val } : f))
  }

  function createFolder() {
    const name = newFolderName.trim()
    if (!name || folders.find((f) => f.name === name)) return
    setFolders((prev) => [...prev, { name, expanded: true, showAddLink: false, uploading: false }])
    setNewFolderName('')
  }

  async function deleteFolder(folderName: string) {
    if (!confirm(`Delete folder "${folderName}" and all its files?`)) return
    await supabase.from('offer_files').delete().eq('offer_id', offerId).eq('folder_name', folderName)
    setFiles((prev) => prev.filter((f) => f.folder_name !== folderName))
    setFolders((prev) => prev.filter((f) => f.name !== folderName))
  }

  async function handleFileUpload(folderName: string, fileList: FileList) {
    setUploading(folderName, true)
    for (const file of Array.from(fileList)) {
      const ext      = file.name.split('.').pop() ?? 'bin'
      const filePath = `${offerId}/${folderName}/${Date.now()}-${file.name}`
      const { data: upload, error: upErr } = await supabase.storage
        .from('offer-assets')
        .upload(filePath, file, { upsert: true })
      if (upErr) {
        showToast(upErr.message.includes('bucket') ? 'Storage not configured.' : `Upload failed: ${upErr.message}`)
        continue
      }
      const { data: { publicUrl } } = supabase.storage.from('offer-assets').getPublicUrl(upload.path)
      const { data: inserted } = await supabase
        .from('offer_files')
        .insert({ offer_id: offerId, folder_name: folderName, file_name: file.name, file_url: publicUrl, file_type: ext, file_size: file.size })
        .select('*').single()
      if (inserted) setFiles((prev) => [...prev, inserted as OfferFile])
    }
    setUploading(folderName, false)
    showToast('Files uploaded')
  }

  async function handleAddLink(folderName: string) {
    const form = linkForms[folderName]
    if (!form?.url?.trim()) return
    const { data: inserted } = await supabase
      .from('offer_files')
      .insert({ offer_id: offerId, folder_name: folderName, file_name: form.name.trim() || form.url, file_url: form.url.trim(), file_type: 'link', file_size: null })
      .select('*').single()
    if (inserted) {
      setFiles((prev) => [...prev, inserted as OfferFile])
      setLinkForms((prev) => ({ ...prev, [folderName]: { name: '', url: '' } }))
      setFolders((prev) => prev.map((f) => f.name === folderName ? { ...f, showAddLink: false } : f))
      showToast('Link saved')
    }
  }

  async function deleteFile(fileId: string) {
    await supabase.from('offer_files').delete().eq('id', fileId)
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-zinc-500 text-sm">
        <div className="w-4 h-4 rounded-full border-2 border-zinc-600 border-t-zinc-300 animate-spin" />
        Loading…
      </div>
    )
  }

  const inputCls = 'bg-[#111111] border border-[#1C1C1C] text-white h-11 rounded-lg px-4 text-sm w-full focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 placeholder:text-zinc-600 transition-colors'

  return (
    <>
      {toast && <Toast msg={toast} onDismiss={() => setToast(null)} />}

      <div className="p-8">
        {/* Header */}
        <Link href="/admin/offers" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-5">
          ← Back to Offers
        </Link>
        <h1 className="text-2xl font-bold text-white mb-1">{offerTitle}</h1>
        <p className="text-sm text-zinc-400 mb-8">Materials</p>

        <div className="max-w-3xl mx-auto">

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            <Link href={`/admin/offers/${offerId}/edit`} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
              <span className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs flex items-center justify-center">✓</span>
              <span>1 Details</span>
            </Link>
            <div className="flex-1 h-px bg-zinc-800" />
            <div className="flex items-center gap-2 text-sm">
              <span className="w-6 h-6 rounded-full bg-yellow-400/20 border border-yellow-400/30 text-yellow-400 text-xs flex items-center justify-center font-bold">2</span>
              <span className="text-yellow-400 font-medium">Materials</span>
            </div>
          </div>

          {/* ─── SECTION 1: Creatives ─── */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-white">🎬 Creatives</h2>
              <button
                onClick={() => setShowAddForm((v) => !v)}
                className="bg-yellow-400 text-black text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer hover:brightness-110 transition-all"
              >
                ＋ Add Creative
              </button>
            </div>

            {/* Add creative form */}
            {showAddForm && (
              <div className="bg-[#111111] border border-[#1C1C1C] rounded-xl p-4 mb-4">
                {/* Row 1: name */}
                <input
                  type="text"
                  value={creativeName}
                  onChange={(e) => setCreativeName(e.target.value)}
                  placeholder="Ex: Creative 01 – Doctor Hook"
                  className={`${inputCls} mb-3`}
                />
                {/* Row 2: type + angle */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <select
                    value={creativeType}
                    onChange={(e) => setCreativeType(e.target.value)}
                    className={`${inputCls} cursor-pointer`}
                  >
                    <option value="video">Video</option>
                    <option value="image">Image</option>
                    <option value="gif">GIF</option>
                  </select>
                  <input
                    type="text"
                    value={angle}
                    onChange={(e) => setAngle(e.target.value)}
                    placeholder="Ex: Doctor authority..."
                    className={inputCls}
                  />
                </div>
                {/* Row 3: media tabs */}
                <div className="flex gap-1 mb-3">
                  {(['url', 'upload'] as const).map((tab) => (
                    <button key={tab} onClick={() => setMediaTab(tab)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${mediaTab === tab ? 'bg-yellow-400 text-black' : 'text-zinc-400 hover:text-white'}`}
                    >
                      {tab === 'url' ? 'URL' : 'Upload'}
                    </button>
                  ))}
                </div>
                {mediaTab === 'url' ? (
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="YouTube, Vimeo or direct video/image URL"
                    className={`${inputCls} mb-3`}
                  />
                ) : (
                  <div className="mb-3">
                    <input
                      ref={creativeInputRef}
                      type="file"
                      accept=".mp4,.mov,.jpg,.jpeg,.png,.webp,.gif"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCreativeUpload(f) }}
                    />
                    <div
                      onClick={() => creativeInputRef.current?.click()}
                      className="border-2 border-dashed border-zinc-700 rounded-xl p-6 text-center cursor-pointer hover:border-yellow-400/50 transition-colors"
                    >
                      {creativeUploading ? (
                        <p className="text-sm text-zinc-400">Uploading…</p>
                      ) : mediaUrl ? (
                        <p className="text-sm text-green-400">✓ Uploaded — click to replace</p>
                      ) : (
                        <>
                          <p className="text-sm text-zinc-400 mb-1">Click to upload or drag & drop</p>
                          <p className="text-xs text-zinc-600">MP4, MOV, JPG, PNG, WEBP, GIF</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {/* Row 4: actions */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={resetCreativeForm}
                    className="border border-zinc-700 text-zinc-400 h-10 px-4 rounded-lg cursor-pointer hover:border-zinc-500 hover:text-white transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveCreative}
                    disabled={savingCreative}
                    className="bg-yellow-400 text-black font-semibold h-10 px-5 rounded-lg cursor-pointer hover:brightness-110 disabled:opacity-60 transition-all text-sm"
                  >
                    {savingCreative ? 'Saving…' : 'Save Creative'}
                  </button>
                </div>
              </div>
            )}

            {/* Creatives grid */}
            {creatives.length === 0 ? (
              <div className="bg-[#111] rounded-xl p-8 text-center">
                <p className="text-zinc-500 text-sm">No creatives yet. Add the first one.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {creatives.map((c) => (
                  <CreativeCard key={c.id} creative={c} onDelete={deleteCreative} />
                ))}
              </div>
            )}
          </div>

          {/* ─── SECTION 2: Create Folder ─── */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5 mb-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') createFolder() }}
                placeholder="Folder name (ex: Ads, VSL, Checkout…)"
                className="bg-[#111] border border-[#1C1C1C] text-white h-11 rounded-lg px-4 text-sm flex-1 focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 placeholder:text-zinc-600 transition-colors"
              />
              <button onClick={createFolder}
                className="bg-yellow-400 text-black font-semibold h-11 px-5 rounded-lg cursor-pointer hover:brightness-110 transition-all text-sm shrink-0"
              >
                Create Folder
              </button>
            </div>
          </div>

          {/* ─── SECTION 2: Folders ─── */}
          {folders.length === 0 ? (
            <div className="border border-zinc-800 border-dashed rounded-xl p-8 text-center">
              <p className="text-sm text-zinc-600">No folders yet — create one above</p>
            </div>
          ) : (
            folders.map((folder) => {
              const folderFiles = getFolderFiles(folder.name)
              const linkForm    = linkForms[folder.name] ?? { name: '', url: '' }
              return (
                <div key={folder.name} className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl mb-3 overflow-hidden">

                  {/* Folder header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#111] transition-colors select-none"
                    onClick={() => toggleFolder(folder.name)}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`text-zinc-500 text-xs transition-transform duration-200 ${folder.expanded ? 'rotate-90' : ''}`}>▶</span>
                      <span className="text-base">📁</span>
                      <span className="text-sm font-medium text-white">{folder.name}</span>
                      {folderFiles.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{folderFiles.length}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        ref={(el) => { fileInputRefs.current[folder.name] = el }}
                        type="file" multiple
                        accept=".mp4,.mov,.jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.txt"
                        className="hidden"
                        onChange={(e) => { if (e.target.files?.length) handleFileUpload(folder.name, e.target.files); e.target.value = '' }}
                      />
                      <button onClick={() => fileInputRefs.current[folder.name]?.click()}
                        className="border border-zinc-700 text-zinc-400 text-xs px-3 py-1.5 rounded-lg hover:border-yellow-400 hover:text-yellow-400 cursor-pointer transition-colors"
                      >↑ Upload</button>
                      <button onClick={() => toggleAddLink(folder.name)}
                        className="border border-zinc-700 text-zinc-400 text-xs px-3 py-1.5 rounded-lg hover:border-yellow-400 hover:text-yellow-400 cursor-pointer transition-colors"
                      >🔗 Link</button>
                      <button onClick={() => deleteFolder(folder.name)}
                        className="text-zinc-600 hover:text-red-400 cursor-pointer text-base transition-colors"
                      >🗑</button>
                    </div>
                  </div>

                  {folder.expanded && (
                    <>
                      {/* Add link form */}
                      {folder.showAddLink && (
                        <div className="bg-[#111] border-t border-[#1A1A1A] p-4">
                          <div className="flex gap-3 mb-3">
                            <input type="text" value={linkForm.name}
                              onChange={(e) => setLinkForms((prev) => ({ ...prev, [folder.name]: { ...linkForm, name: e.target.value } }))}
                              placeholder="Link name (ex: Main VSL…)"
                              className="bg-[#0D0D0D] border border-[#1C1C1C] text-white h-10 rounded-lg px-3 text-sm flex-[40] focus:outline-none focus:border-yellow-400/50 placeholder:text-zinc-600"
                            />
                            <input type="url" value={linkForm.url}
                              onChange={(e) => setLinkForms((prev) => ({ ...prev, [folder.name]: { ...linkForm, url: e.target.value } }))}
                              placeholder="https://…"
                              className="bg-[#0D0D0D] border border-[#1C1C1C] text-white h-10 rounded-lg px-3 text-sm flex-[50] focus:outline-none focus:border-yellow-400/50 placeholder:text-zinc-600"
                            />
                            <button onClick={() => handleAddLink(folder.name)}
                              className="bg-yellow-400 text-black font-semibold text-xs h-10 px-3 rounded-lg cursor-pointer hover:brightness-110 transition-all shrink-0"
                            >Save</button>
                          </div>
                          <button onClick={() => toggleAddLink(folder.name)}
                            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                          >Cancel</button>
                        </div>
                      )}

                      {/* Upload progress */}
                      {folder.uploading && (
                        <div className="border-t border-[#1A1A1A] px-4 py-3">
                          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full animate-pulse w-2/3" />
                          </div>
                          <p className="text-xs text-zinc-500 mt-1.5">Uploading…</p>
                        </div>
                      )}

                      {/* Files list */}
                      {folderFiles.length === 0 && !folder.uploading ? (
                        <div className="border-t border-[#1A1A1A] p-6 text-center">
                          <p className="text-xs text-zinc-600">No files yet</p>
                        </div>
                      ) : (
                        folderFiles.map((file) => (
                          <div key={file.id} className="flex items-center gap-3 p-3 border-t border-[#1A1A1A] hover:bg-[#111111] transition-colors">
                            <span className="text-lg shrink-0">{getFileIcon(file.file_type, file.file_name)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{file.file_name}</p>
                              {file.file_type === 'link' ? (
                                <p className="text-xs text-zinc-600 truncate mt-0.5">{file.file_url}</p>
                              ) : (
                                <p className="text-xs text-zinc-500 mt-0.5">
                                  {file.file_type && <span className="mr-2 uppercase">{file.file_type}</span>}
                                  {file.file_size != null && <span>{(file.file_size / 1024).toFixed(0)} KB</span>}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <a href={file.file_url} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-zinc-400 hover:text-yellow-400 cursor-pointer transition-colors"
                              >View →</a>
                              <button onClick={() => deleteFile(file.id)}
                                className="text-zinc-600 hover:text-red-400 transition-colors cursor-pointer text-xl leading-none"
                              >×</button>
                            </div>
                          </div>
                        ))
                      )}
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="sticky bottom-0 bg-[#0D0D0D] border-t border-[#1A1A1A] px-6 py-4 flex justify-between items-center z-10 mt-8">
        <Link href={`/admin/offers/${offerId}/edit`} className="text-sm text-zinc-400 hover:text-white transition-colors">
          ← Back to Details
        </Link>
        <button
          onClick={() => { showToast('Offer saved ✓'); setTimeout(() => router.push('/admin/offers'), 1000) }}
          className="bg-yellow-400 text-black font-bold h-10 px-6 rounded-lg cursor-pointer hover:brightness-110 transition-all text-sm"
        >
          Finish →
        </button>
      </div>
    </>
  )
}
