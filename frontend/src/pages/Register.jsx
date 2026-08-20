import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI, departmentAPI } from '../services/api'
import toast from 'react-hot-toast'
import { UserPlus, Eye, EyeOff } from 'lucide-react'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', departmentId: '' })
  const [departments, setDepartments] = useState([])
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    departmentAPI.getAll()
      .then(res => setDepartments(res.data.data || []))
      .catch(err => { console.error("Failed to fetch departments", err) })
  }, [])

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...form, departmentId: form.departmentId || undefined }
      await authAPI.register(payload)
      toast.success('Registered! Check your email to verify your account.')
      navigate('/login')
    } catch (err) {
      const errors = err.response?.data?.data
      if (errors) Object.values(errors).forEach(msg => toast.error(msg))
      else toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = () => {
    setOauthLoading(true)
    // Google OAuth2 — backend auto-registers new users on first sign-in
    window.location.href = 'http://localhost:8090/oauth2/authorization/google'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-700 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏢</div>
          <h1 className="text-3xl font-bold text-white">HRMS</h1>
          <p className="text-primary-200 mt-1">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Register</h2>

          {/* Google OAuth2 Sign-up — shown at top for quick access */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={oauthLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 shadow-sm disabled:opacity-60 mb-5"
          >
            {oauthLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500" />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.84l6.08-6.08C34.36 3.05 29.44 1 24 1 14.82 1 7.07 6.48 3.64 14.22l7.08 5.5C12.43 13.61 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.1 24.5c0-1.64-.15-3.22-.42-4.74H24v9h12.43c-.54 2.88-2.17 5.32-4.62 6.96l7.08 5.5C43.18 37.32 46.1 31.36 46.1 24.5z"/>
                  <path fill="#FBBC05" d="M10.72 28.28A14.6 14.6 0 0 1 9.5 24c0-1.49.26-2.93.72-4.28l-7.08-5.5A23.93 23.93 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l8.16-6.5z"/>
                  <path fill="#34A853" d="M24 47c5.44 0 10.01-1.8 13.35-4.88l-7.08-5.5C28.6 38.3 26.42 39 24 39c-6.26 0-11.57-4.11-13.28-9.72l-8.16 6.5C6.07 43.52 14.48 47 24 47z"/>
                </svg>
                Sign up with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">OR REGISTER WITH EMAIL</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input name="name" type="text" value={form.name} onChange={handle}
                placeholder="John Doe" className="input-field" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input name="email" type="email" value={form.email} onChange={handle}
                placeholder="john@company.com" className="input-field" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input name="password" type={showPw ? 'text' : 'password'}
                  value={form.password} onChange={handle}
                  placeholder="Min 8 chars, uppercase, lowercase & number"
                  className="input-field pr-10" required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department (optional)</label>
              <select name="departmentId" value={form.departmentId} onChange={handle}
                className="input-field">
                <option value="">Select department</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
              {loading
                ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                : <><UserPlus size={18} /> Create Account</>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
