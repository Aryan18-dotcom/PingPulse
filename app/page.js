'use client';
import { useState, useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';

function NextPingCountdown({ lastChecked, pingInterval }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!lastChecked) {
        setTimeLeft('Ping Due');
        return;
      }

      const nextPingTime = new Date(lastChecked).getTime() + (pingInterval || 10) * 60 * 1000;
      const now = new Date().getTime();
      const diff = nextPingTime - now;

      if (diff <= 0) {
        setTimeLeft('Ping Due');
      } else {
        const mins = Math.floor(diff / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${mins}m ${secs}s`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [lastChecked, pingInterval]);

  return (
    <span className="text-xs text-neutral-400 font-mono bg-neutral-950 px-2 py-1 rounded border border-neutral-800">
      Next ping in: <span className="text-emerald-400 font-semibold">{timeLeft}</span>
    </span>
  );
}

function AuthGuard({ children }) {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-login if user clicked the magic link from email
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const linkEmail = urlParams.get('email');
    const linkCode = urlParams.get('code');

    if (linkEmail && linkCode) {
      setLoading(true);
      signIn('otp-credentials', {
        email: linkEmail,
        code: linkCode,
        callbackUrl: '/',
      }).catch(() => setError('Failed to auto-verify link.'));
    }
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white font-mono text-sm">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
          Checking session...
        </div>
      </div>
    );
  }

  if (!session) {
    const handleSendEmail = async (e) => {
      e.preventDefault();
      if (!email) return;
      setLoading(true);
      setError('');

      try {
        const res = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        if (res.ok) {
          setSubmitted(true);
        } else {
          setError('Failed to send verification code.');
        }
      } catch (err) {
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const handleVerifyCode = async (e) => {
      e.preventDefault();
      if (!otpCode) return;
      setLoading(true);
      setError('');

      const res = await signIn('otp-credentials', {
        email,
        code: otpCode,
        redirect: false,
      });

      if (res?.error) {
        setError('Invalid or expired code. Please try again.');
        setLoading(false);
      } else {
        window.location.href = '/';
      }
    };

    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 font-sans text-neutral-100">
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl max-w-md w-full space-y-6 text-center">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">PingPulse</h1>
            <p className="text-neutral-400 text-sm mt-2">Sign in to manage your keep-alive monitors.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs">
              {error}
            </div>
          )}

          {!submitted ? (
            <form onSubmit={handleSendEmail} className="space-y-4">
              <input
                type="email"
                required
                placeholder="enter your email address..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-neutral-600 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-white text-black font-semibold text-sm rounded-lg hover:bg-neutral-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                )}
                {loading ? 'Sending Code...' : 'Send Access Code'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs text-left">
                ✉️ Access code sent to <b className="text-emerald-300">{email}</b>. Type the 6-digit code below or click the link in your email.
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  disabled={loading}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-center font-mono tracking-widest text-xl text-white focus:outline-none focus:border-neutral-600 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-500 text-black font-semibold text-sm rounded-lg hover:bg-emerald-400 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading && (
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  )}
                  {loading ? 'Verifying Code...' : 'Verify Code & Sign In'}
                </button>
              </form>

              <button
                type="button"
                onClick={() => { setSubmitted(false); setOtpCode(''); }}
                className="text-xs text-neutral-500 hover:text-neutral-300 transition"
              >
                ← Use a different email address
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return children;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [pingInterval, setPingInterval] = useState(10);
  const [notifyTelegram, setNotifyTelegram] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [globalCreds, setGlobalCreds] = useState({
    telegram: { botToken: '', chatId: '' },
    email: { smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', recipientEmail: '' },
  });

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date().toLocaleTimeString());
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (e) {
      console.error('Failed to fetch projects');
    }
  };

  const fetchGlobalSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setGlobalCreds(data);
      }
    } catch (e) {
      console.error('Failed to fetch settings');
    }
  };

  useEffect(() => {
    if (session) {
      fetchProjects();
      fetchGlobalSettings();
      const interval = setInterval(fetchProjects, 10000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name || !url) return;
    setLoading(true);

    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url, pingInterval, notifyTelegram, notifyEmail }),
    });

    setName('');
    setUrl('');
    setPingInterval(10);
    setNotifyTelegram(false);
    setNotifyEmail(false);
    setLoading(false);
    fetchProjects();
  };

  const toggleProjectNotify = async (project, field) => {
    const updated = {
      id: project._id,
      notifyTelegram: field === 'telegram' ? !project.notifyTelegram : project.notifyTelegram,
      notifyEmail: field === 'email' ? !project.notifyEmail : project.notifyEmail,
    };

    await fetch('/api/projects', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    fetchProjects();
  };

  const handleDelete = async (id) => {
    await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
    fetchProjects();
  };

  const saveGlobalSettings = async () => {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(globalCreds),
    });
    setShowGlobalSettings(false);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8 font-sans">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <header className="flex justify-between items-center border-b border-neutral-800 pb-6">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">PingPulse</h1>
              <p className="text-neutral-400 text-sm mt-1">
                Keep-Alive Agent — Logged in as <span className="text-white font-medium">{session?.user?.email}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span suppressHydrationWarning className="text-sm font-mono text-neutral-300 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg">
                🕒 {currentTime || '--:--:--'}
              </span>
              <button
                onClick={() => setShowGlobalSettings(true)}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold rounded-lg text-white border border-neutral-700 transition"
              >
                ⚙️ Global Settings
              </button>
              <button
                onClick={() => signOut()}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-400 hover:text-white rounded-lg transition"
              >
                Sign Out
              </button>
            </div>
          </header>

          <form onSubmit={handleAdd} className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl space-y-4">
            <h2 className="text-lg font-semibold text-white">Add Target Service</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Project Name (e.g. AeonMatrix)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-neutral-600"
              />
              <input
                type="url"
                placeholder="URL (https://aeonmatrix.onrender.com/health)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-neutral-600"
              />
              <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-lg px-3">
                <span className="text-xs text-neutral-400 whitespace-nowrap">Interval (min):</span>
                <input
                  type="number"
                  min="5"
                  value={pingInterval}
                  onChange={(e) => setPingInterval(e.target.value)}
                  className="bg-transparent w-full p-3 text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyTelegram}
                  onChange={(e) => setNotifyTelegram(e.target.checked)}
                  className="rounded bg-neutral-950 border-neutral-800"
                />
                Enable Telegram Alerts
              </label>
              <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="rounded bg-neutral-950 border-neutral-800"
                />
                Enable Email Alerts
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-white text-black font-medium text-sm rounded-lg hover:bg-neutral-200 transition"
            >
              {loading ? 'Adding...' : 'Add Project'}
            </button>
          </form>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Active Monitors ({projects.length})</h2>
            <div className="grid grid-cols-1 gap-4">
              {projects.map((project) => {
                const isHealthy = project.lastStatus >= 200 && project.lastStatus < 300;
                return (
                  <div key={project._id} className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className={`w-2.5 h-2.5 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <h3 className="font-semibold text-white">{project.name}</h3>
                          <span className="text-xs bg-neutral-800 px-2 py-0.5 rounded text-neutral-400 font-mono">
                            {project.lastStatus || 'Pending'}
                          </span>
                          <span className="text-xs bg-neutral-800/60 px-2 py-0.5 rounded text-neutral-400 font-mono">
                            Every {project.pingInterval || 10}m
                          </span>
                        </div>
                        <p className="text-xs font-mono text-neutral-400">{project.url}</p>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-neutral-400 font-mono">Latency</p>
                          <p className="text-sm font-semibold text-neutral-200">{project.lastResponseTimeMs || 0} ms</p>
                        </div>

                        <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 px-2.5 py-1 rounded-lg">
                          <button
                            onClick={() => toggleProjectNotify(project, 'telegram')}
                            className={`text-xs px-2 py-0.5 rounded transition ${project.notifyTelegram ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-neutral-500'}`}
                          >
                            ✈️ TG
                          </button>
                          <button
                            onClick={() => toggleProjectNotify(project, 'email')}
                            className={`text-xs px-2 py-0.5 rounded transition ${project.notifyEmail ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-neutral-500'}`}
                          >
                            ✉️ Email
                          </button>
                        </div>

                        <button
                          onClick={() => handleDelete(project._id)}
                          className="text-neutral-500 hover:text-red-400 text-sm transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between">
                      <NextPingCountdown 
                        lastChecked={project.lastChecked} 
                        pingInterval={project.pingInterval} 
                      />
                      <span className="text-xs text-neutral-500 font-mono">
                        Last ping: {project.lastChecked ? new Date(project.lastChecked).toLocaleTimeString() : 'Never'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {showGlobalSettings && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl max-w-lg w-full space-y-6">
              <h3 className="text-xl font-bold text-white">Global Alert Credentials</h3>
              <p className="text-xs text-neutral-400">Configure your credentials once here. You can then toggle alerts per project card.</p>

              <div className="space-y-3 border-b border-neutral-800 pb-4">
                <h4 className="text-sm font-semibold text-white">Telegram Configuration</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Telegram Bot Token"
                    value={globalCreds.telegram?.botToken || ''}
                    onChange={(e) => setGlobalCreds({
                      ...globalCreds,
                      telegram: { ...globalCreds.telegram, botToken: e.target.value }
                    })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Telegram Chat ID"
                    value={globalCreds.telegram?.chatId || ''}
                    onChange={(e) => setGlobalCreds({
                      ...globalCreds,
                      telegram: { ...globalCreds.telegram, chatId: e.target.value }
                    })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white">Email Configuration (SMTP)</h4>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="SMTP Host (smtp.gmail.com)"
                    value={globalCreds.email?.smtpHost || ''}
                    onChange={(e) => setGlobalCreds({
                      ...globalCreds,
                      email: { ...globalCreds.email, smtpHost: e.target.value }
                    })}
                    className="bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white"
                  />
                  <input
                    type="number"
                    placeholder="SMTP Port (587)"
                    value={globalCreds.email?.smtpPort || 587}
                    onChange={(e) => setGlobalCreds({
                      ...globalCreds,
                      email: { ...globalCreds.email, smtpPort: parseInt(e.target.value) }
                    })}
                    className="bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="SMTP User / Email"
                    value={globalCreds.email?.smtpUser || ''}
                    onChange={(e) => setGlobalCreds({
                      ...globalCreds,
                      email: { ...globalCreds.email, smtpUser: e.target.value }
                    })}
                    className="bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white"
                  />
                  <input
                    type="password"
                    placeholder="SMTP Password"
                    value={globalCreds.email?.smtpPass || ''}
                    onChange={(e) => setGlobalCreds({
                      ...globalCreds,
                      email: { ...globalCreds.email, smtpPass: e.target.value }
                    })}
                    className="bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white"
                  />
                  <input
                    type="email"
                    placeholder="Recipient Email"
                    value={globalCreds.email?.recipientEmail || ''}
                    onChange={(e) => setGlobalCreds({
                      ...globalCreds,
                      email: { ...globalCreds.email, recipientEmail: e.target.value }
                    })}
                    className="col-span-2 bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  onClick={() => setShowGlobalSettings(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={saveGlobalSettings}
                  className="px-5 py-2 bg-white text-black text-xs font-semibold rounded-lg hover:bg-neutral-200"
                >
                  Save Credentials
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}