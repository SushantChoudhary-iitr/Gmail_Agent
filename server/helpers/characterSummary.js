const {OpenAI} = require('openai');
const EmailReplyParser = require('email-reply-parser');
const {htmlToText} = require('html-to-text');
require('dotenv').config();

function extractVisibleReply(body){
    const parser = new EmailReplyParser();
    return parser.read(body).getVisibleText().trim();
  }

async function analyzeReplies(replies){
    const openai = new OpenAI({
        apiKey: process.env['OPENAI_API_KEY'],
    });

    if(!replies.length){
      console.log("NO MAILS");
      return;
    }

    const systemPrompt = `
    You are an expert language analyst. Create a User Summary based on the previous replies provided, summarize based on the following: 
    1. Overall tone informal/friendly/semi-formal/or some other combination 
    2. Signature style (IF NO SIGNATURE THEN RETURN "Regards, [user's Name]") 
    3. Typical length (very short(1-15 words), short(15-30 words), medium(30-50)) 
    4. Frequent phrases or patterns or slang (DO NOT UNECESSARILY PILE UP)
    5. Any use of emojis, if yes store frequently used ones[ 😊,🔥,😅,'frequency : 1/(no. of words)' ]
    6. "specifics" — Most important: Identify **personal context** like:
          - Where the user might be working/studying
          - What projects/products they're working on
          - Any deals, launches, transactions, or ongoing tasks mentioned
          - Any current events or activities (e.g., hiring, relocating, collaborating)
          - Product or company names mentioned
          - Any behavioral patterns you can deduce about what's going on in the user's life
          - DO NOT BLOAT THIS SECTION
    7. Additional NOTES (if you notice anything unique, you can save a few peculiar replies here, but be short and efficient)`.trim();

    const chunkSummaries = [];
    
    for (let i = 0; i < replies.length; i += 20) {
        const chunk = replies.slice(i, i + 20);
        const userPrompt = `Here are the previous replies:\n\n${chunk.join('\n\n')} \n\nReturn a JSON object like:\n
    {
      "tone": "...",
      "signature": "...",
      "length": "...",
      "phrases": ["..."],
      "emojis": {
        "used": true/false,
        "types": ["🔥"," 😊", "frequency: 1/(no. of words)]->only if true
      },
      "specifics": ["..."],
      "additionalNotes": "..."
    } DO NOT MIX UP "topics" and "phrases"`.trim();

        try {
            console.log(`summarizing ${(i+20)/20}th chunk`);
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.5
            });

            const rawResponse = completion.choices[0].message.content;
            //console.log('Raw GPT response:', rawResponse);
            
            try {
                const summaryJSON = JSON.parse(rawResponse);
                chunkSummaries.push(summaryJSON);
                console.log(`done with ${(i+20)/20}`);
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                console.error('Invalid JSON content:', rawResponse);
                chunkSummaries.push({
                    tone: "unknown",
                    signature: "unknown",
                    length: "unknown",
                    specifics: [],
                    phrases: [],
                    emojis: { used: false, types: [] },
                    additionalNotes: "Error parsing response"
                });
            }
        } catch (err) {
            console.error(`Error processing chunk ${i / 20 + 1}:`, err.message);
            chunkSummaries.push({
                tone: "unknown",
                signature: "unknown",
                length: "unknown",
                specifics: [],
                phrases: [],
                emojis: { used: false, types: [] },
                additionalNotes: "Error processing chunk"
            });
        }
    }

    if(!chunkSummaries.length){
      console.log("No summaries created");
      return;
    }

    const mergePromptSystem = `You are an expert summarizer. Merge the following multiple JSON summaries into a single consistent summary`;

    const mergePromptUser = `Here are the summaries to merge: ${JSON.stringify(chunkSummaries, null, 2)} \n Return a JSON object like:
    {
      "tone": "...",
      "signature": "...",
      "length": "...",
      "phrases": ["..."],
      "emojis": {
            used : "true"/"false",
            types: ["🔥"," 😊","frequency: 1/(no. of words)"]
        },
        "specifics": ["..."],
      "additionalNotes": "..."
    }`;

    try {
        console.log("into Merging");
        const mergeRes = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: mergePromptSystem },
                { role: 'user', content: mergePromptUser }
            ],
            temperature: 0.4
        });

        const finalSummary = JSON.parse(mergeRes.choices[0].message.content);
        console.log("done with merging");
        return finalSummary;
    } catch (error) {
        console.error('Error merging summaries:', error.message);
        return null;
    }
}

