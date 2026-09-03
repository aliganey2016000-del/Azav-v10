'use client'

import { useState } from 'react'
import {
  Activity, Bell, Building2, ChevronDown, CircleHelp, CreditCard,
  FileClock, LayoutDashboard, Menu, MoreHorizontal, Plus, Search,
  Settings, ShieldCheck, SlidersHorizontal, UserRound, Users, X,
} from 'lucide-react'

type Section = 'Overview' | 'Users' | 'Organizations' | 'Billing' | 'Audit logs' | 'Settings'

const nav: { label: Section; icon: typeof LayoutDashboard }[] = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Users', icon: Users },
  { label: 'Organizations', icon: Building2 },
  { label: 'Billing', icon: CreditCard },
  { label: 'Audit logs', icon: FileClock },
]
const users = [
  { initials: 'AM', name: 'Amina Mohamed', email: 'amina@azav.io', role: 'Admin', status: 'Active', date: 'Today, 09:42' },
  { initials: 'JD', name: 'Jamal Davis', email: 'jamal@northstar.co', role: 'Member', status: 'Active', date: 'Yesterday' },
  { initials: 'SK', name: 'Sarah Kim', email: 'sarah@azav.io', role: 'Member', status: 'Active', date: 'Aug 28, 2026' },
  { initials: 'OB', name: 'Omar Benali', email: 'omar@studioeight.co', role: 'Owner', status: 'Invited', date: 'Aug 26, 2026' },
]

function Badge({ children, tone = 'green' }: { children: React.ReactNode; tone?: 'green' | 'blue' | 'gray' | 'amber' }) {
  return <span className={`badge badge-${tone}`}><span className="badge-dot" />{children}</span>
}

function Sidebar({ active, setActive, mobileOpen, setMobileOpen }: { active: Section; setActive: (s: Section) => void; mobileOpen: boolean; setMobileOpen: (v: boolean) => void }) {
  return <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
    <div className="brand"><div className="brand-mark">A</div><span>azav</span><button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={20} /></button></div>
    <div className="workspace"><div className="workspace-avatar">S</div><div><strong>Super admin</strong><small>Azav workspace</small></div><ChevronDown size={16} /></div>
    <nav aria-label="Main navigation"><p className="nav-label">Workspace</p>{nav.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => { setActive(label); setMobileOpen(false) }}><Icon size={18} />{label}{label === 'Users' && <span className="nav-count">24</span>}</button>)}<p className="nav-label nav-label-spaced">Manage</p><button className={`nav-item ${active === 'Settings' ? 'active' : ''}`} onClick={() => { setActive('Settings'); setMobileOpen(false) }}><Settings size={18} />Settings</button></nav>
    <div className="sidebar-bottom"><div className="help"><CircleHelp size={18} /><div><strong>Need help?</strong><small>Visit our support center</small></div></div><div className="profile"><div className="profile-avatar">AM</div><div><strong>Amina Mohamed</strong><small>Super administrator</small></div><MoreHorizontal size={18} /></div></div>
  </aside>
}

function Header({ active, setMobileOpen }: { active: Section; setMobileOpen: (v: boolean) => void }) { return <header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={22} /></button><div className="breadcrumbs"><span>Admin</span><span>/</span><strong>{active}</strong></div><div className="top-actions"><div className="search"><Search size={17} /><input placeholder="Search" aria-label="Search" /><kbd>⌘ K</kbd></div><button className="icon-button" aria-label="Notifications"><Bell size={19} /><i /></button><div className="top-avatar">AM</div></div></header> }

function Overview() { return <><div className="page-heading"><div><p className="eyebrow">Wednesday, September 4, 2026</p><h1>Good morning, Amina</h1><p className="subheading">Here&apos;s what&apos;s happening across your workspace today.</p></div><button className="primary-button"><Plus size={17} />Invite user</button></div><section className="stat-grid">{[['Total users','2,482','+12.5%','Users'],['Active organizations','184','+8.2%','Organizations'],['Monthly revenue','$48,290','+14.6%','Revenue'],['System health','99.98%','+0.04%','Uptime']].map(([label, value, change, type]) => <div className="stat-card" key={label}><div className="stat-top"><span>{label}</span><span className="stat-icon">{type === 'Users' ? <Users size={17}/> : type === 'Organizations' ? <Building2 size={17}/> : type === 'Revenue' ? <CreditCard size={17}/> : <Activity size={17}/>}</span></div><strong>{value}</strong><small><span className="positive">↗ {change}</span> vs last month</small></div>)}</section><div className="content-grid"><section className="panel activity-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Latest events across your workspace</p></div><button className="text-button">View all <span>→</span></button></div><div className="activity-list">{[['AM','Amina Mohamed','updated workspace settings','2 minutes ago','blue'],['JD','Jamal Davis','joined Northstar organization','18 minutes ago','green'],['OB','Omar Benali','was invited to Azav','1 hour ago','amber'],['SK','Sarah Kim','updated billing details','3 hours ago','gray']].map(([i,n,a,t,c]) => <div className="activity-row" key={n}><div className={`activity-avatar ${c}`}>{i}</div><div><p><strong>{n}</strong> {a}</p><small>{t}</small></div><MoreHorizontal size={18} className="row-more" /></div>)}</div></section><section className="panel health-panel"><div className="panel-heading"><div><h2>System health</h2><p>All systems operational</p></div><Badge>Operational</Badge></div><div className="health-score"><div><strong>99.98%</strong><span>Uptime this month</span></div><div className="ring">99<span>.98</span></div></div><div className="health-bars"><div><span>API services</span><b>100%</b><i><em style={{width:'100%'}} /></i></div><div><span>Database</span><b>99.99%</b><i><em style={{width:'99.99%'}} /></i></div><div><span>File storage</span><b>99.95%</b><i><em style={{width:'99.95%'}} /></i></div></div><button className="outline-button"><Activity size={16} />View status page</button></section></div><section className="panel users-panel"><div className="panel-heading"><div><h2>Recent users</h2><p>New members in your workspace</p></div><button className="text-button">Manage users <span>→</span></button></div><div className="table-wrap"><table><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th /></tr></thead><tbody>{users.slice(0,3).map(u => <tr key={u.email}><td><div className="user-cell"><div className="user-avatar">{u.initials}</div><div><strong>{u.name}</strong><small>{u.email}</small></div></div></td><td>{u.role}</td><td><Badge>{u.status}</Badge></td><td>{u.date}</td><td><MoreHorizontal size={18}/></td></tr>)}</tbody></table></div></section></> }

function DataSection({ active }: { active: Section }) { return <div className="page-heading"><div><p className="eyebrow">Workspace management</p><h1>{active}</h1><p className="subheading">Manage and monitor your {active.toLowerCase()} from one place.</p></div><button className="primary-button"><Plus size={17} />{active === 'Users' ? 'Invite user' : 'Add new'}</button><section className="panel placeholder-panel"><div className="empty-icon"><SlidersHorizontal size={24}/></div><h2>{active} management</h2><p>This section is ready for your {active.toLowerCase()} workflows. Use the controls above to get started.</p><button className="outline-button">Configure {active.toLowerCase()}</button></section></div> }

export default function Page() { const [active, setActive] = useState<Section>('Overview'); const [mobileOpen, setMobileOpen] = useState(false); return <div className="admin-shell"><Sidebar active={active} setActive={setActive} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/><div className="main-area"><Header active={active} setMobileOpen={setMobileOpen}/><main className="main-content">{active === 'Overview' ? <Overview /> : <DataSection active={active}/>}</main></div>{mobileOpen && <button className="scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}</div> }
