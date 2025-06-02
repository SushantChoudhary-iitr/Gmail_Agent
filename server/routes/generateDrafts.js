const express = require('express');
const { OpenAI } = require('openai');
require("dotenv").config();
const { google } = require('googleapis');
const router = express.Router();
const User = require('../models/users'); // adjust path if needed
const { oAuth2Client } = require('../helpers/gmailClient');
const checkIfRepliedOrDrafted = require('../helpers/checkReplyDraft')
//const { openai } = require('../helpers/openaiClient'); // helper for OpenAI init

const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
  });

function makeRawReply(to, from, subject, message, threadId) {
  const str = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: Re: ${subject}`,
    `In-Reply-To: ${threadId}`,
    `References: ${threadId}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    message,
  ].join('\n');

  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

router.post('/generate-drafts', async (req, res) => {
  try {
    /*const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const email = profile.data.emailAddress;
    */

    const { email } = req.body;
    if (!email) return res.status(400).send('Email is required in request body');

    const user = await User.findOne({ email });
    if (!user) return res.status(404).send('User not found');

    oAuth2Client.setCredentials(user.tokens);
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    const designation = user.designation || 'You are an email assistant';
    const pastReplies = user.pastReplies;
    const lastChecked = user.lastRepliedTimestamp || new Date('2024-05-01').getTime();

    //console.log("in /generate-drafts");

    const messagesRes = await gmail.users.messages.list({
        userId: 'me',
        q: `is:inbox after:${Math.floor(lastChecked / 1000)}`,
        maxResults: 10, // Adjust this if needed
      });



    const messages = messagesRes.data.messages;
    if (!messages || messages.length === 0) {
        console.log("hey i'm here");
      return res.status(200).send('No new messages to process');
    }


    let latestTimestamp = lastChecked;
    

    for (const message of messages) {
      const fullMsg = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full',
      });

      const internalDate = parseInt(fullMsg.data.internalDate);
      if (internalDate > latestTimestamp) latestTimestamp = internalDate;

      // 1. Skip if already replied or drafted
      const check = await checkIfRepliedOrDrafted(gmail, fullMsg.data);
      if (!check.shouldReply) {
        console.log('Skipping:', check.reason);
        continue;
      }

      // 2. Extract headers
      const headers = fullMsg.data.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const from = headers.find(h => h.name === 'From')?.value || '';
      const threadId = fullMsg.data.threadId;

      // 3. Extract plain body
      const bodyData =
        fullMsg.data.payload.parts?.find(p => p.mimeType === 'text/plain')?.body?.data ||
        fullMsg.data.payload.body?.data;

      const decodedBody = bodyData
        ? Buffer.from(bodyData, 'base64').toString('utf-8')
        : '(No message body found)';

      // 4. Filter out auto-emails
      const isAutoEmail =
        from.toLowerCase().includes('noreply') ||
        from.toLowerCase().includes('no-reply') ||
        from.toLowerCase().includes('donotreply') ||
        subject.toLowerCase().includes('receipt') ||
        subject.toLowerCase().includes('newsletter') ||
        subject.toLowerCase().includes('auto');

      if (isAutoEmail) {
        console.log('Skipping auto email:', subject);
        continue;
      }

      // 5. Generate reply from OpenAI
      const openaiRes = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: `Generate emails on behalf of ${designation}, and learn from previous replies \n\n ${pastReplies.join('\n---\n')}` },
          { role: 'user', content: `Reply to this email only if it needs a response:\n\n"${decodedBody}"` },
        ],
      });

      const aiReply = openaiRes.choices[0].message.content;

      // 6. Create and save draft
      const raw = makeRawReply(from, email, subject, aiReply, threadId);
      await gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
          message: {
            raw,
            threadId,
          },
        },
      });

      // 7. Update chat history
      await User.findOneAndUpdate(
        { email },
        {
          $push: {
            chatHistory: [
              { role: 'user', content: `reply this like me \n\n${decodedBody}` },
              { role: 'assistant', content: aiReply }
            ]
          }
        }
      );

      console.log(`✅ Draft generated for: ${subject}`);
    }

    // 8. Update lastRepliedTimestamp
    await User.findOneAndUpdate(
      { email },
      { lastRepliedTimestamp: latestTimestamp }
    );


    //console.log( `hey ${aiReply}`);

    res.status(200).send('Draft reply generated and saved');
  } catch (err) {
    console.error('Error generating draft:', err);
    res.status(500).send('Failed to generate draft');
  }
});

module.exports = router;
