import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGlobalContext } from '../context/context.jsx';
import AuthShell from '../components/AuthShell.jsx';

const fieldClass = 'mt-2 h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm text-[var(--text)] placeholder:text-[var(--muted)] transition focus:border-[var(--primary)] focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/10';

export default function Register() {
  const { Register, loading } = useGlobalContext();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const update = (event) => setFormData((current)=>({ ...current, [event.target.name]: event.target.value }));
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (formData.password !== formData.confirmPassword) { toast.error('Passwords do not match.'); return; }
    if (formData.password.length < 8) { toast.error('Password must be at least 8 characters long.'); return; }
    try { await Register({ username: formData.username, email: formData.email, password: formData.password }); }
    catch { /* The auth context displays the API error. */ }
  };

  return <AuthShell title="Create your workspace" subtitle="A few details, then your business is ready to go." footer={<>Already have an account? <Link to="/login" className="ml-1 font-semibold text-[var(--primary)] hover:underline">Sign in</Link></>}>
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label htmlFor="register-name" className="text-sm font-semibold">Your name</label><div className="relative"><UserRound size={17} className="absolute left-4 top-[1.35rem] text-[var(--muted)]"/><input id="register-name" autoComplete="name" type="text" name="username" value={formData.username} onChange={update} required placeholder="e.g. Alex Morgan" className={`${fieldClass} pl-11`}/></div></div>
      <div><label htmlFor="register-email" className="text-sm font-semibold">Work email</label><div className="relative"><Mail size={17} className="absolute left-4 top-[1.35rem] text-[var(--muted)]"/><input id="register-email" autoComplete="email" type="email" name="email" value={formData.email} onChange={update} required placeholder="you@business.com" className={`${fieldClass} pl-11`}/></div></div>
      <div><label htmlFor="register-password" className="text-sm font-semibold">Password</label><div className="relative"><LockKeyhole size={17} className="absolute left-4 top-[1.35rem] text-[var(--muted)]"/><input id="register-password" autoComplete="new-password" type={showPassword?'text':'password'} name="password" value={formData.password} onChange={update} required minLength={8} placeholder="At least 8 characters" className={`${fieldClass} pl-11 pr-12`}/><button type="button" onClick={()=>setShowPassword((value)=>!value)} aria-label={showPassword?'Hide password':'Show password'} className="absolute right-3 top-3 rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface)]">{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></div>
      <div><label htmlFor="register-confirm" className="text-sm font-semibold">Confirm password</label><input id="register-confirm" autoComplete="new-password" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={update} required minLength={8} placeholder="Type your password again" className={fieldClass}/></div>
      <p className="text-xs leading-5 text-[var(--muted)]">Your account becomes the workspace manager. After signup, create salesperson accounts from Team and share their generated login credentials.</p>
      <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60">{loading?'Creating your workspace…':'Create account'}</button>
    </form>
  </AuthShell>;
}
