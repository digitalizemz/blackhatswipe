'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  createLookupItem,
  updateLookupItem,
  deleteLookupItem,
  toggleLookupActive,
  type LookupItem,
} from '@/app/actions/admin'

const slugify = (s: string) =>
  s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

const inputClass =
  'bg-[#0D0D0D] border border-[#1A1A1A] text-white text-sm rounded-lg px-3 h-9 focus:outline-none focus:border-yellow-400 placeholder:text-zinc-600'

export default function AdminNichesPage() {
  const supabase = createClient()

  const [niches, setNiches] = useState<LookupItem[]>([])
  const [subNiches, setSubNiches] = useState<LookupItem[]>([])
  const [selectedNicheId, setSelectedNicheId] = useState<string | null>(null)
  const [loadingNiches, setLoadingNiches] = useState(true)
  const [loadingSubNiches, setLoadingSubNiches] = useState(false)

  // Add niche form
  const [newNicheName, setNewNicheName] = useState('')
  const [newNicheColor, setNewNicheColor] = useState('#ffffff')
  const [addingNiche, setAddingNiche] = useState(false)
  const [addNicheError, setAddNicheError] = useState('')

  // Add sub-niche form
  const [newSubNicheName, setNewSubNicheName] = useState('')
  const [addingSubNiche, setAddingSubNiche] = useState(false)
  const [addSubNicheError, setAddSubNicheError] = useState('')

  // Edit states
  const [editingNicheId, setEditingNicheId] = useState<string | null>(null)
  const [editNicheName, setEditNicheName] = useState('')
  const [editNicheColor, setEditNicheColor] = useState('#ffffff')
  const [editingSubNicheId, setEditingSubNicheId] = useState<string | null>(null)
  const [editSubNicheName, setEditSubNicheName] = useState('')

  // Delete states
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'niche' | 'subniche' } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [error, setError] = useState('')

  async function fetchNiches() {
    const { data } = await supabase.from('niches').select('*').order('name')
    setNiches((data ?? []) as LookupItem[])
    setLoadingNiches(false)
  }

  async function fetchSubNiches(nicheId: string) {
    setLoadingSubNiches(true)
    const { data } = await supabase
      .from('sub_niches')
      .select('*')
      .eq('niche_id', nicheId)
      .order('name')
    setSubNiches((data ?? []) as LookupItem[])
    setLoadingSubNiches(false)
  }

  useEffect(() => {
    fetchNiches()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedNicheId) {
      fetchSubNiches(selectedNicheId)
    } else {
      setSubNiches([])
    }
  }, [selectedNicheId]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedNiche = niches.find((n) => n.id === selectedNicheId)

  async function handleAddNiche() {
    if (!newNicheName.trim()) {
      setAddNicheError('Name is required')
      return
    }
    setAddingNiche(true)
    setAddNicheError('')
    const result = await createLookupItem('niches', {
      name: newNicheName.trim(),
      slug: slugify(newNicheName.trim()),
      color: newNicheColor,
      active: true,
    })
    if (result.error) {
      setAddNicheError(result.error)
    } else {
      setNewNicheName('')
      setNewNicheColor('#ffffff')
      await fetchNiches()
    }
    setAddingNiche(false)
  }

  async function handleSaveNiche(id: string) {
    const result = await updateLookupItem('niches', id, {
      name: editNicheName.trim(),
      slug: slugify(editNicheName.trim()),
      color: editNicheColor,
    })
    if (result.error) {
      setError(result.error)
    } else {
      setEditingNicheId(null)
      await fetchNiches()
    }
  }

  async function handleAddSubNiche() {
    if (!newSubNicheName.trim() || !selectedNicheId) return
    setAddingSubNiche(true)
    setAddSubNicheError('')
    const result = await createLookupItem('sub_niches', {
      name: newSubNicheName.trim(),
      slug: slugify(newSubNicheName.trim()),
      niche_id: selectedNicheId,
      active: true,
    })
    if (result.error) {
      setAddSubNicheError(result.error)
    } else {
      setNewSubNicheName('')
      await fetchSubNiches(selectedNicheId)
    }
    setAddingSubNiche(false)
  }

  async function handleSaveSubNiche(id: string) {
    const result = await updateLookupItem('sub_niches', id, {
      name: editSubNicheName.trim(),
      slug: slugify(editSubNicheName.trim()),
    })
    if (result.error) {
      setError(result.error)
    } else {
      setEditingSubNicheId(null)
      if (selectedNicheId) await fetchSubNiches(selectedNicheId)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const table = deleteTarget.type === 'niche' ? 'niches' : 'sub_niches'
    const result = await deleteLookupItem(table, deleteTarget.id)
    if (result.error) {
      setError(result.error)
    } else {
      if (deleteTarget.type === 'niche') {
        if (selectedNicheId === deleteTarget.id) setSelectedNicheId(null)
        await fetchNiches()
      } else if (selectedNicheId) {
        await fetchSubNiches(selectedNicheId)
      }
      setDeleteTarget(null)
    }
    setDeleting(false)
  }

  async function handleToggleNiche(id: string, active: boolean) {
    await toggleLookupActive('niches', id, active)
    setNiches((prev) => prev.map((n) => (n.id === id ? { ...n, active } : n)))
  }

  async function handleToggleSubNiche(id: string, active: boolean) {
    await toggleLookupActive('sub_niches', id, active)
    setSubNiches((prev) => prev.map((s) => (s.id === id ? { ...s, active } : s)))
  }

  return (
    <div className="p-8">
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Niches section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-5">
          <h1 className="text-2xl font-bold text-white">Niches</h1>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
            {niches.length}
          </span>
        </div>

        {/* Add niche form */}
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4 mb-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Add Niche</p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs text-zinc-600 mb-1 block">Name</label>
              <input
                type="text"
                value={newNicheName}
                onChange={(e) => setNewNicheName(e.target.value)}
                placeholder="e.g. Health"
                className={`${inputClass} w-full`}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNiche()}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-600 mb-1 block">Color</label>
              <input
                type="color"
                value={newNicheColor}
                onChange={(e) => setNewNicheColor(e.target.value)}
                className="w-10 h-9 rounded cursor-pointer border border-[#1A1A1A] bg-transparent"
              />
            </div>
            <button
              type="button"
              onClick={handleAddNiche}
              disabled={addingNiche}
              className="h-9 px-5 bg-yellow-400 text-black font-semibold rounded-lg cursor-pointer hover:brightness-110 transition-all text-sm whitespace-nowrap disabled:opacity-50"
            >
              {addingNiche ? 'Adding...' : 'Add'}
            </button>
          </div>
          {addNicheError && <p className="text-xs text-red-400 mt-2">{addNicheError}</p>}
        </div>

        {/* Niches table */}
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#050505]">
                <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Name</th>
                <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Slug</th>
                <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Color</th>
                <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-center">Active</th>
                <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingNiches ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#1A1A1A]">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-zinc-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : niches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-600 text-sm">
                    No niches yet
                  </td>
                </tr>
              ) : (
                niches.map((niche) => (
                  <tr
                    key={niche.id}
                    className={`hover:bg-[#111111] border-b border-[#1A1A1A] last:border-0 transition-colors ${
                      selectedNicheId === niche.id ? 'bg-yellow-400/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-sm">
                      {editingNicheId === niche.id ? (
                        <input
                          type="text"
                          value={editNicheName}
                          onChange={(e) => setEditNicheName(e.target.value)}
                          className="bg-[#111111] border border-zinc-700 text-white text-sm rounded px-2 h-7 focus:outline-none focus:border-yellow-400"
                        />
                      ) : (
                        <span className="text-zinc-300">{niche.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500">{niche.slug ?? '—'}</td>
                    <td className="px-4 py-3">
                      {editingNicheId === niche.id ? (
                        <input
                          type="color"
                          value={editNicheColor}
                          onChange={(e) => setEditNicheColor(e.target.value)}
                          className="w-8 h-7 rounded cursor-pointer border border-[#1A1A1A] bg-transparent"
                        />
                      ) : (
                        <span className="flex items-center gap-2">
                          {niche.color && (
                            <span
                              className="inline-block w-3 h-3 rounded-full"
                              style={{ backgroundColor: niche.color }}
                            />
                          )}
                          <span className="text-zinc-500 text-xs">{niche.color ?? '—'}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleNiche(niche.id, !niche.active)}
                        className={`w-10 h-5 rounded-full transition-colors cursor-pointer relative ${
                          niche.active ? 'bg-yellow-400' : 'bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                            niche.active ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editingNicheId === niche.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSaveNiche(niche.id)}
                            className="text-xs text-yellow-400 hover:text-yellow-300 cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingNicheId(null)}
                            className="text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingNicheId(niche.id)
                              setEditNicheName(niche.name)
                              setEditNicheColor(niche.color ?? '#ffffff')
                            }}
                            className="text-zinc-400 hover:text-white transition-colors text-sm cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setSelectedNicheId(niche.id === selectedNicheId ? null : niche.id)}
                            className={`text-sm cursor-pointer transition-colors ${
                              selectedNicheId === niche.id
                                ? 'text-yellow-400 hover:text-yellow-300'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            Sub-niches →
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ id: niche.id, type: 'niche' })}
                            className="text-red-400 hover:text-red-300 transition-colors text-sm cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sub-niches section */}
      {selectedNicheId && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-xl font-bold text-white">
              Sub-niches of: <span className="text-yellow-400">{selectedNiche?.name}</span>
            </h2>
            <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
              {subNiches.length}
            </span>
            <button
              onClick={() => setSelectedNicheId(null)}
              className="ml-auto text-sm text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors"
            >
              ✕ Close
            </button>
          </div>

          {/* Add sub-niche form */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4 mb-5">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Add Sub-Niche</p>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-zinc-600 mb-1 block">Name</label>
                <input
                  type="text"
                  value={newSubNicheName}
                  onChange={(e) => setNewSubNicheName(e.target.value)}
                  placeholder="e.g. Weight Loss"
                  className={`${inputClass} w-full`}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubNiche()}
                />
              </div>
              <button
                type="button"
                onClick={handleAddSubNiche}
                disabled={addingSubNiche}
                className="h-9 px-5 bg-yellow-400 text-black font-semibold rounded-lg cursor-pointer hover:brightness-110 transition-all text-sm whitespace-nowrap disabled:opacity-50"
              >
                {addingSubNiche ? 'Adding...' : 'Add'}
              </button>
            </div>
            {addSubNicheError && <p className="text-xs text-red-400 mt-2">{addSubNicheError}</p>}
          </div>

          {/* Sub-niches table */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#050505]">
                  <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Name</th>
                  <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Slug</th>
                  <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-center">Active</th>
                  <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingSubNiches ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#1A1A1A]">
                      {Array.from({ length: 4 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-zinc-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : subNiches.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-zinc-600 text-sm">
                      No sub-niches yet for {selectedNiche?.name}
                    </td>
                  </tr>
                ) : (
                  subNiches.map((sub) => (
                    <tr key={sub.id} className="hover:bg-[#111111] border-b border-[#1A1A1A] last:border-0 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        {editingSubNicheId === sub.id ? (
                          <input
                            type="text"
                            value={editSubNicheName}
                            onChange={(e) => setEditSubNicheName(e.target.value)}
                            className="bg-[#111111] border border-zinc-700 text-white text-sm rounded px-2 h-7 focus:outline-none focus:border-yellow-400"
                          />
                        ) : (
                          <span className="text-zinc-300">{sub.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-500">{sub.slug ?? '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSubNiche(sub.id, !sub.active)}
                          className={`w-10 h-5 rounded-full transition-colors cursor-pointer relative ${
                            sub.active ? 'bg-yellow-400' : 'bg-zinc-700'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                              sub.active ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editingSubNicheId === sub.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSaveSubNiche(sub.id)}
                              className="text-xs text-yellow-400 hover:text-yellow-300 cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingSubNicheId(null)}
                              className="text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingSubNicheId(sub.id)
                                setEditSubNicheName(sub.name)
                              }}
                              className="text-zinc-400 hover:text-white transition-colors text-sm cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ id: sub.id, type: 'subniche' })}
                              className="text-red-400 hover:text-red-300 transition-colors text-sm cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6 w-[340px]">
            <h3 className="text-base font-semibold text-white mb-2">Delete item?</h3>
            <p className="text-sm text-zinc-400 mb-5">This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm rounded-lg border border-[#1A1A1A] text-zinc-400 hover:text-white cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-50 cursor-pointer transition-all"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
