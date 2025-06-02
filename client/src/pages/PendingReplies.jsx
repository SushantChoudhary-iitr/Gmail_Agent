import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Paper,
  Snackbar,
  Alert,
} from '@mui/material';
import axios from 'axios';

function PendingReplies() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      const response = await axios.get('http://localhost:3001/pending-replies');
      setEmails(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch emails: ' + error.message);
      setLoading(false);
    }
  };

  const handleSendReply = async (email) => {
    try {
      await axios.post('http://localhost:3001/reply-email', { toEmail : email.from, reply : email.suggestedReply });
      setOpenSnackbar(true);
      fetchEmails();
    } catch (error) {
      setError('Failed to send reply: ' + error.message);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpenSnackbar(false);
  };

  if (loading) {
    return (
      <Box 
        sx={{
          minHeight: '100vh',
          width: '100vw',
          backgroundColor: '#FAFAFA',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          width: '100vw',
          backgroundColor: '#FAFAFA',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Container>
          <Typography color="error" align="center">{error}</Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#FAFAFA',
        py: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <Container maxWidth="md">
        <Typography variant="h3" gutterBottom align="center" sx={{ mb: 4, fontWeight: 700, letterSpacing: 2 }}>
          PENDING REPLIES
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {emails.map((email, index) => (
            <Grid item xs={12} key={index} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Card sx={{ width: 800, maxWidth: '100%', boxShadow: 6, borderRadius: 4, p: 2, border: '1px solid #e0e0e0', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'stretch', position: 'relative' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" sx={{ textAlign: 'center', fontWeight: 700, color: '#1976d2', width: '100%' }}>
                      From: {email.from}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'left', mb: 1 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      Subject: {email.subject}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Date: {email.date}
                    </Typography>
                  </Box>
                  <Typography variant="body1" paragraph sx={{ fontSize: '1.35rem', textAlign: 'center' }}>
                    {email.body}
                  </Typography>
                  {email.suggestedReply && (
                    <Paper elevation={2} sx={{ background: '#FFF0F6', p: 2, mb: 2, borderLeft: '4px solid #1976d2', borderRadius: 2, textAlign: 'center' }}>
                      <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 700, fontSize: '1.15rem', textAlign: 'center' }}>
                        SUGGESTED REPLY
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.15rem', fontWeight: 500, textAlign: 'center', whiteSpace : 'pre-line' }}>{email.suggestedReply}</Typography>
                    </Paper>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleSendReply(email)}
                    >
                      Send Reply
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Mail has been sent
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default PendingReplies; 