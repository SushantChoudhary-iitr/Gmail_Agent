
const { google, oAuth2Client } = require('./gmailClient');
const User = require('../models/users'); // adjust path if different
const checkIfRepliedOrDrafted = require('./checkReplyDraft');
const makeRawReply = require('./makeRawReply');
const { OpenAI } = require('openai');
const { htmlToText } = require('html-to-text');
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
    const { email, tokens, designation, pastReplies, lastRepliedTimestamp, characterSummary } = user;

    if (!designation) {
        console.log(`⏭️ Skipping ${email} — no designation set.`);
        continue;
      }
    if(!characterSummary){
      console.log(`⏭️ skipping: ${email} No characterSummary`);
      continue;
    }
    console.log(` first call -> generating for ${email}`);

    try {
      //const oAuth2Client = new google.auth.OAuth2();
      oAuth2Client.setCredentials(tokens);
      await oAuth2Client.getAccessToken(); // Refresh access token if needed

      const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
      const labelId = await getOrCreateLabel(gmail);
      const lastChecked = lastRepliedTimestamp || new Date('2025-05-01').getTime();

      const messagesRes = await gmail.users.messages.list({
        userId: 'me',
        q: `is:inbox after:${Math.floor(lastChecked / 1000)}`,
        maxResults: 20,
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
        const textPart = fullMsg.data.payload.parts?.find(p => p.mimeType === 'text/plain');
        const htmlPart = fullMsg.data.payload.parts?.find(p => p.mimeType === 'text/html');
        const bodyData = 
          textPart?.body?.data ||
          fullMsg.data.payload.body?.data ||
          htmlPart?.body?.data;

        const rawBody = bodyData
          ? Buffer.from(bodyData, 'base64').toString('utf-8')
          : '(No message body)';

          /*if (!textPart && !fullMsg.data.payload.body?.data && htmlPart) {
            const decodedBody = htmlToText(rawBody); // Convert HTML to plain text
          }*/
         const decodedBody = htmlToText(rawBody);

          console.log(`generating for ${email}`);

          console.log(`FROM: ${from}`);
          console.log(`BODY: ${decodedBody}`);

        const isAutoEmail =
            from.toLowerCase().includes('noreply') ||
            from.toLowerCase().includes('no-reply') ||
            from.toLowerCase().includes('donotreply') ||
            from.toLowerCase().includes('notification') ||
            subject.toLowerCase().includes('receipt') ||
            subject.toLowerCase().includes('notification') ||
            subject.toLowerCase().includes('auto');

        if (isAutoEmail){
          await User.findOneAndUpdate(
            { email },
            {
              $set: { lastRepliedTimestamp: Date.now() }
            }
          );

          continue;
        }

        /*if(decodedBody.includes("No message body")){
          await User.findOneAndUpdate(
            { email },
            {
              $set: { lastRepliedTimestamp: Date.now() }
            }
          );

          continue;
        }*/

          const requireReply = await openai.chat.completions.create({
            model : 'gpt-3.5-turbo',
            messages:[
                {role: 'system', content: 'you are an Email assistant, if an email requires a reply answer in yes or no, no punctuation marks.For no message body reply no'},
                {role:'user', content: `from: ${from}\n subject: ${subject}\nbody: ${decodedBody} \n reply only if its from a real person, and its asking a question or needs a folow up response, No need to reply if its a social media notification or some company commercial, newsletter, ad, or system alert. /n does it need a reply?`},
            ],
          });
          
          console.log("Number of tokens used: ", requireReply.usage.total_tokens);
          console.log( "1st verification: ", requireReply.choices[0].message.content.trim().toLowerCase() );
  
          if( requireReply.choices[0].message.content.trim().toLowerCase() === 'no' ){
            await User.findOneAndUpdate(
              { email },
              {
                $set: { lastRepliedTimestamp: Date.now() }
              }
            );
  
            continue;
          }
  
          const aiResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: `Write a reply as: \n${designation}, match the style and try to mimic on the basis of characterSummary:\n\n${JSON.stringify(characterSummary,null,2)}. match the tone,be clear, further cut down the "length" as this is a reply in the SAME THREAD so, Avoid being too formal, pompous, or wordy` },
              { role: 'user', content: `Reply to this:\n\n${decodedBody}` },
            ],
          });
  
          const aiReply = aiResponse.choices[0].message.content;
          const raw = await makeRawReply(from, email, subject, aiReply, fullMsg.data.threadId);
          
          console.log("Number of tokens used: ", aiResponse.usage.total_tokens);
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
            /*$push: {
              chatHistory: [
                { role: 'user', content: `reply this like me\n\n${decodedBody}` },
                { role: 'assistant', content: aiReply }
              ]
            }*/
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
