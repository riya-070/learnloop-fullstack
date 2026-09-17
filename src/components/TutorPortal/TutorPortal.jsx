import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../api';
import './TutorPortal.css';

const emptyAuth = { name: '', email: '', password: '', role: 'student', subject: '', bio: '' };

export default function TutorPortal() {
  const [mode, setMode] = useState('signup');
  const [form, setForm] = useState(emptyAuth);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('learnloopUser') || 'null'));
  const [tutors, setTutors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [booking, setBooking] = useState({ subject: '', scheduled_at: '' });
  const [message, setMessage] = useState('');

  const loadData = useCallback(async () => {
    try {
      setTutors(await api('/tutors'));
      if (user) setBookings(await api('/bookings/me'));
    } catch (error) {
      if (user) setMessage(error.message);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const submitAuth = async (event) => {
    event.preventDefault();
    setMessage('Please wait...');
    try {
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { ...form, subject: form.role === 'tutor' ? form.subject : null, bio: form.bio || null };
      const data = await api(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(payload) });
      const nextUser = { id: data.user_id, name: data.name, role: data.role };
      localStorage.setItem('learnloopToken', data.access_token);
      localStorage.setItem('learnloopUser', JSON.stringify(nextUser));
      setUser(nextUser);
      setForm(emptyAuth);
      setMessage(`Welcome, ${data.name}!`);
    } catch (error) { setMessage(error.message); }
  };

  const logout = () => {
    localStorage.removeItem('learnloopToken');
    localStorage.removeItem('learnloopUser');
    setUser(null); setBookings([]); setMessage('Logged out successfully.');
  };

  const bookSession = async (event) => {
    event.preventDefault();
    try {
      await api('/bookings', {
        method: 'POST',
        body: JSON.stringify({ ...booking, tutor_id: selectedTutor.id }),
      });
      setSelectedTutor(null); setBooking({ subject: '', scheduled_at: '' });
      setMessage('Session request sent!'); await loadData();
    } catch (error) { setMessage(error.message); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setMessage(`Booking ${status}.`); await loadData();
    } catch (error) { setMessage(error.message); }
  };

  return (
    <section className="portal" id="portal">
      <div className="portal-heading">
        <p>STUDENT & TUTOR PORTAL</p><h2>Learn together. Book with confidence.</h2>
      </div>
      {message && <div className="portal-message" role="status">{message}</div>}

      {!user ? (
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Create account</button>
            <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Log in</button>
          </div>
          <form onSubmit={submitAuth}>
            {mode === 'signup' && <input aria-label="Name" placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />}
            <input type="email" aria-label="Email" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            <input type="password" aria-label="Password" placeholder="Password (minimum 8 characters)" minLength="8" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            {mode === 'signup' && <>
              <select aria-label="Role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option value="student">I am a student</option><option value="tutor">I am a tutor</option></select>
              {form.role === 'tutor' && <input aria-label="Subject" placeholder="Subject you teach" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />}
            </>}
            <button className="portal-primary" type="submit">{mode === 'signup' ? 'Join LearnLoop' : 'Log in'}</button>
          </form>
        </div>
      ) : (
        <>
          <div className="portal-user"><span>Signed in as <strong>{user.name}</strong> ({user.role})</span><button onClick={logout}>Log out</button></div>
          {user.role === 'student' && <div className="portal-section">
            <h3>Find a peer tutor</h3>
            <div className="tutor-grid">{tutors.length ? tutors.map(tutor => (
              <article className="tutor-card" key={tutor.id}>
                <div className="avatar">{tutor.name.charAt(0)}</div><h4>{tutor.name}</h4>
                <p className="subject">{tutor.subject}</p><p>{tutor.bio || 'Peer tutor ready to help you learn.'}</p>
                <button onClick={() => { setSelectedTutor(tutor); setBooking({ ...booking, subject: tutor.subject || '' }); }}>Book session</button>
              </article>
            )) : <p>No tutors registered yet. Create a tutor account to add the first tutor.</p>}</div>
          </div>}

          <div className="portal-section"><h3>{user.role === 'student' ? 'My bookings' : 'Student requests'}</h3>
            <div className="booking-list">{bookings.length ? bookings.map(item => (
              <article key={item.id}><div><strong>{item.subject}</strong><p>{user.role === 'student' ? `Tutor: ${item.tutor_name}` : `Student ID: ${item.student_id}`} · {new Date(item.scheduled_at).toLocaleString()}</p></div>
                <span className={`status ${item.status}`}>{item.status}</span>
                {user.role === 'student' && item.status === 'pending' && <button onClick={() => updateStatus(item.id, 'cancelled')}>Cancel</button>}
                {user.role === 'tutor' && item.status === 'pending' && <button onClick={() => updateStatus(item.id, 'confirmed')}>Confirm</button>}
              </article>
            )) : <p>No bookings yet.</p>}</div>
          </div>
        </>
      )}

      {selectedTutor && <div className="portal-modal" onClick={() => setSelectedTutor(null)}>
        <form onSubmit={bookSession} onClick={e => e.stopPropagation()}>
          <button type="button" className="modal-close" onClick={() => setSelectedTutor(null)}>×</button>
          <h3>Book {selectedTutor.name}</h3>
          <label>Subject<input value={booking.subject} onChange={e => setBooking({ ...booking, subject: e.target.value })} required /></label>
          <label>Date and time<input type="datetime-local" value={booking.scheduled_at} onChange={e => setBooking({ ...booking, scheduled_at: e.target.value })} required /></label>
          <button className="portal-primary" type="submit">Request session</button>
        </form>
      </div>}
    </section>
  );
}
