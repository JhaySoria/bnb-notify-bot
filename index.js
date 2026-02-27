const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Example product list
const products = [
  { name: "Item A", price: 0.01 },
  { name: "Item B", price: 0.02 },
  { name: "Item C", price: 0.03 }
];require("dotenv").config();
const { ethers } = require("ethers");
const axios = require("axios");
const express = require("express");

const app = express();
app.get("/", (req, res) => res.send("Bot is running"));
app.listen(3000, () => console.log("Web server running"));

const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
const walletAddress = process.env.WALLET_ADDRESS;

let lastBalance = null;

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
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const buttons = products.map(p => [{ text: `${p.name} - ${p.price} BNB`, callback_data: p.name }]);

  bot.sendMessage(chatId, "Welcome! Choose a product:", {
    reply_markup: {
      inline_keyboard: buttons
    }
  });
});
