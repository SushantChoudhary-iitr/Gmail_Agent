import { useEffect} from "react";
import { Box, Typography, Container } from '@mui/material';

function Home() {

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    if (email) {
      localStorage.setItem('userEmail', email);
      // Optionally remove the query param from the URL
      window.history.replaceState({}, '', '/dashboard'); 
    }
  }, []);
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#FAFAFA',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <Container maxWidth="md" sx={{ width: '100%' }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
          Welcome to your Dashboard
        </Typography>
        <Typography variant="body1">
          Select a tab on the left to manage your emails and replies.
        </Typography>
      </Container>
    </Box>
  );
}

export default Home; 