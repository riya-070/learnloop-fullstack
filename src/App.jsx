import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import logo from './assets/flogo.png';
import './App.css';

const starterTutors = [
  { id: 'demo-1', name: 'Aarav Mehta', subject: 'Data Structures', branch: 'Computer Engineering', year: '4th Year', hourly_rate: 250, rating: 4.9, review_count: 42, bio: 'DSA, interview preparation and problem-solving sessions.' },
  { id: 'demo-2', name: 'Mehak Sharma', subject: 'Database Management', branch: 'Electronics & Computer', year: '3rd Year', hourly_rate: 200, rating: 4.8, review_count: 31, bio: 'SQL, DBMS concepts and query practice in simple language.' },
  { id: 'demo-3', name: 'Kabir Singh', subject: 'Python & AI/ML', branch: 'Computer Science', year: '4th Year', hourly_rate: 300, rating: 4.7, review_count: 28, bio: 'Python foundations, machine learning and project guidance.' },
];

const blankAuth = { name: '', email: '', password: '', role: 'student', subject: '', branch: '', year: '', hourly_rate: 200, bio: '' };
const Icon = ({ children }) => <span className="icon" aria-hidden="true">{children}</span>;

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('learnloopUser') || 'null'));
  const [view, setView] = useState('discover');
  const [tutors, setTutors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [stats, setStats] = useState({ total_bookings: 0, upcoming: 0, completed: 0, favorites: 0 });
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('All subjects');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signup');
  const [authForm, setAuthForm] = useState(blankAuth);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [booking, setBooking] = useState({ subject: '', scheduled_at: '' });
  const [availability, setAvailability] = useState([]);
  const [slot, setSlot] = useState({ day: 'Monday', start_time: '17:00', end_time: '19:00' });
  const [notice, setNotice] = useState('');

  const loadData = useCallback(async () => {
    try {
      const tutorData = await api('/tutors');
      setTutors(tutorData);
      if (user) {
        const [bookingData, dashboardData] = await Promise.all([api('/bookings/me'), api('/dashboard')]);
        setBookings(bookingData); setStats(dashboardData);
        if (user.role === 'student') setFavorites(await api('/favorites'));
        if (user.role === 'tutor') setAvailability(await api(`/availability/${user.id}`));
      }
    } catch {
      setNotice('Start the FastAPI backend to use live accounts and bookings.');
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const displayTutors = tutors.length ? tutors : starterTutors;
  const subjects = useMemo(() => ['All subjects', ...new Set(displayTutors.map(t => t.subject).filter(Boolean))], [displayTutors]);
  const filtered = displayTutors.filter(tutor => {
    const text = `${tutor.name} ${tutor.subject} ${tutor.branch}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (subject === 'All subjects' || tutor.subject === subject);
  });

  const saveSession = (data) => {
    const nextUser = { id: data.user_id, name: data.name, role: data.role };
    localStorage.setItem('learnloopToken', data.access_token);
    localStorage.setItem('learnloopUser', JSON.stringify(nextUser));
    setUser(nextUser); setAuthOpen(false); setNotice(`Welcome to LearnLoop, ${data.name}.`);
  };

  const submitAuth = async (event) => {
    event.preventDefault(); setNotice('Creating your learning space…');
    try {
      const body = authMode === 'login' ? { email: authForm.email, password: authForm.password } : authForm;
      saveSession(await api(`/auth/${authMode}`, { method: 'POST', body: JSON.stringify(body) }));
      setAuthForm(blankAuth);
    } catch (error) { setNotice(error.message); }
  };

  const logout = () => {
    localStorage.removeItem('learnloopToken'); localStorage.removeItem('learnloopUser');
    setUser(null); setBookings([]); setFavorites([]); setView('discover'); setNotice('You have been logged out.');
  };

  const startBooking = async (tutor) => {
    if (!user) { setAuthMode('login'); setAuthOpen(true); setNotice('Log in as a student to book a tutor.'); return; }
    if (user.role !== 'student') { setNotice('Tutor accounts cannot book sessions.'); return; }
    if (String(tutor.id).startsWith('demo')) { setNotice('Create a real tutor account first; these profiles demonstrate the finished design.'); return; }
    setSelectedTutor(tutor); setBooking({ subject: tutor.subject || '', scheduled_at: '' });
    try { setAvailability(await api(`/availability/${tutor.id}`)); } catch { setAvailability([]); }
  };

  const submitBooking = async (event) => {
    event.preventDefault();
    try {
      await api('/bookings', { method: 'POST', body: JSON.stringify({ ...booking, tutor_id: selectedTutor.id }) });
      setSelectedTutor(null); setNotice('Session request sent to your tutor.'); await loadData();
    } catch (error) { setNotice(error.message); }
  };

  const toggleFavorite = async (tutorId) => {
    if (!user) { setAuthOpen(true); setAuthMode('login'); return; }
    const saved = favorites.includes(tutorId);
    try {
      await api(`/favorites/${tutorId}`, { method: saved ? 'DELETE' : 'POST' });
      setFavorites(saved ? favorites.filter(id => id !== tutorId) : [...favorites, tutorId]);
    } catch (error) { setNotice(error.message); }
  };

  const updateBooking = async (id, status) => {
    try { await api(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); setNotice(`Session ${status}.`); await loadData(); }
    catch (error) { setNotice(error.message); }
  };

  const addSlot = async (event) => {
    event.preventDefault();
    try { await api('/availability', { method: 'POST', body: JSON.stringify(slot) }); setNotice('Availability added.'); await loadData(); }
    catch (error) { setNotice(error.message); }
  };

  const navItems = user?.role === 'tutor'
    ? [['dashboard', '▦', 'Overview'], ['bookings', '▣', 'Student requests'], ['availability', '◷', 'Availability']]
    : [['discover', '⌕', 'Discover tutors'], ['bookings', '▣', 'My sessions'], ['favorites', '♡', 'Saved tutors']];

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setView(user ? 'dashboard' : 'discover')}><img src={logo} alt="LearnLoop" /><span>LearnLoop</span></button>
      <nav><a href="#how">How it works</a><a href="#subjects">Subjects</a></nav>
      {user ? <div className="profile-menu"><div className="mini-avatar">{user.name[0]}</div><span>{user.name}</span><button onClick={logout}>Log out</button></div>
        : <div className="auth-actions"><button onClick={() => { setAuthMode('login'); setAuthOpen(true); }}>Log in</button><button className="solid" onClick={() => { setAuthMode('signup'); setAuthOpen(true); }}>Join free</button></div>}
    </header>

    {notice && <button className="toast" onClick={() => setNotice('')}>{notice}<span>×</span></button>}

    <main className={user ? 'workspace' : ''}>
      {user && <aside className="sidebar">
        <p className="sidebar-label">YOUR SPACE</p>
        {navItems.map(([id, icon, label]) => <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}><Icon>{icon}</Icon>{label}</button>)}
        <div className="support-card"><span>?</span><strong>Need help?</strong><p>Contact the LearnLoop team.</p><a href="mailto:contact@learnloop.dev">Get support</a></div>
      </aside>}

      <section className="main-content">
        {!user && <section className="hero-new">
          <div><span className="eyebrow">PEER LEARNING AT TIET</span><h1>Learn from students who have already <em>mastered it.</em></h1><p>Find trusted peer tutors for your exact course, book a time that works, and learn in a way that finally makes sense.</p>
            <div className="hero-search"><Icon>⌕</Icon><input aria-label="Search tutors" placeholder="Try “Data Structures” or “DBMS”" value={query} onChange={e => setQuery(e.target.value)} /><button onClick={() => document.getElementById('tutors').scrollIntoView({ behavior: 'smooth' })}>Find a tutor</button></div>
            <div className="trust-row"><span>✓ Verified student tutors</span><span>✓ Flexible sessions</span><span>✓ Campus-focused help</span></div>
          </div>
          <div className="hero-panel"><div className="floating-note"><span>★</span><div><strong>4.9 average rating</strong><small>from student sessions</small></div></div><div className="mentor-orbit"><div className="orbit-center">LL</div><span className="orbit o1">DSA</span><span className="orbit o2">SQL</span><span className="orbit o3">AI</span><span className="orbit o4">ECE</span></div><div className="floating-booking"><span>✓</span><div><strong>Session confirmed</strong><small>Today · 5:00 PM</small></div></div></div>
        </section>}

        {user && view === 'dashboard' && <><PageTitle kicker="OVERVIEW" title={`Good to see you, ${user.name.split(' ')[0]}`} text="Here is what is happening with your tutoring sessions." /><Stats stats={stats} role={user.role} /><section className="panel"><SectionHead title="Recent requests" action={() => setView('bookings')} /><BookingList items={bookings.slice(0, 3)} user={user} update={updateBooking} /></section></>}

        {(!user || view === 'discover' || view === 'favorites') && <section className="discover" id="tutors">
          <PageTitle kicker={user ? 'DISCOVER' : 'FIND YOUR MATCH'} title={view === 'favorites' ? 'Saved tutors' : 'Tutors who know your coursework'} text={view === 'favorites' ? 'Your shortlist of peer tutors.' : 'Search by name, subject or branch and choose the right mentor for you.'} />
          <div className="filterbar"><label><Icon>⌕</Icon><input placeholder="Search tutors or subjects" value={query} onChange={e => setQuery(e.target.value)} /></label><select value={subject} onChange={e => setSubject(e.target.value)}>{subjects.map(item => <option key={item}>{item}</option>)}</select></div>
          <div className="tutor-grid-new">{(view === 'favorites' ? filtered.filter(t => favorites.includes(t.id)) : filtered).map((tutor, index) => <article className="tutor-card-new" key={tutor.id}>
            <div className={`tutor-avatar color-${index % 3}`}>{tutor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
            <button className={`heart ${favorites.includes(tutor.id) ? 'saved' : ''}`} aria-label="Save tutor" onClick={() => toggleFavorite(tutor.id)}>{favorites.includes(tutor.id) ? '♥' : '♡'}</button>
            <div className="online"><i /> Available this week</div><h3>{tutor.name}</h3><p className="course">{tutor.subject}</p><p className="meta">{tutor.branch} · {tutor.year}</p><p className="bio">{tutor.bio}</p>
            <div className="rating"><span>★ {tutor.rating || 'New'}</span><small>{tutor.review_count ? `${tutor.review_count} reviews` : 'No reviews yet'}</small></div>
            <div className="card-footer"><div><small>Starting at</small><strong>₹{tutor.hourly_rate || 0}<span>/hr</span></strong></div><button onClick={() => startBooking(tutor)}>View & book</button></div>
          </article>)}</div>
        </section>}

        {user && view === 'bookings' && <section><PageTitle kicker="SESSIONS" title={user.role === 'student' ? 'My learning sessions' : 'Student requests'} text="Manage all your upcoming and previous sessions in one place." /><div className="panel"><BookingList items={bookings} user={user} update={updateBooking} /></div></section>}

        {user?.role === 'tutor' && view === 'availability' && <section><PageTitle kicker="SCHEDULE" title="Set your availability" text="Tell students when you are usually free to teach." /><div className="schedule-layout"><form className="panel slot-form" onSubmit={addSlot}><h3>Add weekly slot</h3><label>Day<select value={slot.day} onChange={e => setSlot({ ...slot, day: e.target.value })}>{['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d}>{d}</option>)}</select></label><div><label>From<input type="time" value={slot.start_time} onChange={e => setSlot({ ...slot, start_time: e.target.value })} /></label><label>To<input type="time" value={slot.end_time} onChange={e => setSlot({ ...slot, end_time: e.target.value })} /></label></div><button className="primary" type="submit">Add availability</button></form><div className="panel"><h3>Your weekly hours</h3><div className="slot-list">{availability.length ? availability.map(a => <div key={a.id}><strong>{a.day}</strong><span>{a.start_time} – {a.end_time}</span></div>) : <Empty text="No availability added yet." />}</div></div></div></section>}

        {!user && <><section className="how" id="how"><PageTitle kicker="SIMPLE BY DESIGN" title="From stuck to confident in three steps" /><div>{[['01','Find your tutor','Search by course, expertise and availability.'],['02','Choose a time','Request a session that fits your timetable.'],['03','Learn together','Meet your peer tutor and master the topic.']].map(item => <article key={item[0]}><span>{item[0]}</span><h3>{item[1]}</h3><p>{item[2]}</p></article>)}</div></section><section className="subject-strip" id="subjects"><div><span>Popular this week</span><h2>What students are learning</h2></div>{['Data Structures','DBMS & SQL','Python','Digital Electronics','Operating Systems'].map(s => <button key={s} onClick={() => { setSubject(s); document.getElementById('tutors').scrollIntoView({ behavior: 'smooth' }); }}>{s}<span>↗</span></button>)}</section></>}
      </section>
    </main>

    {!user && <footer><div className="brand footer-brand"><img src={logo} alt="" /><span>LearnLoop</span></div><p>Peer learning, built for university life.</p><small>© 2026 LearnLoop · Thapar Institute of Engineering and Technology</small></footer>}

    {authOpen && <Modal close={() => setAuthOpen(false)}><div className="auth-modal"><span className="eyebrow">WELCOME TO LEARNLOOP</span><h2>{authMode === 'signup' ? 'Create your account' : 'Welcome back'}</h2><p>{authMode === 'signup' ? 'Join as a student or share your expertise as a tutor.' : 'Continue your learning journey.'}</p><div className="auth-tabs"><button className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>Sign up</button><button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Log in</button></div><form onSubmit={submitAuth}>{authMode === 'signup' && <><input placeholder="Full name" value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} required /><div className="two-fields"><select value={authForm.role} onChange={e => setAuthForm({ ...authForm, role: e.target.value })}><option value="student">I am a student</option><option value="tutor">I am a tutor</option></select><input placeholder="Branch" value={authForm.branch} onChange={e => setAuthForm({ ...authForm, branch: e.target.value })} /></div>{authForm.role === 'tutor' && <><div className="two-fields"><input placeholder="Subject taught" value={authForm.subject} onChange={e => setAuthForm({ ...authForm, subject: e.target.value })} required /><input type="number" placeholder="Rate ₹/hour" value={authForm.hourly_rate} onChange={e => setAuthForm({ ...authForm, hourly_rate: Number(e.target.value) })} /></div><textarea placeholder="Short tutor bio" value={authForm.bio} onChange={e => setAuthForm({ ...authForm, bio: e.target.value })} /></>}</>}<input type="email" placeholder="College email" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} required /><input type="password" minLength="8" placeholder="Password (8+ characters)" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} required /><button className="primary" type="submit">{authMode === 'signup' ? 'Create account' : 'Log in'}</button></form></div></Modal>}

    {selectedTutor && <Modal close={() => setSelectedTutor(null)}><form className="booking-modal" onSubmit={submitBooking}><div className="tutor-mini"><div className="tutor-avatar color-1">{selectedTutor.name[0]}</div><div><span>BOOK A SESSION WITH</span><h2>{selectedTutor.name}</h2><p>{selectedTutor.subject}</p></div></div>{availability.length > 0 && <div className="available-note"><strong>Usual availability</strong>{availability.map(a => <span key={a.id}>{a.day} {a.start_time}–{a.end_time}</span>)}</div>}<label>What do you want help with?<input value={booking.subject} onChange={e => setBooking({ ...booking, subject: e.target.value })} required /></label><label>Preferred date and time<input type="datetime-local" value={booking.scheduled_at} onChange={e => setBooking({ ...booking, scheduled_at: e.target.value })} required /></label><button className="primary" type="submit">Send session request</button><small>You will see the request status in My Sessions.</small></form></Modal>}
  </div>;
}

function PageTitle({ kicker, title, text }) { return <div className="page-title"><span>{kicker}</span><h2>{title}</h2>{text && <p>{text}</p>}</div>; }
function SectionHead({ title, action }) { return <div className="section-head"><h3>{title}</h3><button onClick={action}>View all →</button></div>; }
function Stats({ stats, role }) { const values = [['▣','Total sessions',stats.total_bookings],['◷','Upcoming',stats.upcoming],['✓','Completed',stats.completed],[role === 'student' ? '♡' : '★',role === 'student' ? 'Saved tutors' : 'Profile rating',role === 'student' ? stats.favorites : 'New']]; return <div className="stat-grid">{values.map(v => <article key={v[1]}><Icon>{v[0]}</Icon><div><span>{v[1]}</span><strong>{v[2]}</strong></div></article>)}</div>; }
function Empty({ text }) { return <div className="empty"><span>○</span><p>{text}</p></div>; }
function BookingList({ items, user, update }) { if (!items.length) return <Empty text="No sessions here yet." />; return <div className="booking-table">{items.map(item => <article key={item.id}><div className="date-tile"><strong>{new Date(item.scheduled_at).getDate()}</strong><span>{new Date(item.scheduled_at).toLocaleString('en', { month: 'short' })}</span></div><div className="booking-info"><strong>{item.subject}</strong><p>{user.role === 'student' ? `with ${item.tutor_name}` : `Student #${item.student_id}`} · {new Date(item.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div><span className={`status ${item.status}`}>{item.status}</span><div className="row-actions">{user.role === 'student' && ['pending','confirmed'].includes(item.status) && <button onClick={() => update(item.id, 'cancelled')}>Cancel</button>}{user.role === 'tutor' && item.status === 'pending' && <button className="confirm" onClick={() => update(item.id, 'confirmed')}>Confirm</button>}{user.role === 'tutor' && item.status === 'confirmed' && <button className="confirm" onClick={() => update(item.id, 'completed')}>Complete</button>}</div></article>)}</div>; }
function Modal({ children, close }) { return <div className="modal-backdrop" onMouseDown={close}><div className="modal-card" onMouseDown={e => e.stopPropagation()}><button className="close" onClick={close}>×</button>{children}</div></div>; }

export default App;
