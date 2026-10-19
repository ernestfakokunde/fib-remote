import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ChevronDown, Menu, Moon, Search, Sun, UserRound, X, LogOut, Settings } from 'lucide-react';
import { useGlobalContext } from '../context/context';
import NotificationsPanel from './NotificationsPanel';
import useNotifications from '../hooks/useNotifications';
import CommandPalette from './CommandPalette';

export default function TopBar() {
  const { user, logout, theme, toggleTheme, sidebarOpen, toggleSidebar, isPaletteOpen, openPalette, closePalette, permissions } = useGlobalContext();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);
  const { notifications, loading, unreadCount, markAsRead } = useNotifications();
  useEffect(() => {
    const onKeyDown = (event) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openPalette(); } };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openPalette]);
  useEffect(() => {
    const onClick = (event) => { if (!accountRef.current?.contains(event.target)) setAccountOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  const initials = (user?.username || user?.email || 'U').slice(0,1).toUpperCase();

  return <>
    <header className="sticky top-0 z-30 mb-6 flex h-[60px] items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button type="button" onClick={toggleSidebar} aria-label={sidebarOpen?'Close sidebar':'Open sidebar'} className="mr-3 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface)] lg:hidden">{sidebarOpen?<X size={18}/>:<Menu size={18}/>}</button>
      <button type="button" onClick={openPalette} aria-label="Search or jump to (Ctrl+K)" className="flex h-9 w-full max-w-[420px] items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-left text-[13px] text-[var(--muted)] transition hover:border-[var(--primary)]/40"><Search size={15}/><span className="flex-1">Search or jump to...</span><kbd className="hidden items-center gap-1 rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] sm:flex">Ctrl K</kbd></button>
      <div className="ml-3 flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button type="button" onClick={toggleTheme} aria-label={theme==='white'?'Switch to dark mode':'Switch to light mode'} title={theme==='white'?'Dark mode':'Light mode'} className="grid h-9 w-9 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text)]">{theme==='white'?<Moon size={17}/>:<Sun size={17}/>}</button>
        <div className="relative"><button type="button" onClick={()=>setNotificationsOpen((value)=>!value)} aria-label={`Notifications${unreadCount?`, ${unreadCount} unread`:''}`} aria-expanded={notificationsOpen} className="relative grid h-9 w-9 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text)]"><Bell size={17}/>{unreadCount>0&&<span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--primary)] ring-2 ring-[var(--bg)]"/>}</button><NotificationsPanel isOpen={notificationsOpen} notifications={notifications} loading={loading} unreadCount={unreadCount} onNotificationClick={async(item)=>{if(!item.isRead)await markAsRead(item._id);}}/></div>
        <div ref={accountRef} className="relative"><button type="button" onClick={()=>setAccountOpen((value)=>!value)} aria-label="Account menu" aria-expanded={accountOpen} className="flex h-9 items-center gap-1.5 rounded-lg px-1.5 transition hover:bg-[var(--surface)]"><span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--primary-soft)] text-xs font-bold text-[var(--primary)]">{initials}</span><ChevronDown size={13} className="hidden text-[var(--muted)] sm:block"/></button>{accountOpen&&<div className="absolute right-0 top-11 z-50 w-52 rounded-xl border border-[var(--border)] bg-[var(--card)] p-1.5 shadow-[var(--shadow)]"><div className="border-b border-[var(--border)] px-3 py-2"><p className="truncate text-xs font-semibold">{user?.username||user?.name||'Account'}</p><p className="truncate text-[10px] text-[var(--muted)]">{user?.email}</p></div><Link onClick={()=>setAccountOpen(false)} to="/profile" className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-[var(--surface)]"><UserRound size={14}/>Profile</Link>{permissions.canAccessSettings&&<Link onClick={()=>setAccountOpen(false)} to="/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-[var(--surface)]"><Settings size={14}/>Settings</Link>}<button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-[var(--danger)] hover:bg-[var(--surface)]"><LogOut size={14}/>Sign out</button></div>}</div>
      </div>
    </header>
    <CommandPalette isOpen={isPaletteOpen} onClose={closePalette}/>
  </>;
}
