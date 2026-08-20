import { useState, useEffect, useCallback } from 'react'
import { userAPI, departmentAPI } from '../services/api'
import toast from 'react-hot-toast'
import { Users, Loader, Search, UserCheck, UserX, Edit3, X, Check } from 'lucide-react'

function EditModal({ user, departments, onClose, onDone }) {
  const [form, setForm] = useState({
    name: user.name,
    departmentId: user.departmentId || '',
    roles: [...(user.roles || [])]
  })
  const [loading, setLoading] = useState(false)
  const ROLES = ['ADMIN', 'MANAGER', 'EMPLOYEE']

  const toggleRole = role => {
    setForm(f => ({
      ...f,
      roles: f.roles.includes(role) ? f.roles.filter(r => r !== role) : [...f.roles, role]
    }))
  }

  const save = async () => {
    setLoading(true)
    try {
      await userAPI.updateUser(user.id, { ...form, departmentId: form.departmentId || undefined })
      toast.success('User updated')
      onDone()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Edit User</h3>
          <button onClick={onClose}><X size={20} className="text-gray-500" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input-field mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Department</label>
            <select value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}
              className="input-field mt-1">
              <option value="">No Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Roles</label>
            <div className="flex gap-2">
              {ROLES.map(role => (
                <button key={role} onClick={() => toggleRole(role)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                    ${form.roles.includes(role) ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300'}`}>
                  {role}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={save} disabled={loading}
              className="btn-primary flex items-center gap-2 flex-1 justify-center">
              {loading ? <Loader size={16} className="animate-spin" /> : <Check size={16} />}
              Save Changes
            </button>
            <button onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsers() {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    departmentAPI.getAll().then(res => setDepartments(res.data.data || [])).catch(() => {})
  }, [])

  const fetch = useCallback((p = 0, s = search) => {
    setLoading(true)
    userAPI.getAllUsers({ page: p, size: 10, search: s || undefined, sortBy: 'name' })
      .then(res => { setData(res.data.data); setPage(p) })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => { fetch(0) }, [])

  const toggleActive = async (user) => {
    try {
      if (user.active) await userAPI.disableUser(user.id)
      else await userAPI.enableUser(user.id)
      toast.success(`User ${user.active ? 'disabled' : 'enabled'}`)
      fetch(page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    }
  }

  return (
    <div className="space-y-6">
      {editing && <EditModal user={editing} departments={departments}
        onClose={() => setEditing(null)} onDone={() => { setEditing(null); fetch(page) }} />}

      <div className="flex items-center gap-3">
        <Users size={26} className="text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm">Manage all employees in the system</p>
        </div>
      </div>

      <div className="card">
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetch(0)}
              placeholder="Search by name or email..."
              className="input-field pl-9 text-sm" />
          </div>
          <button onClick={() => fetch(0)} className="btn-primary px-4">Search</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader size={24} className="animate-spin text-primary-600" /></div>
        ) : !data?.content?.length ? (
          <div className="text-center py-12 text-gray-400">
            <Users size={40} className="mx-auto mb-2 opacity-40" /><p>No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b text-xs uppercase tracking-wide">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Roles</th>
                    <th className="pb-3">Department</th>
                    <th className="pb-3">Verified</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.content.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="py-3 font-medium">{u.name}</td>
                      <td className="py-3 text-gray-600">{u.email}</td>
                      <td className="py-3">
                        <div className="flex gap-1 flex-wrap">
                          {u.roles?.map(r => (
                            <span key={r} className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 text-gray-600">{u.departmentName || '—'}</td>
                      <td className="py-3">
                        <span className={`text-xs font-medium ${u.enabled ? 'text-green-600' : 'text-yellow-600'}`}>
                          {u.enabled ? '✓ Yes' : '✗ No'}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`text-xs font-medium ${u.active ? 'text-green-600' : 'text-red-600'}`}>
                          {u.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setEditing(u)}
                            className="p-1.5 text-primary-600 hover:bg-primary-50 rounded" title="Edit">
                            <Edit3 size={15} />
                          </button>
                          <button onClick={() => toggleActive(u)}
                            className={`p-1.5 rounded ${u.active ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                            title={u.active ? 'Disable' : 'Enable'}>
                            {u.active ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">Page {page + 1} of {data.totalPages} ({data.totalElements} users)</p>
                <div className="flex gap-2">
                  <button disabled={page === 0} onClick={() => fetch(page - 1)}
                    className="btn-secondary text-sm px-3 py-1 disabled:opacity-40">Prev</button>
                  <button disabled={page >= data.totalPages - 1} onClick={() => fetch(page + 1)}
                    className="btn-secondary text-sm px-3 py-1 disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
