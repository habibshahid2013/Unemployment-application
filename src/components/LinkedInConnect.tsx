'use client';

import { useState } from 'react';
import { Card, CardContent, Typography, Button, Box, Avatar, Badge, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function LinkedInConnect() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile/linkedin');
      const data = await res.json();
      // Simulate delay for effect
      await new Promise(r => setTimeout(r, 1500));
      setProfile(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (profile && profile.connected) {
    return (
      <Card sx={{ bgcolor: 'white', mb: 3, border: '1px solid #0077b5' }}>
        <CardContent sx={{ textAlign: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={<CheckCircleIcon color="success" sx={{ bgcolor: 'white', borderRadius: '50%' }} />}
                >
                    <Avatar 
                        src={profile.avatarUrl} 
                        sx={{ width: 80, height: 80, border: profile.openToWork ? '4px solid #78BE20' : 'none' }} 
                    />
                </Badge>
                {profile.openToWork && (
                    <Box sx={{ 
                        position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
                        bgcolor: '#78BE20', color: 'white', px: 1, py: 0.2, borderRadius: 10, fontSize: '0.6rem', fontWeight: 'bold', whiteSpace: 'nowrap'
                    }}>
                        #OPENTOWORK
                    </Box>
                )}
            </Box>
            <Typography variant="h6" fontWeight="bold">{profile.name}</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>{profile.headline}</Typography>
            <Button variant="outlined" size="small" href={profile.profileUrl} target="_blank" color="primary" sx={{ mt: 1 }}>
                View In LinkedIn
            </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ bgcolor: '#0077b5', color: 'white', mb: 3 }}>
      <CardContent sx={{ textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">Connect LinkedIn</Typography>
        <Typography variant="body2" sx={{ mb: 3, opacity: 0.9 }}>
          Sync your profile to display your "Open To Work" status and speed up applications.
        </Typography>
        <Button 
            variant="contained" 
            sx={{ bgcolor: 'white', color: '#0077b5', '&:hover': { bgcolor: '#f0f0f0' } }}
            onClick={handleConnect}
            disabled={loading}
        >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Connect Account'}
        </Button>
      </CardContent>
    </Card>
  );
}
