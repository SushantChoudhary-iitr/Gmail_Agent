import { Box, Container, Typography, Button } from '@mui/material';
import axios from 'axios';

function Drafts() {
  const handleGenerateDrafts = async () => {
    try {
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        console.error('No user email found');
        return;
      }
      await axios.post('http://localhost:3001/generate-drafts', { email: userEmail });
      // You might want to add a success notification here
    } catch (error) {
      console.error('Failed to generate drafts:', error);
      // You might want to add an error notification here
    }
  };

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
      }}
    >
      <Container maxWidth="md">
        <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 700 }}>
          Drafts
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleGenerateDrafts}
          sx={{ px: 4, py: 1.5 }}
        >
          Generate Drafts
        </Button>
      </Container>
    </Box>
  );
}

export default Drafts; 