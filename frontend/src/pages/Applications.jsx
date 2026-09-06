import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { applicationService } from '../services/applicationService';
import { jobService } from '../services/jobService';
import { resumeService } from '../services/resumeService';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import {
  Kanban as KanbanIcon,
  Table as TableIcon,
  Plus,
  Calendar,
  FileText,
  Briefcase,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';

const STATUS_CONFIG = [
  { key: 'SAVED', label: 'Saved', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' },
  { key: 'APPLIED', label: 'Applied', color: '#38bdf8', bg: 'rgba(14, 165, 233, 0.1)' },
  { key: 'SCREENING', label: 'Screening', color: '#c084fc', bg: 'rgba(168, 85, 247, 0.1)' },
  { key: 'INTERVIEW', label: 'Interview', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.1)' },
  { key: 'OFFER', label: 'Offer', color: '#34d399', bg: 'rgba(16, 185, 129, 0.1)' },
  { key: 'REJECTED', label: 'Rejected', color: '#fb7185', bg: 'rgba(244, 63, 94, 0.1)' },
  { key: 'WITHDRAWN', label: 'Withdrawn', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' },
];

export const Applications = () => {
  const location = useLocation();
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'table'

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [saving, setSaving] = useState(false);

  const initialForm = {
    job_id: '',
    resume_id: '',
    status: 'SAVED',
    applied_date: '',
    interview_date: '',
    notes: '',
  };
  const [formData, setFormData] = useState(initialForm);

  const { success, error } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appsRes, jobsRes, resumesRes] = await Promise.all([
        applicationService.getApplications(),
        jobService.getJobs(),
        resumeService.getResumes(),
      ]);
      setApplications(appsRes);
      setJobs(jobsRes);
      setResumes(resumesRes);

      // Check if URL has ?new_job_id=
      const params = new URLSearchParams(location.search);
      const newJobId = params.get('new_job_id');
      if (newJobId) {
        const defaultResume = resumesRes.find(r => r.is_active) || resumesRes[0];
        setFormData({
          job_id: newJobId,
          resume_id: defaultResume ? defaultResume.id : '',
          status: 'SAVED',
          applied_date: '',
          interview_date: '',
          notes: '',
        });
        setModalOpen(true);
      }
    } catch (err) {
      error('Failed to load application data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [location.search]);

  const handleOpenCreate = () => {
    const defaultResume = resumes.find(r => r.is_active) || resumes[0];
    setEditingApp(null);
    setFormData({
      ...initialForm,
      job_id: jobs[0]?.id || '',
      resume_id: defaultResume ? defaultResume.id : '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (app) => {
    setEditingApp(app);
    setFormData({
      job_id: app.job,
      resume_id: app.resume || '',
      status: app.status,
      applied_date: app.applied_date || '',
      interview_date: app.interview_date ? app.interview_date.slice(0, 16) : '',
      notes: app.notes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.job_id) {
      error('Please select a target job.');
      return;
    }

    setSaving(true);
    const payload = {
      job_id: Number(formData.job_id),
      resume_id: formData.resume_id ? Number(formData.resume_id) : null,
      status: formData.status,
      applied_date: formData.applied_date || null,
      interview_date: formData.interview_date ? new Date(formData.interview_date).toISOString() : null,
      notes: formData.notes,
    };

    try {
      if (editingApp) {
        await applicationService.updateApplication(editingApp.id, payload);
        success('Application updated.');
      } else {
        await applicationService.createApplication(payload);
        success('Application logged to tracker!');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      error(err.response?.data?.detail || 'Failed to save application.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatusChange = async (appId, newStatus) => {
    try {
      await applicationService.updateApplication(appId, { status: newStatus });
      setApplications(applications.map(a => a.id === appId ? { ...a, status: newStatus } : a));
      success(`Status moved to ${newStatus}`);
    } catch (err) {
      error('Failed to update status.');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete application for '${title}'?`)) return;

    try {
      await applicationService.deleteApplication(id);
      success('Application removed.');
      setApplications(applications.filter(a => a.id !== id));
    } catch (err) {
      error('Failed to delete application.');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Application Tracker</h1>
          <p style={{ fontSize: '0.875rem' }}>Track pipeline stages, schedule interviews, and log private notes</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* View Toggle */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: '4px'
          }}>
            <button
              onClick={() => setViewMode('kanban')}
              className="btn btn-sm"
              style={{
                background: viewMode === 'kanban' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'kanban' ? '#fff' : 'var(--text-secondary)',
                padding: '4px 10px',
              }}
            >
              <KanbanIcon size={14} /> Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className="btn btn-sm"
              style={{
                background: viewMode === 'table' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'table' ? '#fff' : 'var(--text-secondary)',
                padding: '4px 10px',
              }}
            >
              <TableIcon size={14} /> Table
            </button>
          </div>

          <button onClick={handleOpenCreate} className="btn btn-primary" disabled={jobs.length === 0}>
            <Plus size={16} />
            <span>Track Application</span>
          </button>
        </div>
      </div>

      {jobs.length === 0 && (
        <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '20px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#fbbf24', fontSize: '0.875rem' }}>
          Notice: You haven't added any jobs yet. Please create a job opportunity in the Job Tracker before tracking an application.
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
          <div className="spinner" style={{ width: '32px', height: '32px', borderTopColor: 'var(--accent-primary)' }} />
        </div>
      ) : applications.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', maxWidth: '540px', margin: '40px auto' }}>
          <KanbanIcon size={40} color="var(--accent-primary)" style={{ margin: '0 auto 16px auto', display: 'block' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>No active applications</h2>
          <p style={{ fontSize: '0.875rem', marginBottom: '20px' }}>
            Track jobs you've applied to, schedule interviews, and visualize pipeline progression.
          </p>
          <button onClick={handleOpenCreate} className="btn btn-primary" disabled={jobs.length === 0}>
            <Plus size={16} /> Track First Application
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban Board */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          alignItems: 'start',
          overflowX: 'auto',
          paddingBottom: '20px'
        }}>
          {STATUS_CONFIG.map((col) => {
            const columnApps = applications.filter((a) => a.status === col.key);
            return (
              <div
                key={col.key}
                style={{
                  background: 'rgba(15, 23, 42, 0.45)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  minHeight: '400px'
                }}
              >
                {/* Column Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{col.label}</span>
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: 'rgba(255, 255, 255, 0.08)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    color: 'var(--text-secondary)'
                  }}>
                    {columnApps.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {columnApps.map((app) => (
                    <div
                      key={app.id}
                      className="glass-card"
                      style={{
                        padding: '14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                            {app.job_details?.company_name}
                          </div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px' }}>
                            {app.job_details?.job_title}
                          </h4>
                        </div>
                        <button
                          onClick={() => handleOpenEdit(app)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>

                      {/* Resume attached tag */}
                      {app.resume_details && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <FileText size={12} color="var(--accent-primary)" />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {app.resume_details.title}
                          </span>
                        </div>
                      )}

                      {/* Interview date */}
                      {app.interview_date && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.75rem',
                          color: '#fbbf24',
                          background: 'rgba(245, 158, 11, 0.1)',
                          padding: '4px 8px',
                          borderRadius: '6px'
                        }}>
                          <Clock size={12} />
                          <span>Interview: {new Date(app.interview_date).toLocaleDateString()}</span>
                        </div>
                      )}

                      {/* Notes snippet */}
                      {app.notes && (
                        <p style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {app.notes}
                        </p>
                      )}

                      {/* Card Footer: Quick move dropdown */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--border-subtle)',
                        marginTop: '4px'
                      }}>
                        <select
                          value={app.status}
                          onChange={(e) => handleQuickStatusChange(app.id, e.target.value)}
                          className="select-field"
                          style={{
                            padding: '3px 6px',
                            fontSize: '0.72rem',
                            width: 'auto',
                            marginBottom: 0,
                            borderRadius: '4px'
                          }}
                        >
                          {STATUS_CONFIG.map(s => (
                            <option key={s.key} value={s.key}>Move to: {s.label}</option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleDelete(app.id, app.job_details?.job_title)}
                          style={{ background: 'transparent', border: 'none', color: '#fb7185', cursor: 'pointer', padding: '2px' }}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="glass-card" style={{ padding: '20px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 14px' }}>Company & Role</th>
                <th style={{ padding: '12px 14px' }}>Status</th>
                <th style={{ padding: '12px 14px' }}>Attached Resume</th>
                <th style={{ padding: '12px 14px' }}>Applied Date</th>
                <th style={{ padding: '12px 14px' }}>Interview Date</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{app.job_details?.job_title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.job_details?.company_name}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className={`badge badge-${app.status.toLowerCase()}`}>
                      {app.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                    {app.resume_details?.title || 'None attached'}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                    {app.applied_date || '—'}
                  </td>
                  <td style={{ padding: '12px 14px', color: app.interview_date ? '#fbbf24' : 'var(--text-muted)' }}>
                    {app.interview_date ? new Date(app.interview_date).toLocaleString() : '—'}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button onClick={() => handleOpenEdit(app)} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }}>
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleDelete(app.id, app.job_details?.job_title)} className="btn btn-danger btn-sm" style={{ padding: '4px 8px' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingApp ? 'Update Application' : 'Track New Application'}
      >
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Target Job *</label>
            <select
              className="select-field"
              value={formData.job_id}
              onChange={(e) => setFormData({ ...formData, job_id: e.target.value })}
              required
            >
              <option value="">-- Choose Job --</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.job_title} @ {job.company_name}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Associated Resume Version</label>
            <select
              className="select-field"
              value={formData.resume_id}
              onChange={(e) => setFormData({ ...formData, resume_id: e.target.value })}
            >
              <option value="">-- None / General --</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} {r.is_active ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label className="input-label">Pipeline Status</label>
              <select
                className="select-field"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {STATUS_CONFIG.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Date Applied</label>
              <input
                type="date"
                className="input-field"
                value={formData.applied_date}
                onChange={(e) => setFormData({ ...formData, applied_date: e.target.value })}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Interview Date & Time (Optional)</label>
            <input
              type="datetime-local"
              className="input-field"
              value={formData.interview_date}
              onChange={(e) => setFormData({ ...formData, interview_date: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Notes & Follow-ups</label>
            <textarea
              className="textarea-field"
              placeholder="Referral contact, recruiter notes, salary discussed, take-home challenge details..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <div className="spinner" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{editingApp ? 'Update Application' : 'Save Application'}</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
