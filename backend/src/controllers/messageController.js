
const prisma = require("../config/prisma");

exports.createConversation = async (req, res, next) => {
  try {
    const { participantId } = req.body;

    if (!participantId || participantId === req.user.id) {
      return res.status(400).json({ message: "Choose another user." });
    }

    const participant = await prisma.user.findUnique({
      where: { id: participantId }
    });

    if (!participant) {
      return res.status(404).json({ message: "User not found." });
    }

    let conversation = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        participants: {
          every: { userId: { in: [req.user.id, participantId] } },
          some: { userId: req.user.id }
        }
      },
      include: { participants: true }
    });

    if (conversation && conversation.participants.length === 2) {
      return res.json({ conversation });
    }

    conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: req.user.id },
            { userId: participantId }
          ]
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true }
            }
          }
        }
      }
    });

    res.status(201).json({ conversation });
  } catch (error) {
    next(error);
  }
};

exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId: req.user.id } }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    res.json({ conversations });
  } catch (error) {
    next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    const membership = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: req.user.id
        }
      }
    });

    if (!membership) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    res.json({ messages: messages.reverse() });
  } catch (error) {
    next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const content = typeof req.body.content === "string"
      ? req.body.content.trim()
      : "";

    if (!content || content.length > 5000) {
      return res.status(400).json({
        message: "Message must contain 1–5000 characters."
      });
    }

    const membership = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: req.user.id
        }
      }
    });

    if (!membership) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId: req.user.id,
        conversationId
      },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true }
        }
      }
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
};

exports.editMessage = async (req, res, next) => {
  try {
    const content = typeof req.body.content === "string"
      ? req.body.content.trim()
      : "";

    if (!content || content.length > 5000) {
      return res.status(400).json({ message: "Invalid message content." });
    }

    const message = await prisma.message.findUnique({
      where: { id: req.params.messageId }
    });

    if (!message || message.senderId !== req.user.id || message.deletedAt) {
      return res.status(404).json({ message: "Message not found." });
    }

    const updated = await prisma.message.update({
      where: { id: message.id },
      data: { content, editedAt: new Date() }
    });

    res.json({ message: updated });
  } catch (error) {
    next(error);
  }
};

exports.deleteMessage = async (req, res, next) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: req.params.messageId }
    });

    if (!message || message.senderId !== req.user.id || message.deletedAt) {
      return res.status(404).json({ message: "Message not found." });
    }

    await prisma.message.update({
      where: { id: message.id },
      data: {
        content: "This message was deleted.",
        deletedAt: new Date()
      }
    });

    res.json({ message: "Message deleted successfully." });
  } catch (error) {
    next(error);
  }
};
