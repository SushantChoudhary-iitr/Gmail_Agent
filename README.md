AI Email Reply Assistant :
An AI-powered email assistant that automatically analyzes incoming Gmail messages and generates contextual draft replies in the user’s writing style.
The system connects to a user's Gmail account via OAuth, periodically scans the inbox for new messages, determines whether a reply is needed using AI, and creates draft responses that the user can review and send.

Features:
Gmail Integration
Secure Google OAuth2 authentication
Access to user inbox using Gmail API
Automatically creates draft replies
Adds a custom Gmail label (toReply) for emails requiring attention
AI Email Processing

Uses OpenAI models to:
Determine whether an email requires a reply
Generate a contextual response
Learns the user's tone from past email replies

Filters out:
newsletters
system notifications
promotional emails
automated messages

Background Automation:
Uses cron jobs to periodically check for new emails
Only scans emails received after the last processed timestamp
Prevents duplicate draft generation
Email Parsing
Handles complex Gmail message structures

Extracts content from:
text/plain
text/html
Converts HTML emails into readable text before sending to AI
User Personalization

Each user profile stores:
Gmail OAuth tokens
user designation
past email replies
AI chat history
last processed email timestamp
This allows the AI to match the user’s writing style.

Tech Stack:
Backend:
Node.js
Express.js
Gmail API
OpenAI API
MongoDB
node-cron

Frontend:
React
Material UI
Axios

Deployment:
Backend: Render
Frontend: Netlify
