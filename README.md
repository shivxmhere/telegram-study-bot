# 🤖 Telegram Study Bot + Live Dashboard

> Day 5/35 — #35DaysOfProjects by Shivam Singh | IIT Patna

A Telegram bot that acts as your personal study assistant
+ a live web dashboard to demo the experience.

## 🔗 Live Dashboard
https://studybot-day5-iitpatna.vercel.app

## ✨ Features

### Telegram Bot
- /study [topic] → 3-point Wikipedia summary
- /quiz [topic] → Auto-generated MCQ quiz
- /score → Your points and stats
- /history → Last 5 topics studied

### Web Dashboard
- Live Telegram chat simulator
- Real Wikipedia API integration
- Score + streak tracking
- Study history timeline
- Neon terminal UI

## 🛠️ Tech Stack
Python · python-telegram-bot · Wikipedia API ·
HTML · CSS · Vanilla JS · localStorage

## 🚀 Run the Bot Locally
cd bot
pip install -r requirements.txt
cp .env.example .env
# Add your BOT_TOKEN from @BotFather
python bot.py

## 📊 What I Learned
- Telegram Bot API with python-telegram-bot
- Inline keyboard buttons + callback queries
- Wikipedia REST API integration
- MCQ generation from text (NLP without ML)
- Building a chat UI from scratch
- Matrix rain canvas animation

## 🤖 Get a Bot Token
1. Open Telegram → search @BotFather
2. Send /newbot → follow instructions
3. Copy token → paste in .env file

Built with 💚 as part of #35DaysOfProjects
