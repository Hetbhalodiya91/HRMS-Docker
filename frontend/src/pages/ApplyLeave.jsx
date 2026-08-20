import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { leaveAPI } from '../services/api'
import toast from 'react-hot-toast'
import { CalendarPlus, Send } from 'lucide-react'

const LEAVE_TYPES = ['ANNUAL', 'SICK', 'CASUAL', 'MATERNITY', 'PATERNITY', 'UNPAID']

export default function ApplyLeave() {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    startDate: today, endDate: today, reason: '', leaveType: 'ANNUAL'
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const days = form.startDate && form.endDate
    ? Math.max(0, Math.floor((new Date(form.endDate) - new Date(form.startDate)) / 86400000) + 1)
    : 0

  const submit = async e => {
    e.preventDefault()
    if (form.endDate < form.startDate) {
      toast.error('End date cannot be before start date')
      return
    }
    setLoading(true)
    try {
      await leaveAPI.apply(form)
      toast.success('Leave request submitted successfully!')
      navigate('/my-leaves')
    } catch (err) {
      const errors = err.response?.data?.data
      if (errors) Object.values(errors).forEach(msg => toast.error(msg))
      else toast.error(err.response?.data?.message || 'Failed to submit leave')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <CalendarPlus size={26} className="text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Apply for Leave</h1>
          <p className="text-gray-500 text-sm">Submit a new leave request for manager approval</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
            <select name="leaveType" value={form.leaveType} onChange={handle} className="input-field">
              {LEAVE_TYPES.map(t => <option key={t} value={t}>{t} LEAVE</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input name="startDate" type="date" value={form.startDate} onChange={handle}
                min={today} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input name="endDate" type="date" value={form.endDate} onChange={handle}
                min={form.startDate} className="input-field" required />
            </div>
          </div>

          {days > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              📅 Total duration: <strong>{days} day{days > 1 ? 's' : ''}</strong>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea name="reason" value={form.reason} onChange={handle}
              rows={4} placeholder="Please provide a detailed reason for your leave request (min 10 characters)..."
              className="input-field resize-none" required minLength={10} />
            <p className="text-xs text-gray-400 mt-1">{form.reason.length}/500 characters</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="btn-primary flex items-center gap-2 px-6">
              {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                : <Send size={16} />}
              Submit Request
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
