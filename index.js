require("dotenv").config();
const TelegramBot = require('node-telegram-bot-api');
const { ethers } = require("ethers");
const axios = require("axios");
const express = require("express");

// Initialize bot
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Product list
const products = [
  { name: "Item A", price: 0.01 },
  { name: "Item B", price: 0.02 },
  { name: "Item C", price: 0.03 }
];

// Web server to keep bot alive
const app = express();
app.get("/", (req, res) => res.send("Bot is running"));
app.listen(3000, () => console.log("Web server running"));

// Binance Smart Chain provider
const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
const walletAddress = process.env.WALLET_ADDRESS;

let lastBalance = null;

// Check wallet balance every 15 seconds
async function checkBalance() {
  try {
    const balance = await provider.getBalance(walletAddress);
    const balanceInBNB = parseFloat(ethers.formatEther(balance));

    if (lastBalance !== null && balanceInBNB > lastBalance) {
      const received = balanceInBNB - lastBalance;

      await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
        chat_id: process.env.CHAT_ID,
        text: `🚀 New BNB Deposit!\n\nAmount: ${received} BNB\nWallet: ${walletAddress}`
      });
    }

    lastBalance = balanceInBNB;
  } catch (error) {
    console.log(error.message);
  }
}
setInterval(checkBalance, 15000);

// /start menu
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

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
    bot.sendMessage(
      message.chat.id,
      `Please send **${product.price} BNB** to this wallet:\n${process.env.WALLET_ADDRESS}\n\nAfter sending, your purchase will be confirmed automatically.`
    );
  }
});
