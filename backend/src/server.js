
require("dotenv").config();

const express = require("express");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const pg = require("pg");
const connectPgSimple = require("connect-pg-simple");
const passport = require("./config/passport");

const app = express();
const PgSession = connectPgSimple(session);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ...(process.env.NODE_ENV === "production"
    ? { ssl: { rejectUnauthorized: false } }
    : {})
});

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required.");
}

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(helmet());
app.use(express.json({ limit: "10kb" }));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false
}));

app.use(session({
  store: new PgSession({
    pool,
    createTableIfMissing: true
  }),
  name: "connect.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, "../../frontend")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Messaging API is running" });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/messageRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "An internal server error occurred." });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Messaging App running on port ${PORT}`);
});
