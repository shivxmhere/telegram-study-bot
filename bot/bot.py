import os
import json
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
from dotenv import load_dotenv
from wikipedia_api import get_summary, get_bullet_points
from quiz_gen import generate_quiz
from storage import get_score, update_score, add_to_history, get_history

load_dotenv()
BOT_TOKEN = os.getenv("BOT_TOKEN")

logging.basicConfig(level=logging.INFO)

async def start(update, context):
    await update.message.reply_text(
        "🤖 Welcome to StudyBot!\n\n"
        "Commands:\n"
        "/study [topic] — Get a 3-point summary\n"
        "/quiz [topic]  — Take a quiz\n"
        "/score         — Your stats\n"
        "/history       — Past topics\n"
        "/help          — All commands\n\n"
        "Try: /study Machine Learning"
    )

async def study(update, context):
    if not context.args:
        await update.message.reply_text(
            "Please provide a topic!\n"
            "Example: /study Quantum Computing"
        )
        return
    
    topic = " ".join(context.args)
    user_id = str(update.effective_user.id)
    
    await update.message.reply_text(
        f"🔍 Searching Wikipedia for: {topic}..."
    )
    
    summary = get_summary(topic)
    if not summary:
        await update.message.reply_text(
            f"❌ Could not find info on '{topic}'.\n"
            "Try a different search term."
        )
        return
    
    bullets = get_bullet_points(summary, topic)
    add_to_history(user_id, topic)
    
    response = f"📚 *{topic}*\n\n"
    response += "Here's your 3-point summary:\n\n"
    for i, bullet in enumerate(bullets, 1):
        response += f"• {bullet}\n\n"
    response += f"Ready for a quiz? Type /quiz {topic} 🎯"
    
    await update.message.reply_text(
        response, parse_mode="Markdown"
    )

async def quiz(update, context):
    if not context.args:
        await update.message.reply_text(
            "Please provide a topic!\n"
            "Example: /quiz Machine Learning"
        )
        return
    
    topic = " ".join(context.args)
    summary = get_summary(topic)
    
    if not summary:
        await update.message.reply_text(
            f"❌ Could not find info on '{topic}'."
        )
        return
    
    quiz_data = generate_quiz(summary, topic)
    if not quiz_data:
        await update.message.reply_text(
            "❌ Could not generate quiz for this topic."
        )
        return
    
    keyboard = []
    for i, option in enumerate(quiz_data["options"]):
        keyboard.append([InlineKeyboardButton(
            f"{chr(65+i)}. {option}",
            callback_data=f"quiz_{i}_{quiz_data['correct']}_{topic}"
        )])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        f"🎯 *Quiz: {topic}*\n\n"
        f"Q: {quiz_data['question']}\n\n"
        "Choose your answer:",
        reply_markup=reply_markup,
        parse_mode="Markdown"
    )

async def handle_quiz_answer(update, context):
    query = update.callback_query
    await query.answer()
    
    data = query.data.split("_")
    selected = int(data[1])
    correct = int(data[2])
    topic = "_".join(data[3:])
    user_id = str(query.from_user.id)
    
    if selected == correct:
        update_score(user_id, 10)
        current_score = get_score(user_id)
        await query.edit_message_text(
            f"✅ *Correct!* +10 points\n\n"
            f"Your score: {current_score} points 🎉\n"
            f"Keep going! /study {topic}",
            parse_mode="Markdown"
        )
    else:
        correct_letter = chr(65 + correct)
        await query.edit_message_text(
            f"❌ *Wrong!*\n\n"
            f"The correct answer was: {correct_letter}\n"
            f"Don't give up! Try: /quiz {topic}",
            parse_mode="Markdown"
        )

async def score(update, context):
    user_id = str(update.effective_user.id)
    current_score = get_score(user_id)
    history = get_history(user_id)
    
    await update.message.reply_text(
        f"📊 *Your Stats*\n\n"
        f"🏆 Score: {current_score} points\n"
        f"📚 Topics studied: {len(history)}\n\n"
        f"Keep studying to increase your score!",
        parse_mode="Markdown"
    )

async def history_cmd(update, context):
    user_id = str(update.effective_user.id)
    history = get_history(user_id)
    
    if not history:
        await update.message.reply_text(
            "No topics studied yet!\n"
            "Start with: /study Machine Learning"
        )
        return
    
    text = "📖 *Your Study History*\n\n"
    for i, topic in enumerate(history[-5:], 1):
        text += f"{i}. {topic}\n"
    
    await update.message.reply_text(
        text, parse_mode="Markdown"
    )

def main():
    app = Application.builder().token(BOT_TOKEN).build()
    
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", start))
    app.add_handler(CommandHandler("study", study))
    app.add_handler(CommandHandler("quiz", quiz))
    app.add_handler(CommandHandler("score", score))
    app.add_handler(CommandHandler("history", history_cmd))
    app.add_handler(CallbackQueryHandler(handle_quiz_answer, pattern="^quiz_"))
    
    print("🤖 StudyBot is running...")
    app.run_polling()

if __name__ == "__main__":
    main()
