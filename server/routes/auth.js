const express = require('express');
const router = express.Router();
const fs = require('fs');
const { google, oAuth2Client } = require('../helpers/gmailClient');
//const generateDraftsForAllUsers = require('../helpers/generateDraftsCron');
const User = require('../models/users');
const session = require('express-session');

// Step 1: Start OAuth flow
router.get("/auth", (req, res) => {
  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.compose", "https://www.googleapis.com/auth/gmail.modify", "https://www.googleapis.com/auth/gmail.labels"],
    prompt: "consent", // always returns refresh_token
    include_granted_scopes: true
  });
  res.redirect(url);
});

// Step 2: Handle redirect from Google
router.get("/oauth2callback", async (req, res) => {
  try {
    const code = req.query.code;
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client })

    const profile = await gmail.users.getProfile({ userId: 'me' });
    const userEmail = profile.data.emailAddress;
    // Save tokens for future use
    fs.writeFileSync("token.json", JSON.stringify(tokens));

    const threeWeeksAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
const formattedDate = `${threeWeeksAgo.getFullYear()}/${(threeWeeksAgo.getMonth() + 1)
  .toString()
  .padStart(2, '0')}/${threeWeeksAgo.getDate().toString().padStart(2, '0')}`;

const listRes = await gmail.users.messages.list({
  userId: 'me',
  labelIds: ['SENT'],
  q: `after:${formattedDate}`,
  maxResults: 20,
});

    const messages = listRes.data.messages || [];

    const pastReplies = [];
    
    
for (const msg of messages) {
  const msgRes = await gmail.users.messages.get({
    userId: 'me',
    id: msg.id,
    format: 'full',
  });

  const parts = msgRes.data.payload.parts || [];
  const bodyPart = parts.find(p => p.mimeType === 'text/plain' || p.mimeType === 'text/html');
  if (bodyPart?.body?.data) {
    const decoded = Buffer.from(bodyPart.body.data, 'base64').toString('utf8');
    pastReplies.push(decoded);
  }
}

    //Add token to database
    await User.findOneAndUpdate(
      { email: userEmail },
      {
        $set: { 
          tokens,
          lastRepliedTimestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 // 1 week ago
         },
        $push: { pastReplies: { $each: pastReplies.slice(0, 10) } } // store up to 10 replies
      },
      { new: true, upsert: true }
    );
    
    // Set user info in session
    req.session.user = { email: profile.email };

    //res.send("✅ OAuth consent successful. You can now use the app.");
    res.redirect(`http://localhost:5173/home?email=${userEmail}`)
  } catch (error) {
    console.error("Error during OAuth callback:", error);
    res.status(500).send("❌ OAuth failed.");
  }
});

module.exports = router; 