async function characterSummary(gmail) {
    const threeWeeksAgo = Math.floor((Date.now() - 21 * 24 * 60 * 60 * 1000) / 1000);

    const listRes = await gmail.users.messages.list({
        userId: 'me',
        labelIds: ['SENT'],
        q: `after:${threeWeeksAgo}`,
        maxResults: 100,
    });

    const messages = listRes.data.messages || [];
    const uniqueThreadIds = [...new Set(messages.map(msg => msg.threadId))];
    const parser = new EmailReplyParser();
    const allReplies = [];

    for (const threadId of uniqueThreadIds) {
        const thread = await gmail.users.threads.get({
            userId: 'me',
            id: threadId,
            format: 'full',
        });

        console.log(`firstloop`);

        const sentMessages = thread.data.messages.filter(m => m.labelIds?.includes('SENT'));

        for (const msg of sentMessages) {
            const payload = msg.payload;
            const parts = payload.parts || [];
            const textPart = parts.find(p => p.mimeType === 'text/plain');
            const htmlPart = parts.find(p => p.mimeType === 'text/html');
            const bodyData =
                textPart?.body?.data ||
                payload.body?.data ||
                htmlPart?.body?.data;

            if (!bodyData) {
                console.log('skipping this mail has no body');
                continue;
            }

            let decoded = Buffer.from(bodyData, 'base64').toString('utf8');
            decoded = htmlToText(decoded); // in case it's HTML
            const visibleReply = parser.read(decoded).getVisibleText().trim();

            console.log(`sample MAIL: ${visibleReply}`);
            //return;

            if (visibleReply.length > 0) {
                allReplies.push(visibleReply);
            }
        }
    }

    console.log(`done extracting mails: \n ${allReplies.slice(0, 2)}`);

    return analyzeReplies(allReplies);
}

async function characterSummarySent(gmail){
    const threeWeeksAgo = Math.floor((Date.now() - 21 * 24 * 60 * 60 * 1000) / 1000);
    let nextPageToken = null;

    const replies = [];

    do {
        console.log("Entered DoWhile");
        const listRes = await gmail.users.messages.list({
            userId: 'me',
            labelIds: ['SENT'],
            q: `after:${threeWeeksAgo}`,
            maxResults: 500,
            pageToken: nextPageToken || undefined,
        });
    
        //Setting nextPageToken
        nextPageToken = listRes.data.nextPageToken;
    
        const messages = listRes.data.messages || [];
    
        for (const msg of messages) {
            //console.log("First Loop");
          const msgRes = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'full',
            metadataHeaders: ["In-Reply-To"], 
          });
    
          const headers = msgRes.data.payload?.headers || [];
          const isReply = headers.some(h => h.name === 'In-Reply-To');
    
          if(!isReply) continue;
          console.log(`isReply: ${isReply}`);
      
         /* const parts = msgRes.data.payload.parts || [];
          const bodyPart = parts.find(
            p => p.mimeType === 'text/plain' || p.mimeType === 'text/html'
          );*/

          const textPart = msgRes.data.payload.parts?.find(p => p.mimeType === 'text/plain');
        const htmlPart = msgRes.data.payload.parts?.find(p => p.mimeType === 'text/html');
        const bodyData = 
          textPart?.body?.data ||
          msgRes.data.payload.body?.data ||
          htmlPart?.body?.data;
      
          if (bodyData) {
            const decoded = Buffer.from(bodyData, 'base64').toString('utf8');
            const cleanText = extractVisibleReply(decoded);
            console.log(`cleanText: ${cleanText}`);
            const timestamp = new Date(Number(msgRes.data.internalDate)).toLocaleString();
            if (cleanText.length > 0) replies.push(cleanText); // avoid empty or trivial replies
          }
          else{
            console.log('no body data');
          }
        }
        
    } while (nextPageToken);

    

    console.log(`done extracting eamil ${replies.slice(-1)[0]}`);
    /*for (const reply of replies) {
        console.log(`⏱ ${reply.timestamp}\n📩 ${reply.text}\n\n---\n`);
      }*/
    //return;

    return analyzeReplies(replies);
}

module.exports = {
    characterSummary,
    characterSummarySent
};