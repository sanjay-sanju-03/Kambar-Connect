import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { loadSchedule } from './api';
import { fallbackSchedule } from './data';
import './styles.css';

// ─── i18n ────────────────────────────────────────────────────────────────────
const copy = {
  en: {
    brand: 'Kasargod Bus Guide', tagline: 'Your next bus, right now.',
    home: 'Home', timetable: 'Timetable', details: 'Bus Details',
    from: 'From', to: 'To', route: 'Route', stops: 'Stops',
    arrival: 'Arrives', departure: 'Departs', duration: 'Duration',
    next: 'Next Bus', bothRoutes: 'Live Next Bus', scheduled: 'Scheduled · Not Live GPS',
    sample: 'Community timetable', everyDay: 'Every day',
    viewRoute: 'View route', seeAll: 'See all buses',
    noMore: 'No more buses today', noMoreText: 'Check the full timetable or try another direction.',
    upcoming: 'Upcoming', soon: 'Soon', boarding: 'Boarding', passed: 'Departed',
    tomorrow: 'Tomorrow', updated: 'Updated',
    notice: 'Timings are approximate. Buses may be delayed. Allow extra time.',
    confirmed: 'Approx.', language: 'മലയാളം',
    search: 'Search by bus name or stop…', admin: 'Admin',
    liveTime: 'Your local time', inMin: 'min', awayText: 'away',
    firstTomorrow: 'First bus tomorrow', allDone: 'All buses done for today',
    timetableNotice: 'Full schedule',
  },
  ml: {
    brand: 'കാസർഗോഡ് ബസ് ഗൈഡ്', tagline: 'അടുത്ത ബസ്, ഇപ്പോൾ.',
    home: 'ഹോം', timetable: 'സമയപ്പട്ടിക', details: 'ബസ് വിവരങ്ങൾ',
    from: 'എവിടെ നിന്ന്', to: 'എവിടേക്ക്', route: 'റൂട്ട്', stops: 'സ്റ്റോപ്പ്',
    arrival: 'എത്തിച്ചേരൽ', departure: 'പുറപ്പെടൽ', duration: 'ദൈർഘ്യം',
    next: 'അടുത്ത ബസ്', bothRoutes: 'ലൈവ് ബസ്', scheduled: 'ഷെഡ്യൂൾ · ലൈവ് GPS അല്ല',
    sample: 'സാമൂഹിക സമയപ്പട്ടിക', everyDay: 'എല്ലാ ദിവസവും',
    viewRoute: 'റൂട്ട് കാണുക', seeAll: 'എല്ലാ ബസ്',
    noMore: 'ഇന്ന് ഇനി ബസില്ല', noMoreText: 'ടൈംടേബിൾ കാണുക അല്ലെങ്കിൽ മറ്റൊരു ദിശ ശ്രമിക്കുക.',
    upcoming: 'വരുന്നു', soon: 'ഉടൻ', boarding: 'ബോർഡ്', passed: 'പോയി',
    tomorrow: 'നാളെ', updated: 'അപ്ഡേറ്റ്',
    notice: 'സമയം ഏകദേശം മാത്രം. ബസ് വൈകാം. കൂടുതൽ സമയം അനുവദിക്കുക.',
    confirmed: 'ഏകദേശം', language: 'English',
    search: 'ബസ് പേര് അല്ലെങ്കിൽ സ്റ്റോപ്പ് തിരയുക…', admin: 'അഡ്മിൻ',
    liveTime: 'നിങ്ങളുടെ സമയം', inMin: 'മിനിറ്റ്', awayText: 'ദൂരെ',
    firstTomorrow: 'നാളെ ആദ്യ ബസ്', allDone: 'ഇന്നത്തെ ബസ് തീർന്നു',
    timetableNotice: 'സമ്പൂർണ്ണ ക്രമം',
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function toTrips(route) {
  return route.trips.map((trip, i) => {
    const [h, m] = trip.departure.split(':').map(Number);
    return { ...trip, id: trip.id || `${route.id}-${i}`, hour: h, minute: m, minutes: h * 60 + m };
  });
}

function formatTime(time) {
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

function formatClock(date) {
  const h = date.getHours(), m = date.getMinutes();
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

function formatDate(date) {
  return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
}

function minsUntil(trip, now) {
  return trip.minutes - (now.getHours() * 60 + now.getMinutes());
}

function getStatus(trip, now) {
  const diff = minsUntil(trip, now);
  if (diff < -1) return 'passed';
  if (diff <= 4) return 'boarding';
  if (diff <= 25) return 'soon';
  return 'upcoming';
}

function nextBus(route, now) {
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const trips = toTrips(route);
  const trip = trips.find(t => t.minutes >= nowMins);
  return { trip: trip || trips[0], tomorrow: !trip };
}

// ─── Icons ───────────────────────────────────────────────────────────────────
function Icon({ name, size = 20 }) {
  const p = {
    bus: <><rect x="3" y="4" width="18" height="14" rx="3"/><path d="M7 18v2M17 18v2M3 10h18M8 14h.01M16 14h.01"/></>,
    arrow: <><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>,
    back: <path d="m15 18-6-6 6-6"/>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></>,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/></>,
    swap: <><path d="M7 7h12l-3-3M17 17H5l3 3"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></>,
    close: <path d="M18 6 6 18M6 6l12 12"/>,
    spark: <path d="m13 2-2 6.9L7 11l4.3 2.4L10 21l5-5.7 5 1.7-3.5-5.4L19 7l-6 .6z"/>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {p[name]}
    </svg>
  );
}

// ─── Loading ─────────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-wrap">
        <div className="loading-icon">
          <div className="loading-pulse" />
          <div className="loading-bus"><Icon name="bus" size={28} /></div>
        </div>
        <p className="loading-label">Loading timetable…</p>
        <div className="loading-track"><div className="loading-bar" /></div>
      </div>
    </div>
  );
}

// ─── Live Clock ───────────────────────────────────────────────────────────────
function LiveClock({ now, t }) {
  return (
    <div className="live-clock">
      <span className="live-green-dot" />
      <span className="live-time-text">{formatClock(now)}</span>
      <span className="live-label">{t.liveTime}</span>
    </div>
  );
}

// ─── Countdown Badge ──────────────────────────────────────────────────────────
function CountdownBadge({ mins, t, variant = 'card' }) {
  if (mins <= -2) return null;
  let cls, label;
  if (mins <= 1) { cls = 'badge-boarding'; label = t.boarding; }
  else if (mins <= 4) { cls = 'badge-boarding'; label = `${mins} ${t.inMin}`; }
  else if (mins <= 25) { cls = 'badge-soon'; label = `${mins} ${t.inMin}`; }
  else { cls = 'badge-upcoming'; label = `${mins} ${t.inMin}`; }
  return <span className={`countdown-badge ${cls} variant-${variant}`}>{label}</span>;
}

// ─── Next Bus Hero Card ───────────────────────────────────────────────────────
function NextBusCard({ route, now, t, onSeeAll }) {
  const { trip, tomorrow } = nextBus(route, now);
  const trips = toTrips(route);
  const full = trips.find(tr => tr.departure === trip.departure) || { ...trip, minutes: 0 };
  const mins = tomorrow ? null : minsUntil(full, now);
  const status = tomorrow ? 'tomorrow' : getStatus(full, now);
  const isUrgent = status === 'boarding' || status === 'soon';

  return (
    <div className={`next-card next-card-${status}`}>
      <div className="next-card-orb" />
      <div className="next-card-orb2" />
      <div className="next-card-route">
        <span className="next-card-from">{route.from}</span>
        <Icon name="arrow" size={13} />
        <span className="next-card-to">{route.to}</span>
      </div>
      <div className="next-card-main">
        <span className="next-card-time">{formatTime(trip.departure)}</span>
        {!tomorrow && mins !== null && <CountdownBadge mins={mins} t={t} variant="hero" />}
        {tomorrow && <span className="countdown-badge badge-tomorrow variant-hero">{t.firstTomorrow}</span>}
      </div>
      <div className="next-card-bus-name">{trip.name}</div>
      <div className="next-card-footer">
        {isUrgent && <span className="next-card-pulse-label"><span className="inline-dot" />{status === 'boarding' ? t.boarding : t.soon}</span>}
        <button className="next-card-cta" onClick={onSeeAll}>{t.seeAll} <Icon name="chevron" size={14} /></button>
      </div>
    </div>
  );
}

// ─── Trip Card ────────────────────────────────────────────────────────────────
function TripCard({ trip, route, now, t, onDetails }) {
  const status = getStatus(trip, now);
  const mins = minsUntil(trip, now);
  const statusLabel = { boarding: t.boarding, soon: t.soon, passed: t.passed, upcoming: t.upcoming }[status];

  return (
    <article className={`trip-card trip-${status}`} onClick={() => onDetails(trip)}>
      <div className="trip-card-top">
        <div className={`trip-bus-mark trip-bus-${status}`}><Icon name="bus" size={16} /></div>
        <span className={`trip-pill trip-pill-${status}`}>{statusLabel}</span>
        {status !== 'passed' && <CountdownBadge mins={mins} t={t} variant="card" />}
      </div>
      <div className="trip-card-mid">
        <div>
          <h3 className="trip-name">{trip.name}</h3>
          <p className="trip-subroute">{route.from} <Icon name="arrow" size={10} /> {route.to}</p>
        </div>
        <span className={`trip-depart trip-depart-${status}`}>{formatTime(trip.departure)}</span>
      </div>
      <div className="trip-card-bot">
        <span><small>{t.stops}</small>{trip.stops?.length || 2}</span>
        <span><small>{t.arrival}</small>{trip.arrival ? formatTime(trip.arrival) : '—'}</span>
        <span><small>{t.duration}</small>{trip.duration || '—'}</span>
        <button className="trip-cta" onClick={e => { e.stopPropagation(); onDetails(trip); }}>{t.viewRoute} <Icon name="chevron" size={12} /></button>
      </div>
    </article>
  );
}

// ─── Route Pills ──────────────────────────────────────────────────────────────
function RoutePills({ schedule, routeId, setRouteId }) {
  return (
    <div className="route-pills">
      {schedule.routes.map(r => (
        <button key={r.id} className={`route-pill ${routeId === r.id ? 'active' : ''}`} onClick={() => setRouteId(r.id)}>
          <span className="route-pill-icon"><Icon name="bus" size={14} /></span>
          <span>{r.from}</span><Icon name="arrow" size={12} /><span>{r.to}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Search Bar ───────────────────────────────────────────────────────────────
function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="search-bar">
      <Icon name="search" size={17} />
      <input type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      {value && <button className="search-clear" onClick={() => onChange('')}><Icon name="close" size={15} /></button>}
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  const [lang, setLang] = useState('en');
  const [schedule, setSchedule] = useState(null);
  const [routeId, setRouteId] = useState('new-bus-stand-kambar');
  const [view, setView] = useState(window.location.pathname === '/admin' ? 'admin' : 'home');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [query, setQuery] = useState('');
  const [aroundTime, setAroundTime] = useState('');
  const [now, setNow] = useState(new Date());
  const [adminOk, setAdminOk] = useState(false);
  const [adminLoading, setAdminLoading] = useState(window.location.pathname === '/admin');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPw, setAdminPw] = useState('');
  const [adminErr, setAdminErr] = useState('');
  const [adminOkMsg, setAdminOkMsg] = useState('');
  const [schedJson, setSchedJson] = useState('');
  const t = copy[lang];

  useEffect(() => {
    loadSchedule()
      .then(d => { setSchedule(d); setSchedJson(JSON.stringify(d, null, 2)); })
      .catch(() => { setSchedule(fallbackSchedule); setSchedJson(JSON.stringify(fallbackSchedule, null, 2)); });
    const timer = setInterval(() => setNow(new Date()), 1000);
    const onPop = () => setView(window.location.pathname === '/admin' ? 'admin' : 'home');
    window.addEventListener('popstate', onPop);
    if (window.location.pathname === '/admin') checkSession();
    return () => { clearInterval(timer); window.removeEventListener('popstate', onPop); };
  }, []);

  const route = schedule?.routes.find(r => r.id === routeId) || schedule?.routes[0];

  const trips = useMemo(() => {
    if (!route) return [];
    const q = query.trim().toLowerCase();
    const selMins = aroundTime
      ? Number(aroundTime.split(':')[0]) * 60 + Number(aroundTime.split(':')[1])
      : null;
    return toTrips(route).filter(tr =>
      (!q || `${tr.name} ${tr.stops.join(' ')}`.toLowerCase().includes(q)) &&
      (selMins === null || tr.minutes >= selMins)
    );
  }, [route, query, aroundTime]);

  const goHome = () => { window.history.pushState({}, '', '/'); setView('home'); };
  const goTimetable = () => { window.history.pushState({}, '', '/'); setView('timetable'); };
  const goAdmin = () => { window.history.pushState({}, '', '/admin'); setView('admin'); setAdminLoading(false); };
  const goDetails = trip => { setSelectedTrip(trip); setView('details'); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const checkSession = async () => {
    setAdminLoading(true);
    try {
      const r = await fetch('/api/admin/session', { credentials: 'include' });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setAdminOk(true); setAdminEmail(d.email);
    } catch { setAdminOk(false); } finally { setAdminLoading(false); }
  };

  const loginAdmin = async e => {
    e.preventDefault(); setAdminErr(''); setAdminOkMsg('');
    const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email: adminEmail, password: adminPw }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setAdminErr(d.error || 'Login failed'); return; }
    setAdminOk(true); setAdminPw('');
  };

  const logoutAdmin = async () => { await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' }); setAdminOk(false); };

  const saveSchedule = async e => {
    e.preventDefault(); setAdminErr(''); setAdminOkMsg('');
    let parsed;
    try { parsed = JSON.parse(schedJson); } catch { setAdminErr('Invalid JSON — check brackets and commas.'); return; }
    if (!Array.isArray(parsed.routes)) { setAdminErr('JSON must have a "routes" array.'); return; }
    const r = await fetch('/api/admin/schedule', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(parsed) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setAdminErr(d.error || 'Save failed'); return; }
    setSchedule(d); setSchedJson(JSON.stringify(d, null, 2)); setAdminOkMsg('Schedule saved successfully!');
  };

  if (!schedule || !route) return <LoadingScreen />;

  return (
    <div className="app-shell">
      {/* ── TOP BAR ── */}
      <header className="topbar">
        <div className="topbar-inner page-width">
          <button className="brand-btn" onClick={goHome}>
            <span className="brand-icon"><Icon name="bus" size={20} /></span>
            <span className="brand-name">{t.brand}</span>
          </button>
          <nav className="topbar-nav">
            <button className={`nav-btn ${view === 'home' ? 'active' : ''}`} onClick={goHome}>{t.home}</button>
            <button className={`nav-btn ${view === 'timetable' ? 'active' : ''}`} onClick={goTimetable}>{t.timetable}</button>
          </nav>
          <button className="lang-btn" onClick={() => setLang(lang === 'en' ? 'ml' : 'en')}>{t.language}</button>
        </div>
      </header>

      <main className="main page-width">

        {/* ══ ADMIN ══ */}
        {view === 'admin' && (
          <section className="admin-section anim-fadein">
            <div className="page-heading">
              <span className="eyebrow">🔐 Protected area</span>
              <h1>Timetable Admin</h1>
              <p>Edit bus names and departure times in the live schedule.</p>
            </div>
            {adminLoading ? (
              <div className="soft-notice">Checking admin session…</div>
            ) : adminOk ? (
              <>
                <div className="admin-toolbar">
                  <div><strong>Signed in</strong><span>{adminEmail}</span></div>
                  <button className="btn-outline" onClick={logoutAdmin}>Sign out</button>
                </div>
                <form className="admin-editor" onSubmit={saveSchedule}>
                  <label htmlFor="sched">Schedule JSON</label>
                  <textarea id="sched" value={schedJson} onChange={e => setSchedJson(e.target.value)} spellCheck="false" />
                  <div className="admin-actions">
                    {adminErr && <span className="admin-err" role="alert">{adminErr}</span>}
                    {adminOkMsg && <span className="admin-ok" role="status">{adminOkMsg}</span>}
                    <button className="btn-primary" type="submit">Save schedule</button>
                  </div>
                </form>
              </>
            ) : (
              <form className="admin-login" onSubmit={loginAdmin}>
                <h2>Admin sign in</h2>
                <label>Email<input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required autoComplete="email" /></label>
                <label>Password<input type="password" value={adminPw} onChange={e => setAdminPw(e.target.value)} required autoComplete="current-password" /></label>
                {adminErr && <span className="admin-err" role="alert">{adminErr}</span>}
                <button className="btn-primary" type="submit">Sign in</button>
              </form>
            )}
          </section>
        )}

        {/* ══ DETAILS ══ */}
        {view === 'details' && selectedTrip && (
          <section className="details-section anim-fadein">
            <button className="back-btn" onClick={goHome}><Icon name="back" size={18} /> {t.home}</button>
            <div className="details-hero">
              <span className="eyebrow-light">{t.details}</span>
              <h1>{selectedTrip.name}</h1>
              <p className="details-direction">{route.from} <Icon name="arrow" size={14} /> {route.to}</p>
              <div className="details-times">
                <div><small>{t.departure}</small><strong>{formatTime(selectedTrip.departure)}</strong></div>
                <div><small>{t.arrival}</small><strong>{selectedTrip.arrival ? formatTime(selectedTrip.arrival) : '—'}</strong></div>
                <div><small>{t.duration}</small><strong>{selectedTrip.duration || '—'}</strong></div>
              </div>
            </div>
            <div className="details-body">
              <div>
                <h2>{t.route}</h2>
                <div className="stop-line">
                  {(selectedTrip.stops || [route.from, route.to]).map((stop, i, arr) => (
                    <div className="stop" key={stop + i}>
                      <span className={`stop-dot ${i === 0 || i === arr.length - 1 ? 'terminal' : ''}`} />
                      <span>{stop}</span>
                    </div>
                  ))}
                </div>
              </div>
              <aside className="soft-notice-card">
                <strong>{t.scheduled}</strong>
                <p>Arrival times and intermediate stops are not yet confirmed.</p>
                <small>{t.updated}: {schedule.updatedAt}</small>
              </aside>
            </div>
          </section>
        )}

        {/* ══ FULL TIMETABLE ══ */}
        {view === 'timetable' && (
          <section className="timetable-section anim-fadein">
            <div className="page-heading">
              <span className="eyebrow">{t.timetableNotice}</span>
              <h1>{t.brand}</h1>
              <p>{t.scheduled}</p>
            </div>
            <RoutePills schedule={schedule} routeId={routeId} setRouteId={setRouteId} />
            <div className="list-header">
              <h2>{route.from} <Icon name="arrow" size={16} /> {route.to}</h2>
              <span>{route.trips.length} services · {schedule.updatedAt}</span>
            </div>
            <SearchBar value={query} onChange={setQuery} placeholder={t.search} />
            <div className="trip-grid">
              {toTrips(route).map(trip => (
                <TripCard key={trip.id} trip={trip} route={route} now={now} t={t} onDetails={goDetails} />
              ))}
            </div>
          </section>
        )}

        {/* ══ HOME ══ */}
        {view === 'home' && (
          <>
            {/* Hero + live clock */}
            <section className="home-hero anim-fadein">
              <div className="hero-left">
                <span className="eyebrow"><span className="amber-dot" />{t.scheduled}</span>
                <h1>{t.tagline}</h1>
              </div>
              <LiveClock now={now} t={t} />
            </section>

            {/* Date bar */}
            <div className="date-bar anim-fadein-d1">
              <Icon name="calendar" size={14} />
              <span>{formatDate(now)}</span>
            </div>

            {/* ── REAL-TIME NEXT BUS for BOTH routes ── */}
            <section className="both-routes-section anim-fadein-d2">
              <div className="section-eyebrow">
                <Icon name="spark" size={14} />
                {t.bothRoutes}
              </div>
              <div className="next-cards-grid">
                {schedule.routes.map(r => (
                  <NextBusCard
                    key={r.id}
                    route={r}
                    now={now}
                    t={t}
                    onSeeAll={() => { setRouteId(r.id); goTimetable(); }}
                  />
                ))}
              </div>
            </section>

            {/* ── FILTER + SEARCH ── */}
            <section className="filter-section anim-fadein-d3">
              <RoutePills schedule={schedule} routeId={routeId} setRouteId={setRouteId} />
              <div className="filter-row">
                <SearchBar value={query} onChange={setQuery} placeholder={t.search} />
                <label className="time-filter-label">
                  <Icon name="clock" size={15} />
                  <input type="time" value={aroundTime} onChange={e => setAroundTime(e.target.value)} />
                </label>
              </div>
            </section>

            {/* ── TRIP LIST ── */}
            <section className="results-section anim-fadein-d4">
              <div className="list-header">
                <h2>{route.from} <Icon name="arrow" size={16} /> {route.to}</h2>
                <span>{trips.length} buses</span>
              </div>
              {trips.length ? (
                <div className="trip-grid">
                  {trips.map(trip => (
                    <TripCard key={trip.id} trip={trip} route={route} now={now} t={t} onDetails={goDetails} />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Icon name="bus" size={38} />
                  <h3>{t.noMore}</h3>
                  <p>{t.noMoreText}</p>
                </div>
              )}
            </section>

            {/* Info banner */}
            <div className="info-banner anim-fadein-d5">
              <div className="info-banner-icon"><Icon name="info" size={18} /></div>
              <div>
                <strong>{t.scheduled}</strong>
                <p>{t.notice}</p>
              </div>
              <span className="info-ver">{schedule.version}</span>
            </div>
          </>
        )}
      </main>

      <footer className="footer page-width">
        <span>{t.updated}: {schedule.updatedAt}</span>
        <span>·</span>
        <span>{t.sample}</span>
        <button className="footer-admin-link" onClick={goAdmin}>{t.admin}</button>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
