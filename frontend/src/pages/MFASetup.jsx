import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'
import QRCode from 'react-qr-code'
import { toast } from 'react-toastify'

function MFASetup() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('initial') // initial, setup, verify, disable
  const [qrData, setQrData] = useState(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user?.mfa_enabled) {
      setStep('disable')
    }
  }, [user])

  const handleSetupMFA = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await authAPI.setupMFA()
      setQrData(response.data)
      setStep('verify')
    } catch (err) {
      setError('Failed to setup MFA. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyMFA = async (e) => {
    e.preventDefault()
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await authAPI.enableMFA(verificationCode)
      toast.success('MFA enabled successfully!')
      refreshUser()
      navigate('/profile')
    } catch (err) {
      setError('Invalid verification code. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDisableMFA = async (e) => {
    e.preventDefault()
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await authAPI.disableMFA(verificationCode)
      toast.success('MFA disabled successfully')
      refreshUser()
      navigate('/profile')
    } catch (err) {
      setError('Invalid verification code. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {user?.mfa_enabled ? 'Manage MFA' : 'Setup Two-Factor Authentication'}
      </h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Initial Setup Step */}
        {step === 'initial' && (
          <div>
            <p className="text-gray-600 mb-6">
              Two-factor authentication adds an extra layer of security to your account. 
              You'll need a authenticator app like Google Authenticator or Authy.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
                <p className="text-sm text-gray-600">Install an authenticator app on your phone</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
                <p className="text-sm text-gray-600">Scan the QR code with your authenticator app</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">3</span>
                <p className="text-sm text-gray-600">Enter the 6-digit code to verify</p>
              </div>
            </div>
            <button
              onClick={handleSetupMFA}
              disabled={loading}
              className="w-full mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Setting up...' : 'Start Setup'}
            </button>
          </div>
        )}

        {/* QR Code Step */}
        {step === 'verify' && qrData && (
          <div>
            <p className="text-gray-600 mb-4">
              Scan this QR code with your authenticator app:
            </p>
            <div className="flex justify-center p-4 bg-white border rounded-lg mb-4">
              <QRCode value={qrData.otpauth_url} size={200} />
            </div>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Can't scan? Enter this code manually:</p>
              <code className="text-sm font-mono break-all">{qrData.secret}</code>
            </div>
            <form onSubmit={handleVerifyMFA}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter verification code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="000000"
              />
              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Enable MFA'}
              </button>
            </form>
          </div>
        )}

        {/* Disable MFA Step */}
        {step === 'disable' && (
          <div>
            <div className="flex items-center gap-3 mb-4 p-3 bg-green-50 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-green-800 font-medium">MFA is currently enabled</span>
            </div>
            <p className="text-gray-600 mb-4">
              To disable two-factor authentication, enter your current verification code:
            </p>
            <form onSubmit={handleDisableMFA}>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="000000"
              />
              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {loading ? 'Disabling...' : 'Disable MFA'}
              </button>
            </form>
          </div>
        )}

        <button
          onClick={() => navigate('/profile')}
          className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          Back to Profile
        </button>
      </div>
    </div>
  )
}

export default MFASetup
