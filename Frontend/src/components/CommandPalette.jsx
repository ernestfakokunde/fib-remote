import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createElement } from 'react';
import { BarChart3, Command, CreditCard, LayoutDashboard, Package, Search, Settings, ShoppingCart, UserRound, X } from 'lucide-react';

const commands = [
  { label: 'Overview', detail: 'Dashboard', to: '/', Icon: LayoutDashboard },
  { label: 'Products', detail: 'Inventory', to: '/products', Icon: Package },
  { label: 'Sales', detail: 'Finance', to: '/sales', Icon: CreditCard },
  { label: 'Record a sale', detail: 'Stock out', to: '/stock-out', Icon: ShoppingCart },
  { label: 'Reports', detail: 'Finance', to: '/reports', Icon: BarChart3 },
  { label: 'Profile', detail: 'Account', to: '/profile', Icon: UserRound },
  { label: 'Settings', detail: 'Account', to: '/settings', Icon: Settings },
];

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const matches = commands.filter((item)=>`${item.label} ${item.detail}`.toLowerCase().includes(query.toLowerCase()));
  useEffect(()=>{ if(isOpen){setQuery('');requestAnimationFrame(()=>inputRef.current?.focus());} },[isOpen]);
  useEffect(()=>{ if(!isOpen)return undefined;const onKeyDown=(event)=>{if(event.key==='Escape')onClose();};window.addEventListener('keydown',onKeyDown);return()=>window.removeEventListener('keydown',onKeyDown);},[isOpen,onClose]);
  if(!isOpen)return null;
  const go=(path)=>{navigate(path);onClose();};
  return <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/35 px-4 pt-[12vh] backdrop-blur-[2px]" onMouseDown={(event)=>event.target===event.currentTarget&&onClose()}><section role="dialog" aria-modal="true" aria-label="Command palette" className="w-full max-w-xl overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl"><div className="flex items-center gap-3 border-b border-[var(--border)] px-4"><Search size={17} className="text-[var(--muted)]"/><input ref={inputRef} value={query} onChange={(event)=>setQuery(event.target.value)} onKeyDown={(event)=>{if(event.key==='Enter'&&matches[0])go(matches[0].to);}} placeholder="Search pages and actions..." className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"/><kbd className="hidden rounded border border-[var(--border)] px-1.5 py-1 text-[10px] text-[var(--muted)] sm:block">ESC</kbd><button type="button" aria-label="Close command palette" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-[var(--muted)] hover:bg-[var(--surface)]"><X size={16}/></button></div><div className="max-h-[min(60vh,420px)] overflow-y-auto p-2"><p className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Navigate</p>{matches.length?matches.map(({label,detail,to,Icon})=><button type="button" key={to} onClick={()=>go(to)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-[var(--surface)]"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">{createElement(Icon,{size:16})}</span><span className="flex-1 text-sm font-medium">{label}</span><span className="text-xs text-[var(--muted)]">{detail}</span></button>):<p className="px-3 py-8 text-center text-sm text-[var(--muted)]">No matching pages</p>}</div><div className="flex items-center gap-2 border-t border-[var(--border)] px-4 py-2.5 text-[10px] text-[var(--muted)]"><Command size={12}/> Ctrl + K to search <span className="ml-auto">Enter to select</span></div></section></div>;
}
