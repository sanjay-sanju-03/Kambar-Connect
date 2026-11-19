import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { loadSchedule } from './api';
import { fallbackSchedule, formatTime, getTripStatus, nextTrip, toTrips } from './data';
import './styles.css';

const copy = {
  en: {
    brand: 'Kasargod Bus Guide', tagline: 'Find your next bus.',
    find: 'Find buses', timetable: 'Full timetable', home: 'Search', details: 'Bus details',
    from: 'From', to: 'To', date: 'Travel date', time: 'Around what time?', next: 'Next bus',
    scheduled: 'Bus timetable · Not live GPS', sample: 'Community timetable', route: 'Route',
    stops: 'Stops', arrival: 'Expected arrival', departure: 'Departure', duration: 'Duration',
    everyDay: 'Every day', viewRoute: 'View route', viewSchedule: 'View schedule', noMore: 'No more scheduled buses today',
    noMoreText: 'Try another date or check the full timetable for this direction.', upcoming: 'Upcoming',
    soon: 'Departing soon', passed: 'Schedule passed', tomorrow: 'First bus tomorrow',
    updated: 'Last updated',     correction: 'Timetable notice',
    correctionText: 'The timings may not be accurate and buses may be delayed. Please allow extra time. Sorry for the inconvenience.',
    admin: 'Admin-ready data', confirmed: 'Sample / approximate', language: 'മലയാളം', search: 'Search buses or stops',
  },
  ml: {
    brand: 'കാസർഗോഡ് ബസ് ഗൈഡ്', tagline: 'അടുത്ത ബസ് കണ്ടെത്തുക.',
    find: 'ബസുകൾ കണ്ടെത്തുക', timetable: 'സമയപ്പട്ടിക', home: 'തിരയുക', details: 'ബസ് വിവരങ്ങൾ',
    from: 'എവിടെ നിന്ന്', to: 'എവിടേക്ക്', date: 'യാത്രാ തീയതി', time: 'ഏകദേശ സമയം', next: 'അടുത്ത ബസ്',
    scheduled: 'ബസ് സമയപ്പട്ടിക · ലൈവ് GPS അല്ല', sample: 'സാമൂഹിക സമയപ്പട്ടിക', route: 'റൂട്ട്', stops: 'സ്റ്റോപ്പുകൾ',
    arrival: 'പ്രതീക്ഷിക്കുന്ന എത്തിച്ചേരൽ', departure: 'പുറപ്പെടൽ', duration: 'യാത്രാ സമയം', everyDay: 'എല്ലാ ദിവസവും',
    viewRoute: 'റൂട്ട് കാണുക', viewSchedule: 'സമയപ്പട്ടിക കാണുക', noMore: 'ഇന്ന് ഇനി ബസുകളില്ല',
    noMoreText: 'മറ്റൊരു തീയതി തിരഞ്ഞെടുക്കുക അല്ലെങ്കിൽ മുഴുവൻ സമയപ്പട്ടിക കാണുക.', upcoming: 'വരാനിരിക്കുന്നത്',
    soon: 'ഉടൻ പുറപ്പെടും', passed: 'സമയം കഴിഞ്ഞു', tomorrow: 'നാളെ ആദ്യ ബസ്', updated: 'അവസാനം പുതുക്കിയത്',
    correction: 'സമയപ്പട്ടിക അറിയിപ്പ്', correctionText: 'സമയങ്ങൾ കൃത്യമായി ഉണ്ടായിരിക്കില്ല, ബസ് വൈകിയേക്കാം. അധിക സമയം അനുവദിക്കണം. അസൗകര്യംക്കായി ക്ഷമിക്കണം.', admin: 'അഡ്മിൻ ഡാറ്റ', confirmed: 'മാതൃക / ഏകദേശം', language: 'English', search: 'ബസുകളോ സ്റ്റോപ്പുകളോ തിരയുക',
  },
};

