import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './Auth.css';

function Auth({ onClose, onSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  // OTP mode (passwordless only)
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isSignUp) {
        // For OTP-only signup, we use signInWithOtp with shouldCreateUser: true
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: window.location.origin,
            data: {
              full_name: fullName,
            }
          }
        });

        if (error) throw error;

        setOtpSent(true);
        setMessage('We\'ve sent you a code or magic link. Check your email to complete signup.');
      } else {
        // OTP flow: send code (or magic link depending on project setting)
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: window.location.origin
          }
        });

        if (error) throw error;

        setOtpSent(true);
        setMessage('We\'ve sent you a code or magic link. Check your email.');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email'
      });

      if (error) throw error;

      setMessage('You are signed in!');
      setTimeout(() => {
        onSuccess();
      }, 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose}>×</button>
        
        <div className="auth-header">
          <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
          <p>
            {isSignUp 
              ? 'Join our recipe community' 
              : 'Welcome back to Recipe App'}
          </p>
        </div>

        {message && <div className="auth-message success">{message}</div>}
        {error && <div className="auth-message error">{error}</div>}

        {/* Sign Up form */}
        {isSignUp ? (
          <form onSubmit={handleAuth} className="auth-form">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Send Code'}
            </button>
          </form>
        ) : (
          // Sign In form (OTP only)
          <>
            <form onSubmit={otpSent ? handleVerifyOtp : handleAuth} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              {otpSent && (
                <div className="form-group">
                  <label htmlFor="otp">OTP Code</label>
                  <input
                    id="otp"
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                  />
                </div>
              )}

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? 'Loading...' : (otpSent ? 'Verify Code' : 'Send Code')}
              </button>
            </form>
            {!otpSent && (
              <p className="auth-header" style={{ marginTop: '0.5rem' }}>
                We'll email you a code or magic link
              </p>
            )}
          </>
        )}

        <div className="auth-switch">
          <p>
            {isSignUp ? 'Already have an account?' : 'Need an account?'}
            <button 
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setMessage('');
                setOtpSent(false);
                setOtpCode('');
              }}
              className="auth-switch-btn"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Auth;