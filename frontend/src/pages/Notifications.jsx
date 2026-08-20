import { useState, useEffect } from 'react'
import { notificationAPI } from '../services/api'
import toast from 'react-hot-toast'
import { Bell, Loader, CheckCheck } from 'lucide-react'

export default function Notifications() {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetch = (p = 0) => {
    setLoading(true)
    notificationAPI.getAll({ page: p, size: 20 })
      .then(res => { setData(res.data.data); setPage(p) })
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch(0) }, [])

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead()
      toast.success('All marked as read')
      fetch(page)
    } catch {
      toast.error('Failed')
    }
  }

  const timeAgo = (dt) => {
    const diff = Date.now() - new Date(dt).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell size={26} className="text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-500 text-sm">Your latest activity updates</p>
          </div>
        </div>
        <button onClick={markAllRead} className="btn-secondary flex items-center gap-2 text-sm">
          <CheckCheck size={16} /> Mark All Read
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader size={24} className="animate-spin text-primary-600" /></div>
        ) : !data?.content?.length ? (
          <div className="text-center py-12 text-gray-400">
            <Bell size={40} className="mx-auto mb-2 opacity-40" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.content.map(n => (
              <div key={n.id} className={`p-4 flex items-start gap-3 ${!n.read ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.read ? 'bg-primary-500' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.read ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {data?.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-gray-500">Page {page + 1} of {data.totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => fetch(page - 1)}
                className="btn-secondary text-sm px-3 py-1 disabled:opacity-40">Prev</button>
              <button disabled={page >= data.totalPages - 1} onClick={() => fetch(page + 1)}
                className="btn-secondary text-sm px-3 py-1 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
