'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Select, MenuItem, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Tooltip, Badge, Fade, Skeleton, Avatar, FormControl, InputLabel,
  Snackbar, Alert
} from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import Link from 'next/link';
import {
  JobApplication,
  getApplications,
  updateApplication,
  deleteApplication,
  getApplicationStats,
  getDaysSinceApplied,
  STATUS_LABELS,
  STATUS_COLORS,
} from '../../lib/applications';

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [editModal, setEditModal] = useState<JobApplication | null>(null);
  const [followUpModal, setFollowUpModal] = useState<JobApplication | null>(null);
  const [toast, setToast] = useState<{open: boolean, message: string, severity: 'success' | 'error' | 'info'}>({open: false, message: '', severity: 'success'});
  
  // Follow-up generation state
  const [resumeText, setResumeText] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState<{subject: string, body: string} | null>(null);
  const [generatedLinkedIn, setGeneratedLinkedIn] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = () => {
    setLoading(true);
    const apps = getApplications();
    setApplications(apps);
    setLoading(false);
  };

  const stats = getApplicationStats();

  const filteredApps = filter === 'all' 
    ? applications 
    : applications.filter(a => a.status === filter);

  const handleStatusChange = (app: JobApplication, newStatus: JobApplication['status']) => {
    updateApplication(app.id, { status: newStatus });
    loadApplications();
    setToast({ open: true, message: `Status updated to ${STATUS_LABELS[newStatus]}`, severity: 'success' });
  };

  const handleDelete = (app: JobApplication) => {
    if (confirm(`Remove "${app.title}" at ${app.company} from your applications?`)) {
      deleteApplication(app.id);
      loadApplications();
      setToast({ open: true, message: 'Application removed', severity: 'info' });
    }
  };

  const handleSaveNotes = () => {
    if (editModal) {
      updateApplication(editModal.id, { 
        notes: editModal.notes,
        contactName: editModal.contactName,
        contactEmail: editModal.contactEmail,
        contactLinkedIn: editModal.contactLinkedIn,
      });
      setEditModal(null);
      loadApplications();
      setToast({ open: true, message: 'Notes saved', severity: 'success' });
    }
  };

  const handleGenerateFollowUp = async () => {
    if (!followUpModal) return;
    
    setGenerating(true);
    try {
      const res = await fetch('/api/v1/generate-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: followUpModal.title,
          company: followUpModal.company,
          jobDescription: followUpModal.description,
          resumeText: resumeText,
          contactName: followUpModal.contactName,
          contactEmail: followUpModal.contactEmail,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setGeneratedEmail(data.email);
        setGeneratedLinkedIn(data.linkedinMessage);
      } else {
        throw new Error('Failed to generate');
      }
    } catch (err) {
      setToast({ open: true, message: 'Failed to generate follow-up. Check API key.', severity: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setToast({ open: true, message: `${type} copied to clipboard!`, severity: 'success' });
  };

  const handleSendEmail = () => {
    if (!generatedEmail || !followUpModal?.contactEmail) return;
    
    const mailtoLink = `mailto:${followUpModal.contactEmail}?subject=${encodeURIComponent(generatedEmail.subject)}&body=${encodeURIComponent(generatedEmail.body)}`;
    window.open(mailtoLink, '_blank');
    
    // Mark as followed up
    updateApplication(followUpModal.id, { 
      followUpSent: true, 
      followUpSentAt: new Date().toISOString(),
      status: 'following_up'
    });
    loadApplications();
    setFollowUpModal(null);
    setGeneratedEmail(null);
    setToast({ open: true, message: 'Email client opened! Follow-up marked.', severity: 'success' });
  };

  return (
    <Box maxWidth="lg" mx="auto" sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 4,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Link href="/work-search" passHref>
            <IconButton sx={{ bgcolor: '#f5f5f5' }}>
              <ArrowBackIcon />
            </IconButton>
          </Link>
          <Box>
            <Typography variant="h4" fontWeight="800" color="#003865">
              My Applications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track your job applications and follow-ups
            </Typography>
          </Box>
        </Box>
        
        <Link href="/work-search" passHref>
          <Button variant="contained" startIcon={<WorkIcon />} sx={{
            background: 'linear-gradient(135deg, #003865 0%, #0055a5 100%)',
            borderRadius: 2,
            fontWeight: 600
          }}>
            Find More Jobs
          </Button>
        </Link>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2, mb: 4 }}>
        <Card sx={{ 
          p: 2, 
          borderRadius: 3, 
          background: 'linear-gradient(135deg, #003865 0%, #0055a5 100%)',
          color: 'white'
        }}>
          <Typography variant="h3" fontWeight="800">{stats.total}</Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Applications</Typography>
        </Card>
        
        <Card sx={{ p: 2, borderRadius: 3, bgcolor: '#E3F2FD' }}>
          <Typography variant="h3" fontWeight="800" color="#1976D2">{stats.applied}</Typography>
          <Typography variant="body2" color="text.secondary">Applied</Typography>
        </Card>
        
        <Card sx={{ p: 2, borderRadius: 3, bgcolor: '#FFF3E0' }}>
          <Typography variant="h3" fontWeight="800" color="#E65100">{stats.followingUp}</Typography>
          <Typography variant="body2" color="text.secondary">Following Up</Typography>
        </Card>
        
        <Card sx={{ p: 2, borderRadius: 3, bgcolor: '#F3E5F5' }}>
          <Typography variant="h3" fontWeight="800" color="#7B1FA2">{stats.interviewing}</Typography>
          <Typography variant="body2" color="text.secondary">Interviewing</Typography>
        </Card>
        
        <Card sx={{ p: 2, borderRadius: 3, bgcolor: '#E8F5E9' }}>
          <Typography variant="h3" fontWeight="800" color="#2E7D32">{stats.offers}</Typography>
          <Typography variant="body2" color="text.secondary">Offers</Typography>
        </Card>
      </Box>

      {/* Filter Tabs */}
      <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={filter} 
          onChange={(e, val) => setFilter(val)}
          sx={{
            '& .MuiTab-root': { fontWeight: 600, textTransform: 'none' },
            '& .Mui-selected': { color: '#003865 !important' }
          }}
        >
          <Tab label={`All (${stats.total})`} value="all" />
          <Tab label={`Applied (${stats.applied})`} value="applied" />
          <Tab label={`Following Up (${stats.followingUp})`} value="following_up" />
          <Tab label={`Interviewing (${stats.interviewing})`} value="interviewing" />
          <Tab label={`Offers (${stats.offers})`} value="offer" />
        </Tabs>
      </Box>

      {/* Applications List */}
      {loading ? (
        <Box sx={{ display: 'grid', gap: 2 }}>
          {[1,2,3].map(i => (
            <Skeleton key={i} variant="rounded" height={100} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      ) : filteredApps.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '2px dashed #e0e0e0' }}>
          <WorkIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {filter === 'all' ? 'No applications yet' : `No ${STATUS_LABELS[filter as JobApplication['status']]} applications`}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Start tracking your job applications by applying to jobs in the Job Search
          </Typography>
          <Link href="/work-search" passHref>
            <Button variant="contained" startIcon={<WorkIcon />}>
              Start Job Search
            </Button>
          </Link>
        </Card>
      ) : (
        <Box sx={{ display: 'grid', gap: 2 }}>
          {filteredApps.map((app, index) => {
            const daysSince = getDaysSinceApplied(app.appliedAt);
            const needsFollowUp = daysSince >= 7 && !app.followUpSent && app.status === 'applied';
            
            return (
              <Fade in key={app.id} timeout={300 + index * 50}>
                <Card sx={{ 
                  borderRadius: 3,
                  border: needsFollowUp ? '2px solid #FF9800' : '1px solid #e0e0e0',
                  transition: 'all 0.3s',
                  '&:hover': { 
                    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                    transform: 'translateY(-2px)'
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    {needsFollowUp && (
                      <Chip 
                        icon={<ScheduleIcon />}
                        label="Follow-up recommended" 
                        size="small"
                        sx={{ 
                          mb: 2, 
                          bgcolor: '#FFF3E0', 
                          color: '#E65100',
                          fontWeight: 600 
                        }} 
                      />
                    )}
                    
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      {/* Logo */}
                      {app.logoUrl ? (
                        <Avatar 
                          src={app.logoUrl} 
                          variant="rounded"
                          sx={{ width: 56, height: 56, bgcolor: 'white', border: '1px solid #eee' }}
                        />
                      ) : (
                        <Avatar variant="rounded" sx={{ width: 56, height: 56, bgcolor: '#f5f5f5' }}>
                          <WorkIcon sx={{ color: '#999' }} />
                        </Avatar>
                      )}
                      
                      {/* Job Info */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                          <Box>
                            <Typography variant="h6" fontWeight="700" color="#003865" noWrap>
                              {app.title}
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary" fontWeight="500">
                              {app.company}
                            </Typography>
                          </Box>
                          
                          {/* Status Select */}
                          <FormControl size="small" sx={{ minWidth: 150 }}>
                            <Select
                              value={app.status}
                              onChange={(e) => handleStatusChange(app, e.target.value as JobApplication['status'])}
                              sx={{ 
                                borderRadius: 2,
                                fontWeight: 600,
                                bgcolor: STATUS_COLORS[app.status] + '20',
                                '& .MuiSelect-select': { py: 1 }
                              }}
                            >
                              <MenuItem value="applied">Applied</MenuItem>
                              <MenuItem value="following_up">Following Up</MenuItem>
                              <MenuItem value="interviewing">Interviewing</MenuItem>
                              <MenuItem value="offer">Offer Received</MenuItem>
                              <MenuItem value="rejected">Rejected</MenuItem>
                              <MenuItem value="withdrawn">Withdrawn</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                        
                        {/* Tags */}
                        <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                          <Chip 
                            icon={<LocationOnIcon />} 
                            label={app.location} 
                            size="small" 
                            variant="outlined"
                          />
                          <Chip 
                            icon={<AccessTimeIcon />} 
                            label={`Applied ${daysSince === 0 ? 'today' : daysSince === 1 ? 'yesterday' : `${daysSince} days ago`}`}
                            size="small"
                            sx={{ bgcolor: '#f5f5f5' }}
                          />
                          {app.salary && (
                            <Chip label={app.salary} size="small" sx={{ bgcolor: '#E8F5E9', color: '#2E7D32' }} />
                          )}
                          {app.followUpSent && (
                            <Chip 
                              icon={<CheckCircleIcon />} 
                              label="Followed up" 
                              size="small" 
                              sx={{ bgcolor: '#E3F2FD', color: '#1565C0' }} 
                            />
                          )}
                        </Box>
                        
                        {/* Notes preview */}
                        {app.notes && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, fontStyle: 'italic' }}>
                            📝 {app.notes.substring(0, 100)}{app.notes.length > 100 ? '...' : ''}
                          </Typography>
                        )}
                      </Box>
                      
                      {/* Actions */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<EmailIcon />}
                          onClick={() => setFollowUpModal(app)}
                          sx={{
                            borderRadius: 2,
                            fontWeight: 600,
                            background: 'linear-gradient(135deg, #78BE20 0%, #5da010 100%)',
                          }}
                        >
                          Follow Up
                        </Button>
                        
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Edit notes">
                            <IconButton size="small" onClick={() => setEditModal(app)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {app.url && (
                            <Tooltip title="View job posting">
                              <IconButton size="small" component="a" href={app.url} target="_blank">
                                <OpenInNewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Remove">
                            <IconButton size="small" onClick={() => handleDelete(app)} sx={{ color: '#F44336' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            );
          })}
        </Box>
      )}

      {/* Edit Notes Modal */}
      <Dialog open={!!editModal} onClose={() => setEditModal(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Edit Application Details
        </DialogTitle>
        <DialogContent>
          {editModal && (
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle1" fontWeight="600" color="primary">
                {editModal.title} at {editModal.company}
              </Typography>
              
              <TextField
                label="Contact Name"
                value={editModal.contactName || ''}
                onChange={(e) => setEditModal({ ...editModal, contactName: e.target.value })}
                fullWidth
                placeholder="e.g., John Smith (Hiring Manager)"
              />
              
              <TextField
                label="Contact Email"
                value={editModal.contactEmail || ''}
                onChange={(e) => setEditModal({ ...editModal, contactEmail: e.target.value })}
                fullWidth
                placeholder="e.g., john.smith@company.com"
              />
              
              <TextField
                label="LinkedIn Profile URL"
                value={editModal.contactLinkedIn || ''}
                onChange={(e) => setEditModal({ ...editModal, contactLinkedIn: e.target.value })}
                fullWidth
                placeholder="e.g., https://linkedin.com/in/johnsmith"
              />
              
              <TextField
                label="Notes"
                value={editModal.notes || ''}
                onChange={(e) => setEditModal({ ...editModal, notes: e.target.value })}
                fullWidth
                multiline
                rows={4}
                placeholder="Add any notes about this application..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditModal(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveNotes}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Follow-Up Modal */}
      <Dialog open={!!followUpModal} onClose={() => { setFollowUpModal(null); setGeneratedEmail(null); setGeneratedLinkedIn(''); }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon color="primary" />
          Generate Follow-Up
        </DialogTitle>
        <DialogContent>
          {followUpModal && (
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Card sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight="600" color="primary">
                  {followUpModal.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {followUpModal.company} • {followUpModal.location}
                </Typography>
              </Card>
              
              {/* Contact Info */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Contact Name (Optional)"
                  value={followUpModal.contactName || ''}
                  onChange={(e) => setFollowUpModal({ ...followUpModal, contactName: e.target.value })}
                  size="small"
                />
                <TextField
                  label="Contact Email"
                  value={followUpModal.contactEmail || ''}
                  onChange={(e) => setFollowUpModal({ ...followUpModal, contactEmail: e.target.value })}
                  size="small"
                />
              </Box>
              
              {/* Resume Input */}
              <TextField
                label="Paste Your Resume (for personalized message)"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                fullWidth
                multiline
                rows={6}
                placeholder="Paste your resume text here for a more personalized follow-up message..."
              />
              
              <Button
                variant="contained"
                size="large"
                onClick={handleGenerateFollowUp}
                disabled={generating}
                sx={{
                  alignSelf: 'center',
                  borderRadius: 2,
                  px: 4,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #003865 0%, #0055a5 100%)',
                }}
              >
                {generating ? '✨ Generating...' : '✨ Generate with AI'}
              </Button>
              
              {/* Generated Content */}
              {generatedEmail && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="subtitle2" fontWeight="700" color="primary">
                    📧 Email Follow-Up
                  </Typography>
                  
                  <TextField
                    label="Subject"
                    value={generatedEmail.subject}
                    onChange={(e) => setGeneratedEmail({ ...generatedEmail, subject: e.target.value })}
                    fullWidth
                    size="small"
                  />
                  
                  <TextField
                    label="Email Body"
                    value={generatedEmail.body}
                    onChange={(e) => setGeneratedEmail({ ...generatedEmail, body: e.target.value })}
                    fullWidth
                    multiline
                    rows={8}
                  />
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<EmailIcon />}
                      onClick={handleSendEmail}
                      disabled={!followUpModal.contactEmail}
                      sx={{ background: 'linear-gradient(135deg, #4285F4 0%, #1a73e8 100%)' }}
                    >
                      Open in Email Client
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => handleCopyToClipboard(generatedEmail.body, 'Email')}
                    >
                      Copy Email
                    </Button>
                  </Box>
                </Box>
              )}
              
              {generatedLinkedIn && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight="700" color="primary">
                    💼 LinkedIn Message
                  </Typography>
                  
                  <TextField
                    value={generatedLinkedIn}
                    onChange={(e) => setGeneratedLinkedIn(e.target.value)}
                    fullWidth
                    multiline
                    rows={4}
                  />
                  
                  <Button
                    variant="outlined"
                    startIcon={<LinkedInIcon />}
                    onClick={() => handleCopyToClipboard(generatedLinkedIn, 'LinkedIn message')}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Copy for LinkedIn
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setFollowUpModal(null); setGeneratedEmail(null); setGeneratedLinkedIn(''); }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} variant="filled" sx={{ fontWeight: 600 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
