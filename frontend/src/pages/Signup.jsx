import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { UserPlus, Compass } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export const Signup = () => {
  const navigate = useNavigate();
  const { signup, googleLogin } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim()) {
      toast.error('All fields are required!');
      return;
    }
    setSubmitting(true);
    const res = await signup(username, email, password);
    setSubmitting(false);

    if (res.success) {
      toast.success(res.message || 'Account created successfully!');
      navigate('/listings');
    } else {
      toast.error(res.error || 'Registration failed!');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const { credential } = credentialResponse;
    const res = await googleLogin(credential);
    if (res.success) {
      toast.success(res.message || 'Logged in with Google!');
      navigate('/listings');
    } else {
      toast.error(res.error || 'Google signup failed.');
    }
  };

  const handleSimulatedGoogleLogin = async () => {
    const res = await googleLogin("mock_google_token_madanrajsagar83");
    if (res.success) {
      toast.success(res.message || 'Logged in successfully via simulation!');
      navigate('/listings');
    } else {
      toast.error(res.error || 'Simulated Google Login failed');
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50/20">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-100 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-brand-rose">
            <UserPlus className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Create Account
            </h2>
            <p className="mt-1.5 text-xs font-semibold text-slate-400">
              Sign up to discover and host unique holiday stays
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              className="w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20 transition-all placeholder:text-slate-300"
              placeholder="Pick a unique username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className="w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20 transition-all placeholder:text-slate-300"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20 transition-all placeholder:text-slate-300"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-brand-rose py-3 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:bg-brand-rose/90 hover:shadow-md disabled:opacity-50 active:scale-98"
          >
            {submitting ? 'Registering...' : 'Sign Up'}
          </button>

          {/* Divider */}
          <div className="relative flex py-1.5 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">or</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          {/* Google Button */}
          <div className="flex flex-col items-center justify-center w-full gap-2.5">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google Sign In failed')}
              useOneTap
              shape="circle"
              width="380"
              text="signup_with"
            />
            
            <button
              type="button"
              onClick={handleSimulatedGoogleLogin}
              className="w-full rounded-full border border-slate-200 bg-white hover:bg-slate-50 py-2.5 text-xs font-bold text-slate-700 shadow-[0_2px_4px_rgba(0,0,0,0.01)] transition-all duration-300 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Compass className="h-4.5 w-4.5 text-brand-rose" />
              <span>Simulate Google Login</span>
            </button>
          </div>

          <div className="text-center pt-2 text-xs font-semibold text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-rose hover:underline font-bold">
              Log in
            </Link>
          </div>
        </form>

      </div>
    </div>
  );
};
export default Signup;