function Icon({ name, size = 19 }) {
  const paths = {
    bus: <><rect x="4" y="4" width="16" height="13" rx="3" /><path d="M7 17v3M17 17v3M4 10h16M8 14h.01M16 14h.01" /></>,
    arrow: <><path d="M4 12h16M14 6l6 6-6 6" /></>, search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
    clock: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></>, calendar: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>,
    swap: <><path d="M7 7h12l-3-3M17 17H5l3 3" /></>, chevron: <path d="m9 18 6-6-6-6" />, back: <path d="m15 18-6-6 6-6" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function TripCard({ trip, route, now, t, onDetails }) {
  const status = getTripStatus(trip, now);
  const statusText = status === 'soon' ? t.soon : status === 'passed' ? t.passed : t.upcoming;
  return <article className={`trip-card ${status}`}>
    <div className="trip-card-top"><span className="trip-icon"><Icon name="bus" /></span><span className={`status-pill ${status}`}>{statusText}</span></div>
    <div className="trip-card-main"><div><h3>{trip.name}</h3><p className="muted">{route.from} <Icon name="arrow" size={13} /> {route.to}</p></div><strong className="trip-departure">{formatTime(trip.departure)}</strong></div>
    <div className="trip-meta"><span><small>{t.arrival}</small>{trip.arrival ? formatTime(trip.arrival) : '—'}</span><span><small>{t.duration}</small>{trip.duration || '—'}</span><span><small>{t.stops}</small>{trip.stops?.length || 2}</span></div>
    <div className="trip-actions"><button className="text-button" onClick={() => onDetails(trip)}>{t.viewRoute} <Icon name="chevron" size={15} /></button><span className="data-note">{trip.confirmed ? 'Confirmed' : t.confirmed}</span></div>
  </article>;
}

function App() {
  const [language, setLanguage] = useState('en');
  const [schedule, setSchedule] = useState(null);
  const [routeId, setRouteId] = useState('new-bus-stand-kambar');
  const [view, setView] = useState(window.location.pathname === '/admin' ? 'admin' : 'home');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [query, setQuery] = useState('');
  const [travelDate, setTravelDate] = useState(new Date().toISOString().slice(0, 10));
  const [aroundTime, setAroundTime] = useState('');
  const [now, setNow] = useState(new Date());
  const [adminAuthorized, setAdminAuthorized] = useState(false);
  const [adminLoading, setAdminLoading] = useState(window.location.pathname === '/admin');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [scheduleJson, setScheduleJson] = useState('');
  const t = copy[language];
  useEffect(() => {
    loadSchedule().then((data) => { setSchedule(data); setScheduleJson(JSON.stringify(data, null, 2)); }).catch(() => { setSchedule(fallbackSchedule); setScheduleJson(JSON.stringify(fallbackSchedule, null, 2)); });
    const timer = setInterval(() => setNow(new Date()), 30000);
    const onPopState = () => setView(window.location.pathname === '/admin' ? 'admin' : 'home');
    window.addEventListener('popstate', onPopState);
    if (window.location.pathname === '/admin') checkAdminSession();
    return () => { clearInterval(timer); window.removeEventListener('popstate', onPopState); };
  }, []);
  const route = schedule?.routes.find((item) => item.id === routeId) || schedule?.routes[0];
  const trips = useMemo(() => {
    if (!route) return [];
    const value = query.trim().toLowerCase();
    const selectedMinutes = aroundTime ? Number(aroundTime.split(':')[0]) * 60 + Number(aroundTime.split(':')[1]) : null;
    return toTrips(route).filter((trip) => (!value || `${trip.name} ${trip.stops.join(' ')}`.toLowerCase().includes(value)) && (selectedMinutes === null || trip.minutes >= selectedMinutes));
  }, [route, query, aroundTime]);
  const next = route ? nextTrip(route, now) : null;
  const openDetails = (trip) => { setSelectedTrip(trip); setView('details'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const swapRoute = () => setRouteId(routeId === 'new-bus-stand-kambar' ? 'kambar-new-bus-stand' : 'new-bus-stand-kambar');
  const openAdmin = () => { window.history.pushState({}, '', '/admin'); setView('admin'); setAdminLoading(false); };
  const openHome = () => { window.history.pushState({}, '', '/'); setView('home'); };
  const openTimetable = () => { window.history.pushState({}, '', '/'); setView('timetable'); };
  const checkAdminSession = async () => {
    setAdminLoading(true);
    try {
      const response = await fetch('/api/admin/session', { credentials: 'include' });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setAdminAuthorized(true);
      setAdminEmail(data.email);
    } catch {
      setAdminAuthorized(false);
    } finally {
      setAdminLoading(false);
    }
  };
  const loginAdmin = async (event) => {
    event.preventDefault();
    setAdminError('');
    setAdminSuccess('');
    const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email: adminEmail, password: adminPassword }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setAdminError(data.error || 'Login failed'); return; }
    setAdminAuthorized(true);
    setAdminPassword('');
  };
  const logoutAdmin = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    setAdminAuthorized(false);
  };
  const saveSchedule = async (event) => {
    event.preventDefault();
    setAdminError('');
    setAdminSuccess('');
    let parsed;
    try { parsed = JSON.parse(scheduleJson); }
    catch { setAdminError('The JSON is not valid. Check brackets and commas.'); return; }
    if (!Array.isArray(parsed.routes)) { setAdminError('Schedule JSON must contain a routes array.'); return; }
    const response = await fetch('/api/admin/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(parsed),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setAdminError(data.error || 'Unable to save schedule'); return; }
    setSchedule(data);
    setScheduleJson(JSON.stringify(data, null, 2));
    setAdminSuccess('Schedule saved successfully.');
  };
  if (!schedule || !route || !next) return <div className="loading" role="status" aria-live="polite"><div className="loading-bus"><div className="brand-mark"><Icon name="bus" size={28} /></div><span className="loading-road" /></div><p>Loading bus timetable…</p></div>;

  return <div className="app-shell">
    <Analytics />
    <header className="topbar page-width"><button className="brand" onClick={openHome}><span className="brand-mark"><Icon name="bus" size={22} /></span><span>{t.brand}</span></button><nav><button className={view === 'home' ? 'nav-active' : ''} onClick={openHome}>{t.home}</button><button className={view === 'timetable' ? 'nav-active' : ''} onClick={openTimetable}>{t.timetable}</button></nav><button className="language-button" onClick={() => setLanguage(language === 'en' ? 'ml' : 'en')}><span>◉</span>{t.language}</button></header>
    <main className="page-width">
      {view === 'admin' ? <section className="admin-page"><div className="page-heading"><span className="eyebrow">Protected area</span><h1>Timetable admin</h1><p>Add, edit, or remove buses and timings in the live schedule.</p></div>{adminLoading ? <div className="notice-card">Checking your admin session…</div> : adminAuthorized ? <><div className="admin-toolbar"><div><strong>Signed in</strong><span>{adminEmail}</span></div><button className="outline-button" onClick={logoutAdmin}>Sign out</button></div><form className="admin-editor" onSubmit={saveSchedule}><label htmlFor="schedule-json">Schedule JSON</label><textarea id="schedule-json" value={scheduleJson} onChange={(event) => setScheduleJson(event.target.value)} spellCheck="false" /><div className="admin-actions">{adminError && <span className="admin-error" role="alert">{adminError}</span>}{adminSuccess && <span className="admin-success" role="status">{adminSuccess}</span>}<button className="primary-button" type="submit">Save schedule</button></div></form></> : <form className="admin-login" onSubmit={loginAdmin}><h2>Admin sign in</h2><label>Email<input type="email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} required autoComplete="email" /></label><label>Password<input type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} required autoComplete="current-password" /></label>{adminError && <span className="admin-error" role="alert">{adminError}</span>}<button className="primary-button" type="submit">Sign in</button></form>}</section> :
      view === 'details' && selectedTrip ? <section className="details-page"><button className="back-button" onClick={openHome}><Icon name="back" size={18} /> {t.home}</button><div className="details-hero"><span className="eyebrow">{t.details}</span><h1>{selectedTrip.name}</h1><p>{route.from} <Icon name="arrow" size={15} /> {route.to}</p><div className="detail-time-grid"><div><small>{t.departure}</small><strong>{formatTime(selectedTrip.departure)}</strong></div><div><small>{t.arrival}</small><strong>{selectedTrip.arrival ? formatTime(selectedTrip.arrival) : '—'}</strong></div><div><small>{t.duration}</small><strong>{selectedTrip.duration || '—'}</strong></div></div></div><div className="detail-content"><div><h2>{t.route}</h2><div className="stop-line">{(selectedTrip.stops || [route.from, route.to]).map((stop, index) => <div className="stop" key={stop}><span className={index === 0 || index === selectedTrip.stops.length - 1 ? 'stop-dot terminal' : 'stop-dot'} /><span>{stop}</span></div>)}</div></div><aside className="notice-card"><strong>{t.scheduled}</strong><p>Arrival times and intermediate stops have not been provided yet.</p><small>{t.updated}: {schedule.updatedAt}</small></aside></div></section> :
      view === 'timetable' ? <section className="timetable-page"><div className="page-heading"><span className="eyebrow">{t.timetable}</span><h1>{t.brand}</h1><p>{t.scheduled}</p></div><RoutePicker route={route} schedule={schedule} routeId={routeId} setRouteId={setRouteId} t={t} /><div className="list-toolbar"><h2>{route.from} <Icon name="arrow" size={18} /> {route.to}</h2><span>{route.trips.length} services · {schedule.updatedAt}</span></div><div className="trip-list">{toTrips(route).map((trip) => <TripCard key={trip.id} trip={trip} route={route} now={now} t={t} onDetails={openDetails} />)}</div></section> :
      <><section className="hero"><span className="eyebrow"><span className="status-dot" />{t.scheduled}</span><h1>{t.tagline}</h1></section><section className="search-panel"><div className="search-fields"><label>{t.from}<select value={routeId} onChange={(event) => setRouteId(event.target.value)}>{schedule.routes.map((item) => <option key={item.id} value={item.id}>{item.from}</option>)}</select></label><button className="swap-button" onClick={swapRoute} aria-label="Swap direction"><Icon name="swap" /></button><label>{t.to}<select value={routeId} onChange={(event) => setRouteId(event.target.value)}>{schedule.routes.map((item) => <option key={item.id} value={item.id}>{item.to}</option>)}</select></label><label><span><Icon name="calendar" size={15} /> {t.date}</span><input type="date" value={travelDate} onChange={(event) => setTravelDate(event.target.value)} /></label><label><span><Icon name="clock" size={15} /> {t.time}</span><input type="time" value={aroundTime} onChange={(event) => setAroundTime(event.target.value)} /></label></div><button className="primary-button" onClick={() => setView('home')}>{t.find} <Icon name="arrow" size={17} /></button></section><RoutePicker route={route} schedule={schedule} routeId={routeId} setRouteId={setRouteId} t={t} /><section className="results-section"><div className="section-heading"><div><span className="eyebrow">{next.tomorrow ? t.tomorrow : t.next}</span><h2>{route.from} <Icon name="arrow" size={19} /> {route.to}</h2></div><button className="outline-button" onClick={() => setView('timetable')}>{t.timetable}</button></div><div className="next-highlight"><div><small>{next.tomorrow ? t.tomorrow : t.next}</small><strong>{formatTime(next.trip.departure)}</strong><span>{next.trip.name}</span></div><div className="next-highlight-route">{route.from}<Icon name="arrow" size={18} />{route.to}</div></div><div className="list-heading"><h2>{t.find}</h2><span>{trips.length} services</span></div><div className="search-wrap"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} /></div>{trips.length ? <div className="trip-list">{trips.map((trip) => <TripCard key={trip.id} trip={trip} route={route} now={now} t={t} onDetails={openDetails} />)}</div> : <div className="empty-state"><h3>{t.noMore}</h3><p>{t.noMoreText}</p></div>}</section><section className="info-card"><div className="info-icon"><Icon name="clock" /></div><div><strong>{t.scheduled}</strong><p>{t.correctionText}</p></div><span className="info-version">{schedule.version}</span></section></>}
    </main>
    <footer className="page-width"><span>{t.updated}: {schedule.updatedAt}</span><span>·</span><span>{t.sample}</span></footer>
  </div>;
}

function RoutePicker({ route, schedule, routeId, setRouteId, t }) {
  return <div className="route-picker" aria-label="Choose a direction">{schedule.routes.map((item) => <button key={item.id} className={routeId === item.id ? 'route-option selected' : 'route-option'} onClick={() => setRouteId(item.id)}><span className="route-icon"><Icon name="bus" size={20} /></span><span><small>{t.route}</small><strong>{item.from} <Icon name="arrow" size={14} /> {item.to}</strong></span><Icon name="chevron" size={19} /></button>)}</div>;
}

createRoot(document.getElementById('root')).render(<App />);
