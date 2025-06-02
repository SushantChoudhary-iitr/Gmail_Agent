import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Divider } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MailIcon from '@mui/icons-material/Mail';
import ReplyIcon from '@mui/icons-material/Reply';
import LabelIcon from '@mui/icons-material/Label';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import DraftsIcon from '@mui/icons-material/Drafts';
import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/home' },
  { text: 'Pending Replies', icon: <ReplyIcon />, path: '/pending-replies' },
  { text: 'Drafts', icon: <DraftsIcon />, path: '/drafts' },
  { text: 'Inbox', icon: <MailIcon />, path: '/inbox' },
  { text: 'Labels', icon: <LabelIcon />, path: '/labels' },
  { text: 'Integrations', icon: <IntegrationInstructionsIcon />, path: '/integrations' },
  { text: 'Preferences', icon: <SettingsIcon />, path: '/preferences' },
  { text: 'Sign out', icon: <LogoutIcon />, path: '/signout' },
];

export default function Sidebar() {
  const location = useLocation();
  return (
    <Box
      sx={{
        width: 250,
        height: '100vh',
        background: '#F3F3F3',
        borderRight: '1px solid #eee',
        boxShadow: 2,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1000,
      }}
    >
      <Toolbar sx={{ minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 1 }}>
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
            Gmail Agent
          </span>
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={NavLink}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 2,
                mx: 1,
                my: 0.5,
                '&.Mui-selected, &.Mui-selected:hover': {
                  backgroundColor: '#EDE7F6',
                  color: '#1976d2',
                },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? '#1976d2' : '#888' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
} 