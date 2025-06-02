const express = require('express');
const router = express.Router();
const { oAuth2Client, google, setOAuthCredentialsForUser } = require('../helpers/gmailClient');
const fs = require('fs');


router.get("/read-emails", async (req, res) => {
  try {

    /*if (!req.session.user || !req.session.user.email) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const email = req.session.user?.email;
    await setOAuthCredentialsForUser(email, oAuth2Client)*/

    console.log("Tokens loaded at startup:", oAuth2Client.credentials);

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    // Get the latest 10 messages
    const listRes = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
    });

    const messages = listRes.data.messages || [];
    const emailData = [];

    for (const msg of messages) {
      const msgRes = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
      });

      const payload = msgRes.data.payload;
      const headers = payload.headers;

      const subjectHeader = headers.find(h => h.name === "Subject");
      const fromHeader = headers.find(h => h.name === "From");
      const dateHeader = headers.find(h => h.name === "Date");

      // Extract plain text content from message body
      let body = "";
      if (payload.parts) {
        const textPart = payload.parts.find(part => part.mimeType === "text/plain");
        if (textPart && textPart.body && textPart.body.data) {
          body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
        }
      } else if (payload.body && payload.body.data) {
        body = Buffer.from(payload.body.data, "base64").toString("utf-8");
      }

      emailData.push({
        from: fromHeader?.value || "N/A",
        subject: subjectHeader?.value || "No Subject",
        date: dateHeader?.value || "N/A",
        body,
      });
    }

    res.json(emailData);
  } catch (error) {
    console.error("Error reading emails:", error);
    res.status(500).send("Failed to read emails");
  }
});

router.get("/reply-latest", async (req, res) => {
  try {

    const email = req.session.user?.email;
    await setOAuthCredentialsForUser(email, oAuth2Client);

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    const listRes = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
    });

    const messages = listRes.data.messages || [];
    let senderEmail = null;

    // Find the first email that is not sent by you
    for (const msg of messages) {
      const msgRes = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
      });

      const headers = msgRes.data.payload.headers;
      const fromHeader = headers.find(h => h.name === "From");
      const from = fromHeader?.value || "";

      // Replace this with your actual Gmail ID
      const myEmail = "choudhary.sushant.2005@gmail.com";

      if (!from.includes(myEmail)) {
        const match = from.match(/<(.+?)>/); // extract email from: Name <email@domain>
        senderEmail = match ? match[1] : from;
        break;
      }
    }

    if (!senderEmail) {
      return res.status(404).send("No external email found to reply to.");
    }

    // Compose the email
    const subject = "Re: Hello from Gmail Agent";
    const bodyText = `Hi there,\n\nThis is an automated reply.\n\nRegards,\nGmail Agent`;

    const messageParts = [
      `To: ${senderEmail}`,
      "Subject: " + subject,
      "Content-Type: text/plain; charset=utf-8",
      "",
      bodyText,
    ];
    const message = messageParts.join("\n");

    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    res.send(`✅ Email sent to ${senderEmail}`);
  } catch (error) {
    console.error("Error replying to latest sender:", error);
    res.status(500).send("Failed to reply.");
  }
});


//REPLY TO ANY EMAIL

router.post("/reply-email", async (req, res) => {
    try {
      const { toEmail, reply } = req.body;
  
      if (!toEmail || !reply) {
        return res.status(400).json({ error: "Missing toEmail or reply" });
      }

      /*const email = req.session.user?.email;
      await setOAuthCredentialsForUser(email, oAuth2Client);*/
  
      //const oAuth2Client = await getAuthenticatedClient(); // your helper to load tokens
      const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
  
      const replyBody = reply;
  
      const rawMessage = [
        `To: ${toEmail}`,
        "Subject: Re: your message",
        "",
        replyBody,
      ]
        .join("\n")
        .trim();
  
      const encodedMessage = Buffer.from(rawMessage)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
  
      await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedMessage,
        },
      });
  
      res.json({ message: "Reply sent!" });
    } catch (err) {
      console.error("Failed to send reply:", err);
      res.status(500).json({ error: "Failed to send reply" });
    }
  });


//PENDING REPLIES

  const getEmailBody = (payload) => {
    const parts = payload.parts || [];
    const part = parts.find(p => p.mimeType === 'text/plain');
    const data = part ? part.body.data : payload.body.data;
    if (!data) return '';
    const buffer = Buffer.from(data, 'base64');
    return buffer.toString('utf8');
  };
  
  // GET /pending-replies
  router.get('/pending-replies', async (req, res) => {
    try {

      /*const email = req.session.user?.email;
      await setOAuthCredentialsForUser(email, oAuth2Client);*/

      const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  
      const { data } = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 10,
        q: 'in:inbox',
      });
  
      const messages = data.messages || [];
  
      const results = [];
  
      for (const message of messages) {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full',
        });
  
        const payload = msg.data.payload;
        const headers = payload.headers;
  
        const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
        const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
        const date = headers.find(h => h.name === 'Date')?.value || '';
        const body = getEmailBody(payload);
  
        results.push({
          from,
          subject,
          date,
          body,
          suggestedReply: 'Hey!! \n gmail agent here. from now on ill be answering. \n hope to connect again soon.',
        });
      }
  
      res.json(results);
    } catch (error) {
      console.error('Error fetching pending replies:', error);
      res.status(500).send('Failed to fetch pending replies');
    }
  });


  //SAVING DRAFTS IN THE USERS GMAIL INBOX
  router.get('/drafts', async (req, res) => {
    try {

      /*const email = req.session.user?.email;
      await setOAuthCredentialsForUser(email, oAuth2Client);*/

      const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  
      // Fetch inbox messages
      const { data } = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 5,
        q: 'in:inbox',
      });
  
      const messages = data.messages || [];
  
      for (const message of messages) {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full',
        });
  
        const headers = msg.data.payload.headers;
        const fromHeader = headers.find(h => h.name === 'From')?.value || '';
        const replyTo = fromHeader.match(/<(.+)>/)?.[1] || fromHeader;
        const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
        const messageId = headers.find(h => h.name === 'Message-ID')?.value;
        const threadId = msg.data.threadId;

        const replyText = `Hey,\n\nGmail agent here. From now on, I'll be answering.\nHope to connect again soon.\n\n- Agent`;

        const rawMessage = [
          `From: me`,
          `To: ${replyTo}`,
          `Subject: Re: ${subject}`,
          `In-Reply-To: ${messageId}`,
          `References: ${messageId}`,
          `Content-Type: text/plain; charset=utf-8`,
          ``,
          replyText,
        ]
        .join('\n')
        .trim();

        const encodedMessage = Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

        await gmail.users.drafts.create({
          userId: 'me',
            requestBody: {
              message: {
                raw: encodedMessage,
                threadId: threadId, // <== This links the draft to the original conversation
              },
            },
          });
      }
  
      res.send('✅ Drafts created successfully for recent inbox emails.');
    } catch (error) {
      console.error('Error creating drafts:', error);
      res.status(500).send('❌ Failed to create drafts.');
    }
  });
  

module.exports = router; 