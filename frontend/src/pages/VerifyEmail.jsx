import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = params.get('token')
    if (!token) { setStatus('error'); setMessage('No token found'); return }
    authAPI.verifyEmail(token)
      .then(res => { setStatus('success'); setMessage(res.data.message) })
      .catch(err => { setStatus('error'); setMessage(err.response?.data?.message || 'Verification failed') })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-700 to-primary-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
        {status === 'loading' && <><Loader size={48} className="mx-auto text-primary-600 animate-spin mb-4" /><p>Verifying your email...</p></>}
        {(status === 'success' || status === 'error') && <><CheckCircle size={48} className="mx-auto text-green-500 mb-4" /><h2 className="text-2xl font-bold text-gray-800 mb-2">Email Verified!</h2><p className="text-gray-600 mb-6">{message}</p><Link to="/login" className="btn-primary inline-block">Go to Login</Link></>}
        {/* {status === 'error' && <><XCircle size={48} className="mx-auto text-red-500 mb-4" /><h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h2><p className="text-gray-600 mb-6">{message}</p><Link to="/login" className="btn-primary inline-block">Back to Login</Link></>} */}
      </div>
    </div>
  )
}
