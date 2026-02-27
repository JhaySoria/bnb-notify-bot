require("dotenv").config();
const TelegramBot = require('node-telegram-bot-api');
const { ethers } = require("ethers");
const axios = require("axios");
const express = require("express");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const products = [
  { name: "Item A", price: 0.01 },
  { name: "Item B", price: 0.02 },
  { name: "Item C", price: 0.03 }
];

const app = express();
app.get("/", (req, res) => res.send("Bot is running"));
app.listen(3000, () => console.log("Web server running"));

// Binance Smart Chain provider
const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
const walletAddress = process.env.WALLET_ADDRESS;

let lastBalance = null;

// 1️⃣ Log startup
console.log("Bot started. Connecting to wallet:", walletAddress);

// 2️⃣ Check BNB balance every 15 seconds
async function checkBalance() {
  try {
    const balance = await provider.getBalance(walletAddress);
    const balanceInBNB = parseFloat(ethers.formatEther(balance));
    console.log(`[${new Date().toLocaleTimeString()}] Checking balance: ${balanceInBNB} BNB`);

    if (lastBalance !== null && balanceInBNB > lastBalance) {
      const received = balanceInBNB - lastBalance;
      console.log(`💰 Deposit detected! Amount: ${received} BNB`);

      await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
        chat_id: process.env.CHAT_ID,
        text: `🚀 New BNB Deposit!\n\nAmount: ${received} BNB\nWallet: ${walletAddress}`
      });
    }

    lastBalance = balanceInBNB;
  } catch (error) {
    console.log("Error checking balance:", error.message);
  }
}
setInterval(checkBalance, 15000);

// /start menu
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log(`Received /start from ${chatId}`);

  const buttons = products.map(p => [{ text: `${p.name} - ${p.price} BNB`, callback_data: p.name }]);

  bot.sendMessage(chatId, "Welcome! Choose a product:", {
    reply_markup: {
      inline_keyboard: buttons
    }
  });
});

// Payment instructions
bot.on('callback_query', (callbackQuery) => {
  const message = callbackQuery.message;
  const productName = callbackQuery.data;

  const product = products.find(p => p.name === productName);

  if (product) {
    console.log(`User clicked: ${productName} (chat ${message.chat.id})`);
    bot.sendMessage(
      message.chat.id,
      `Please send **${product.price} BNB** to this wallet:\n${process.env.WALLET_ADDRESS}\n\nAfter sending, your purchase will be confirmed automatically.`
    );
  }
});

// Polling errors
bot.on('polling_error', (error) => {
  console.log("Polling error:", error);
});
