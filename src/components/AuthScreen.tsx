/**
 * Welcome & Firebase Authentication Screen - Fully Responsive
 */

import React, { useState } from 'react';
import { 
  BookOpen, 
  ArrowRight, 
  Loader2, 
  Settings, 
  AlertCircle,
  KeyRound,
  Check
} from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile 
} from 'firebase/auth';
import { auth, isFirebaseConfigured, firebaseConfig, saveRuntimeFirebaseConfig } from '../firebase';
import { getFriendlyAuthErrorMessage } from '../utils/errorHandling';

interface AuthScreenProps {
  onAuthSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Loading & error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fallback Firebase Configuration modal
  const [showConfigModal, setShowConfigModal] = useState(!isFirebaseConfigured);
  const [customApiKey, setCustomApiKey] = useState(firebaseConfig.apiKey);
  const [customAuthDomain, setCustomAuthDomain] = useState(firebaseConfig.authDomain);
  const [customProjectId, setCustomProjectId] = useState(firebaseConfig.projectId);
  const [customStorageBucket, setCustomStorageBucket] = useState(firebaseConfig.storageBucket);
  const [customSenderId, setCustomSenderId] = useState(firebaseConfig.messagingSenderId);
  const [customAppId, setCustomAppId] = useState(firebaseConfig.appId);

  // Form submit handler for Firebase Auth
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate submissions

    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (password.length < 6) {
      setError('Your password is too weak. Please choose a stronger password.');
      return;
    }

    if (!isFirebaseConfigured) {
      setShowConfigModal(true);
      setError('Firebase configuration is required. Please enter your configuration below.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        // Real Firebase Auth: Create new account
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        
        // Optionally update display name
        if (name.trim() && userCredential.user) {
          try {
            await updateProfile(userCredential.user, {
              displayName: name.trim(),
            });
          } catch (profileErr) {
            console.error('Failed to set display name:', profileErr);
          }
        }
      } else {
        // Real Firebase Auth: Sign in existing account
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
      }

      onAuthSuccess?.();
    } catch (authError: any) {
      setError(getFriendlyAuthErrorMessage(authError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customApiKey.trim() || !customProjectId.trim()) {
      setError('API Key and Project ID are required.');
      return;
    }

    saveRuntimeFirebaseConfig({
      apiKey: customApiKey.trim(),
      authDomain: customAuthDomain.trim() || `${customProjectId.trim()}.firebaseapp.com`,
      projectId: customProjectId.trim(),
      storageBucket: customStorageBucket.trim() || `${customProjectId.trim()}.appspot.com`,
      messagingSenderId: customSenderId.trim(),
      appId: customAppId.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-8 sm:py-12 px-3.5 sm:px-6 lg:px-8 overflow-x-hidden">
      
      {/* Notice if Firebase credentials are missing */}
      {!isFirebaseConfigured && (
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-1 sm:px-4 mb-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-xs" role="region" aria-label="Configuration notice">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-amber-950">Firebase Configuration Needed</span>
                <p className="text-amber-800/90 mt-1 break-words">
                  Add your Firebase config in <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[11px]">.env</code> or configure it below.
                </p>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(true)}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors cursor-pointer text-xs"
                >
                  <Settings className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Configure Firebase Keys</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-1 sm:px-4">
        {/* App Title & Subtitle */}
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xs mb-3">
            <BookOpen className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            MyNotes
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Your simple personal notes
          </p>
        </div>

        {/* Auth Card */}
        <div className="mt-6 sm:mt-8 bg-white py-6 sm:py-8 px-4 sm:px-10 shadow-sm border border-slate-200 rounded-2xl">
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            
            {/* Optional Name field if signing up */}
            {isSignUp && (
              <div>
                <label 
                  htmlFor="fullName" 
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Your Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="e.g. Jordan Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50 disabled:bg-slate-50 transition-colors min-h-[44px]"
                />
              </div>
            )}

            {/* Email Input */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50 disabled:bg-slate-50 transition-colors min-h-[44px]"
              />
            </div>

            {/* Password Input */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50 disabled:bg-slate-50 transition-colors min-h-[44px]"
              />
            </div>

            {/* Accessible Error Message Banner */}
            {error && (
              <div 
                role="alert" 
                aria-live="assertive" 
                className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium flex items-start gap-2"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" aria-hidden="true" />
                <span className="break-words">{error}</span>
              </div>
            )}

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="w-full flex justify-center items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2" role="status">
                    <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden="true" />
                    <span>{isSignUp ? 'Creating account...' : 'Signing in...'}</span>
                  </span>
                ) : (
                  <>
                    <span>{isSignUp ? 'Create an account' : 'Login'}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>

            {/* Mode Switcher with comfortable tap area */}
            <div className="text-center pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="py-1 px-2 text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer disabled:opacity-50 inline-block min-h-[36px]"
              >
                {isSignUp ? (
                  <span>Already have an account? <strong className="underline text-slate-900">Log in</strong></span>
                ) : (
                  <span>Don&apos;t have an account? <strong className="underline text-slate-900">Create an account</strong></span>
                )}
              </button>
            </div>

          </form>

          {/* Quick info footer */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Secured with Firebase</span>
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer p-1"
            >
              <KeyRound className="h-3 w-3" aria-hidden="true" />
              <span>Firebase Keys</span>
            </button>
          </div>

        </div>
      </div>

      {/* Firebase Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="pr-2">
                <h3 className="text-base font-semibold text-slate-900">
                  Firebase Web Configuration
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Values are automatically loaded from <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.env</code> or can be saved below.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs p-2 rounded"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase">
                  VITE_FIREBASE_API_KEY *
                </label>
                <input
                  type="text"
                  required
                  placeholder="AIzaSy..."
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono min-h-[38px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase">
                  VITE_FIREBASE_PROJECT_ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="my-notes-app-12345"
                  value={customProjectId}
                  onChange={(e) => setCustomProjectId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono min-h-[38px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase">
                  VITE_FIREBASE_AUTH_DOMAIN
                </label>
                <input
                  type="text"
                  placeholder="my-notes-app-12345.firebaseapp.com"
                  value={customAuthDomain}
                  onChange={(e) => setCustomAuthDomain(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono min-h-[38px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase">
                  VITE_FIREBASE_APP_ID
                </label>
                <input
                  type="text"
                  placeholder="1:123456789:web:abcdef"
                  value={customAppId}
                  onChange={(e) => setCustomAppId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono min-h-[38px]"
                />
              </div>

              <div className="pt-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800 text-center"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
