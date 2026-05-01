'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'


function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
  return m ? m[1] : null
}

function ytThumb(url: string): string | null {
  const id = extractYouTubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}

function getMediaType(url: string, fileType: string | null): 'youtube' | 'video' | 'image' | 'unknown' {
  if (extractYouTubeId(url)) return 'youtube'
  if (fileType === 'image' || /\.(jpg|jpeg|png|webp|gif)$/i.test(url)) return 'image'
  if (fileType === 'video' || /\.(mp4|mov)$/i.test(url)) return 'video'
  return 'unknown'
}

function fileIcon(type: string | null): string {
  if (type === 'link') return '🔗'
  if (!type) return '📎'
  const t = type.toLowerCase()
  if (['mp4','mov','avi','webm','video'].includes(t)) return '🎬'
  if (['jpg','jpeg','png','webp','gif','image'].includes(t)) return '🖼️'
  if (t === 'pdf') return '📄'
  if (t === 'html') return '🌐'
  if (['doc','docx'].includes(t)) return '📝'
  if (['xls','xlsx','csv'].includes(t)) return '📊'
  if (['zip','rar'].includes(t)) return '🗜️'
  if (['ppt','pptx'].includes(t)) return '📑'
  if (t === 'txt') return '📃'
  return '📎'
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function Toast({ message, type, onHide }: { message: string; type: 'success' | 'error'; onHide: () => void }) {
  useEffect(() => {
    const t = setTimeout(onHide, 4000)
    return () => clearTimeout(t)
  }, [onHide])
  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border max-w-sm cursor-pointer ${
        type === 'success' ? 'bg-green-900/90 border-green-700/60 text-green-300' : 'bg-red-900/90 border-red-700/60 text-red-300'
      }`}
      onClick={onHide}
    >
      {type === 'success' ? '✓' : '✗'} {message}
    </div>
  )
}

interface OfferFile {
  id: string
  offer_id: string
  folder_name: string
  file_name: string
  file_url: string
  file_type: string | null
  file_size: number | null
  created_at: string
}

export default function MaterialsPage() {
  const params   = useParams()
  const id       = params.id as string
  const router   = useRouter()
  const supabase = createClient()

  const vslFileRef      = useRef<HTMLInputElement>(null)
  const creativeFileRef = useRef<HTMLInputElement>(null)
  const folderFileRef   = useRef<HTMLInputElement>(null)

  const [loading, setLoading]   = useState(true)
  const [offerTitle, setOfferTitle] = useState('')
  const [toast, setToast]       = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // ── VSLs ──
  const [vsls,       setVsls]       = useState<OfferFile[]>([])
  const [showVslForm,  setShowVslForm]  = useState(false)
  const [vslName,    setVslName]    = useState('')
  const [vslTab,     setVslTab]     = useState<'url' | 'upload'>('url')
  const [vslUrl,     setVslUrl]     = useState('')
  const [vslFile,    setVslFile]    = useState<File | null>(null)
  const [vslSaving,  setVslSaving]  = useState(false)

  // ── Creatives ──
  const [creatives,        setCreatives]        = useState<OfferFile[]>([])
  const [showCreativeForm, setShowCreativeForm] = useState(false)
  const [cName,    setCName]    = useState('')
  const [cType,    setCType]    = useState('video')
  const [cAngle,   setCAngle]   = useState('')
  const [cTab,     setCTab]     = useState<'url' | 'upload'>('url')
  const [cUrl,     setCUrl]     = useState('')
  const [cFile,    setCFile]    = useState<File | null>(null)
  const [cSaving,  setCSaving]  = useState(false)

  // ── Folders ──
  const [folders,      setFolders]      = useState<string[]>([])
  const [folderFiles,  setFolderFiles]  = useState<OfferFile[]>([])
  const [openFolders,  setOpenFolders]  = useState<Record<string, boolean>>({})
  const [newFolderName, setNewFolderName] = useState('')
  const [activeUploadFolder,  setActiveUploadFolder]  = useState<string | null>(null)
  const [uploadProgress,      setUploadProgress]      = useState('')
  const [activeLinkFolder,    setActiveLinkFolder]    = useState<string | null>(null)
  const [linkName,  setLinkName]  = useState('')
  const [linkUrl,   setLinkUrl]   = useState('')

  // ── Load data ──
  useEffect(() => {
    if (!id) return

    async function load() {
      const [offerRes, filesRes] = await Promise.all([
        supabase.from('offers').select('title').eq('id', id).single(),
        supabase.from('offer_files').select('*').eq('offer_id', id).order('created_at', { ascending: false }),
      ])

      setOfferTitle(offerRes.data?.title ?? '')

      const allFiles = (filesRes.data ?? []) as OfferFile[]
      const vslFiles  = allFiles.filter(f => f.folder_name === '__vsls__')
      const cFiles    = allFiles.filter(f => f.folder_name === '__creatives__')
      const fFiles    = allFiles.filter(f => !['__vsls__', '__creatives__', '__assets__'].includes(f.folder_name))

      setVsls(vslFiles)
      setCreatives(cFiles)
      setFolderFiles(fFiles)

      const uniqueFolders = Array.from(new Set(fFiles.map(f => f.folder_name)))
      setFolders(uniqueFolders)

      setLoading(false)
    }

    load()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── VSL helpers ──
  async function saveVsl() {
    if (!vslName.trim() && !vslUrl && !vslFile) return
    setVslSaving(true)

    let mediaUrl = vslUrl
    let fileSize: number | null = null

    if (vslFile) {
      const path = `${id}/vsls/${Date.now()}-${vslFile.name}`
      const { data: up } = await supabase.storage.from('offer-assets').upload(path, vslFile)
      if (up) {
        const { data: { publicUrl } } = supabase.storage.from('offer-assets').getPublicUrl(up.path)
        mediaUrl = publicUrl
        fileSize = vslFile.size
      }
    }

    if (!mediaUrl) { setVslSaving(false); return }

    const { data: inserted } = await supabase.from('offer_files').insert({
      offer_id:    id,
      folder_name: '__vsls__',
      file_name:   vslName.trim() || 'VSL',
      file_url:    mediaUrl,
      file_type:   'video',
      file_size:   fileSize,
    }).select('*').single()

    if (inserted) setVsls(prev => [inserted as OfferFile, ...prev])

    setVslName(''); setVslUrl(''); setVslFile(null); setVslTab('url')
    setShowVslForm(false)
    setVslSaving(false)
  }

  async function deleteVsl(vslId: string) {
    await supabase.from('offer_files').delete().eq('id', vslId)
    setVsls(vsls.filter(v => v.id !== vslId))
  }

  // ── Creative helpers ──
  async function saveCreative() {
    if (!cUrl && !cFile) return
    setCSaving(true)

    let mediaUrl = cUrl
    let fileSize: number | null = null

    if (cFile) {
      const path = `${id}/creatives/${Date.now()}-${cFile.name}`
      const { data: up } = await supabase.storage.from('offer-assets').upload(path, cFile)
      if (up) {
        const { data: { publicUrl } } = supabase.storage.from('offer-assets').getPublicUrl(up.path)
        mediaUrl = publicUrl
        fileSize = cFile.size
      }
    }

    if (!mediaUrl) { setCSaving(false); return }

    const fileName = `${cName.trim() || 'Creative'}${cAngle.trim() ? ` | ${cAngle.trim()}` : ''}`

    const { data: inserted } = await supabase.from('offer_files').insert({
      offer_id:    id,
      folder_name: '__creatives__',
      file_name:   fileName,
      file_url:    mediaUrl,
      file_type:   cType,
      file_size:   fileSize,
    }).select('*').single()

    if (inserted) setCreatives(prev => [inserted as OfferFile, ...prev])

    setCName(''); setCAngle(''); setCUrl(''); setCFile(null); setCTab('url'); setCType('video')
    setShowCreativeForm(false)
    setCSaving(false)
  }

  async function deleteCreative(cId: string) {
    await supabase.from('offer_files').delete().eq('id', cId)
    setCreatives(creatives.filter(c => c.id !== cId))
  }

  // ── Folder helpers ──
  function toggleFolder(name: string) {
    setOpenFolders(prev => ({ ...prev, [name]: !prev[name] }))
  }

  function createFolder() {
    const name = newFolderName.trim()
    if (!name || folders.includes(name)) return
    setFolders([...folders, name])
    setNewFolderName('')
    setOpenFolders(prev => ({ ...prev, [name]: true }))
  }

  async function handleFolderUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length || !activeUploadFolder) return

    for (let i = 0; i < files.length; i++) {
      setUploadProgress(`Uploading ${i + 1}/${files.length}…`)
      const file = files[i]
      const path = `${id}/${activeUploadFolder}/${Date.now()}-${file.name}`
      const { data: up } = await supabase.storage.from('offer-assets').upload(path, file)
      if (!up) continue
      const { data: { publicUrl } } = supabase.storage.from('offer-assets').getPublicUrl(up.path)
      const { data: inserted } = await supabase.from('offer_files').insert({
        offer_id:    id,
        folder_name: activeUploadFolder,
        file_name:   file.name,
        file_url:    publicUrl,
        file_type:   file.name.split('.').pop() ?? null,
        file_size:   file.size,
      }).select('*').single()
      if (inserted) setFolderFiles(prev => [...prev, inserted as OfferFile])
    }

    setUploadProgress('')
    setActiveUploadFolder(null)
    if (folderFileRef.current) folderFileRef.current.value = ''
  }

  async function saveLink(folderName: string) {
    if (!linkUrl.trim()) return
    const { data: inserted } = await supabase.from('offer_files').insert({
      offer_id:    id,
      folder_name: folderName,
      file_name:   linkName.trim() || linkUrl.trim(),
      file_url:    linkUrl.trim(),
      file_type:   'link',
      file_size:   null,
    }).select('*').single()
    if (inserted) setFolderFiles(prev => [...prev, inserted as OfferFile])
    setLinkName(''); setLinkUrl(''); setActiveLinkFolder(null)
  }

  async function deleteFile(fileId: string) {
    await supabase.from('offer_files').delete().eq('id', fileId)
    setFolderFiles(folderFiles.filter(f => f.id !== fileId))
  }

  async function deleteFolder(folderName: string) {
    if (!confirm(`Delete folder "${folderName}" and all its files?`)) return
    await supabase.from('offer_files').delete().eq('offer_id', id).eq('folder_name', folderName)
    setFolderFiles(folderFiles.filter(f => f.folder_name !== folderName))
    setFolders(folders.filter(f => f !== folderName))
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-zinc-500 text-sm">
        <div className="w-4 h-4 rounded-full border-2 border-zinc-600 border-t-zinc-300 animate-spin" />
        Loading materials…
      </div>
    )
  }

  const vslYtId = extractYouTubeId(vslUrl)

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}

      {/* Hidden inputs */}
      <input ref={vslFileRef} type="file" accept=".mp4,.mov" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) setVslFile(f) }}
      />
      <input ref={creativeFileRef} type="file" accept=".mp4,.mov,.jpg,.jpeg,.png,.webp,.gif" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) setCFile(f) }}
      />
      <input ref={folderFileRef} type="file" multiple className="hidden"
        accept=".mp4,.mov,.jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.txt,.html,.zip,.rar,.csv,.xlsx,.pptx"
        onChange={handleFolderUpload}
      />

      <div className="p-8">
        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-6 max-w-3xl mx-auto">
          <div
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => router.push(`/admin/offers/${id}/edit`)}
          >
            <div className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm">✓</div>
            <span className="text-sm text-zinc-400 ml-2">Details</span>
          </div>
          <div className="flex-1 h-px bg-zinc-700" />
          <div className="flex items-center">
            <div className="bg-yellow-400 text-black text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0">2</div>
            <span className="text-sm font-medium text-white ml-2">Materials</span>
          </div>
        </div>

        {offerTitle && (
          <p className="text-zinc-500 text-sm mb-6 max-w-3xl mx-auto truncate">{offerTitle}</p>
        )}

        <div className="max-w-3xl mx-auto space-y-4">

          {/* ── Section 1: VSLs ── */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-white">▶️ VSLs</h2>
              <button
                onClick={() => setShowVslForm(true)}
                className="bg-yellow-400 text-black text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer hover:brightness-110 transition-all"
              >
                ＋ Add VSL
              </button>
            </div>

            {/* Add VSL form */}
            {showVslForm && (
              <div className="bg-[#111] border border-[#1C1C1C] rounded-xl p-4 mb-4">
                <div className="mb-3">
                  <label className="block text-xs text-zinc-500 mb-1.5">VSL Name</label>
                  <input type="text" value={vslName} onChange={(e) => setVslName(e.target.value)}
                    placeholder="Ex: VSL Principal, VSL Curta, VSL Variante B..."
                    className="bg-[#0D0D0D] border border-[#1C1C1C] text-white h-10 rounded-lg px-3 text-sm w-full focus:outline-none focus:border-yellow-400/50 placeholder:text-zinc-600"
                  />
                </div>
                <div className="flex gap-1 mb-3">
                  {(['url', 'upload'] as const).map((tab) => (
                    <button key={tab} onClick={() => setVslTab(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${vslTab === tab ? 'bg-yellow-400 text-black' : 'text-zinc-400 hover:text-white'}`}
                    >{tab === 'url' ? 'URL' : 'Upload'}</button>
                  ))}
                </div>
                {vslTab === 'url' ? (
                  <div className="mb-3">
                    <input type="url" value={vslUrl} onChange={(e) => setVslUrl(e.target.value)}
                      placeholder="YouTube, Vimeo or direct .mp4 URL"
                      className="bg-[#0D0D0D] border border-[#1C1C1C] text-white h-10 rounded-lg px-3 text-sm w-full focus:outline-none focus:border-yellow-400/50 placeholder:text-zinc-600"
                    />
                    {vslYtId && (
                      <div className="mt-2 rounded-lg overflow-hidden h-32">
                        <iframe src={`https://www.youtube.com/embed/${vslYtId}`} className="w-full h-full" allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-3">
                    <button onClick={() => vslFileRef.current?.click()}
                      className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-zinc-700 transition-colors"
                    >
                      {vslFile ? `✓ ${vslFile.name} (${formatSize(vslFile.size)})` : 'Choose .mp4 / .mov'}
                    </button>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setShowVslForm(false); setVslName(''); setVslUrl(''); setVslFile(null) }}
                    className="px-4 h-9 text-sm rounded-lg border border-zinc-700 text-zinc-400 hover:text-white cursor-pointer transition-all"
                  >Cancel</button>
                  <button onClick={saveVsl} disabled={vslSaving}
                    className="px-4 h-9 text-sm rounded-lg bg-yellow-400 text-black font-semibold cursor-pointer hover:brightness-110 disabled:opacity-50 transition-all"
                  >{vslSaving ? 'Saving…' : 'Save VSL'}</button>
                </div>
              </div>
            )}

            {/* VSL list */}
            {vsls.length === 0 && !showVslForm && (
              <p className="text-sm text-zinc-600 py-4 text-center">No VSLs yet. Add the first one.</p>
            )}
            {vsls.map((vsl) => {
              const thumb   = ytThumb(vsl.file_url)
              const isVideo = /\.(mp4|mov)$/i.test(vsl.file_url)
              return (
                <div key={vsl.id} className="bg-[#111] border border-zinc-800 rounded-xl overflow-hidden mb-3 flex gap-3 p-3 items-start">
                  {/* Preview */}
                  <div className="w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-900 flex items-center justify-center">
                    {thumb ? (
                      <img src={thumb} alt={vsl.file_name} className="w-full h-full object-cover" />
                    ) : isVideo ? (
                      <video src={vsl.file_url} muted className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">▶️</span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{vsl.file_name}</p>
                    <p className="text-xs text-zinc-500 mt-1 truncate">{vsl.file_url}</p>
                    <div className="flex gap-3 mt-2">
                      <button onClick={() => window.open(vsl.file_url, '_blank')}
                        className="text-xs text-zinc-400 hover:text-yellow-400 cursor-pointer transition-colors"
                      >▶ View</button>
                      <button onClick={() => deleteVsl(vsl.id)}
                        className="text-xs text-zinc-600 hover:text-red-400 cursor-pointer transition-colors"
                      >× Delete</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Section 2: Creatives ── */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-white">🎬 Creatives</h2>
              <button
                onClick={() => setShowCreativeForm(true)}
                className="bg-yellow-400 text-black text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer hover:brightness-110 transition-all"
              >
                ＋ Add Creative
              </button>
            </div>

            {/* Add Creative form */}
            {showCreativeForm && (
              <div className="bg-[#111] border border-[#1C1C1C] rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Creative Name</label>
                    <input type="text" value={cName} onChange={(e) => setCName(e.target.value)}
                      placeholder="Ex: Creative 01, Hook Video..."
                      className="bg-[#0D0D0D] border border-[#1C1C1C] text-white h-10 rounded-lg px-3 text-sm w-full focus:outline-none focus:border-yellow-400/50 placeholder:text-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Type</label>
                    <select value={cType} onChange={(e) => setCType(e.target.value)}
                      className="bg-[#0D0D0D] border border-[#1C1C1C] text-white h-10 rounded-lg px-3 text-sm w-full focus:outline-none focus:border-yellow-400/50 cursor-pointer"
                    >
                      <option value="video">Video</option>
                      <option value="image">Image</option>
                      <option value="gif">GIF</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-xs text-zinc-500 mb-1.5">Angle / Hook</label>
                  <input type="text" value={cAngle} onChange={(e) => setCAngle(e.target.value)}
                    placeholder="Ex: Pain point, Social proof, Curiosity gap..."
                    className="bg-[#0D0D0D] border border-[#1C1C1C] text-white h-10 rounded-lg px-3 text-sm w-full focus:outline-none focus:border-yellow-400/50 placeholder:text-zinc-600"
                  />
                </div>
                <div className="flex gap-1 mb-3">
                  {(['url', 'upload'] as const).map((tab) => (
                    <button key={tab} onClick={() => setCTab(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${cTab === tab ? 'bg-yellow-400 text-black' : 'text-zinc-400 hover:text-white'}`}
                    >{tab === 'url' ? 'URL' : 'Upload'}</button>
                  ))}
                </div>
                {cTab === 'url' ? (
                  <div className="mb-3">
                    <input type="url" value={cUrl} onChange={(e) => setCUrl(e.target.value)}
                      placeholder="YouTube, Vimeo or direct video/image URL"
                      className="bg-[#0D0D0D] border border-[#1C1C1C] text-white h-10 rounded-lg px-3 text-sm w-full focus:outline-none focus:border-yellow-400/50 placeholder:text-zinc-600"
                    />
                  </div>
                ) : (
                  <div className="mb-3">
                    <button onClick={() => creativeFileRef.current?.click()}
                      className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-zinc-700 transition-colors"
                    >
                      {cFile ? `✓ ${cFile.name}` : 'Choose image or video'}
                    </button>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setShowCreativeForm(false); setCName(''); setCAngle(''); setCUrl(''); setCFile(null) }}
                    className="px-4 h-9 text-sm rounded-lg border border-zinc-700 text-zinc-400 hover:text-white cursor-pointer transition-all"
                  >Cancel</button>
                  <button onClick={saveCreative} disabled={cSaving}
                    className="px-4 h-9 text-sm rounded-lg bg-yellow-400 text-black font-semibold cursor-pointer hover:brightness-110 disabled:opacity-50 transition-all"
                  >{cSaving ? 'Saving…' : 'Save Creative'}</button>
                </div>
              </div>
            )}

            {/* Creatives grid */}
            {creatives.length === 0 && !showCreativeForm && (
              <p className="text-sm text-zinc-600 py-4 text-center">No creatives yet. Add the first one.</p>
            )}
            {creatives.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {creatives.map((c) => {
                  const parts  = c.file_name.split(' | ')
                  const cname  = parts[0] || 'Creative'
                  const cangle = parts[1] || ''
                  const mtype  = getMediaType(c.file_url, c.file_type)
                  const thumb  = mtype === 'youtube' ? ytThumb(c.file_url) : null
                  return (
                    <div key={c.id} className="bg-[#111] border border-zinc-800 rounded-xl overflow-hidden">
                      {/* Preview h-32 */}
                      <div className="h-32 bg-zinc-900 relative flex items-center justify-center">
                        {mtype === 'youtube' && thumb ? (
                          <>
                            <img src={thumb} alt={cname} className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <span className="text-2xl">▶️</span>
                            </div>
                          </>
                        ) : mtype === 'video' ? (
                          <>
                            <video src={c.file_url} muted className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <span className="text-2xl">▶️</span>
                            </div>
                          </>
                        ) : mtype === 'image' ? (
                          <img src={c.file_url} alt={cname} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl">🎬</span>
                        )}
                      </div>
                      {/* Info */}
                      <div className="p-3">
                        <p className="text-sm font-semibold text-white truncate">{cname}</p>
                        {cangle && <p className="text-xs text-zinc-500 truncate mt-0.5">{cangle}</p>}
                        <span className="inline-block text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded mt-1">{c.file_type ?? 'media'}</span>
                        <div className="flex gap-3 mt-2">
                          <button onClick={() => window.open(c.file_url, '_blank')}
                            className="text-xs text-zinc-400 hover:text-yellow-400 cursor-pointer transition-colors"
                          >View →</button>
                          <button onClick={() => deleteCreative(c.id)}
                            className="text-xs text-zinc-600 hover:text-red-400 cursor-pointer transition-colors"
                          >×</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Section 3: Folders ── */}
          <div>
            {/* Create folder row */}
            <div className="flex gap-3 mb-4">
              <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') createFolder() }}
                placeholder="Folder name (ex: Ads, Scripts, Pages...)"
                className="bg-[#0D0D0D] border border-[#1A1A1A] text-white h-11 rounded-lg px-4 text-sm flex-1 focus:outline-none focus:border-yellow-400/50 placeholder:text-zinc-600 transition-colors"
              />
              <button onClick={createFolder}
                className="bg-yellow-400 text-black font-semibold text-sm h-11 px-5 rounded-lg cursor-pointer hover:brightness-110 transition-all shrink-0"
              >Create Folder</button>
            </div>

            {/* Empty state */}
            {folders.length === 0 && (
              <p className="text-zinc-600 text-sm text-center py-8">
                No folders yet. Create your first folder above.
              </p>
            )}

            {/* Folder cards */}
            {folders.map((folderName) => {
              const files   = folderFiles.filter(f => f.folder_name === folderName)
              const isOpen  = !!openFolders[folderName]
              return (
                <div key={folderName} className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl mb-3 overflow-hidden">
                  {/* Folder header */}
                  <div className="flex justify-between items-center p-4 cursor-pointer" onClick={() => toggleFolder(folderName)}>
                    <div className="flex items-center gap-2">
                      <span className={`text-zinc-400 text-xs transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                      <span className="text-base">📁</span>
                      <span className="text-sm font-medium text-white">{folderName}</span>
                      <span className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">{files.length}</span>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setActiveUploadFolder(folderName)
                          setTimeout(() => folderFileRef.current?.click(), 50)
                        }}
                        className="text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                      >↑ Upload{activeUploadFolder === folderName && uploadProgress ? ` ${uploadProgress}` : ''}</button>
                      <button
                        onClick={() => {
                          setActiveLinkFolder(folderName)
                          setOpenFolders(prev => ({ ...prev, [folderName]: true }))
                        }}
                        className="text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                      >🔗 Link</button>
                      <button
                        onClick={() => deleteFolder(folderName)}
                        className="text-xs text-zinc-600 hover:text-red-400 bg-zinc-800 hover:bg-zinc-900 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                      >🗑</button>
                    </div>
                  </div>

                  {/* Folder contents */}
                  {isOpen && (
                    <div className="border-t border-[#1A1A1A] px-4 pb-3">
                      {/* Add link form */}
                      {activeLinkFolder === folderName && (
                        <div className="flex gap-2 items-center py-3 border-b border-[#1A1A1A] mb-2">
                          <input type="text" value={linkName} onChange={(e) => setLinkName(e.target.value)}
                            placeholder="Link name"
                            className="bg-[#111] border border-[#1C1C1C] text-white h-9 rounded-md px-3 text-sm flex-[35] focus:outline-none focus:border-yellow-400/50 placeholder:text-zinc-600"
                          />
                          <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="https://..."
                            className="bg-[#111] border border-[#1C1C1C] text-white h-9 rounded-md px-3 text-sm flex-[50] focus:outline-none focus:border-yellow-400/50 placeholder:text-zinc-600"
                          />
                          <button onClick={() => saveLink(folderName)}
                            className="text-xs bg-yellow-400 text-black font-semibold h-9 px-3 rounded-md cursor-pointer hover:brightness-110 shrink-0"
                          >Save</button>
                          <button onClick={() => { setActiveLinkFolder(null); setLinkName(''); setLinkUrl('') }}
                            className="text-zinc-600 hover:text-red-400 cursor-pointer text-lg leading-none shrink-0"
                          >×</button>
                        </div>
                      )}

                      {files.length === 0 ? (
                        <p className="text-xs text-zinc-700 py-3 text-center">Empty folder. Upload files or add a link.</p>
                      ) : (
                        <div className="space-y-1 pt-2">
                          {files.map((f) => (
                            <div key={f.id} className="flex items-center gap-3 py-2 hover:bg-zinc-900/50 rounded-lg px-2 transition-colors group">
                              <span className="text-base shrink-0">{fileIcon(f.file_type)}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{f.file_name}</p>
                                {f.file_size && <p className="text-xs text-zinc-600">{formatSize(f.file_size)}</p>}
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button onClick={() => window.open(f.file_url, '_blank')}
                                  className="text-xs text-zinc-400 hover:text-yellow-400 cursor-pointer transition-colors"
                                >View</button>
                                <button onClick={() => deleteFile(f.id)}
                                  className="text-zinc-600 hover:text-red-400 cursor-pointer text-lg leading-none transition-colors"
                                >×</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="sticky bottom-0 bg-[#0D0D0D] border-t border-[#1A1A1A] px-6 py-4 flex justify-between items-center z-10">
        <button
          onClick={() => router.push(`/admin/offers/${id}/edit`)}
          className="text-zinc-400 hover:text-white cursor-pointer text-sm transition-colors"
        >
          ← Back to Details
        </button>
        <button
          onClick={() => {
            setToast({ message: 'Offer saved ✓', type: 'success' })
            setTimeout(() => router.push('/admin/offers'), 1200)
          }}
          className="bg-yellow-400 text-black font-bold h-10 px-6 rounded-lg cursor-pointer hover:brightness-110 transition-all text-sm"
        >
          Finish →
        </button>
      </div>
    </>
  )
}
