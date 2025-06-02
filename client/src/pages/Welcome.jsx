import { Box, Button, Typography, Paper } from '@mui/material';
import WelcomeAppBar from '../components/WelcomeAppBar';

function Welcome() {
  const handleGoogleSignIn = () => {
    // Redirect to backend auth endpoint
    window.location.href = 'http://localhost:3001/auth';
  };

  return (
    <Box sx={{ minHeight: '100vh', width: '100vw', background: 'linear-gradient(135deg, #e3e3f7 0%, #b3b3e6 100%)' }}>
      <WelcomeAppBar />
      <Box
        sx={{
          minHeight: 'calc(100vh - 72px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={6}
          sx={{
            px: { xs: 3, sm: 6 },
            py: { xs: 5, sm: 7 },
            borderRadius: 6,
            maxWidth: 650,
            width: '100%',
            textAlign: 'center',
            background: '#fff',
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: '#222', letterSpacing: 1 }}>
            Welcome to Gmail Agent
          </Typography>
          <Typography variant="h6" sx={{ color: '#555', mb: 4, fontWeight: 400 }}>
            Your AI-powered email assistant. Sign in to get started!
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleGoogleSignIn}
            sx={{
              backgroundColor: '#4285F4',
              color: '#fff',
              fontWeight: 700,
              fontSize: 18,
              px: 4,
              py: 1.5,
              borderRadius: 3,
              boxShadow: '0 2px 8px 0 rgba(66,133,244,0.15)',
              '&:hover': {
                backgroundColor: '#357ABD',
              },
            }}
          >
            Sign in with Google
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}

export default Welcome; 