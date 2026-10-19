import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGlobalContext } from '../context/context.jsx';
import AuthShell from '../components/AuthShell.jsx';

const fieldClass = 'mt-2 h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm text-[var(--text)] placeholder:text-[var(--muted)] transition focus:border-[var(--primary)] focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/10';

export default function Login() {
  const { Login, loading } = useGlobalContext();
  const [loginMode, setLoginMode] = useState('manager');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try { await Login({ email, password }); }
    catch { /* The auth context displays the API error. */ }
  };

  return <AuthShell title="Welcome back" subtitle="Sign in to pick up where you left off." footer={<>New to Spectra? <Link to="/register" className="ml-1 font-semibold text-[var(--primary)] hover:underline">Create an account</Link></>}>
    <div className="mb-6 grid grid-cols-2 rounded-xl bg-[var(--surface)] p-1" role="group" aria-label="Account type"><button type="button" onClick={()=>setLoginMode('manager')} aria-pressed={loginMode==='manager'} className={`h-10 rounded-lg text-sm font-semibold transition ${loginMode==='manager'?'bg-[var(--card)] text-[var(--text)] shadow-sm':'text-[var(--muted)]'}`}>Business owner</button><button type="button" onClick={()=>setLoginMode('salesperson')} aria-pressed={loginMode==='salesperson'} className={`h-10 rounded-lg text-sm font-semibold transition ${loginMode==='salesperson'?'bg-[var(--card)] text-[var(--text)] shadow-sm':'text-[var(--muted)]'}`}>Team member</button></div>
    <p className="-mt-2 mb-5 text-xs text-[var(--muted)]">{loginMode==='manager'?'Use your business account credentials.':'Use the account credentials provided by your manager.'}</p>
    <form onSubmit={handleSubmit} className="space-y-5">
      <div><label htmlFor="login-email" className="text-sm font-semibold">Email or username</label><div className="relative"><Mail size={17} className="absolute left-4 top-[1.35rem] text-[var(--muted)]"/><input id="login-email" autoComplete="username" type="text" name="email" value={email} onChange={(event)=>setEmail(event.target.value)} required placeholder="you@business.com" className={`${fieldClass} pl-11`}/></div></div>
      <div><div className="flex items-center justify-between"><label htmlFor="login-password" className="text-sm font-semibold">Password</label></div><div className="relative"><LockKeyhole size={17} className="absolute left-4 top-[1.35rem] text-[var(--muted)]"/><input id="login-password" autoComplete="current-password" type={showPassword?'text':'password'} name="password" value={password} onChange={(event)=>setPassword(event.target.value)} required minLength={8} placeholder="Enter your password" className={`${fieldClass} pl-11 pr-12`}/><button type="button" onClick={()=>setShowPassword((value)=>!value)} aria-label={showPassword?'Hide password':'Show password'} className="absolute right-3 top-3 rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface)]">{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></div>
      <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white shadow-sm transition hover:brightness-105 focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-60">{loading?'Signing you in…':'Sign in to your workspace'}</button>
    </form>
  </AuthShell>;
}
