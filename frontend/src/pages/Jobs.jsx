import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobService } from '../services/jobService';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import {
  Briefcase,
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  MapPin,
  DollarSign,
  Zap,
  Kanban,
  Eye,
  Filter
} from 'lucide-react';

export const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [empTypeFilter, setEmpTypeFilter] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [saving, setSaving] = useState(false);

  // View Job Modal
  const [viewingJob, setViewingJob] = useState(null);

  // Form State
  const initialFormState = {
    company_name: '',
    job_title: '',
    location: '',
    employment_type: 'Full-time',
    salary: '',
    job_url: '',
    required_skills: '',
    description: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  const { success, error } = useToast();
  const navigate = useNavigate();

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (empTypeFilter) params.employment_type = empTypeFilter;
      const data = await jobService.getJobs(params);
      setJobs(data);
    } catch (err) {
      error('Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, empTypeFilter]);

  const handleOpenCreate = () => {
    setEditingJob(null);
    setFormData(initialFormState);
    setModalOpen(true);
  };

  const handleOpenEdit = (job) => {
    setEditingJob(job);
    setFormData({
      company_name: job.company_name,
      job_title: job.job_title,
      location: job.location || '',
      employment_type: job.employment_type,
      salary: job.salary || '',
      job_url: job.job_url || '',
      required_skills: Array.isArray(job.required_skills) ? job.required_skills.join(', ') : '',
      description: job.description,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const skillsArray = formData.required_skills
      ? formData.required_skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const payload = {
      ...formData,
      required_skills: skillsArray,
    };

    try {
      if (editingJob) {
        await jobService.updateJob(editingJob.id, payload);
        success('Job updated successfully!');
      } else {
        await jobService.createJob(payload);
        success('Job opportunity saved!');
      }
      setModalOpen(false);
      fetchJobs();
    } catch (err) {
      error(err.response?.data?.detail || 'Failed to save job.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete '${title}'?`)) return;

    try {
      await jobService.deleteJob(id);
      success('Job deleted.');
      setJobs(jobs.filter((j) => j.id !== id));
    } catch (err) {
      error('Failed to delete job.');
    }
  };

  const handleMatchJob = (jobId) => {
    navigate(`/matching?job_id=${jobId}`);
  };

  const handleApplyJob = (jobId) => {
    navigate(`/applications?new_job_id=${jobId}`);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Job Opportunities</h1>
          <p style={{ fontSize: '0.875rem' }}>Organize target positions, parse required tech stacks, and match against your profile</p>
        </div>
        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={16} />
          <span>Add Job</span>
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '38px', marginBottom: 0 }}
            placeholder="Search by job title, company, skills, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="#64748b" />
          <select
            className="select-field"
            style={{ width: '170px', marginBottom: 0 }}
            value={empTypeFilter}
            onChange={(e) => setEmpTypeFilter(e.target.value)}
          >
            <option value="">All Employment Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Remote">Remote</option>
            <option value="Internship">Internship</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
          <div className="spinner" style={{ width: '32px', height: '32px', borderTopColor: 'var(--accent-primary)' }} />
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', maxWidth: '540px', margin: '40px auto' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            color: 'var(--accent-primary)'
          }}>
            <Briefcase size={32} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>No job listings found</h2>
          <p style={{ fontSize: '0.875rem', marginBottom: '24px' }}>
            {searchQuery || empTypeFilter
              ? 'No jobs match your search criteria. Try clearing filters.'
              : 'Add your first target position or company to track requirements and match your resume.'}
          </p>
          <button onClick={handleOpenCreate} className="btn btn-primary">
            <Plus size={16} />
            <span>Add Job Listing</span>
          </button>
        </div>
      ) : (
        /* Jobs Grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '20px',
        }}>
          {jobs.map((job) => (
            <div
              key={job.id}
              className="glass-card"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {job.company_name}
                    </span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '2px' }}>{job.job_title}</h3>
                  </div>
                  <span className="badge badge-saved" style={{ textTransform: 'none' }}>
                    {job.employment_type}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  {job.location && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} /> {job.location}
                    </span>
                  )}
                  {job.salary && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34d399' }}>
                      <DollarSign size={13} /> {job.salary}
                    </span>
                  )}
                  {job.job_url && (
                    <a
                      href={job.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--accent-primary)', textDecoration: 'none' }}
                    >
                      <span>Posting</span> <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                {/* Skills tags preview */}
                {job.required_skills && job.required_skills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                    {job.required_skills.slice(0, 5).map((skill, idx) => (
                      <span key={idx} className="skill-tag skill-tag-neutral" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                        {skill}
                      </span>
                    ))}
                    {job.required_skills.length > 5 && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                        +{job.required_skills.length - 5} more
                      </span>
                    )}
                  </div>
                )}

                <p style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: '1.5',
                  marginBottom: '16px'
                }}>
                  {job.description}
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-subtle)',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleMatchJob(job.id)}
                    className="btn btn-primary btn-sm"
                    title="Match Resume against this job"
                  >
                    <Zap size={14} /> Match
                  </button>
                  <button
                    onClick={() => handleApplyJob(job.id)}
                    className="btn btn-secondary btn-sm"
                    title="Move to Application Tracker"
                  >
                    <Kanban size={14} /> Track
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setViewingJob(job)}
                    className="btn btn-secondary btn-sm"
                    title="View Job"
                    style={{ padding: '6px' }}
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(job)}
                    className="btn btn-secondary btn-sm"
                    title="Edit Job"
                    style={{ padding: '6px' }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(job.id, job.job_title)}
                    className="btn btn-danger btn-sm"
                    title="Delete Job"
                    style={{ padding: '6px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Job Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingJob ? 'Edit Job Opportunity' : 'Add New Job Opportunity'}
        wide={true}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label className="input-label">Company Name *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Google, Stripe, Linear"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Job Title *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Senior Backend Engineer"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label className="input-label">Employment Type</label>
              <select
                className="select-field"
                value={formData.employment_type}
                onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Remote">Remote</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Location</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. San Francisco / Remote"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Salary Range</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. $140,000 - $170,000"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Job URL / Application Link</label>
            <input
              type="url"
              className="input-field"
              placeholder="https://jobs.example.com/posting/123"
              value={formData.job_url}
              onChange={(e) => setFormData({ ...formData, job_url: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Required Skills (Comma-separated)</label>
            <input
              type="text"
              className="input-field"
              placeholder="Python, Django, React, PostgreSQL, Docker, AWS"
              value={formData.required_skills}
              onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Full Job Description *</label>
            <textarea
              className="textarea-field"
              style={{ minHeight: '140px' }}
              placeholder="Paste the job description, responsibilities, and qualifications here..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
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
                <span>{editingJob ? 'Update Job' : 'Save Job'}</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Job Modal */}
      <Modal
        isOpen={!!viewingJob}
        onClose={() => setViewingJob(null)}
        title={viewingJob ? `${viewingJob.job_title} @ ${viewingJob.company_name}` : 'Job Details'}
        wide={true}
      >
        {viewingJob && (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', fontSize: '0.85rem' }}>
              <span className="badge badge-applied">{viewingJob.employment_type}</span>
              {viewingJob.location && <span style={{ color: 'var(--text-secondary)' }}>📍 {viewingJob.location}</span>}
              {viewingJob.salary && <span style={{ color: '#34d399' }}>💰 {viewingJob.salary}</span>}
              {viewingJob.job_url && (
                <a href={viewingJob.job_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)' }}>
                  View Posting ↗
                </a>
              )}
            </div>

            {viewingJob.required_skills?.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Specified Skills:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {viewingJob.required_skills.map((s, idx) => (
                    <span key={idx} className="skill-tag skill-tag-match">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              maxHeight: '45vh',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              fontSize: '0.85rem',
              lineHeight: '1.6',
              color: '#cbd5e1'
            }}>
              {viewingJob.description}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => {
                  const id = viewingJob.id;
                  setViewingJob(null);
                  handleMatchJob(id);
                }}
                className="btn btn-primary"
              >
                <Zap size={15} /> Analyze Match
              </button>
              <button onClick={() => setViewingJob(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
