"""MINDSPARK YouTube Growth & Packaging Engine
Based on https://github.com/jakeschincariol/youtube-agent-skill

Features:
1. 21 Hook Formulas classifier & scoring (Stakes, Specificity, Curiosity, Brevity, Address)
2. Packaging Linter (Title & Thumbnail pairing, 40-char mobile cut, 60-char desktop cut, no duplicate words)
3. Retention Diagnostics & Narrative Conjunction Rules
"""

import re, json
from typing import Dict, List, Tuple, Any

# Thresholds & Rules from youtube-agent-skill
DESKTOP_LIMIT = 60
MOBILE_LIMIT = 40
HARD_LIMIT = 100

VAGUE_WORDS = {
    "amazing", "incredible", "insane", "crazy", "huge", "massive", "ultimate", "best", "powerful",
    "secret", "revolutionary", "mindblowing", "epic", "perfect", "complete", "everything",
    "अद्भुत", "रोचक", "शानदार", "बेहतरीन", "चमत्कारी"
}

STOP_WORDS = {
    "the", "a", "an", "of", "for", "to", "in", "on", "and", "or", "is", "are", "with", "your", "you", "my", "i",
    "this", "that", "it", "how", "what", "why", "का", "की", "के", "में", "पर", "और", "से", "है", "था"
}

CONCRETE_REGEX = re.compile(r"(\b\d[\d,.]*%?|\b\d+\s?(लाख|करोड़|हज़ार|साल|वर्ष|दिन|घंटे|सेकंड|min|sec|k|m)\b)", re.I)
STAKE_REGEX = re.compile(r"(मौत|ललकार|श्राप|युद्ध|बलिदान|लाज|सत्यानाश|विनाश|अंत|खतरा|kill|die|war|blood|curse|danger|risk|lost|survive)", re.I)
CURIOSITY_REGEX = re.compile(r"(क्यों|कैसे|क्या|रहस्य|गुप्त|अमर|सच|पहला|अंतिम|nobody|secret|why|how|truth|never|hidden)", re.I)

VIRAL_HOOK_FORMULAS = [
    {
        "id": "extreme-stake",
        "name": "The Extreme Stake",
        "formula": "जब [नायक] ने [असंभव संकट / शत्रु] को अकेले ललकार दिया!",
        "example": "जब बहन जाहल की लाज बचाने के लिए रा' नवघण ने 1 लाख की सुल्तानी सेना को अकेले ललकार दिया!"
    },
    {
        "id": "forbidden-mystery",
        "name": "The Forbidden Mystery",
        "formula": "[स्थान / देवता] का वह गुप्त रहस्य जिसे इतिहास ने छुपाया!",
        "example": "काशी का वह गुप्त कोना जहां आज भी भगवान शिव का त्रिशूल हवा में तैरता है!"
    },
    {
        "id": "contrarian-flip",
        "name": "The Contrarian Flip",
        "formula": "सब जानते हैं [सामान्य बात], लेकिन क्या आप जानते हैं [चौंकाने वाला सच]?",
        "example": "सब कहते हैं रावण को केवल राम ने हराया, लेकिन इस एक योद्धा ने रावण को 6 महीने तक बंदी बनाकर रखा था!"
    },
    {
        "id": "the-clock",
        "name": "The Clock / Countdown",
        "formula": "अगले [30/40] सेकंड में जानें [रहस्य / कथा]!",
        "example": "अगले 40 सेकंड में जानें सोमनाथ के उस गुप्त शिवलिंग का रहस्य जिसे कोई मिटा नहीं सका!"
    },
    {
        "id": "the-curse-or-boon",
        "name": "The Curse or Boon",
        "formula": "वह एक श्राप जिसने [नायक / साम्राज्य] का इतिहास हमेशा के लिए बदल दिया!",
        "example": "कर्ण का वह अंतिम श्राप जिसने कुरुक्षेत्र के युद्ध का फैसला तय कर दिया था!"
    }
]

def words(t: str) -> List[str]:
    return [w.lower() for w in re.findall(r"[\w']+", t)]

