
const prisma = require("../config/prisma");

exports.searchUsers = async (req, res, next) => {
  try {
    const search = (req.query.search || "").trim();

    if (search.length < 2 || search.length > 30) {
      return res.status(400).json({
        message: "Search must contain 2–30 characters."
      });
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: req.user.id },
        OR: [
          { username: { contains: search, mode: "insensitive" } },
          { displayName: { contains: search, mode: "insensitive" } }
        ]
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true
      },
      take: 20,
      orderBy: { username: "asc" }
    });

    res.json({ users });
  } catch (error) {
    next(error);
  }
};
