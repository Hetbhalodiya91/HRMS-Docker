import { useState, useEffect } from 'react'
import { leaveAPI } from '../services/api'
import toast from 'react-hot-toast'
import { CheckSquare, Loader, Check, X } from 'lucide-react'

const getBadge = status => {
  const map = { PENDING: 'badge-pending', APPROVED: 'badge-approved', REJECTED: 'badge-rejected', CANCELLED: 'badge-cancelled' }
  return <span className={map[status] || 'badge-pending'}>{status}</span>
}

function ReviewModal({ leave, onClose, onDone }) {
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const decide = async decision => {
    setLoading(true)
    try {
      await leaveAPI.reviewLeave(leave.id, { decision, comment })
      toast.success(`Leave ${decision.toLowerCase()} successfully`)
      onDone()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Review Leave Request</h3>
        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm">
          <div><span className="text-gray-500">Employee:</span> <strong>{leave.appliedByName}</strong></div>
          <div><span className="text-gray-500">Type:</span> {leave.leaveType}</div>
          <div><span className="text-gray-500">Period:</span> {leave.startDate} → {leave.endDate} ({leave.totalDays} days)</div>
          <div><span className="text-gray-500">Reason:</span> {leave.reason}</div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
          <textarea value={comment} onChange={e => setComment(e.target.value)}
            rows={3} placeholder="Add a comment for the employee..."
            className="input-field resize-none text-sm" />
        </div>
        <div className="flex gap-3">
          <button onClick={() => decide('APPROVED')} disabled={loading}
            className="btn-success flex items-center gap-2 flex-1 justify-center">
            <Check size={16} /> Approve
          </button>
          <button onClick={() => decide('REJECTED')} disabled={loading}
            className="btn-danger flex items-center gap-2 flex-1 justify-center">
            <X size={16} /> Reject
          </button>
          <button onClick={onClose} className="btn-secondary px-3">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function ManageLeaves() {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState(null)

  const fetch = (p = 0, s = status) => {
    setLoading(true)
    leaveAPI.getDepartmentLeaves({ page: p, size: 10, status: s || undefined })
      .then(res => { setData(res.data.data); setPage(p) })
      .catch(() => toast.error('Failed to load leaves'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch(0) }, [])

  return (
    <div className="space-y-6">
      {reviewing && <ReviewModal leave={reviewing} onClose={() => setReviewing(null)}
        onDone={() => { setReviewing(null); fetch(page) }} />}

      <div className="flex items-center gap-3">
        <CheckSquare size={26} className="text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Leave Requests</h1>
          <p className="text-gray-500 text-sm">Review and action your department's leave requests</p>
        </div>
      </div>

      <div className="card">
        <div className="flex gap-2 mb-4 flex-wrap">
          {['', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(s => (
            <button key={s} onClick={() => { setStatus(s); fetch(0, s) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                ${status === s ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader size={24} className="animate-spin text-primary-600" /></div>
        ) : !data?.content?.length ? (
          <div className="text-center py-12 text-gray-400">
            <CheckSquare size={40} className="mx-auto mb-2 opacity-40" />
            <p>No leave requests found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b text-xs uppercase tracking-wide">
                    <th className="pb-3">Employee</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">From</th>
                    <th className="pb-3">To</th>
                    <th className="pb-3">Days</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Applied</th>
                    <th className="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.content.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="py-3 font-medium">{l.appliedByName}</td>
                      <td className="py-3">{l.leaveType}</td>
                      <td className="py-3 text-gray-600">{l.startDate}</td>
                      <td className="py-3 text-gray-600">{l.endDate}</td>
                      <td className="py-3 text-gray-600">{l.totalDays}</td>
                      <td className="py-3">{getBadge(l.status)}</td>
                      <td className="py-3 text-gray-500">{new Date(l.createdAt).toLocaleDateString()}</td>
                      <td className="py-3">
                        {l.status === 'PENDING' && (
                          <button onClick={() => setReviewing(l)}
                            className="text-primary-600 hover:underline text-xs font-medium">
                            Review
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">Page {page + 1} of {data.totalPages}</p>
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
