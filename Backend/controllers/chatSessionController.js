import Chat from "../model/chat-collection.js";
import crypto from "crypto";

const normalizeMessages = (messages = [], chatId) =>
  messages
    .filter((msg) => msg?.content)
    .map((msg) => ({
      chatId,
      role: msg.role === "ai" ? "assistant" : msg.role,
      content: msg.content,
      searchType: msg.searchType || "Doc Search",
      sources: msg.sources || [],
      results: msg.results || [],
    }));

export const listChatSessions = async (req, res) => {
  try {
    const { userId } = req.auth();
    const chats = await Chat.find({ userId }).sort({ updatedAt: -1 });
    res.json(chats);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unable to load chat history", error: error.message });
  }
};

export const getChatById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.auth();

    const chat = await Chat.findOne({ chatId: id, userId });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: "Unable to load chat", error: error.message });
  }
};

export const createChatSession = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { title = "New Chat", searchType = "Doc Search" } = req.body || {};

    const chat = await Chat.create({
      chatId: crypto.randomUUID(),
      title: title.trim() || "New Chat",
      searchType,
      userId,
    });

    res.status(201).json(chat);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unable to create chat", error: error.message });
  }
};

export const updateChatMeta = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.auth();
    const { title, searchType } = req.body || {};

    const updatePayload = {};
    if (title) updatePayload.title = title.trim() || "New Chat";
    if (searchType) updatePayload.searchType = searchType;
    updatePayload.updatedAt = new Date();

    const updated = await Chat.findOneAndUpdate(
      { chatId: id, userId },
      { $set: updatePayload },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Chat not found" });

    res.json(updated);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unable to update chat", error: error.message });
  }
};

export const appendChatMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.auth();
    const { messages = [], title, searchType } = req.body || {};

    const chat = await Chat.findOne({ chatId: id, userId });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const normalizedMessages = normalizeMessages(messages, id);
    const updateOps = {
      updatedAt: new Date(),
    };

    if (title) updateOps.title = title.trim() || chat.title;
    if (searchType) updateOps.searchType = searchType;

    if (normalizedMessages.length) {
      await Chat.updateOne(
        { chatId: id, userId },
        {
          $push: { messages: { $each: normalizedMessages } },
          $set: updateOps,
        }
      );
    } else {
      await Chat.updateOne({ chatId: id, userId }, { $set: updateOps });
    }

    const updatedChat = await Chat.findOne({ chatId: id, userId });
    res.json(updatedChat);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unable to save message", error: error.message });
  }
};

export const deleteChatSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.auth();

    const deleted = await Chat.findOneAndDelete({ chatId: id, userId });
    if (!deleted) return res.status(404).json({ message: "Chat not found" });

    res.json({ success: true });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unable to delete chat", error: error.message });
  }
};
