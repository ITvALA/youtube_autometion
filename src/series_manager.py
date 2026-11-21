"""MINDSPARK Multi-Part Series Manager & 3-Topic Rotation Engine.

Features:
1. Full Story Multi-Part Generation:
   Takes a rich topic, writes the full detailed narrative, and splits it into
   2 to 4 sequential parts (each part strictly <= 45s for YouTube Shorts).
2. 3-Topic Parallel Rotation Queue:
   Maintains an active pool of exactly 3 topics.
   Rotates round-robin:
     Topic A (Part 1) -> Topic B (Part 1) -> Topic C (Part 1) ->
     Topic A (Part 2) -> Topic B (Part 2) -> Topic C (Part 2) ...
3. Auto-Replenishment:
   When any topic finishes all its parts, it is archived to completed list,
   and a brand new topic is automatically picked and queued into the active pool.
"""

import os, re, json, datetime, random
from pathlib import Path

from common import ROOT, jload, jsave, load_env
import llm
from myth_picker import pick_myth_topic

STATE_FILE = ROOT / "data" / "active_series.json"

SERIES_PROMPT = """Tum ek anubhavi Hindi dharmik/mythological katha-vachak aur viral YouTube scriptwriter ho.
Hamare paas ek kahani ka topic aaya hai. Hume iski EK ASLI, POORI, VISTAAR-POORVAK (detailed & authentic) katha likhni hai.
Kyunki YouTube Shorts 35-45 second ka hota hai, isliye poori kahani ek video me nahi aa sakti.
Tumhe is poori kahani ko 2 se 4 sequential PARTS (भाग 1, भाग 2, भाग 3...) me todna hai.

TOPIC:
Title: {title}
Summary: {summary}

CRITICAL STORYTELLING NIYAM (KATHA-VACHAN, NOT A MOVIE TRAILER):
1. YE KOI MOVIE TRAILER YA TEASER NAHI HAI! KABHI BHI disjointed, abstract ya cinematic teaser dialogues mat likho (jaise "आँखें खोलें", "कदम बढ़ाएँ", "सामंत की हँसी").
2. HAR PART ME ASLI KATHA (Real Story) SUNAO:
   - Kahani kiski hai? (Pauranik patra, Devi/Devta, Mandir, Nayak ka asli naam saaf bolo)
   - Ghatna kahan ghati? (Asli jagah, prant ya sthan)
   - Asal me kya ghatna ghati thi? (Kalyug ka sankat, raja ka atyachar, shrap, ya divya pariksha)
   - Har ek part me 5-6 concrete ghatnaon ke vaakya hon jo kahani ko sequential kram me aage badhayein!
3. VOICE ME KABHI BHI "BHAG 2" YA ROBOTIC NUMBER MAT BOLO:
   - Part 1 ya beech ke parts ke aakhri scene me voice hamesha bolegi: "dekhiye agle video mein!" ya "iski poori sacchai dekhiye agle video mein!"
   - KABHI BHI voice me "dekhiye bhaag 2" mat bolo!
4. HAR PART KA DHANCHE (Structure):
   - Part 1: Dhamakedar Hook (jisme kahani ke nayak/vishay ka naam saaf ho) + Katha ka aarambh + Sankat khada hona + Suspenseful ending: "...Lekin tabhi kya hua? Dekhiye agle video mein!"
   - Part 2+: Shuruat me 1 line recap connector + Asli sangharsh / katha ka vistaar + Ending: "...Lekin aage kya hua? Dekhiye agle video mein!"
   - Final Part: Chamatkar + Antim divya purnata aur sandesh.

OUTPUT: STRICTLY sirf ek valid JSON object (koi markdown nahi, koi backticks nahi, koi extra text nahi):
{{
  "topic_title": "{title}",
  "total_parts": 3,
  "story_synopsis": "3-4 lines Hindi me poori kahani ka saransh",
  "parts": [
    {{
      "part_num": 1,
      "part_title": "Hindi title with emoji (max 50 chars), e.g. द्वारका का वो अंतिम द्वार",
      "hook_line": "Scene 1 bolne wali line jisme nayak/mandir ka naam ho",
      "recap_bridge": "" (Part 1 ke liye empty, Part 2+ ke liye chhota recap connector),
      "cliffhanger": "Antim scene ka suspense: '...Lekin iske baad jo hua, usne sabko dang kar diya. Dekhiye agle video mein!'",
      "part_summary": "Is part ki detailed story (100-150 words): Patra, sthan, aur concrete ghatnayen jo 7-8 scenes me clearly sunai jayengi."
    }}
  ]
}}
"""


