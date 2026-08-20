import { useState, useEffect } from 'react'
import { leaveAPI } from '../services/api'
import toast from 'react-hot-toast'
import { CalendarDays, Loader, X } from 'lucide-react'

const getBadge = status => {
  const map = { PENDING: 'badge-pending', APPROVED: 'badge-approved', REJECTED: 'badge-rejected', CANCELLED: 'badge-cancelled' }
  return <span className={map[status] || 'badge-pending'}>{status}</span>
}

export default function MyLeaves() {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchLeaves = (p = 0) => {
    setLoading(true)
    leaveAPI.getMyLeaves({ page: p, size: 10 })
      .then(res => { setData(res.data.data); setPage(p) })
      .catch(() => toast.error('Failed to load leaves'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchLeaves(0) }, [])

  const cancel = async id => {
    if (!confirm('Cancel this leave request?')) return
    try {
      await leaveAPI.cancelLeave(id)
      toast.success('Leave cancelled')
      fetchLeaves(page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarDays size={26} className="text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Leave Requests</h1>
          <p className="text-gray-500 text-sm">Track all your leave history</p>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader size={24} className="animate-spin text-primary-600" />
          </div>
        ) : !data?.content?.length ? (
          <div className="text-center py-12 text-gray-400">
            <CalendarDays size={40} className="mx-auto mb-2 opacity-40" />
            <p>No leave requests found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b text-xs uppercase tracking-wide">
                    <th className="pb-3">Type</th>
                    <th className="pb-3">From</th>
                    <th className="pb-3">To</th>
                    <th className="pb-3">Days</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Reviewed By</th>
                    <th className="pb-3">Comment</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.content.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="py-3 font-medium">{l.leaveType}</td>
                      <td className="py-3 text-gray-600">{l.startDate}</td>
                      <td className="py-3 text-gray-600">{l.endDate}</td>
                      <td className="py-3 text-gray-600">{l.totalDays}</td>
                      <td className="py-3">{getBadge(l.status)}</td>
                      <td className="py-3 text-gray-600">{l.reviewedByName || '—'}</td>
                      <td className="py-3 text-gray-500 max-w-xs truncate">{l.reviewComment || '—'}</td>
                      <td className="py-3">
                        {l.status === 'PENDING' && (
                          <button onClick={() => cancel(l.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                            title="Cancel">
                            <X size={16} />
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
                <p className="text-sm text-gray-500">
                  Page {page + 1} of {data.totalPages} ({data.totalElements} total)
                </p>
                <div className="flex gap-2">
                  <button disabled={page === 0} onClick={() => fetchLeaves(page - 1)}
                    className="btn-secondary text-sm px-3 py-1 disabled:opacity-40">Prev</button>
                  <button disabled={page >= data.totalPages - 1} onClick={() => fetchLeaves(page + 1)}
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
