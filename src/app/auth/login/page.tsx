'use client';

import { useState } from 'react';
import { useAuth } from '../../../lib/auth';
import { Box, Paper, Typography, TextField, Button, Alert, Divider } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password, 'mock');
  };

  const handleGoogleLogin = async () => {
    await login(undefined, undefined, 'google');
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <Paper elevation={0} sx={{ p: 4, width: '100%', maxWidth: 400, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom fontWeight="bold" align="center">
          Log In
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Access your unemployment benefits account
        </Typography>

        <Button 
          variant="outlined" 
          fullWidth 
          startIcon={<GoogleIcon />} 
          onClick={handleGoogleLogin}
          sx={{ mb: 3, textTransform: 'none', fontWeight: 600, color: 'text.primary', borderColor: 'divider' }}
        >
          Sign in with Google
        </Button>

        <Divider sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.secondary">OR CONTINUE WITH EMAIL</Typography>
        </Divider>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
            />
            <Button 
              type="submit" 
              variant="contained" 
              size="large" 
              fullWidth
              sx={{ mt: 2 }}
            >
              Log In
            </Button>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              Default: Any email/password will work.
            </Alert>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