def load_series_state():
    """Load or initialize active series state."""
    default_state = {
        "current_index": 0,
        "active_topics": [],
        "completed_series": [],
        "total_series_completed": 0,
        "last_updated": str(datetime.datetime.now())
    }
    state = jload(STATE_FILE, default_state)
    if not isinstance(state, dict):
        state = default_state
    state.setdefault("current_index", 0)
    state.setdefault("active_topics", [])
    state.setdefault("completed_series", [])
    return state


def save_series_state(state):
    """Save active series state."""
    state["last_updated"] = str(datetime.datetime.now())
    jsave(STATE_FILE, state)


def generate_series_for_topic(topic):
    """Uses LLM to write a complete story and split into 2-4 sequential parts."""
    title = topic.get("title", str(topic)) if isinstance(topic, dict) else str(topic)
    summary = topic.get("summary", "") if isinstance(topic, dict) else ""
    topic_id = topic.get("topic") or re.sub(r"[^a-z0-9]+", "_", title.lower()).strip("_")

    prompt = SERIES_PROMPT.format(title=title, summary=summary)
    print(f"[SeriesManager] Generating multi-part series for: '{title}'...")

    for attempt in range(3):
        try:
            raw = llm._call(prompt, max_tokens=4000).strip()
            if "{" in raw and "}" in raw:
                raw = raw[raw.index("{"): raw.rindex("}") + 1]
            data = llm._salvage_json(raw)
            parts = data.get("parts")
            if not isinstance(parts, list) or len(parts) < 2:
                raise ValueError("Must have at least 2 parts")

            # Validate each part
            clean_parts = []
            for idx, p in enumerate(parts):
                clean_parts.append({
                    "part_num": idx + 1,
                    "part_title": str(p.get("part_title") or f"{title} - भाग {idx + 1}").strip(),
                    "hook_line": str(p.get("hook_line") or "").strip(),
                    "recap_bridge": str(p.get("recap_bridge") or "").strip(),
                    "cliffhanger": str(p.get("cliffhanger") or "").strip(),
                    "part_summary": str(p.get("part_summary") or "").strip(),
                    "completed": False,
                    "rendered_at": None,
                    "video_dir": None
                })

            series_obj = {
                "topic_id": topic_id,
                "topic_title": title,
                "story_synopsis": data.get("story_synopsis", summary),
                "total_parts": len(clean_parts),
                "current_part": 1,
                "created_at": str(datetime.datetime.now()),
                "parts": clean_parts
            }
            print(f"[SeriesManager] Successfully created {len(clean_parts)}-part series for '{title}'!")
            return series_obj
        except Exception as e:
            print(f"[SeriesManager] Attempt {attempt + 1} failed: {e}")

    # Fallback 2-part structure if LLM json fails
    fallback_parts = [
        {
            "part_num": 1,
            "part_title": f"{title} - भाग 1: रहस्य और संकट",
            "hook_line": f"{title} का वह रहस्य जो आज तक कोई नहीं जान सका।",
            "recap_bridge": "",
            "cliffhanger": "लेकिन इसके बाद जो हुआ, उसने सबको चौंका दिया। देखिए भाग 2 में!",
            "part_summary": f"{title}: कथा की शुरुआत और प्रथम अध्याय। {summary}",
            "completed": False,
            "rendered_at": None,
            "video_dir": None
        },
        {
            "part_num": 2,
            "part_title": f"{title} - भाग 2: अंतिम चमत्कार",
            "hook_line": f"भाग 1 में आपने देखा {title} का संकट, अब देखिए अंतिम विजय।",
            "recap_bridge": "भाग 1 में हमने देखा था संकट का आरंभ...",
            "cliffhanger": "यही था इस दिव्य कथा का अमर सत्य।",
            "part_summary": f"{title}: कथा का चरमोत्कर्ष, चमत्कार और अंतिम उपसंहार।",
            "completed": False,
            "rendered_at": None,
            "video_dir": None
        }
    ]
    return {
        "topic_id": topic_id,
        "topic_title": title,
        "story_synopsis": summary,
        "total_parts": 2,
        "current_part": 1,
        "created_at": str(datetime.datetime.now()),
        "parts": fallback_parts
    }


