'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';

// ============================================
// TYPES
// ============================================
interface PlatformInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: string;
  website: string;
}

interface PlatformUser {
  id: string;
  name: string;
  age?: number;
  bio?: string;
  photos: string[];
  distance?: number;
}

interface PlatformRecommendation {
  user: PlatformUser;
  swipeToken?: string;
}

interface PlatformMatch {
  id: string;
  person: PlatformUser;
  lastMessage?: string;
}

interface PlatformProfile {
  id: string;
  name: string;
  age?: number;
  bio?: string;
  photos: string[];
  likesRemaining?: number | null;
}

interface Settings {
  likeRecommendUser: boolean;
  sendMessageToMatchedUser: boolean;
  message: string[];
  location: { lat: number; long: number };
  unMatch: { distance: number; gender: string };
  likeCatalogUser: boolean;
  selectedCatalogIds: string[];
  autoExpandDistance: boolean;
  autoExpandDistanceMax: number;
  ageFilterMin: number;
  ageFilterMax: number;
  likeDelayMs: number;
  messageDelayMs: number;
}

interface LogEntry {
  id: string;
  time: string;
  text: string;
  level: 'info' | 'error' | 'warn' | 'success';
}

// ============================================
// BUBBLE DATA (pre-computed for performance)
// ============================================
const BUBBLES = Array.from({ length: 25 }, (_, i) => {
  const types = ['circle', 'heart', 'glow', 'spark'];
  const type = types[i % types.length];
  const size = 20 + Math.random() * 60;
  return {
    id: i,
    type,
    size,
    left: Math.random() * 100,
    duration: 12 + Math.random() * 20,
    delay: Math.random() * 15,
    drift: -80 + Math.random() * 160,
    rotate: Math.random() * 720 - 360,
  };
});

const SPARKLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  top: Math.random() * 100,
  duration: 2 + Math.random() * 4,
  delay: Math.random() * 6,
  size: 2 + Math.random() * 3,
}));

