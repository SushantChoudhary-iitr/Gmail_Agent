import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Paper,
  Button
} from "@mui/material";

function Home() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userEmail = params.get("email");

    if (userEmail) {
      localStorage.setItem("userEmail", userEmail);
      setEmail(userEmail);
      window.history.replaceState({}, "", "/dashboard");
    } else {
      const storedEmail = localStorage.getItem("userEmail");
      if (storedEmail) setEmail(storedEmail);
    }
  }, []);

  const features = [
    {
      title: "Smart Email Replies",
      desc: "Generate AI-powered responses based on your previous email tone."
    },
    {
      title: "Inbox Monitoring",
      desc: "Automatically scan incoming emails and prepare reply drafts."
    },
    {
      title: "Personalized Tone",
      desc: "Our system learns your writing style from past replies."
    }
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        background: "linear-gradient(135deg, #f5f7fa, #e4ecf7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 6
      }}
    >
      <Container maxWidth="lg">
        <Box textAlign="center" mb={6}>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>
            Welcome{email ? `, ${email.split("@")[0]}` : ""} 👋
          </Typography>

          <Typography variant="h6" sx={{ mt: 2, color: "text.secondary" }}>
            Your AI assistant for writing smarter email replies
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((f, i) => (
            <Grid item xs={12} md={4} key={i}>
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  height: "100%",
                  borderRadius: 3,
                  transition: "0.3s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 6
                  }
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>
                  {f.title}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {f.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box textAlign="center" mt={6}>
          <Button
            variant="contained"
            size="large"
            sx={{ borderRadius: 3, px: 4 }}
          >
            Go to Email Manager
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

export default Home;