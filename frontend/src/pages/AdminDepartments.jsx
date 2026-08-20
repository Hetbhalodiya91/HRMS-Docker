import { useState, useEffect } from 'react'
import { departmentAPI } from '../services/api'
import toast from 'react-hot-toast'
import { Building2, Loader, Plus, Edit3, Trash2, X, Check, Users } from 'lucide-react'

function DeptModal({ dept, onClose, onDone }) {
  const [form, setForm] = useState({ name: dept?.name || '', description: dept?.description || '' })
  const [loading, setLoading] = useState(false)

  const save = async () => {
    setLoading(true)
    try {
      if (dept) await departmentAPI.update(dept.id, form)
      else await departmentAPI.create(form)
      toast.success(`Department ${dept ? 'updated' : 'created'}`)
      onDone()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{dept ? 'Edit' : 'New'} Department</h3>
          <button onClick={onClose}><X size={20} className="text-gray-500" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input-field mt-1" placeholder="e.g. Engineering" required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} className="input-field mt-1 resize-none" placeholder="Optional..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={save} disabled={loading || !form.name}
              className="btn-primary flex items-center gap-2 flex-1 justify-center">
              {loading ? <Loader size={16} className="animate-spin" /> : <Check size={16} />}
              {dept ? 'Update' : 'Create'}
            </button>
            <button onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'new' | {dept object}

  const fetch = () => {
    setLoading(true)
    departmentAPI.getAll()
      .then(res => setDepartments(res.data.data || []))
      .catch(() => toast.error('Failed to load departments'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const deleteDept = async dept => {
    if (!confirm(`Delete "${dept.name}"? This cannot be undone.`)) return
    try {
      await departmentAPI.delete(dept.id)
      toast.success('Department deleted')
      fetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete')
    }
  }

  return (
    <div className="space-y-6">
      {modal !== null && (
        <DeptModal dept={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); fetch() }} />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 size={26} className="text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
            <p className="text-gray-500 text-sm">Manage organization departments</p>
          </div>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Department
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader size={24} className="animate-spin text-primary-600" /></div>
      ) : departments.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <Building2 size={40} className="mx-auto mb-2 opacity-40" />
          <p>No departments yet</p>
          <button onClick={() => setModal('new')} className="text-primary-600 text-sm mt-2 hover:underline">
            Create your first department →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map(dept => (
            <div key={dept.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Building2 size={20} className="text-primary-600" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setModal(dept)}
                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded">
                    <Edit3 size={15} />
                  </button>
                  <button onClick={() => deleteDept(dept)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-800">{dept.name}</h3>
              {dept.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{dept.description}</p>}
              <div className="flex items-center gap-1.5 mt-3 text-sm text-gray-500">
                <Users size={14} />
                <span>{dept.totalEmployees} employee{dept.totalEmployees !== 1 ? 's' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
