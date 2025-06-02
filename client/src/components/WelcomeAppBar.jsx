import { AppBar, Toolbar, Typography, Box, Button, Link } from '@mui/material';

export default function WelcomeAppBar() {
  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', background: 'transparent' }}>
      <AppBar position="static" elevation={0} sx={{ background: '#fff', color: '#222', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.03)', width: '75%', borderRadius: 4 }}>
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: 72 }}>
          {/* Left: Brand */}
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 1 }}>
            <span
              style={{
                background: 'linear-gradient(90deg, #1976d2 30%, #42a5f5 70%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'transparent',
                display: 'inline-block',
              }}
            >
              GmailAgent
            </span>
          </Typography>
          {/* Center/Right: Links */}
          <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Link href="#about" underline="none" sx={{ color: '#444', fontSize: 18, fontWeight: 500 }}>
              About
            </Link>
            <Link href="#team" underline="none" sx={{ color: '#444', fontSize: 18, fontWeight: 500 }}>
              Team
            </Link>
            <Link href="#pricing" underline="none" sx={{ color: '#444', fontSize: 18, fontWeight: 500 }}>
              Pricing
            </Link>
          </Box>
          {/* Right: Log in */}
          <Button variant="outlined" sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none', fontSize: 16, borderColor: '#1976d2', color: '#1976d2' }}>
            Log in
          </Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
} 