import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { matchService } from '../services/matchService';
import { resumeService } from '../services/resumeService';
import { jobService } from '../services/jobService';
import { useToast } from '../context/ToastContext';
import { ScoreGauge } from '../components/ScoreGauge';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  History,
  FileText,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';

export const Matching = () => {
  const location = useLocation();
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');

  const [analyzing, setAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { success, error, warning } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        const [resumesRes, jobsRes] = await Promise.all([
          resumeService.getResumes(),
          jobService.getJobs(),
        ]);
        setResumes(resumesRes);
        setJobs(jobsRes);

        // Pre-select active resume if available
        const activeRes = resumesRes.find((r) => r.is_active) || resumesRes[0];
        if (activeRes) {
          setSelectedResumeId(String(activeRes.id));
        }

        // Check query param for pre-selected job
        const params = new URLSearchParams(location.search);
        const queryJobId = params.get('job_id');
        if (queryJobId) {
          setSelectedJobId(queryJobId);
        } else if (jobsRes.length > 0) {
          setSelectedJobId(String(jobsRes[0].id));
        }

        fetchHistory();
      } catch (err) {
        error('Failed to load initial data for resume matcher.');
      }
    };
    init();
  }, [location.search]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await matchService.getMatchHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load match history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!selectedResumeId || !selectedJobId) {
      warning('Please select both a resume and a job.');
      return;
    }

    setAnalyzing(true);
    setCurrentResult(null);

    try {
      const res = await matchService.analyzeMatch(
        Number(selectedResumeId),
        Number(selectedJobId)
      );
      setCurrentResult(res);
      success('Match analysis completed!');
      fetchHistory();
    } catch (err) {
      error(err.response?.data?.error || err.response?.data?.detail || 'Failed to analyze match.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectHistoryItem = (item) => {
    setCurrentResult(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Resume Match Intelligence</h1>
        <p style={{ fontSize: '0.875rem' }}>
          Evaluate deterministic skill alignment and receive LLM-powered qualitative insights and gap recommendations
        </p>
      </div>

      {/* Match Configuration Card */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <form onSubmit={handleAnalyze} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr)) 180px', gap: '16px', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} color="var(--accent-primary)" />
              <span>Select Resume</span>
            </label>
            <select
              className="select-field"
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              disabled={analyzing}
            >
              <option value="">-- Choose Resume --</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} {r.is_active ? '★ (Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Briefcase size={14} color="var(--accent-primary)" />
              <span>Select Target Job</span>
            </label>
            <select
              className="select-field"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              disabled={analyzing}
            >
              <option value="">-- Choose Job --</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.job_title} @ {j.company_name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ height: '44px', width: '100%' }}
            disabled={analyzing || !selectedResumeId || !selectedJobId}
          >
            {analyzing ? (
              <>
                <div className="spinner" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <Zap size={18} />
                <span>Analyze Match</span>
              </>
            )}
          </button>
        </form>

        {(!resumes.length || !jobs.length) && (
          <div style={{ marginTop: '14px', fontSize: '0.8rem', color: '#fbbf24' }}>
            Note: You need at least 1 uploaded resume and 1 saved job to run a match analysis.
          </div>
        )}
      </div>

      {/* Analyzing Progress State */}
      {analyzing && (
        <div className="glass-card scanner-active" style={{ padding: '48px 20px', textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'var(--accent-gradient)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: 'var(--accent-glow)'
          }}>
            <Sparkles size={28} color="#fff" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>Running Resume Intelligence Engine</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
            Parsing syntax, cross-referencing technical skills taxonomy, calculating baseline match score, and generating AI insights...
          </p>
        </div>
      )}

      {/* Results Container */}
      {currentResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '36px' }}>
          {/* Top Score Banner */}
          <div className="glass-card" style={{
            padding: '32px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
            alignItems: 'center',
            border: '1px solid rgba(99, 102, 241, 0.4)'
          }}>
            <ScoreGauge score={currentResult.overall_score} size={180} strokeWidth={16} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-primary)', fontWeight: 700 }}>
                  Match Report
                </span>
                {currentResult.ai_status === 'online' ? (
                  <span style={{
                    fontSize: '0.72rem',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Cpu size={12} /> AI Enhanced ({currentResult.model || 'Ollama'})
                  </span>
                ) : (
                  <span style={{
                    fontSize: '0.72rem',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <ShieldCheck size={12} /> Deterministic Engine
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                {currentResult.job_title} @ {currentResult.company_name}
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Evaluated against: <strong style={{ color: 'var(--text-primary)' }}>{currentResult.resume_title}</strong>
              </div>

              {/* Skills Compatibility Ratio */}
              <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                <div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399' }}>
                    {currentResult.matching_skills?.length || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Matching Skills</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fb7185' }}>
                    {currentResult.missing_skills?.length || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Missing Gaps</div>
                </div>
              </div>
            </div>
          </div>

          {/* Skills Breakdown Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {/* Matching Skills */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <CheckCircle2 size={18} color="#34d399" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Matching Skills Detected</h3>
              </div>

              {currentResult.matching_skills && currentResult.matching_skills.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {currentResult.matching_skills.map((skill, i) => (
                    <span key={i} className="skill-tag skill-tag-match" style={{ padding: '6px 12px' }}>
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  No exact keyword matches found between this resume and the required skills.
                </p>
              )}
            </div>

            {/* Missing Skills */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <AlertTriangle size={18} color="#fb7185" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Missing Required Skills</h3>
              </div>

              {currentResult.missing_skills && currentResult.missing_skills.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {currentResult.missing_skills.map((skill, i) => (
                    <span key={i} className="skill-tag skill-tag-missing" style={{ padding: '6px 12px' }}>
                      ✕ {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: '#34d399' }}>
                  Outstanding! You match 100% of the recognized technical skills for this job posting.
                </p>
              )}
            </div>
          </div>

          {/* Recommendations & AI Summary Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {/* Recommendations */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Lightbulb size={18} color="#fbbf24" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Actionable Recommendations</h3>
              </div>

              {currentResult.recommendations && currentResult.recommendations.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {currentResult.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.85rem',
                        lineHeight: 1.5,
                        display: 'flex',
                        gap: '10px'
                      }}
                    >
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{i + 1}.</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  No specific recommendations generated.
                </p>
              )}
            </div>

            {/* AI Summary */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Sparkles size={18} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Executive Compatibility Summary</h3>
              </div>

              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.875rem',
                lineHeight: '1.7',
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap'
              }}>
                {currentResult.ai_summary || 'Match analysis completed successfully based on deterministic skill taxonomy.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Section */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <History size={18} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Previous Match Analyses</h3>
        </div>

        {historyLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <div className="spinner" />
          </div>
        ) : history.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            No prior match analyses saved. Analyses you perform are logged here for review.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectHistoryItem(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    {item.job_title} @ {item.company_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Resume: {item.resume_title} • {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    color: item.overall_score >= 70 ? '#34d399' : item.overall_score >= 45 ? '#fbbf24' : '#fb7185'
                  }}>
                    {item.overall_score}%
                  </span>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
