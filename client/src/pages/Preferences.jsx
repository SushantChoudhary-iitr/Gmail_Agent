import { useState } from 'react';
import { Box, Container, Typography, TextField, Button } from '@mui/material';
import axios from 'axios';

function Preferences() {
  const [draftPrompt, setDraftPrompt] = useState('');

  const handleSubmit = async () => {
    try {
      await axios.post('http://localhost:3001/preferences', { designation: draftPrompt} );
      // You might want to add a success notification here
    } catch (error) {
      console.error('Failed to save preferences:', error);
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
          Draft Replies
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 2, color: '#666' }}>
          Draft Prompt
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={draftPrompt}
          onChange={(e) => setDraftPrompt(e.target.value)}
          variant="outlined"
          sx={{ mb: 3 }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          sx={{ px: 4 }}
        >
          Save Preferences
        </Button>
      </Container>
    </Box>
  );
}

export default Preferences; 