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

export interface LookupField {
  key: string
  label: string
  type: 'text' | 'color' | 'emoji'
  placeholder?: string
}

interface LookupManagerProps {
  tableName: string
  title: string
  fields: LookupField[]
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

const inputClass =
  'bg-[#0D0D0D] border border-[#1A1A1A] text-white text-sm rounded-lg px-3 h-9 focus:outline-none focus:border-yellow-400 placeholder:text-zinc-600 w-full'

export default function LookupManager({ tableName, title, fields }: LookupManagerProps) {
  const supabase = createClient()
  const [items, setItems] = useState<LookupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [addForm, setAddForm] = useState<Record<string, string>>({})
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function fetchItems() {
    const { data } = await supabase
      .from(tableName)
      .select('*')
      .order('name')
    setItems((data ?? []) as LookupItem[])
    setLoading(false)
  }

  useEffect(() => {
    fetchItems()
  }, [tableName]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd() {
    const name = addForm['name']?.trim()
    if (!name) {
      setAddError('Name is required')
      return
    }
    setAdding(true)
    setAddError('')

    const payload: Partial<LookupItem> = { active: true }
    for (const f of fields) {
      if (f.key === 'slug') {
        payload.slug = addForm.slug?.trim() || slugify(name)
      } else {
        (payload as Record<string, string | boolean>)[f.key] = addForm[f.key] ?? ''
      }
    }

    const result = await createLookupItem(tableName, payload)
    if (result.error) {
      setAddError(result.error)
    } else {
      setAddForm({})
      await fetchItems()
    }
    setAdding(false)
  }

  function startEdit(item: LookupItem) {
    setEditingId(item.id)
    const form: Record<string, string> = {}
    for (const f of fields) {
      form[f.key] = ((item as unknown) as Record<string, unknown>)[f.key] as string ?? ''
    }
    setEditForm(form)
  }

  async function handleSave(id: string) {
    setSaving(true)
    const payload: Partial<LookupItem> = {}
    for (const f of fields) {
      if (f.key === 'slug') {
        payload.slug = editForm.slug?.trim() || slugify(editForm.name ?? '')
      } else {
        (payload as Record<string, string>)[f.key] = editForm[f.key] ?? ''
      }
    }
    const result = await updateLookupItem(tableName, id, payload)
    if (result.error) {
      setError(result.error)
    } else {
      setEditingId(null)
      await fetchItems()
    }
    setSaving(false)
  }

  async function handleToggle(id: string, active: boolean) {
    await toggleLookupActive(tableName, id, active)
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, active } : i)))
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    const result = await deleteLookupItem(tableName, deleteId)
    if (result.error) {
      setError(result.error)
    } else {
      await fetchItems()
      setDeleteId(null)
    }
    setDeleting(false)
  }

  return (
    <div>
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Add Form */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4 mb-5">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Add New</p>
        <div className="flex gap-3 items-end flex-wrap">
          {fields.map((f) => (
            <div key={f.key} className={f.type === 'color' ? 'w-20' : 'flex-1 min-w-[120px]'}>
              <label className="text-xs text-zinc-600 mb-1 block">{f.label}</label>
              {f.type === 'color' ? (
                <input
                  type="color"
                  value={addForm[f.key] ?? '#ffffff'}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-10 h-9 rounded cursor-pointer border border-[#1A1A1A] bg-transparent"
                />
              ) : (
                <input
                  type="text"
                  value={addForm[f.key] ?? ''}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder ?? f.label}
                  className={inputClass}
                />
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding}
            className="h-9 px-5 bg-yellow-400 text-black font-semibold rounded-lg cursor-pointer hover:brightness-110 transition-all text-sm whitespace-nowrap disabled:opacity-50"
          >
            {adding ? 'Adding...' : 'Add'}
          </button>
        </div>
        {addError && <p className="text-xs text-red-400 mt-2">{addError}</p>}
      </div>

      {/* Table */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#050505]">
              {fields.map((f) => (
                <th key={f.key} className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">
                  {f.label}
                </th>
              ))}
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-center">Active</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-[#1A1A1A]">
                  {Array.from({ length: fields.length + 2 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-zinc-800 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={fields.length + 2} className="px-4 py-8 text-center text-zinc-600 text-sm">
                  No {title.toLowerCase()} yet
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-[#111111] border-b border-[#1A1A1A] last:border-0 transition-colors">
                  {fields.map((f) => (
                    <td key={f.key} className="px-4 py-3 text-sm">
                      {editingId === item.id ? (
                        f.type === 'color' ? (
                          <input
                            type="color"
                            value={editForm[f.key] ?? '#ffffff'}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                            className="w-10 h-8 rounded cursor-pointer border border-[#1A1A1A] bg-transparent"
                          />
                        ) : (
                          <input
                            type="text"
                            value={editForm[f.key] ?? ''}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                            className="bg-[#111111] border border-zinc-700 text-white text-sm rounded px-2 h-7 focus:outline-none focus:border-yellow-400 w-full"
                          />
                        )
                      ) : (
                        <span className="text-zinc-300 flex items-center gap-2">
                          {f.type === 'color' && Boolean(((item as unknown) as Record<string, unknown>)[f.key]) && (
                            <span
                              className="inline-block w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: ((item as unknown) as Record<string, unknown>)[f.key] as string }}
                            />
                          )}
                          {String(((item as unknown) as Record<string, unknown>)[f.key] ?? '—')}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggle(item.id, !item.active)}
                      className={`w-10 h-5 rounded-full transition-colors cursor-pointer relative ${
                        item.active ? 'bg-yellow-400' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          item.active ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === item.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSave(item.id)}
                          disabled={saving}
                          className="text-xs text-yellow-400 hover:text-yellow-300 cursor-pointer transition-colors disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="text-zinc-400 hover:text-white transition-colors text-sm cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(item.id)}
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

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6 w-[340px]">
            <h3 className="text-base font-semibold text-white mb-2">Delete item?</h3>
            <p className="text-sm text-zinc-400 mb-5">This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
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
