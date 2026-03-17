import random
import re

def generate_quiz(text, topic):
    sentences = [s.strip() for s in text.split(".") if len(s.strip()) > 50]
    
    if not sentences:
        return None
    
    base_sentence = random.choice(sentences[:3])
    
    words = base_sentence.split()
    significant = [w for w in words
                   if len(w) > 5
                   and w[0].isupper()
                   and w.lower() not in
                   ["which","these","those",
                    "their","there","where",
                    "while","about","through"]]
    
    if not significant:
        significant = [w for w in words if len(w) > 6]
    
    if not significant:
        return None
    
    answer_word = random.choice(significant[:5])
    
    question = base_sentence.replace(
        answer_word, "_______", 1
    )
    question = f"Fill in the blank: '{question}'"
    
    distractors = generate_distractors(
        answer_word, text, topic
    )
    
    options = distractors[:3] + [answer_word]
    random.shuffle(options)
    correct_index = options.index(answer_word)
    
    return {
        "question": question,
        "options": options,
        "correct": correct_index,
        "topic": topic
    }

def generate_distractors(answer, text, topic):
    words = re.findall(r'\b[A-Z][a-z]{4,}\b', text)
    distractors = list(set([
        w for w in words
        if w != answer and len(w) > 4
    ]))
    
    random.shuffle(distractors)
    
    while len(distractors) < 3:
        fillers = [
            "Algorithm", "System", "Network",
            "Process", "Method", "Framework",
            "Structure", "Theory", "Model",
            "Protocol", "Interface", "Platform"
        ]
        for f in fillers:
            if f not in distractors and f != answer:
                distractors.append(f)
                break
    
    return distractors[:3]