// ============================================
// MAIN COMPONENT
// ============================================
export default function HomePage() {
  // Platform state
  const [platforms, setPlatforms] = useState<PlatformInfo[]>([]);
  const [activePlatform, setActivePlatform] = useState<PlatformInfo | null>(null);

  // Core state
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [recommendations, setRecommendations] = useState<PlatformRecommendation[]>([]);
  const [selectedUser, setSelectedUser] = useState<PlatformRecommendation | null>(null);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);
  const [matches, setMatches] = useState<PlatformMatch[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Counters
  const [likeCount, setLikeCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);

  // Animation states
  const [swipeAnim, setSwipeAnim] = useState<'like' | 'dislike' | null>(null);
  const [showCelebration, setShowCelebration] = useState<string | null>(null);
  const [confetti, setConfetti] = useState<any[]>([]);

  // Modals
  const [showConfig, setShowConfig] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Config form
  const [settings, setSettings] = useState<Settings>({
    likeRecommendUser: true,
    sendMessageToMatchedUser: true,
    message: ['Chào bạn!'],
    location: { lat: 21.028, long: 105.854 },
    unMatch: { distance: 10, gender: '1' },
    likeCatalogUser: false,
    selectedCatalogIds: [],
    autoExpandDistance: true,
    autoExpandDistanceMax: 20,
    ageFilterMin: 18,
    ageFilterMax: 30,
    likeDelayMs: 3000,
    messageDelayMs: 5000,
  });
  const [authJson, setAuthJson] = useState('');
  const [authScript, setAuthScript] = useState('');

  // Chat state
  const [selectedMatch, setSelectedMatch] = useState<PlatformMatch | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Profile
  const [profile, setProfile] = useState<PlatformProfile | null>(null);

  const logRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // ============================================
  // HELPERS
  // ============================================
  const addLog = useCallback((text: string, level: LogEntry['level'] = 'info') => {
    setLogs(prev => {
      const entry: LogEntry = {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        time: new Date().toLocaleTimeString('vi-VN'),
        text,
        level
      };
      const next = [...prev, entry];
      return next.length > 500 ? next.slice(-500) : next;
    });
  }, []);

  // Platform API helper
  const api = useCallback(async (action: string, params: any = {}) => {
    const res = await fetch('/api/platform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...params })
    });
    return res.json();
  }, []);

  const triggerSwipeAnim = useCallback((type: 'like' | 'dislike') => {
    setSwipeAnim(type);
    setTimeout(() => setSwipeAnim(null), 600);
  }, []);

  const triggerCelebration = useCallback((name: string) => {
    const colors = ['#fd267a', '#ff6036', '#ffc629', '#4f8cff', '#28d98c', '#783bf9'];
    const newConfetti = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: 1.5 + Math.random() * 2,
      delay: Math.random() * 0.5,
      drift: -150 + Math.random() * 300,
      rotate: Math.random() * 1080,
      size: 6 + Math.random() * 8,
    }));
    setConfetti(newConfetti);
    setShowCelebration(name);
    setTimeout(() => { setShowCelebration(null); setConfetti([]); }, 3000);
  }, []);

  // ============================================
  // API CALLS
  // ============================================
  const fetchPlatforms = async () => {
    try {
      const res = await fetch('/api/platform');
      const data = await res.json();
      if (data.success) {
        setPlatforms(data.allPlatforms || []);
        setActivePlatform(data.activePlatform || null);
      }
    } catch { /* ignore */ }
  };

  const switchPlatform = async (platformId: string) => {
    const data = await api('switch-platform', { platform: platformId });
    if (data.success) {
      setActivePlatform(data.platform);
      setRecommendations([]);
      setSelectedUser(null);
      setMatches([]);
      setLikeCount(0);
      setMatchCount(0);
      setMsgCount(0);
      toast.success(data.message);
      addLog(`🔄 ${data.message}`, 'success');
      // Fetch auth script for new platform
      const scriptData = await api('get-auth-script');
      if (scriptData.success) setAuthScript(scriptData.script);
    } else {
      toast.error(data.message);
    }
  };

  const fetchSettings = async () => {
    const data = await api('get-settings');
    if (data.success && data.data) setSettings(data.data);
  };

  const fetchRecommendations = async () => {
    setIsLoading(true);
    addLog(`🔍 [${activePlatform?.name}] Đang tải danh sách đề xuất...`);
    try {
      const data = await api('get-recommendations');
      if (data.success && data.data?.length > 0) {
        setRecommendations(data.data);
        if (!selectedUser) {
          setSelectedUser(data.data[0]);
          setSelectedPhotoIdx(0);
        }
        addLog(`✅ Đã tải ${data.data.length} người dùng`, 'success');
      } else {
        addLog('⚠️ Không tìm thấy người dùng nào', 'warn');
      }
    } catch (e: any) {
      addLog('❌ Lỗi tải đề xuất: ' + e.message, 'error');
    }
    setIsLoading(false);
  };

  const fetchMatches = async () => {
    const data = await api('get-matches');
    if (data.success && data.data) {
      setMatches(data.data);
      setMatchCount(data.data.length);
    }
  };

  const fetchProfile = async () => {
    const data = await api('get-profile');
    if (data.success && data.data) {
      setProfile(data.data);
    }
  };

  const handleLike = async (rec?: PlatformRecommendation) => {
    const target = rec || selectedUser;
    if (!target) return;
    triggerSwipeAnim('like');
    try {
      const data = await api('like', { userId: target.user.id, swipeToken: target.swipeToken });
      if (data.success) {
        setLikeCount(prev => prev + 1);
        addLog(`💚 [${activePlatform?.name}] Đã like: ${target.user.name}`, 'success');
        if (data.data?.matched) {
          setMatchCount(prev => prev + 1);
          addLog(`🎉 Match với ${target.user.name}!`, 'success');
          triggerCelebration(target.user.name);
        }
        const idx = recommendations.findIndex(r => r.user.id === target.user.id);
        const next = recommendations[idx + 1] || null;
        setSelectedUser(next);
        setSelectedPhotoIdx(0);
        setRecommendations(prev => prev.filter(r => r.user.id !== target.user.id));
      } else {
        addLog(`❌ Lỗi: ${data.message}`, 'error');
      }
    } catch (e: any) {
      addLog('❌ Lỗi: ' + e.message, 'error');
    }
  };

  const handleDislike = async () => {
    if (!selectedUser) return;
    triggerSwipeAnim('dislike');
    try {
      const data = await api('dislike', { userId: selectedUser.user.id });
      if (data.success) {
        addLog(`👎 Đã bỏ qua: ${selectedUser.user.name}`);
        const idx = recommendations.findIndex(r => r.user.id === selectedUser.user.id);
        const next = recommendations[idx + 1] || null;
        setSelectedUser(next);
        setSelectedPhotoIdx(0);
        setRecommendations(prev => prev.filter(r => r.user.id !== selectedUser.user.id));
      }
    } catch (e: any) {
      addLog('❌ Lỗi: ' + e.message, 'error');
    }
  };

  const handleStartAuto = async () => {
    addLog('🚀 Đang khởi động tự động...');
    const res = await fetch('/api/start', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      setIsAutoRunning(true);
      addLog(`✅ ${data.message}`, 'success');
      toast.success(data.message);
    } else {
      addLog(`❌ ${data.message}`, 'error');
      toast.error(data.message);
    }
  };

  const handleStopAuto = async () => {
    const res = await fetch('/api/stop', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      setIsAutoRunning(false);
      addLog('🛑 Đã dừng tự động', 'warn');
      toast.success('Đã dừng tự động');
    }
  };

  const handleUpdateAuth = async () => {
    try {
      const parsed = JSON.parse(authJson);
      const data = await api('update-auth', { auth: parsed });
      if (data.success) {
        addLog(`✅ ${data.message}`, 'success');
        toast.success(data.message);
        setShowConfig(false);
        fetchRecommendations();
        fetchMatches();
        fetchProfile();
      } else {
        addLog(`❌ ${data.message}`, 'error');
        toast.error(data.message);
      }
    } catch {
      toast.error('JSON không hợp lệ');
    }
  };

  const handleSaveSettings = async () => {
    const data = await api('update-settings', { settings });
    if (data.success) {
      toast.success('Đã lưu cài đặt');
      addLog('✅ Đã cập nhật cài đặt', 'success');
    } else {
      toast.error(data.message);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedMatch || !chatInput.trim()) return;
    const data = await api('send-message', { matchId: selectedMatch.id, text: chatInput.trim() });
    if (data.success) {
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        fromMe: true,
        text: chatInput.trim(),
        timestamp: new Date().toISOString()
      }]);
      setChatInput('');
      setMsgCount(prev => prev + 1);
      addLog(`💬 Đã gửi tin nhắn cho ${selectedMatch.person.name}`, 'success');
    } else {
      toast.error('Lỗi gửi tin nhắn');
    }
  };

  const loadMessages = async (match: PlatformMatch) => {
    setSelectedMatch(match);
    const data = await api('get-messages', { matchId: match.id });
    setChatMessages(data.success ? (data.data || []) : []);
  };

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    fetchPlatforms();
    fetchSettings();
    // Load auth script
    api('get-auth-script').then(d => { if (d.success) setAuthScript(d.script); });
    // Check auto status
    fetch('/api/start').then(r => r.json()).then(d => {
      if (d.isAutoRunning) setIsAutoRunning(true);
    }).catch(() => { });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatMessages]);

  // Poll auto status
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/start');
        const data = await res.json();
        setIsAutoRunning(data.isAutoRunning);
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic CSS variables based on active platform
  const platformStyle = useMemo(() => {
    if (!activePlatform) return {};
    return {
      '--platform-color': activePlatform.color,
      '--platform-gradient': activePlatform.gradient,
    } as React.CSSProperties;
  }, [activePlatform]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="app-container" style={platformStyle}>
      {/* Aurora Background */}
      <div className="aurora-bg" />
      <div className="aurora-orb orb-1" />
      <div className="aurora-orb orb-2" />
      <div className="aurora-orb orb-3" />

      {/* Floating Bubbles */}
      <div className="bubbles-container">
        {BUBBLES.map(b => (
          <div
            key={b.id}
            className={`bubble ${b.type}`}
            style={{
              width: b.size,
              height: b.size,
              left: `${b.left}%`,
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
              fontSize: b.type === 'heart' ? `${b.size * 0.5}px` : undefined,
              '--drift': `${b.drift}px`,
              '--rotate': `${b.rotate}deg`,
            } as React.CSSProperties}
          >
            {b.type === 'heart' && (activePlatform?.icon || '💕')}
          </div>
        ))}
      </div>

      {/* Sparkles */}
      <div className="sparkle-container">
        {SPARKLES.map(s => (
          <div
            key={s.id}
            className="sparkle"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              '--duration': `${s.duration}s`,
              '--delay': `${s.delay}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="logo-icon" style={{ background: activePlatform?.gradient }}>{activePlatform?.icon || '🔥'}</div>
          <span className="app-title" style={{ background: activePlatform?.gradient, backgroundClip: 'text', WebkitBackgroundClip: 'text' }}>
            {activePlatform?.name || 'Dating'} Super Tool
          </span>
          <div className={`status-badge ${isAutoRunning ? 'running' : 'stopped'}`}>
            <span className="status-dot"></span>
            {isAutoRunning ? 'Đang chạy' : 'Đã dừng'}
          </div>
        </div>
        <div className="header-actions">
          {/* Platform Tabs */}
          {platforms.map(p => (
            <button
              key={p.id}
              className={`header-btn ${activePlatform?.id === p.id ? 'active' : ''}`}
              onClick={() => switchPlatform(p.id)}
              title={p.name}
              style={activePlatform?.id === p.id ? { background: p.gradient, borderColor: 'transparent' } : {}}
            >
              {p.icon}
            </button>
          ))}
          <div style={{ width: 1, height: 24, background: 'var(--border-color)', margin: '0 0.25rem' }} />
          <button className="header-btn" onClick={() => setShowGuide(true)} title="Hướng dẫn">📖</button>
          <button className="header-btn" onClick={() => setShowConfig(true)} title="Cấu hình">⚙️</button>
          <button className="header-btn" onClick={() => setShowLog(true)} title="Nhật ký">📋</button>
          <button className="header-btn" onClick={() => { fetchProfile(); setShowProfile(true); }} title="Hồ sơ">👤</button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-icon">💚</span>
          <span className="stat-value count-up" key={`like-${likeCount}`}>{likeCount}</span>
          <span className="stat-label">Likes</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🎉</span>
          <span className="stat-value count-up" key={`match-${matchCount}`}>{matchCount}</span>
          <span className="stat-label">Matches</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">💬</span>
          <span className="stat-value count-up" key={`msg-${msgCount}`}>{msgCount}</span>
          <span className="stat-label">Tin nhắn</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">📋</span>
          <span className="stat-value">{recommendations.length}</span>
          <span className="stat-label">Đề xuất</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content">
        {/* Control Row */}
        <div className="controls-row">
          <button className="ctrl-btn dislike ripple-effect" onClick={handleDislike}>
            ✕
            <span className="tooltip">Bỏ qua</span>
          </button>
          <button className="ctrl-btn super-like ripple-effect" onClick={fetchRecommendations}>
            🔄
            <span className="tooltip">Tải đề xuất</span>
          </button>
          <button
            className={`ctrl-btn play ${isAutoRunning ? 'running' : ''}`}
            onClick={isAutoRunning ? handleStopAuto : handleStartAuto}
          >
            {isAutoRunning ? '⏹' : '▶'}
            <span className="tooltip">{isAutoRunning ? 'Dừng' : 'Bắt đầu tự động'}</span>
          </button>
          <button className="ctrl-btn like ripple-effect" onClick={() => handleLike()}>
            ♥
            <span className="tooltip">Like</span>
          </button>
          <button className="ctrl-btn chat ripple-effect" onClick={() => { fetchMatches(); setShowChat(true); }}>
            💬
            <span className="tooltip">Chat</span>
          </button>
        </div>

        {/* User Detail Panel */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span className="card-title-icon">👤</span>
              Chi tiết người dùng
            </div>
            {selectedUser && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {recommendations.indexOf(selectedUser) + 1}/{recommendations.length}
              </span>
            )}
          </div>
          <div className="card-body">
            {selectedUser ? (
              <div className="user-detail-panel animate-fade-in" key={selectedUser.user.id}>
                {/* Swipe Overlays */}
                {swipeAnim === 'like' && (
                  <div className="swipe-overlay like-overlay show">
                    <span className="swipe-label like">LIKE</span>
                  </div>
                )}
                {swipeAnim === 'dislike' && (
                  <div className="swipe-overlay dislike-overlay show">
                    <span className="swipe-label dislike">NOPE</span>
                  </div>
                )}
                <img
                  className="user-detail-photo"
                  src={selectedUser.user.photos[selectedPhotoIdx] || selectedUser.user.photos[0]}
                  alt={selectedUser.user.name}
                />
                <h2 className="user-detail-name">
                  {selectedUser.user.name}
                  {selectedUser.user.age && (
                    <span style={{ fontWeight: 400, fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                      , {selectedUser.user.age}
                    </span>
                  )}
                </h2>
                {selectedUser.user.bio && (
                  <p className="user-detail-bio">{selectedUser.user.bio}</p>
                )}
                {selectedUser.user.photos.length > 1 && (
                  <div className="user-photos-row">
                    {selectedUser.user.photos.map((url, idx) => (
                      <img
                        key={idx}
                        className={`user-photo-thumb ${idx === selectedPhotoIdx ? 'active' : ''}`}
                        src={url}
                        alt=""
                        onClick={() => setSelectedPhotoIdx(idx)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">{activePlatform?.icon || '🔥'}</div>
                <div className="empty-state-title">Chưa có dữ liệu</div>
                <div className="empty-state-desc">
                  Nhấn nút 🔄 để tải danh sách đề xuất hoặc ▶ để bắt đầu tự động
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations Grid */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span className="card-title-icon">💫</span>
              Danh sách đề xuất
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {recommendations.length} người
            </span>
          </div>
          <div className="card-body">
            {isLoading ? (
              <div className="user-card-grid">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="skeleton skeleton-card" />
                ))}
              </div>
            ) : recommendations.length > 0 ? (
              <div className="user-card-grid">
                {recommendations.map((rec) => (
                  <div
                    key={rec.user.id}
                    className="user-card"
                    onClick={() => { setSelectedUser(rec); setSelectedPhotoIdx(0); }}
                    style={{
                      outline: selectedUser?.user.id === rec.user.id ? `2px solid ${activePlatform?.color || 'var(--tinder-pink)'}` : 'none'
                    }}
                  >
                    <img className="user-card-img" src={rec.user.photos[0]} alt={rec.user.name} />
                    <div className="user-card-info">
                      <div className="user-card-name">{rec.user.name}</div>
                      {rec.user.age && <div className="user-card-age">{rec.user.age} tuổi</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">💫</div>
                <div className="empty-state-title">Chưa có danh sách</div>
                <div className="empty-state-desc">Nhấn 🔄 để tải người dùng được đề xuất</div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ============================================ */}
      {/* MATCH CELEBRATION                            */}
      {/* ============================================ */}
      {showCelebration && (
        <div className="match-celebration" onClick={() => setShowCelebration(null)}>
          {confetti.map(c => (
            <div
              key={c.id}
              className="confetti"
              style={{
                left: `${c.left}%`,
                background: c.color,
                width: c.size,
                height: c.size,
                '--duration': `${c.duration}s`,
                '--delay': `${c.delay}s`,
                '--drift': `${c.drift}px`,
                '--rotate': `${c.rotate}deg`,
              } as React.CSSProperties}
            />
          ))}
          <div className="match-celebration-content">
            <div className="match-celebration-title">IT&apos;S A MATCH! 🎉</div>
            <div className="match-celebration-subtitle">Bạn và {showCelebration} đã thích nhau</div>
            <button className="btn btn-primary" onClick={() => setShowCelebration(null)}>Tuyệt vời! ✨</button>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* CONFIG MODAL                                 */}
      {/* ============================================ */}
      {showConfig && (
        <div className="modal-overlay" onClick={() => setShowConfig(false)}>
          <div className="modal wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{activePlatform?.icon} Cấu hình {activePlatform?.name}</div>
              <button className="modal-close" onClick={() => setShowConfig(false)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Platform selector in modal */}
              <div className="form-group">
                <label className="form-label">🌐 Nền tảng đang dùng</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {platforms.map(p => (
                    <button
                      key={p.id}
                      className={`btn ${activePlatform?.id === p.id ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => switchPlatform(p.id)}
                      style={activePlatform?.id === p.id ? { background: p.gradient } : {}}
                    >
                      {p.icon} {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />

              {/* Auth Section */}
              <div className="form-group">
                <label className="form-label">📦 Dán JSON Auth {activePlatform?.name} (từ DevTools)</label>
                <textarea
                  className="form-input"
                  value={authJson}
                  onChange={e => setAuthJson(e.target.value)}
                  placeholder={`Dán JSON auth ${activePlatform?.name} vào đây...`}
                  rows={5}
                  style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                />
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-primary ripple-effect" onClick={handleUpdateAuth}>🔑 Cập nhật Auth</button>
                  <button className="btn btn-secondary" onClick={() => setShowGuide(true)}>📖 Hướng dẫn lấy Auth</button>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }} />

              {/* Auto settings */}
              <div className="toggle-row">
                <div>
                  <div className="toggle-label">💚 Like người dùng được đề xuất</div>
                  <div className="toggle-desc">Tự động like người dùng trong danh sách đề xuất</div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={settings.likeRecommendUser} onChange={e => setSettings({ ...settings, likeRecommendUser: e.target.checked })} />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="toggle-row">
                <div>
                  <div className="toggle-label">💬 Gửi tin nhắn tự động cho match</div>
                  <div className="toggle-desc">Tự động gửi tin nhắn cho người đã match</div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={settings.sendMessageToMatchedUser} onChange={e => setSettings({ ...settings, sendMessageToMatchedUser: e.target.checked })} />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="toggle-row">
                <div>
                  <div className="toggle-label">🔄 Tự tăng khoảng cách</div>
                  <div className="toggle-desc">Tự động tăng khoảng cách khi hết người dùng</div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={settings.autoExpandDistance} onChange={e => setSettings({ ...settings, autoExpandDistance: e.target.checked })} />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">📍 Khoảng cách (km)</label>
                  <input type="number" className="form-input" value={settings.unMatch?.distance || 10}
                    onChange={e => setSettings({ ...settings, unMatch: { ...settings.unMatch, distance: parseInt(e.target.value) || 10 } })} />
                </div>
                <div className="form-group">
                  <label className="form-label">📍 Khoảng cách max</label>
                  <input type="number" className="form-input" value={settings.autoExpandDistanceMax || 20}
                    onChange={e => setSettings({ ...settings, autoExpandDistanceMax: parseInt(e.target.value) || 20 })} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">🎂 Tuổi tối thiểu</label>
                  <input type="number" className="form-input" value={settings.ageFilterMin || 18}
                    onChange={e => setSettings({ ...settings, ageFilterMin: parseInt(e.target.value) || 18 })} />
                </div>
                <div className="form-group">
                  <label className="form-label">🎂 Tuổi tối đa</label>
                  <input type="number" className="form-input" value={settings.ageFilterMax || 30}
                    onChange={e => setSettings({ ...settings, ageFilterMax: parseInt(e.target.value) || 30 })} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">📍 Vĩ độ</label>
                  <input type="number" step="0.001" className="form-input" value={settings.location?.lat || 0}
                    onChange={e => setSettings({ ...settings, location: { ...settings.location, lat: parseFloat(e.target.value) || 0 } })} />
                </div>
                <div className="form-group">
                  <label className="form-label">📍 Kinh độ</label>
                  <input type="number" step="0.001" className="form-input" value={settings.location?.long || 0}
                    onChange={e => setSettings({ ...settings, location: { ...settings.location, long: parseFloat(e.target.value) || 0 } })} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">⏱ Delay like (ms)</label>
                  <input type="number" className="form-input" value={settings.likeDelayMs || 3000}
                    onChange={e => setSettings({ ...settings, likeDelayMs: parseInt(e.target.value) || 3000 })} />
                </div>
                <div className="form-group">
                  <label className="form-label">⏱ Delay tin nhắn (ms)</label>
                  <input type="number" className="form-input" value={settings.messageDelayMs || 5000}
                    onChange={e => setSettings({ ...settings, messageDelayMs: parseInt(e.target.value) || 5000 })} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">👤 Giới tính quan tâm</label>
                <select className="form-input" value={settings.unMatch?.gender || '1'}
                  onChange={e => setSettings({ ...settings, unMatch: { ...settings.unMatch, gender: e.target.value } })}>
                  <option value="0">Nam</option>
                  <option value="1">Nữ</option>
                  <option value="all">Tất cả</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">💬 Tin nhắn tự động (mỗi dòng 1 tin nhắn)</label>
                <textarea className="form-input"
                  value={settings.message?.join('\n') || ''}
                  onChange={e => setSettings({ ...settings, message: e.target.value.split('\n').filter(l => l.trim()) })}
                  rows={5}
                  placeholder="Nhập mỗi tin nhắn trên 1 dòng... Dùng {{name}} để thay bằng tên" />
              </div>

              <button className="btn btn-primary btn-block ripple-effect" onClick={handleSaveSettings}>💾 Lưu cài đặt</button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* GUIDE MODAL                                  */}
      {/* ============================================ */}
      {showGuide && (
        <div className="modal-overlay" onClick={() => setShowGuide(false)}>
          <div className="modal wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">📖 Hướng dẫn - {activePlatform?.name}</div>
              <button className="modal-close" onClick={() => setShowGuide(false)}>✕</button>
            </div>
            <div className="modal-body guide-content">
              <h3>{activePlatform?.icon} Bước 1: Chọn nền tảng</h3>
              <ul>
                <li>Nhấn vào icon nền tảng ở thanh header để chuyển đổi: {platforms.map(p => `${p.icon} ${p.name}`).join(', ')}</li>
              </ul>

              <h3>🔑 Bước 2: Lấy Auth Token cho {activePlatform?.name}</h3>
              <ol>
                <li>Mở <code>{activePlatform?.website}</code> và đăng nhập</li>
                <li>Mở DevTools Console bằng <code>F12</code> hoặc <code>Ctrl+Shift+I</code></li>
                <li>Dán đoạn script bên dưới vào Console rồi nhấn Enter</li>
                <li>Thao tác trên trang (lướt profile, like...)</li>
                <li>Copy kết quả JSON hiện trong Console</li>
                <li>Vào <strong>Cấu hình</strong> → dán JSON → <strong>Cập nhật Auth</strong></li>
              </ol>

              <div className="code-block">
                <pre>{authScript}</pre>
                <button className="copy-btn" onClick={() => {
                  navigator.clipboard.writeText(authScript);
                  toast.success('Đã copy script!');
                }}>📋 Copy</button>
              </div>

              <h3>⚙️ Bước 3: Cấu hình</h3>
              <ul>
                <li>Nhấn ⚙️ để mở cài đặt</li>
                <li>Thiết lập like, tin nhắn, vị trí, khoảng cách</li>
                <li>Nhấn &quot;Lưu cài đặt&quot; để áp dụng</li>
              </ul>

              <h3>▶️ Bước 4: Chạy</h3>
              <ul>
                <li>Nhấn ▶ (Play) để bắt đầu tự động</li>
                <li>Nhấn ⏹ (Stop) để dừng</li>
                <li>Nhấn 💬 để xem và gửi tin nhắn</li>
              </ul>

              <h3>⚠️ Lưu ý</h3>
              <ul>
                <li>Token sẽ hết hạn, cần lấy lại</li>
                <li>Nên dùng gói Premium để tránh giới hạn like</li>
                <li>Không thao tác quá nhanh để tránh bị block</li>
                <li>Mỗi nền tảng có cấu trúc API riêng, script auth sẽ tự đổi theo platform</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* CHAT MODAL                                   */}
      {/* ============================================ */}
      {showChat && (
        <div className="modal-overlay" onClick={() => setShowChat(false)}>
          <div className="modal wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">💬 Tin nhắn - {activePlatform?.name}</div>
              <button className="modal-close" onClick={() => setShowChat(false)}>✕</button>
            </div>
            <div className="chat-container">
              <div className="chat-sidebar">
                {matches.length > 0 ? matches.map(match => (
                  <div
                    key={match.id}
                    className={`match-item ${selectedMatch?.id === match.id ? 'active' : ''}`}
                    onClick={() => loadMessages(match)}
                  >
                    <img className="match-avatar" src={match.person.photos[0] || ''} alt={match.person.name} />
                    <div className="match-info">
                      <div className="match-name">{match.person.name}</div>
                      <div className="match-preview">{match.lastMessage || 'Chưa có tin nhắn'}</div>
                    </div>
                  </div>
                )) : (
                  <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💕</div>
                    <div style={{ fontSize: '0.8rem' }}>Chưa có match nào</div>
                  </div>
                )}
              </div>
              <div className="chat-main">
                {selectedMatch ? (
                  <>
                    <div className="chat-messages" ref={chatRef}>
                      {chatMessages.length > 0 ? chatMessages.map((msg: any) => (
                        <div key={msg.id} className={`message-bubble ${msg.fromMe ? 'sent' : 'received'}`}>
                          {msg.text}
                        </div>
                      )) : <div className="chat-empty">Chưa có tin nhắn</div>}
                    </div>
                    <div className="chat-input-area">
                      <input
                        className="chat-input"
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Nhập tin nhắn..."
                      />
                      <button className="chat-send-btn" onClick={handleSendMessage}>➤</button>
                    </div>
                  </>
                ) : <div className="chat-empty">Chọn một match để bắt đầu nhắn tin</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* LOG MODAL                                    */}
      {/* ============================================ */}
      {showLog && (
        <div className="modal-overlay" onClick={() => setShowLog(false)}>
          <div className="modal wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">📋 Nhật ký hoạt động</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setLogs([])}>🗑 Xóa</button>
                <button className="modal-close" onClick={() => setShowLog(false)}>✕</button>
              </div>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              <div className="log-console" ref={logRef}>
                {logs.length > 0 ? logs.map(log => (
                  <div key={log.id} className={`log-entry ${log.level}`}>
                    <span className="log-time">[{log.time}]</span>
                    {log.text}
                  </div>
                )) : <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Chưa có hoạt động nào</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* PROFILE MODAL                                */}
      {/* ============================================ */}
      {showProfile && (
        <div className="modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{activePlatform?.icon} Hồ sơ - {activePlatform?.name}</div>
              <button className="modal-close" onClick={() => setShowProfile(false)}>✕</button>
            </div>
            <div className="modal-body">
              {profile ? (
                <>
                  <div className="profile-header">
                    {profile.photos?.[0] && (
                      <img className="profile-avatar" src={profile.photos[0]} alt={profile.name}
                        style={{ border: `3px solid ${activePlatform?.color || 'var(--tinder-pink)'}`, borderRadius: '50%' }} />
                    )}
                    <div className="profile-name">{profile.name}{profile.age ? `, ${profile.age}` : ''}</div>
                    {profile.bio && <div className="profile-bio">{profile.bio}</div>}
                  </div>
                  <div className="profile-stats">
                    <div className="profile-stat">
                      <div className="profile-stat-value" style={{ background: activePlatform?.gradient, backgroundClip: 'text', WebkitBackgroundClip: 'text' }}>
                        {profile.likesRemaining ?? '∞'}
                      </div>
                      <div className="profile-stat-label">Likes còn</div>
                    </div>
                    <div className="profile-stat">
                      <div className="profile-stat-value" style={{ background: activePlatform?.gradient, backgroundClip: 'text', WebkitBackgroundClip: 'text' }}>
                        {matches.length}
                      </div>
                      <div className="profile-stat-label">Matches</div>
                    </div>
                    <div className="profile-stat">
                      <div className="profile-stat-value" style={{ background: activePlatform?.gradient, backgroundClip: 'text', WebkitBackgroundClip: 'text' }}>
                        {profile.photos?.length || 0}
                      </div>
                      <div className="profile-stat-label">Ảnh</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">👤</div>
                  <div className="empty-state-title">Chưa đăng nhập</div>
                  <div className="empty-state-desc">Cập nhật Auth token để xem hồ sơ</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