def score_hook(hook_text: str) -> Dict[str, Any]:
    """Score a short-form hook (0-100) based on specificity, stakes, curiosity, brevity, and address."""
    t = hook_text.strip()
    w = words(t)
    n = len(w)
    if n == 0:
        return {"score": 0, "band": "WEAK", "weakest": "EMPTY"}

    # 1. Brevity (Ideal: 8-16 words in Hindi for a fast 0-3s hook)
    if 8 <= n <= 16:
        brevity = 100
    elif n < 8:
        brevity = max(30, 100 - (8 - n) * 12)
    else:
        brevity = max(10, 100 - (n - 16) * 8)

    # 2. Specificity (Proper names, numbers, places)
    nums = len(CONCRETE_REGEX.findall(t))
    vague_count = sum(1 for x in w if x in VAGUE_WORDS)
    proper_nouns = len([x for x in t.split()[1:] if x and x[0].isupper()])
    spec = min(100, max(20, 40 + nums * 25 + proper_nouns * 10 - vague_count * 15))

    # 3. Stakes (Risk, consequence, conflict)
    stake_hits = len(STAKE_REGEX.findall(t))
    stakes = min(100, max(20, 30 + stake_hits * 30))

    # 4. Curiosity Gap (Open loop)
    curiosity_hits = len(CURIOSITY_REGEX.findall(t))
    has_q = 20 if ("?" in t or "क्या" in t or "क्यों" in t) else 0
    curiosity = min(100, max(25, 35 + curiosity_hits * 25 + has_q))

    # Weakest-link weighted score (60% mean, 40% min)
    parts = {"BREVITY": brevity, "SPECIFICITY": spec, "STAKES": stakes, "CURIOSITY": curiosity}
    vals = list(parts.values())
    verdict = round(0.6 * (sum(vals) / len(vals)) + 0.4 * min(vals))
    band = "STRONG" if verdict >= 72 else "WORKABLE" if verdict >= 52 else "WEAK"
    weakest = min(parts, key=parts.get)

    return {
        "score": verdict,
        "band": band,
        "metrics": parts,
        "weakest": weakest,
        "hook": t
    }

def lint_packaging(title: str, thumb_text: str = "") -> Dict[str, Any]:
    """Lint title and thumbnail as a single cohesive packaging unit."""
    t = title.strip()
    n = len(t)
    issues, good = [], []

    # Hard & Desktop / Mobile cuts
    if n > HARD_LIMIT:
        issues.append(("length", f"{n} chars - Exceeds YouTube hard limit ({HARD_LIMIT})"))
    elif n > DESKTOP_LIMIT:
        issues.append(("desktop", f"{n} chars - Truncates on desktop search near {DESKTOP_LIMIT} chars"))
    else:
        good.append(f"{n} chars - Fits within desktop cut ({DESKTOP_LIMIT})")

    if n > MOBILE_LIMIT:
        head = t[:MOBILE_LIMIT].rsplit(" ", 1)[0]
        issues.append(("mobile", f"Mobile home feed cuts at ~{MOBILE_LIMIT} chars: '{head}...'"))
    else:
        good.append(f"Mobile friendly (under {MOBILE_LIMIT} chars)")

    # Concrete details
    nums = CONCRETE_REGEX.findall(t)
    if nums:
        good.append(f"Contains concrete anchor ({', '.join([str(x) for x in nums[:2]])})")
    else:
        issues.append(("no-anchor", "No concrete number, year, or proper noun anchor"))

    # Vague word check
    w_set = set(words(t))
    vague_found = w_set & VAGUE_WORDS
    if vague_found:
        issues.append(("vague", f"Vague trigger words ({', '.join(vague_found)}) - swap for exact names/stakes"))

    # Thumbnail pairing check
    if thumb_text:
        tw = set(words(t)) - STOP_WORDS
        thw = set(words(thumb_text)) - STOP_WORDS
        shared = tw & thw
        if shared:
            issues.append(("duplicate", f"Thumbnail repeats title words ({', '.join(shared)}) - thumbnail must add NEW information"))
        else:
            good.append("Thumbnail and title do not duplicate words")

        if len(words(thumb_text)) > 4:
            issues.append(("thumb-length", f"{len(words(thumb_text))} words on thumbnail - max 3-4 words readable at feed size"))

    score = max(0, min(100, 100 - 15 * len(issues) + 5 * len(good)))
    return {
        "title": t,
        "thumb_text": thumb_text,
        "score": score,
        "issues": issues,
        "good": good
    }
