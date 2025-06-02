import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import Welcome from './pages/Welcome';
import Home from './pages/Home';
import PendingReplies from './pages/PendingReplies';
import Preferences from './pages/Preferences';
import Drafts from './pages/Drafts';
import Sidebar from './components/Sidebar';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route
            path="/*"
            element={
              <div style={{ display: 'flex', minHeight: '100vh', background: '#F3F3F3' }}>
                <Sidebar />
                <main style={{ flex: 1, marginLeft: 250, padding: '32px 0', background: '#FAFAFA', minHeight: '100vh' }}>
                  <Routes>
                    <Route path="/home" element={<Home />} />
                    <Route path="/pending-replies" element={<PendingReplies />} />
                    <Route path="/preferences" element={<Preferences />} />
                    <Route path="/drafts" element={<Drafts />} />
                    {/* Add Inbox and other routes here */}
                  </Routes>
                </main>
              </div>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
