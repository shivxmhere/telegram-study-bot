import json
import os

STORAGE_FILE = "data.json"

def load_data():
    if os.path.exists(STORAGE_FILE):
        with open(STORAGE_FILE, "r") as f:
            return json.load(f)
    return {}

def save_data(data):
    with open(STORAGE_FILE, "w") as f:
        json.dump(data, f, indent=2)

def get_score(user_id):
    data = load_data()
    return data.get(user_id, {}).get("score", 0)

def update_score(user_id, points):
    data = load_data()
    if user_id not in data:
        data[user_id] = {"score": 0, "history": []}
    data[user_id]["score"] += points
    save_data(data)

def add_to_history(user_id, topic):
    data = load_data()
    if user_id not in data:
        data[user_id] = {"score": 0, "history": []}
    history = data[user_id].get("history", [])
    if topic not in history:
        history.append(topic)
    data[user_id]["history"] = history[-10:]
    save_data(data)

def get_history(user_id):
    data = load_data()
    return data.get(user_id, {}).get("history", [])
