import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());     // parse JSON body
app.use(cors());             // allow cross-origin
app.use(helmet());           // basic security
app.use(morgan("tiny"));     // logs

// quick health check
app.get("/health", (req, res) => res.json({ ok: true }));
// helper: check if token is an integer string (e.g., "1","334","-5")
function isIntegerString(s) {
  return typeof s === "string" && /^-?\d+$/.test(s);
}

// helper: build alternating-caps string from reversed letters
function buildAlternatingCaps(letters) {
  const rev = letters.slice().reverse();
  return rev.map((ch, i) => (i % 2 === 0 ? ch.toUpperCase() : ch.toLowerCase())).join("");
}

app.post("/bfhl", (req, res) => {
  try {
    if (!req.body || !Array.isArray(req.body.data)) {
      return res.status(400).json({
        is_success: false,
        error: 'Invalid body: expected { "data": [ ... ] }'
      });
    }

    const data = req.body.data.map(String); // normalize to strings

    const odd_numbers = [];
    const even_numbers = [];
    const alphabets = [];
    const special_characters = [];
    const lettersForConcat = [];

    let sum = 0;

    for (const token of data) {
      if (/^[A-Za-z]+$/.test(token)) {
        // pure letters → alphabets (UPPER)
        alphabets.push(token.toUpperCase());
        for (const ch of token) lettersForConcat.push(ch);
      } else if (isIntegerString(token)) {
        // pure numbers → even/odd + sum (keep as strings in arrays)
        const n = parseInt(token, 10);
        sum += n;
        if (Math.abs(n) % 2 === 0) even_numbers.push(token);
        else odd_numbers.push(token);
      } else {
        // mixed/others → collect letters for concat + each non-alnum as special char
        for (const ch of token) {
          if (/[A-Za-z]/.test(ch)) lettersForConcat.push(ch);
          else if (!/[0-9]/.test(ch)) special_characters.push(ch);
        }
      }
    }

    const concat_string = buildAlternatingCaps(lettersForConcat);

    // identity fields (env-driven; fallbacks match examples)
    const fullName = (process.env.FULL_NAME || "john_doe").toLowerCase(); // must be lowercase with underscores
    const dob = process.env.DOB_DDMMYYYY || "17091999";                   // ddmmyyyy
    const user_id = `${fullName}_${dob}`;

    const email = process.env.EMAIL || "john@xyz.com";
    const roll_number = process.env.ROLL_NUMBER || "ABCD123";

    return res.status(200).json({
      is_success: true,
      user_id,
      email,
      roll_number,
      odd_numbers,
      even_numbers,
      alphabets,
      special_characters,
      sum: String(sum),    // sum must be a string
      concat_string
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ is_success: false, error: "Internal Server Error" });
  }
});


// ======== YOU will implement POST /bfhl below =========

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`BFHL API listening at http://localhost:${PORT}`);
});
