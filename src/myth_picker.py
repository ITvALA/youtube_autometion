"""Myth topic picker: ek hi kahani alag topic-id/title se dobara nahi aayegi.

daily_pipeline.py me purana `def pick_myth_topic` hata kar upar import me ye jodo:
    from myth_picker import pick_myth_topic
"""
import re, random
from common import ROOT, jload

slug = lambda s: re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

# Ek hi kahani ke alag-alag topic id. Inme se ek use hua to poora group "used" maana jayega.
GROUPS = [
    {"samudra_manthan_halahal", "shiva_neelkanth"},
    {"narasimha_avatar", "narasimha_avatar_prahlada", "prahlada_holika"},
    {"shabari_ram", "shabari_ke_ber"},
    {"dadhichi_asthi_daan", "maharshi_dadhichi_asthi_daan"},
    {"krishna_sudama_sandipani", "krishna_sudama_chawal"},
]
_CANON = {tid: sorted(g)[0] for g in GROUPS for tid in g}


def canon(topic_id):
    return _CANON.get(topic_id, topic_id)


def pick_myth_topic(forced=None):
    topics = jload(ROOT / "data" / "myth_topics.json", [])
    # Naye topics alag file me (shakti peeth, jyotirlinga, devi-devta): dono list jod do
    have = {t.get("topic") for t in topics}
    topics += [t for t in jload(ROOT / "data" / "myth_topics_extra.json", []) if t.get("topic") not in have]
    if forced:
        for t in topics:
            if t.get("topic", "").lower() == forced.lower() or t.get("title", "").lower() == forced.lower():
                return t
        return {"title": forced, "summary": forced, "topic": slug(forced) or "custom"}
    if not topics:
        return {"title": "श्रीकृष्ण और अर्जुन: कुरुक्षेत्र का रहस्य", "topic": "krishna_arjuna",
                "summary": "कुरुक्षेत्र में गीता ज्ञान और विराट रूप।"}

    hist = [h for h in jload(ROOT / "data" / "myth_history.json", []) if isinstance(h, dict)]
    used = {canon(h.get("topic_id")) for h in hist if h.get("topic_id")}
    used_titles = {h.get("topic_title") for h in hist if h.get("topic_title")}

    left = [t for t in topics if canon(t.get("topic")) not in used and t.get("title") not in used_titles]
    if left:
        return random.choice(left)

    # Sab kahaniyan ek baar ho chuki: naya round, par haal ki kahaniyan nahi dohrani.
    n_stories = len({canon(t.get("topic")) for t in topics})
    recent_n = max(1, n_stories // 2)
    recent = {canon(h.get("topic_id")) for h in hist[-recent_n:] if h.get("topic_id")}
    left = [t for t in topics if canon(t.get("topic")) not in recent]
    print(f"[Myth] Naya round: pichli {recent_n} kahaniyan chhod kar {len(left)} topics me se chun rahe hain")
    return random.choice(left or topics)
