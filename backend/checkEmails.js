require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const User = require('./src/models/User');
const { fetchTransactionEmails } = require('./src/services/gmailService');
const { ruleBasedParse } = require('./src/services/emailParser');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const user = await User.findOne({ gmailConnected: true });
    if (!user) return console.log("No connected user");

    console.log("Fetching emails...");
    // Fetch last 50 emails
    const emails = await fetchTransactionEmails(user.gmailTokens, 150, new Date('2026-03-01'));
    console.log(`Fetched ${emails.length} emails`);

    let passed = 0;
    let failed = [];
    for (const email of emails) {
      const result = ruleBasedParse(email.subject, email.body, email.snippet);
      if (result) {
        passed++;
      } else {
        failed.push({ sub: email.subject, snip: email.snippet });
      }
    }
    console.log(`\nFailed Examples (first 5):`);
    failed.slice(0, 5).forEach(f => console.log("- " + f.snip));
    console.log(`\nPassed: ${passed}, Failed: ${failed.length}`);
    process.exit(0);
  })
  .catch(console.error);
