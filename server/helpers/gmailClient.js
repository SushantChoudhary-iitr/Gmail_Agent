const { google } = require("googleapis");
require("dotenv").config();
const fs = require('fs');
const User = require('../models/users');

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

//console.log("HEY BUDDY");

//for avoiding reautentication everytime we run the server
/*if (fs.existsSync("token.json")) {
  const tokens = JSON.parse(fs.readFileSync("token.json"));
  oAuth2Client.setCredentials(tokens);
}*/

//Checking if tokens exist in database
async function setOAuthCredentialsForUser(email, oAuth2Client) {
  const user = await User.findOne({ email });

  if (!user || !user.tokens) {
    throw new Error("User tokens not found. User may not be authenticated.");
  }

  oAuth2Client.setCredentials(user.tokens);
}



module.exports = {
  setOAuthCredentialsForUser,
  oAuth2Client,
  google
}; 