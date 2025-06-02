const { google } = require('googleapis');

async function checkIfRepliedOrDrafted(gmail, message) {
    const threadId = message.threadId;
    const incomingInternalDate = parseInt(message.internalDate); // in ms
  
    // 1. Check for existing draft in the same thread
    const draftsList = await gmail.users.drafts.list({ userId: 'me' });
    const hasDraft = draftsList.data.drafts?.some(d => d.message.threadId === threadId);
    if (hasDraft) {
      return { shouldReply: false, reason: 'Draft already exists' };
    }
  
    // 2. Check if any SENT reply is newer than this incoming message
    const sentReplies = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['SENT'],
      q: `thread:${threadId}`,
    });
  
    if (sentReplies.data.messages?.length > 0) {
      for (let sentMsg of sentReplies.data.messages) {
        const sentDetail = await gmail.users.messages.get({
          userId: 'me',
          id: sentMsg.id,
          format: 'metadata',
        });
  
        const sentInternalDate = parseInt(sentDetail.data.internalDate);
  
        // If reply was sent after incoming message, no need to draft again
        if (sentInternalDate > incomingInternalDate) {
          return { shouldReply: false, reason: 'Already replied to this message' };
        }
      }
    }
  
    return { shouldReply: true };
  }
  

module.exports = checkIfRepliedOrDrafted;
