import React, { useState, useEffect } from 'react';
import { resumeService } from '../services/resumeService';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Trash2,
  Eye,
  Sparkles,
  Calendar,
  AlertCircle,
  Plus
} from 'lucide-react';

export const Resumes = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [uploadError, setUploadError] = useState('');

  // Extracted text preview modal
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [selectedResumeText, setSelectedResumeText] = useState({ title: '', text: '' });

  // AI Suggestions modal
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState({ resumeTitle: '', content: '', status: '', notice: '' });

  const { success, error } = useToast();

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const data = await resumeService.getResumes();
      setResumes(data);
    } catch (err) {
      error('Failed to load resumes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Only PDF files are supported.');
      setFile(null);
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setUploadError('File exceeds maximum size of 10MB.');
      setFile(null);
      return;
    }

    setUploadError('');
    setFile(selected);
    if (!title) {
      // Auto-populate title from file name without extension
      setTitle(selected.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please choose a PDF file.');
      return;
    }
    if (!title.trim()) {
      setUploadError('Please provide a resume title.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      await resumeService.uploadResume(title.trim(), file);
      success('Resume uploaded and text successfully parsed!');
      setUploadModalOpen(false);
      setTitle('');
      setFile(null);
      fetchResumes();
    } catch (err) {
      const msg = err.response?.data?.file?.[0] || err.response?.data?.detail || 'Failed to upload and parse resume.';
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleSetActive = async (id) => {
    try {
      const res = await resumeService.setActiveResume(id);
      success(res.message || 'Active resume updated!');
      fetchResumes();
    } catch (err) {
      error('Failed to set resume as active.');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete '${title}'?`)) return;

    try {
      await resumeService.deleteResume(id);
      success('Resume deleted.');
      setResumes(resumes.filter((r) => r.id !== id));
    } catch (err) {
      error('Failed to delete resume.');
    }
  };

  const handleViewText = (resume) => {
    setSelectedResumeText({
      title: resume.title,
      text: resume.extracted_text || 'No text extracted for this resume.'
    });
    setTextModalOpen(true);
  };

  const handleAiImprove = async (resume) => {
    setAiSuggestions({ resumeTitle: resume.title, content: '', status: '', notice: '' });
    setAiModalOpen(true);
    setAiLoading(true);

    try {
      const res = await resumeService.getAiImprovements(resume.id);
      setAiSuggestions({
        resumeTitle: resume.title,
        content: res.suggestions,
        status: res.ai_status,
        notice: res.notice || ''
      });
    } catch (err) {
      error(err.response?.data?.error || 'Failed to get AI improvement suggestions.');
      setAiModalOpen(false);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Resume Management</h1>
          <p style={{ fontSize: '0.875rem' }}>Upload multiple resume versions, parse skill profiles, and generate AI improvements</p>
        </div>
        <button onClick={() => setUploadModalOpen(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>Upload New Resume</span>
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
          <div className="spinner" style={{ width: '32px', height: '32px', borderTopColor: 'var(--accent-primary)' }} />
        </div>
      ) : resumes.length === 0 ? (
        /* Empty State */
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
            <FileText size={32} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>No resumes uploaded yet</h2>
          <p style={{ fontSize: '0.875rem', marginBottom: '24px' }}>
            Upload your PDF resume to start matching against saved jobs, identifying missing skills, and getting personalized career guidance.
          </p>
          <button onClick={() => setUploadModalOpen(true)} className="btn btn-primary">
            <UploadCloud size={16} />
            <span>Upload Resume (PDF)</span>
          </button>
        </div>
      ) : (
        /* Resume Cards Grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
        }}>
          {resumes.map((resume) => (
            <div
              key={resume.id}
              className="glass-card"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: resume.is_active ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid var(--border-subtle)',
                boxShadow: resume.is_active ? '0 0 25px rgba(99, 102, 241, 0.15)' : 'none'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: resume.is_active ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    flexShrink: 0
                  }}>
                    <FileText size={20} />
                  </div>
                  {resume.is_active ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      <CheckCircle2 size={13} /> Active Resume
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetActive(resume.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                    >
                      Set Active
                    </button>
                  )}
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>{resume.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  <Calendar size={13} />
                  <span>Uploaded {new Date(resume.uploaded_at).toLocaleDateString()}</span>
                </div>

                <p style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: '1.5',
                  marginBottom: '18px'
                }}>
                  {resume.extracted_text || 'Text parsed successfully.'}
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
                <button
                  onClick={() => handleViewText(resume)}
                  className="btn btn-secondary btn-sm"
                  title="View Extracted Text"
                >
                  <Eye size={14} /> View Text
                </button>
                <button
                  onClick={() => handleAiImprove(resume)}
                  className="btn btn-primary btn-sm"
                  title="Analyze ATS and wording with AI"
                >
                  <Sparkles size={14} /> AI Review
                </button>
                <button
                  onClick={() => handleDelete(resume.id, resume.title)}
                  className="btn btn-danger btn-sm"
                  title="Delete Resume"
                  style={{ padding: '6px' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Resume (PDF)"
      >
        <form onSubmit={handleUploadSubmit}>
          {uploadError && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fb7185',
              fontSize: '0.8125rem',
              marginBottom: '16px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{uploadError}</span>
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Resume Title / Version</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Senior Backend Engineer - Python"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Select PDF Document (Max 10MB)</label>
            <div style={{
              border: '2px dashed var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '28px 20px',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              cursor: 'pointer',
              position: 'relative'
            }}>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer',
                  width: '100%',
                  height: '100%'
                }}
              />
              <UploadCloud size={32} color="var(--accent-primary)" style={{ margin: '0 auto 10px auto' }} />
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {file ? file.name : 'Choose a PDF file or drag and drop here'}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'PDF format up to 10MB'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={() => setUploadModalOpen(false)}
              className="btn btn-secondary"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading || !file}
            >
              {uploading ? (
                <>
                  <div className="spinner" />
                  <span>Extracting Text...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={16} />
                  <span>Upload & Parse</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Extracted Text Modal */}
      <Modal
        isOpen={textModalOpen}
        onClose={() => setTextModalOpen(false)}
        title={`Extracted Text: ${selectedResumeText.title}`}
        wide={true}
      >
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          maxHeight: '60vh',
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          fontSize: '0.8125rem',
          lineHeight: '1.6',
          color: '#cbd5e1'
        }}>
          {selectedResumeText.text}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button onClick={() => setTextModalOpen(false)} className="btn btn-secondary">
            Close
          </button>
        </div>
      </Modal>

      {/* AI Resume Improvement Modal */}
      <Modal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title={`AI Resume Review: ${aiSuggestions.resumeTitle}`}
        wide={true}
      >
        {aiLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
            <div className="spinner scanner-active" style={{ width: '40px', height: '40px', borderTopColor: 'var(--accent-primary)', marginBottom: '16px' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Analyzing ATS compatibility & impact verbs with AI...</p>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Auditing bullet structure, quantifiable metrics, and tech stacks</span>
          </div>
        ) : (
          <div>
            {aiSuggestions.status === 'offline' && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                color: '#fbbf24',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{aiSuggestions.notice || 'Standard optimization heuristics applied (Ollama offline).'}</span>
              </div>
            )}

            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '20px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              maxHeight: '65vh',
              overflowY: 'auto',
              fontSize: '0.875rem',
              lineHeight: '1.7',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap'
            }}>
              {aiSuggestions.content}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setAiModalOpen(false)} className="btn btn-secondary">
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