def ensure_active_pool(state, pool_size=3):
    """Guarantees that there are exactly `pool_size` active multi-part topics."""
    active = state.get("active_topics", [])
    existing_ids = {t["topic_id"] for t in active}
    for comp in state.get("completed_series", []):
        existing_ids.add(comp.get("topic_id"))

    while len(active) < pool_size:
        # Pick fresh myth topic that isn't currently active or recently completed
        new_topic = pick_myth_topic()
        tid = new_topic.get("topic") or re.sub(r"[^a-z0-9]+", "_", new_topic.get("title", "").lower()).strip("_")
        if tid in existing_ids:
            # force generate unique
            new_topic["topic"] = f"{tid}_{len(existing_ids) + 1}"

        series_obj = generate_series_for_topic(new_topic)
        active.append(series_obj)
        existing_ids.add(series_obj["topic_id"])
        print(f"[SeriesManager] Added '{series_obj['topic_title']}' ({series_obj['total_parts']} parts) to active pool (Active: {len(active)}/{pool_size})")

    state["active_topics"] = active
    save_series_state(state)
    return state


def get_next_slot(pool_size=3):
    """
    Returns the next active topic and part to render in round-robin order.
    Format returned: (topic_obj, part_obj, slot_info)
    """
    state = load_series_state()
    ensure_active_pool(state, pool_size=pool_size)

    active = state["active_topics"]
    if not active:
        raise RuntimeError("No active topics available")

    # Round-robin index safely wrapped
    idx = state.get("current_index", 0) % len(active)
    topic = active[idx]

    current_part_num = topic.get("current_part", 1)
    # Find the part object
    part = next((p for p in topic["parts"] if p["part_num"] == current_part_num), None)
    if not part:
        # All parts done for this topic
        part = topic["parts"][-1]

    slot_info = {
        "topic_index": idx,
        "topic_id": topic["topic_id"],
        "topic_title": topic["topic_title"],
        "current_part": current_part_num,
        "total_parts": topic["total_parts"],
        "active_pool_count": len(active),
        "is_final_part": current_part_num >= topic["total_parts"]
    }

    return topic, part, slot_info


def mark_slot_completed(topic_id, part_num, video_dir=None):
    """
    Marks the given part as completed.
    If that was the final part of the topic:
      - Moves topic to completed_series.
      - Removes it from active_topics.
      - Automatically fetches a fresh topic to keep 3 active.
    Advances round-robin pointer.
    """
    state = load_series_state()
    active = state.get("active_topics", [])

    matched_topic_idx = None
    for i, t in enumerate(active):
        if t["topic_id"] == topic_id:
            matched_topic_idx = i
            break

    if matched_topic_idx is None:
        print(f"[SeriesManager] Warning: Topic {topic_id} not found in active topics")
        return state

    topic = active[matched_topic_idx]
    # Mark part complete
    for p in topic["parts"]:
        if p["part_num"] == part_num:
            p["completed"] = True
            p["rendered_at"] = str(datetime.datetime.now())
            if video_dir:
                p["video_dir"] = str(video_dir)

    topic["current_part"] = part_num + 1

    # Check if topic is completely finished
    if topic["current_part"] > topic["total_parts"]:
        print(f"🎉 [SeriesManager] Series '{topic['topic_title']}' FULLY COMPLETED across all {topic['total_parts']} parts!")
        completed_entry = dict(topic)
        completed_entry["completed_at"] = str(datetime.datetime.now())
        state["completed_series"].append(completed_entry)
        state["total_series_completed"] = state.get("total_series_completed", 0) + 1
        active.pop(matched_topic_idx)
        print(f"[SeriesManager] Removed '{topic['topic_title']}' from active topics.")
        # Advance index without skipping since one element was popped
        if active:
            state["current_index"] = matched_topic_idx % len(active)
    else:
        # Still has pending parts: advance to the next active topic for round-robin rotation
        state["current_index"] = (matched_topic_idx + 1) % len(active)

    state["active_topics"] = active
    # Ensure active pool is refilled to 3 topics immediately
    ensure_active_pool(state, pool_size=3)
    save_series_state(state)
    return state


def print_active_series_status():
    """Prints a clear overview of active series and their parts."""
    state = load_series_state()
    active = state.get("active_topics", [])
    print("=" * 60)
    print("📺 MINDSPARK ACTIVE 3-TOPIC ROTATION STATUS")
    print("=" * 60)
    print(f"Next Topic Up: Slot #{state.get('current_index', 0) + 1}")
    for idx, t in enumerate(active):
        pointer = "👉 " if idx == state.get("current_index", 0) else "   "
        done_parts = sum(1 for p in t["parts"] if p.get("completed"))
        print(f"{pointer}Slot {idx + 1}: {t['topic_title']}")
        print(f"       Progress: Part {t['current_part']}/{t['total_parts']} (Done: {done_parts}/{t['total_parts']})")
        for p in t["parts"]:
            status_icon = "✅" if p.get("completed") else "⏳"
            print(f"         {status_icon} Part {p['part_num']}: {p['part_title']}")
    print(f"\nTotal Series Completed So Far: {len(state.get('completed_series', []))}")
    print("=" * 60)
