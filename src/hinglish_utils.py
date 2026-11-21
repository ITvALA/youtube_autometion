"""Hinglish utilities: Devanagari to Roman Hinglish transliteration and English detection."""
from __future__ import annotations

import re

# Words that indicate text was written in English rather than Hinglish
ENGLISH_WORDS = {
    "the", "were", "was", "is", "are", "and", "where", "faced", "trapped",
    "surrounded", "their", "his", "her", "they", "them", "sword", "enemy",
    "soldiers", "watch", "next", "video", "when", "which", "that", "this",
    "with", "from", "into", "onto", "under", "about", "death", "blood",
    "fell", "fear", "reached", "looking", "retreated", "sacrificed", "warriors"
}

HINDI_SPECIAL = {
    "में": "mein", "नहीं": "nahi", "नही": "nahi", "हैं": "hain", "है": "hai",
    "था": "tha", "थी": "thi", "थे": "the", "और": "aur", "क्या": "kya",
    "क्यों": "kyun", "कैसे": "kaise", "कहा": "kaha", "कहानी": "kahani",
    "सिर्फ": "sirf", "सिर्फ़": "sirf", "खून": "khoon", "खूँ": "khoon",
    "हुए": "hue", "हुआ": "hua", "हुई": "hui", "गई": "gayi", "गए": "gaye",
    "गया": "gaya", "भी": "bhi", "तो": "to", "पर": "par", "तक": "tak",
    "से": "se", "का": "ka", "की": "ki", "के": "ke", "को": "ko", "ने": "ne",
    "एक": "ek", "दो": "do", "तीन": "teen", "चार": "char", "पाँच": "paanch",
    "छह": "chhah", "सात": "saat", "आठ": "aath", "नौ": "nau", "दस": "das",
    "हज़ार": "hazar", "हजार": "hazar", "सौ": "sau", "साठ": "saath",
    "सोलह": "solah", "सन": "san", "सन्": "san", "साल": "saal", "वर्ष": "varsh",
    "वीडियो": "video", "अगले": "agle", "अगला": "agla", "अगली": "agli",
    "देखें": "dekhein", "देखिए": "dekhiye", "तलवार": 'talwar', "पावनखिंड": "Pawankhind",
    "महाराष्ट्र": "Maharashtra", "विशालगढ़": "Vishalgadh", "बाजीप्रभु": "Bajiprabhu",
    "शिवाजी": "Shivaji", "महाराज": "Maharaj", "मुगल": "Mughal", "मुगलों": "Mughalon",
    "सेना": "sena", "किले": "kile", "किला": "kila", "वीर": "veer", "वीरों": "veeron",
    "साथियों": "sathiyon", "हवा": "hawa", "धूल": "dhool", "सैनिकों": "sainikon",
    "आवाज़ें": "aawazein", "आवाज़": "aawaz", "कानों": "kaanon", "उठाई": "uthai"
}

CONSONANTS = {
    "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "ng",
    "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "ny",
    "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n",
    "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n",
    "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m",
    "य": "y", "र": "r", "ल": "l", "व": "v", "श": "sh", "ष": "sh", "स": "s", "ह": "h",
    "क़": "q", "ख़": "kh", "ग़": "gh", "ज़": "z", "ड़": "d", "ढ़": "dh", "फ़": "f"
}

VOWELS = {
    "अ": "a", "आ": "aa", "इ": "i", "ई": "ee", "उ": "u", "ऊ": "oo",
    "ऋ": "ri", "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au",
    "अं": "an", "अः": "ah"
}

MATRAS = {
    "ा": "a", "ि": "i", "ी": "i", "ु": "u", "ू": "u",
    "ृ": "ri", "े": "e", "ै": "ai", "ो": "o", "ौ": "au",
    "ं": "n", "ँ": "n", "ः": "h"
}


def is_english_narration(text: str) -> bool:
    """Returns True if the text contains obvious English grammar/words instead of Hinglish."""
    if not text:
        return True
    words = re.findall(r"[a-zA-Z]+", text.lower())
    if not words:
        return False
    english_count = sum(1 for w in words if w in ENGLISH_WORDS)
    return english_count >= 2 or (len(words) <= 4 and english_count >= 1)


def devanagari_to_hinglish(text: str) -> str:
    """Converts Devanagari Hindi text into natural conversational Roman Hinglish."""
    if not text:
        return ""
    words = text.split()
    out = []
    for w in words:
        clean = re.sub(r"[,.!?।\'\"\-]", "", w)
        punc = w[len(clean):] if len(w) > len(clean) else ""
        if not clean:
            out.append(w)
            continue
        if clean in HINDI_SPECIAL:
            out.append(HINDI_SPECIAL[clean] + punc)
            continue

        res = ""
        i = 0
        n = len(clean)
        while i < n:
            ch = clean[i]
            # Special conjuncts
            if clean[i:i+3] == "क्ष्":
                res += "ksh"; i += 3; continue
            if clean[i:i+2] == "क्ष":
                res += "ksha" if (i+2 == n) else "ksh"; i += 2; continue
            if clean[i:i+3] == "ज्ञ्":
                res += "gy"; i += 3; continue
            if clean[i:i+2] == "ज्ञ":
                res += "gya"; i += 2; continue
            if clean[i:i+3] == "श्र्":
                res += "shr"; i += 3; continue
            if clean[i:i+2] == "श्र":
                res += "shra" if (i+2 == n) else "shr"; i += 2; continue
            if clean[i:i+3] == "त्र्":
                res += "tr"; i += 3; continue
            if clean[i:i+2] == "त्र":
                res += "tra" if (i+2 == n) else "tr"; i += 2; continue

            # Nukta combination
            if i + 1 < n and clean[i+1] == "़":
                comb = ch + "़"
                if comb in CONSONANTS:
                    ch = comb
                    i += 1
            if ch in VOWELS:
                res += VOWELS[ch]
                i += 1
            elif ch in CONSONANTS:
                base = CONSONANTS[ch]
                if i + 1 < n and clean[i+1] == "्":
                    res += base
                    i += 2
                elif i + 1 < n and clean[i+1] in MATRAS:
                    res += base + MATRAS[clean[i+1]]
                    i += 2
                else:
                    res += base if (i + 1 == n) else (base + "a")
                    i += 1
            elif ch in MATRAS:
                res += MATRAS[ch]
                i += 1
            else:
                res += ch
                i += 1
        res = re.sub(r"ee$", "i", res)
        res = re.sub(r"aa$", "a", res)
        out.append(res + punc)
    return " ".join(out)


def ensure_hinglish_narration(narration: str, tts_text: str) -> str:
    """Ensures narration is in Hinglish (Roman Hindi). Converts tts_text if narration is English."""
    if not narration or is_english_narration(narration):
        return devanagari_to_hinglish(tts_text)
    return narration
