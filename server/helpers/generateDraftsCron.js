
const { google, oAuth2Client } = require('./gmailClient');
const User = require('../models/users'); // adjust path if different
const checkIfRepliedOrDrafted = require('./checkReplyDraft');
const makeRawReply = require('./makeRawReply');
const { OpenAI } = require('openai');
require("dotenv").config();


const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
  });

/*  function makeRawReply(to, from, subject, message, threadId) {
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
  } */

async function getOrCreateLabel(gmail, labelName = 'toReply') {
  const res = await gmail.users.labels.list({ userId: 'me' });
  const existing = res.data.labels.find(l => l.name === labelName);
  // If it exists, optionally update its color
  if (existing) {
    await gmail.users.labels.update({
      userId: 'me',
      id: existing.id,
      requestBody: {
        name: labelName,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
        color: {
          backgroundColor: '#ffad47', // ORANGE
          textColor: '#000000',       // BLACK
        }
      }
    });
    return existing.id;
  }

  // If it doesn't exist, create it with color
  const newLabel = await gmail.users.labels.create({
    userId: 'me',
    requestBody: {
      name: labelName,
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show',
      color: {
        backgroundColor: '#ffad47', // ORANGE
        textColor: '#000000',       // BLACK
      }
    },
  });

  return newLabel.data.id;
}

async function generateDraftsForAllUsers() {
  const users = await User.find({});
  for (const user of users) {
    const { email, tokens, designation, pastReplies, lastRepliedTimestamp } = user;

    if (!designation) {
        console.log(`⏭️ Skipping ${email} — no designation set.`);
        continue;
      }
    console.log(` first call -> generating for ${email}`);

    try {
      //const oAuth2Client = new google.auth.OAuth2();
      oAuth2Client.setCredentials(tokens);
      await oAuth2Client.getAccessToken(); // Refresh access token if needed

      const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
      const labelId = await getOrCreateLabel(gmail);
      const lastChecked = lastRepliedTimestamp || new Date('2024-05-01').getTime();

      const messagesRes = await gmail.users.messages.list({
        userId: 'me',
        q: `is:inbox after:${Math.floor(lastChecked / 1000)}`,
        maxResults: 10,
      });


      const messages = messagesRes.data.messages;
      if (!messages || messages.length === 0) continue;


      for (const msg of messages) {
        const fullMsg = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full',
        });

        const check = await checkIfRepliedOrDrafted(gmail, fullMsg.data);
        if (!check.shouldReply) continue;


        const headers = fullMsg.data.payload.headers;
        const from = headers.find(h => h.name === 'From')?.value || '';
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const bodyData =
          fullMsg.data.payload.parts?.find(p => p.mimeType === 'text/plain')?.body?.data ||
          fullMsg.data.payload.body?.data;

        const decodedBody = bodyData
          ? Buffer.from(bodyData, 'base64').toString('utf-8')
          : '(No message body)';

          console.log(`generating for ${email}`);

          console.log(`FROM: ${from}`);
          console.log(`SUBJECT: ${subject}`);

        const isAutoEmail =
            from.toLowerCase().includes('noreply') ||
            from.toLowerCase().includes('no-reply') ||
            from.toLowerCase().includes('donotreply') ||
            subject.toLowerCase().includes('receipt') ||
            subject.toLowerCase().includes('newsletter') ||
            subject.toLowerCase().includes('auto');

        if (isAutoEmail) continue;

        const aiResponse = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: `Generate emails on behalf of ${designation}, and learn from previous replies \n\n ${pastReplies.join('\n---\n')}` },
            { role: 'user', content: `Given this email below, generate a reply only if it's a genuine email from a person, asking something, or requiring action. Skip it if it's just a social media notification, ad, or generic system update or any company commercials, i am also sharing the from emailID: ${from}, and here is the email body:\n\n${decodedBody}` },
          ],
        });

        const aiReply = aiResponse.choices[0].message.content;
        const raw = await makeRawReply(from, email, subject, aiReply, fullMsg.data.threadId);

        console.log("Raw Email String (decoded):", Buffer.from(raw, 'base64').toString('utf-8'));


        await gmail.users.drafts.create({
          userId: 'me',
          requestBody: {
            message: {
              raw,
              threadId: fullMsg.data.threadId,
            },
          },
        });

        // Add label to the message
        await gmail.users.messages.modify({
          userId: 'me',
          id: fullMsg.data.id,
          requestBody: {
            addLabelIds: [labelId],
          },
        });

        await User.findOneAndUpdate(
          { email },
          {
            $set: { lastRepliedTimestamp: Date.now() },
            $push: {
              chatHistory: [
                { role: 'user', content: `reply this like me\n\n${decodedBody}` },
                { role: 'assistant', content: aiReply }
              ]
            }
          }
        );

        console.log(`✅ Draft generated for ${email}`);
      }
    } catch (err) {
      console.error(`❌ Failed for user ${email}:`, err.message);
    }
  }
}

module.exports = generateDraftsForAllUsers;
