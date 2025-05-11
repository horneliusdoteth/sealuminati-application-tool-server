//server.js
const express = require("express");
const cors = require("cors");
const pool = require('./db');

const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const axios = require('axios');

// 2) /api/applicants endpoint
// server.js
app.get("/api/applicants", async (req, res) => {
	try {
	  const result = await pool.query(`
		SELECT
		  id,
		  submission_timestamp AS "timestamp",
		  discord,
		  twitter,
		  wallet,
		  entered_crypto,
		  future_ideas,
		  skillset,
		  hobbies,
		  whos_soul,
		  how_bad,
		  seal_count,
		  hornelius_vote,
		  sammy_vote,
		  richard_vote,
		  cookies_vote,
		  hornelius_role,
		  sammy_role,
		  richard_role,
		  cookies_role,
		  review_notes,
		  review_status,
		  in_discord,
		  discord_checked_at
		FROM applicants
		ORDER BY submission_timestamp ASC
	  `);
  
	  const data = result.rows.map(row => ({
		id: row.id,
		timestamp: row.timestamp,
		discord: row.discord,
		twitter: row.twitter,
		wallet: row.wallet,
		answers: {
		  enteredCrypto: row.entered_crypto,
		  futureIdeas:   row.future_ideas,
		  skillset:      row.skillset,
		  hobbies:       row.hobbies,
		  sacrifice:     row.whos_soul,
		  cultScale:     row.how_bad,
		  sealCount:     row.seal_count
		},
		reviewStatus: row.review_status,
		savedReview: {
		  votes: {
			Hornelius: row.hornelius_vote,
			Sammy:     row.sammy_vote,
			Richard:   row.richard_vote,
			Cookies:   row.cookies_vote
		  },
		  roles: {
			Hornelius: row.hornelius_role,
			Sammy:     row.sammy_role,
			Richard:   row.richard_role,
			Cookies:   row.cookies_role
		  },
		  notes: row.review_notes
		},
		// NEW FIELDS:
		inDiscord: row.in_discord,                     // boolean
		discordCheckedAt: row.discord_checked_at       // timestamp
	  }));
  
	  res.json(data);
	} catch (err) {
	  console.error("Error fetching applicants from DB", err);
	  res.status(500).json({ error: "Failed to fetch applicants" });
	}
  });
  

  // 4) Twitter‐profile endpoint
  app.get('/api/twitter/profile', async (req, res) => {
    let { handle } = req.query;
    handle = handle.replace(/^@/, '');
    // TODO: wire up the Twitter API here
    res.json({
      avatarUrl: `https://unavatar.io/twitter/${handle}`,
      followers: 0,
      bio: '',
      profileUrl: `https://twitter.com/${handle}`
    });
  });
  
  // 5) On-chain info endpoint
  app.get('/api/chain/info', async (req, res) => {
    const { wallet } = req.query;
    // TODO: integrate your RPC or block-explorer API
    res.json({
      txCount: 0,
      nftCount:  0,
      firstTxDate: new Date().toISOString()
    });
  });
  
  app.post('/api/review', async (req, res) => {
	try {
	  // Destructure the incoming data
	  const { applicantId, votes, roles, notes, newStatus } = req.body;
  
	  // We'll do a parameterized query to avoid SQL injection
	  await pool.query(`
		UPDATE applicants
		SET
		  hornelius_vote  = $1,
		  sammy_vote      = $2,
		  richard_vote    = $3,
		  cookies_vote    = $4,
		  hornelius_role  = $5,
		  sammy_role      = $6,
		  richard_role    = $7,
		  cookies_role    = $8,
		  review_notes    = $9,
		  review_status   = $10
		WHERE id = $11
	  `, [
		votes?.Hornelius || null,
		votes?.Sammy     || null,
		votes?.Richard   || null,
		votes?.Cookies   || null,
  
		roles?.Hornelius || null,
		roles?.Sammy     || null,
		roles?.Richard   || null,
		roles?.Cookies   || null,
  
		notes || null,
		newStatus || null,
		applicantId
	  ]);
  
	  console.log('Review saved to DB for applicant #', applicantId);
	  res.json({ success: true });
  
	} catch (err) {
	  console.error("Error saving review:", err);
	  res.status(500).json({ error: "Failed to save review" });
	}
  });
  
  
  

// 3) Start server
const port = process.env.PORT || 4000;
app.listen(port, () => {
	console.log(`🚀 Backend listening on http://localhost:${port}`);
});
