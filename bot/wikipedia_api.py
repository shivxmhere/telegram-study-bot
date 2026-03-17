import requests

def get_summary(topic):
    try:
        url = (f"https://en.wikipedia.org/api/rest_v1/page/summary/{requests.utils.quote(topic)}")
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return response.json().get("extract", "")
        return None
    except Exception:
        return None

def get_bullet_points(text, topic):
    sentences = [s.strip() for s in text.split(".") if len(s.strip()) > 40]
    
    if len(sentences) >= 3:
        return sentences[:3]
    elif len(sentences) == 2:
        return sentences[:2] + [
            f"{topic} has significant applications in modern technology and research."
        ]
    else:
        return [
            text[:200] + "...",
            f"{topic} is an important concept in its field.",
            f"Learn more about {topic} on Wikipedia."
        ]
