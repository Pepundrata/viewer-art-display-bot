require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");

// === Discord bot setup ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: ["CHANNEL", "MESSAGE"], // Added "MESSAGE" partial to properly handle partial messages
});

const TARGET_CHANNEL_ID = "1378795534298517566";

client.on("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  // If the message is partial, fetch it fully before continuing
  if (message.partial) {
    try {
      await message.fetch();
    } catch (err) {
      console.error("Error fetching partial message:", err);
      return; // exit early if can't fetch full message
    }
  }

  if (message.author.bot) return;
  if (message.channel.id !== TARGET_CHANNEL_ID) return;

  const imageAttachment = message.attachments.find((att) =>
    att.contentType?.startsWith("image"),
  );

  if (imageAttachment) {
    const imageUrl = imageAttachment.url;
    const filePath = path.join(__dirname, "images.json");

    // Read existing data or start fresh
    let data = [];
    try {
      data = JSON.parse(fs.readFileSync(filePath));
    } catch {
      console.warn("⚠️ images.json not found or invalid, starting fresh.");
    }

    data.push({
      url: imageUrl,
      user: message.author.username,
      timestamp: new Date().toISOString(),
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`🖼️ Saved image: ${imageUrl}`);

    // Reply publicly in the channel
    try {
      await message.reply("✅ Your art has been saved!");
    } catch (err) {
      console.error(`❌ Couldn't reply to message in channel:`, err);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

// === Express server setup ===
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/images.json", (req, res) => {
  const filePath = path.join(__dirname, "images.json");
  console.log("GET /images.json requested");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading images.json:", err);
      return res.status(500).send("Error reading images.json");
    }
    res.setHeader("Content-Type", "application/json");
    res.send(data);
  });
});

app.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});
app.listen(PORT, () => {
  const replUrl = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  console.log(`🌐 Public URL: ${replUrl}`);
  console.log(`📦 Endpoint:   ${replUrl}/images.json`);
});
app.get("/overlay", (req, res) => {
  res.sendFile(path.join(__dirname, "overlay.html"));
});
