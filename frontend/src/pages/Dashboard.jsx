import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import {
  Briefcase,
  FileCheck,
  Award,
  Bookmark,
  Target,
  ArrowUpRight,
  Calendar,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Plus
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area
} from 'recharts';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await dashboardService.getDashboardData();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const STATUS_COLORS = {
    SAVED: '#94a3b8',
    APPLIED: '#38bdf8',
    SCREENING: '#c084fc',
    INTERVIEW: '#fbbf24',
    OFFER: '#34d399',
    REJECTED: '#fb7185',
    WITHDRAWN: '#64748b'
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: '36px', height: '36px', borderTopColor: 'var(--accent-primary)' }} />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Applications',
      value: data?.total_applications ?? 0,
      icon: Briefcase,
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.12)',
      border: 'rgba(99, 102, 241, 0.25)',
    },
    {
      title: 'Interviews Scheduled',
      value: data?.interviews ?? 0,
      icon: Calendar,
      color: '#fbbf24',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.25)',
    },
    {
      title: 'Job Offers',
      value: data?.offers ?? 0,
      icon: Award,
      color: '#34d399',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.25)',
    },
    {
      title: 'Saved Opportunities',
      value: data?.saved_jobs ?? 0,
      icon: Bookmark,
      color: '#38bdf8',
      bg: 'rgba(14, 165, 233, 0.12)',
      border: 'rgba(14, 165, 233, 0.25)',
    },
    {
      title: 'Avg Match Score',
      value: `${data?.average_match_score ?? 0}%`,
      icon: Target,
      color: '#ec4899',
      bg: 'rgba(236, 72, 153, 0.12)',
      border: 'rgba(236, 72, 153, 0.25)',
    },
  ];

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Intelligence Overview</h1>
          <p style={{ fontSize: '0.875rem' }}>Track your application pipeline and optimize resume relevance</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchDashboard} className="btn btn-secondary btn-sm" title="Refresh metrics">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <Link to="/matching" className="btn btn-primary btn-sm">
            <Sparkles size={15} />
            <span>Analyze Match</span>
          </Link>
        </div>
      </div>

      {/* Metric Counters Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="glass-card"
              style={{
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                border: `1px solid ${card.border}`,
              }}
            >
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: card.bg,
                border: `1px solid ${card.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: card.color,
                flexShrink: 0,
              }}>
                <Icon size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {card.title}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px', lineHeight: 1.2 }}>
                  {card.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {/* Applications by Status Bar Chart */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Applications by Pipeline Stage</h3>
            <Link to="/applications" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View Board <ArrowUpRight size={14} />
            </Link>
          </div>
          <div style={{ height: '240px', width: '100%' }}>
            {data?.applications_by_status && data.applications_by_status.some(i => i.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.applications_by_status} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="status"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid var(--border-light)', borderRadius: '8px', color: '#fff' }}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {data.applications_by_status.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                <Briefcase size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
                <span style={{ fontSize: '0.875rem' }}>No applications tracked yet</span>
              </div>
            )}
          </div>
        </div>

        {/* Match Scores Timeline / Area Chart */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Resume Match Scores Overview</h3>
            <Link to="/matching" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Run Analysis <ArrowUpRight size={14} />
            </Link>
          </div>
          <div style={{ height: '240px', width: '100%' }}>
            {data?.match_scores_overview && data.match_scores_overview.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.match_scores_overview} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="job_title" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid var(--border-light)', borderRadius: '8px', color: '#fff' }}
                    formatter={(val) => [`${val}%`, 'Match Score']}
                  />
                  <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#scoreGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                <Target size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
                <span style={{ fontSize: '0.875rem' }}>No match analyses generated yet</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two Columns: Recent Applications & Top Missing Skills / Interviews */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '20px'
      }}>
        {/* Recent Applications */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Applications</h3>
            <Link to="/applications" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>
              View All
            </Link>
          </div>

          {data?.recent_applications && data.recent_applications.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.recent_applications.map((app) => (
                <div
                  key={app.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>{app.job_details?.job_title || 'Software Role'}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {app.job_details?.company_name} • {app.applied_date ? `Applied ${app.applied_date}` : 'Draft'}
                    </span>
                  </div>
                  <span className={`badge badge-${app.status.toLowerCase()}`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.875rem' }}>No applications saved yet.</p>
              <Link to="/applications" className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }}>
                <Plus size={14} /> Create Application
              </Link>
            </div>
          )}
        </div>

        {/* Action Center: Top Missing Skills & Upcoming Interviews */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Missing Skills */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>Target Skill Gaps</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Skills frequently required by your saved roles but missing from your active resume:
            </p>

            {data?.top_missing_skills && data.top_missing_skills.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {data.top_missing_skills.map((item, idx) => (
                  <div
                    key={idx}
                    className="skill-tag skill-tag-missing"
                    style={{ padding: '5px 12px', fontSize: '0.8125rem' }}
                  >
                    <span>{item.skill}</span>
                    <span style={{
                      fontSize: '0.7rem',
                      background: 'rgba(244, 63, 94, 0.25)',
                      padding: '1px 6px',
                      borderRadius: '999px',
                      marginLeft: '4px'
                    }}>
                      {item.count} roles
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Run match analyses between your resumes and jobs to highlight priority skill gaps.
              </p>
            )}
          </div>

          {/* Upcoming Interviews */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#fbbf24" />
              <span>Upcoming Interviews</span>
            </h3>

            {data?.upcoming_interviews && data.upcoming_interviews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.upcoming_interviews.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                        {item.job_details?.job_title} @ {item.job_details?.company_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#fbbf24' }}>
                        {new Date(item.interview_date).toLocaleString()}
                      </div>
                    </div>
                    <Link to="/applications" className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                      Notes
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                No upcoming interviews scheduled. Update your application dates as you hear back!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
