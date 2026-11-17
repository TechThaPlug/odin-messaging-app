const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const prisma = require("./prisma");

passport.use(
  new LocalStrategy(
    { usernameField: "identifier" },
    async (identifier, password, done) => {
      try {
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: identifier.toLowerCase() },
              { username: identifier }
            ]
          }
        });

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
          return done(null, false, { message: "Invalid credentials." });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    done(null, user || false);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;