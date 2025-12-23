'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Stepper, Step, StepLabel, Button, TextField,
  Card, CardContent, FormControlLabel, Checkbox, Snackbar, Alert, Stack
} from '@mui/material';
import Grid from '@mui/material/Grid'; // Keep for minor usage if needed but prefer Stack
import { sendMockNotification } from '../../lib/notifications';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';

const steps = ['Identity', 'Employment', 'Separation', 'Review'];

export default function ApplyPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/apply');
    }
  }, [isAuthenticated, router]);

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [optIn, setOptIn] = useState(true);
  
  // Anti-Fraud: Honeypot & Rate Limit State
  const [honeypot, setHoneypot] = useState('');

  // Mock form state
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', ssn: '', email: '', phone: '',
    employerName: '', jobTitle: '', startDate: '', endDate: '',
    separationReason: '',
  });

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      await handleSubmit();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    // 1. Anti-Bot: Check Honeypot
    if (honeypot) {
      console.warn("Bot detected: Honeypot field filled.");
      setLoading(false);
      // Silently fail or redirect
      router.push('/dashboard'); 
      return;
    }

    // 2. Anti-Spam: Rate Limiting
    const lastSubmission = localStorage.getItem('last_application_time');
    if (lastSubmission) {
      const timeDiff = Date.now() - parseInt(lastSubmission);
      if (timeDiff < 10 * 60 * 1000) { // 10 minutes
        alert("Duplicate application detected. You have submitted an application recently. Please wait before applying again.");
        setLoading(false);
        return;
      }
    }

    try {
      // Simulate API submission
      const res = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (optIn) {
        console.log('Notifying user...', data.id);
      }

      // Record successful submission time
      localStorage.setItem('last_application_time', Date.now().toString());

      // Redirect
      router.push('/dashboard?newApplication=true');

    } catch (e) {
      console.error(e);
      alert('Error submitting application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth="lg" mx="auto">
      <Alert severity="warning" sx={{ mb: 4, fontWeight: 500 }} icon={false}>
        <strong>FRAUD WARNING:</strong> Submitting false information specifically to obtain unemployment benefits is a federal crime. 
        Violators may face fines, imprisonment, and permanent disqualification from future benefits.
      </Alert>

      <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
        Apply for Benefits
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ my: 5 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card variant="outlined" sx={{ minHeight: 400 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Honeypot Field (Hidden from humans) */}
          <Box sx={{ display: 'none' }} aria-hidden="true">
             <TextField label="Website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
          </Box>

          {activeStep === 0 && (
            <Stack spacing={3}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { sm: '1fr 1fr' }, gap: 3 }}>
                <TextField required fullWidth label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
                <TextField required fullWidth label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
              </Box>
              <TextField required fullWidth label="Social Security Number" name="ssn" type="password" value={formData.ssn} onChange={handleChange} helperText="We use this to verify your identity." />
              <Box sx={{ display: 'grid', gridTemplateColumns: { sm: '1fr 1fr' }, gap: 3 }}>
                <TextField required fullWidth label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
                <TextField required fullWidth label="Phone Number" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
              </Box>
              <FormControlLabel
                control={<Checkbox checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />}
                label="I agree to receive text/email updates about my application status."
              />
            </Stack>
          )}

          {activeStep === 1 && (
            <Stack spacing={3}>
               <Typography variant="h6" gutterBottom>Most Recent Employer</Typography>
               <TextField required fullWidth label="Employer Name" name="employerName" value={formData.employerName} onChange={handleChange} />
               <Box sx={{ display: 'grid', gridTemplateColumns: { sm: '2fr 1fr 1fr' }, gap: 3 }}>
                 <TextField required fullWidth label="Job Title" name="jobTitle" value={formData.jobTitle} onChange={handleChange} />
                 <TextField required fullWidth label="Start Date" name="startDate" type="date" InputLabelProps={{ shrink: true }} value={formData.startDate} onChange={handleChange} />
                 <TextField required fullWidth label="End Date" name="endDate" type="date" InputLabelProps={{ shrink: true }} value={formData.endDate} onChange={handleChange} />
               </Box>
            </Stack>
          )}

          {activeStep === 2 && (
             <Stack spacing={3}>
                <TextField 
                  required fullWidth multiline rows={4} 
                  label="Reason for Separation" 
                  name="separationReason" 
                  placeholder="Explain why you are no longer working at your last job..."
                  value={formData.separationReason} 
                  onChange={handleChange} 
                />
             </Stack>
          )}

          {activeStep === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>Review Information</Typography>
              <Typography><strong>Name:</strong> {formData.firstName} {formData.lastName}</Typography>
              <Typography><strong>SSN:</strong> ***-**-****</Typography>
              <Typography><strong>Contact:</strong> {formData.email} | {formData.phone}</Typography>
              <Typography sx={{ mt: 2 }}><strong>Employer:</strong> {formData.employerName}</Typography>
              <Typography><strong>Reason:</strong> {formData.separationReason}</Typography>
              
              <Alert severity="info" sx={{ mt: 3 }}>
                By clicking "Submit", you certify that the information provided is true and correct.
              </Alert>
            </Box>
          )}
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
        <Button color="inherit" disabled={activeStep === 0} onClick={handleBack} sx={{ mr: 1 }}>
          Back
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        <Button onClick={handleNext} variant="contained" disabled={loading}>
          {activeStep === steps.length - 1 ? (loading ? 'Submitting...' : 'Submit Application') : 'Next'}
        </Button>
      </Box>
    </Box>
  );
}
