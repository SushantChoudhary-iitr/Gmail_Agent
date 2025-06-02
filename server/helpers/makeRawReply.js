async function makeRawReply(to, from, subject, body, threadId) {
    const messageParts = [
      `To: ${to}`,
      `From: ${from}`,
      `Subject: Re: ${subject}`,
      `In-Reply-To: ${threadId}`,
      `References: ${threadId}`,
      '',
      body,
    ];
    const message = messageParts.join('\n');
  
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  
    return encodedMessage;
  }

  module.exports = makeRawReply;