const express = require('express');
const router = express.Router();
const { google, oAuth2Client } = require('../helpers/gmailClient');
const User = require('../models/users'); // your Mongoose model
const generateDraftsForAllUsers = require('../helpers/generateDraftsCron');

router.post('/preferences', async (req, res) => {
    console.log("HELLO");
  //const email = req.session?.user?.email;
  const  { designation, email }  = req.body;

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client })

  //const profile = await gmail.users.getProfile({ userId: 'me' });
  //const email = profile.data.emailAddress;

  if (!email) return res.status(401).send('User not authenticated');

  try {
    await User.findOneAndUpdate(
      { email },
      { designation },
      { new: true }
    );

    //TRIGGER DRAFT GENERATION FOR THE FIRST TIME (but it wil trigger for all users NO HARM IG)
    await generateDraftsForAllUsers();

    console.log(`Updated designation for ${email} : ${designation}`);
    res.status(200).send('Profile updated');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating profile');
  }
});


/*router.post('/preferences', async(req, res) => {
    try {

        const  {designation } = req.body;
        let problem ;

        if(!designation){
             problem = "no response from frontend";
        }

        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client })

        //res.json(designation);
        console.log(`Updated designation for ${designation}`);
        res.send(problem);
    } catch (error) {
        console.error("Basics gone wrong:", error);
        res.status(500).send("❌ OAuth failed.");
    }
})*/

module.exports = router;