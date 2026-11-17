const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");

exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({
        message: "Username must be 3–20 characters and contain only letters, numbers, and underscores."
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email address." });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        message: "Password must be between 8 and 72 characters."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: normalizedEmail }
        ]
      }
    });

    if (existing) {
      return res.status(409).json({
        message: "Username or email is already registered."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        email: normalizedEmail,
        passwordHash
      },
      select: {
        id: true,
        username: true,
        email: true
      }
    });

    req.login(user, (error) => {
      if (error) return next(error);
      res.status(201).json({ message: "Account created successfully.", user });
    });
  } catch (error) {
    next(error);
  }
};

exports.login = (req, res) => {
  res.json({
    message: "Login successful.",
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email
    }
  });
};

exports.logout = (req, res, next) => {
  req.logout((error) => {
    if (error) return next(error);

    req.session.destroy((sessionError) => {
      if (sessionError) return next(sessionError);

      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully." });
    });
  });
};

exports.currentUser = (req, res) => {
  res.json({ user: req.user || null });
};