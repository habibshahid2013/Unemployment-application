'use client';

import { useState, useEffect } from 'react';
import { Box, Grid, Typography, Card, CardContent, Button, Divider, Avatar, Chip } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import ChatRoom from '../../components/ChatRoom';
import { searchJobs, Job } from '../../lib/linkedin';
import { useAuth } from '../../lib/auth';
import { sendMessage } from '../../lib/db';

export default function CommunityPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load of jobs for the feed
    const fetchFeed = async () => {
      try {
        const results = await searchJobs('', 'Minnesota');
        setJobs(results);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  const handleShare = async (job: Job) => {
    if (!user) {
        alert("Login to share jobs!");
        return;
    }
    const text = `Check out this ${job.title} role at ${job.company}!`;
    await sendMessage(user.id, user.name, text, 'job-share', job);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" fontWeight="bold" color="primary">Community Board</Typography>
        <Typography variant="body2" color="text.secondary">Discover jobs and discuss them with the community.</Typography>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 3 }}>
        {/* Left: Job Feed */}
        <Box sx={{ height: '100%', overflowY: 'auto' }}>
            {jobs.map((job) => (
                <Card key={job.id} sx={{ mb: 2, display: 'flex', p: 1 }}>
                    {job.logoUrl && (
                        <Avatar src={job.logoUrl} variant="rounded" sx={{ width: 64, height: 64, m: 1 }} />
                    )}
                    <CardContent sx={{ flexGrow: 1, py: 1 }}>
                        <Typography variant="h6" fontWeight="bold">{job.title}</Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>{job.company} • {job.location}</Typography>
                        <Typography variant="body2" noWrap>{job.description}</Typography>
                        
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                            <Button variant="outlined" size="small" startIcon={<ShareIcon />} onClick={() => handleShare(job)}>
                                Share to Chat
                            </Button>
                            <Button variant="contained" size="small" href={job.url || '#'} target="_blank">
                                Apply
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            ))}
        </Box>

        {/* Right: Chat Room */}
        <Box sx={{ height: '100%' }}>
            <ChatRoom />
        </Box>
      </Box>
    </Box>
  );
}
