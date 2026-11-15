"""Automated Myth & Folklore Topic Harvester for MindSpark.
Scrapes and discovers unique local deities, temple mysteries, regional folk heroes,
and puranic lore from Wikipedia, Reddit, and curated folklore repositories.

Usage:
    python scripts/harvest_myth_topics.py [--count N] [--source all|wikipedia|reddit|local] [--dry-run]
"""

import os
import re
import sys
import json
import random
import urllib.request
import urllib.parse
from pathlib import Path

# Add project root to path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

try:
    from dotenv import load_dotenv
    load_dotenv(ROOT / ".env")
except ImportError:
    pass

# Try importing LLM helper for high quality distillation
try:
    from src.llm import _call_groq, _call_relay
    HAS_LLM = True
except Exception:
    HAS_LLM = False

USER_AGENT = "MindSparkFolkloreBot/1.0 (https://github.com/ITvALA/youtube_autometion; educational mythology channel)"

# Rich seed themes for local Indian deities, temple mysteries, and regional folk legends
SEED_THEMES = [
    # Gujarat & Saurashtra Ni Rasdhar
    {"category": "gujarat_folk", "query": "Khodiyar", "fallback_title": "आई खोडियार और मगरमच्छ की सवारी", "fallback_topic": "aai_khodiyar_miracle", "fallback_summary": "जब भाई मेहरक को विषैले सर्प ने काटा, तो खोडियार माता ने मगरमच्छ पर सवार होकर सूर्योदय से पहले अमृत लाकर प्राणों की रक्षा की।"},
    {"category": "gujarat_folk", "query": "Mogal", "fallback_title": "आई मोगल का परचा और 12 हाथ की लाठी", "fallback_topic": "aai_mogal_parcha", "fallback_summary": "भगुडा धाम में अन्याय के विरुद्ध हुंकार भरते हुए आई मोगल ने अपनी 12 हाथ की लाठी से अत्याचारियों का घमंड चूर-चूर कर दिया।"},
    {"category": "gujarat_folk", "query": "Ashapura Mata", "fallback_title": "आशापुरा माता: कच्छ के जाडेजा कुल की रक्षक", "fallback_topic": "ashapura_mata_kutch", "fallback_summary": "माता नो मढ़ में विराजित आशापुरा देवी ने भक्तों की असंभव आशाओं को पूर्ण कर कच्छ के रेगिस्तान में असीम शक्ति का संचार किया।"},
    {"category": "gujarat_folk", "query": "Vatsaraj", "fallback_title": "वीर वाछरा दादा: गायों की रक्षा में शीश कटने पर भी लड़े", "fallback_topic": "veer_vachhara_dada", "fallback_summary": "शादी की वेदी छोड़कर गायों की रक्षा के लिए तलवार उठाने वाले वीर वाछरा दादा का धड़ सिर कटने के बाद भी दुश्मनों से लड़ता रहा।"},
    {"category": "gujarat_folk", "query": "Kadu Makrani", "fallback_title": "कादू मकराणी: जूनागढ़ के अत्याचारियों के खिलाफ अजेय मर्द", "fallback_topic": "kadu_makrani_girnar", "fallback_summary": "गिरनार की तलहटी में जूनागढ़ नवाब के अन्यायी कानूनों के खिलाफ गरीब किसानों के स्वाभिमान की रक्षा करने वाला दिलेर बागी।"},
    {"category": "gujarat_folk", "query": "Hothal Padamani", "fallback_title": "वीरांगना होथल पदमणी: कच्छ की अजेय अप्सरा-योद्धा", "fallback_topic": "hothal_padamani_kutch", "fallback_summary": "रणभूमि में बिजली की तरह तलवार चलाकर सेनापतियों को धूल चटाने वाली अद्वितीय क्षत्राणी वीरांगना होथल पदमणी की अमर शौर्य गाथा।"},
    
    # Rajasthan Folk Heroes & Lok Devtas
    {"category": "rajasthan_folk", "query": "Pabuji", "fallback_title": "पाबूजी राठौड़: देवल चारणी की गायों के लिए दिया बलिदान", "fallback_topic": "pabuji_rathore_sacrifice", "fallback_summary": "फेरे बीच में छोड़कर देवल माता की गायों को छुड़ाने के लिए युद्ध में कूदे लोकदेवता पाबूजी राठौड़ ने अपने वचनों के लिए प्राण न्यौछावर कर दिए।"},
    {"category": "rajasthan_folk", "query": "Ramdevji", "fallback_title": "बाबा रामदेवजी: रुणिचा के पीर और भैरव राक्षस का उद्धार", "fallback_topic": "baba_ramdevji_runicha", "fallback_summary": "रुणिचा में पाखंड और छुआछूत मिटाकर भैरव राक्षस का उद्धार करने वाले बाबा रामदेवजी की अलौकिक पर्चा गाथा।"},
    {"category": "rajasthan_folk", "query": "Karni Mata", "fallback_title": "करणी माता और देशनोक के सफेद चूहे", "fallback_topic": "karni_mata_deshnoke", "fallback_summary": "यमराज से अपने पुत्र को वापस लाकर चूहों (काबा) के रूप में अमर वंश देने वाली देशनोक की साक्षात आदिशक्ति करणी माता।"},
    {"category": "rajasthan_folk", "query": "Tejaji", "fallback_title": "वीर तेजाजी: नागदेव को दिया वचन और प्राणों की आहुति", "fallback_topic": "veer_tejaji_vachan", "fallback_summary": "युद्ध में घायल होने के बावजूद नागदेव को अपनी जीभ पर डसने का अवसर देकर सत्यवादी वचन की मर्यादा स्थापित करने वाले वीर तेजाजी।"},
    
    # Bundelkhand & Maratha Lore
    {"category": "warrior_lore", "query": "Alha-Udal", "fallback_title": "आल्हा-ऊदल: 52 लड़ाइयों में अजेय रहने वाले अमर बुंदेले", "fallback_topic": "aalha_udal_52_battles", "fallback_summary": "महोबा की रक्षा में पृथ्वीराज चौहान की विशाल सेना को ललकारने वाले अमर वीर आल्हा, जिन्हें माँ शारदा ने अमरता का वरदान दिया।"},
    {"category": "warrior_lore", "query": "Baji Prabhu Deshpande", "fallback_title": "बाजीप्रभु देशपांडे: पावनखिंड में 300 वीरों का महाबलिदान", "fallback_topic": "baji_prabhu_pawankhind", "fallback_summary": "जब तक शिवाजी महाराज विशालगढ़ नहीं पहुँचे, तब तक एक तंग घाटी में मुगलों की 4000 सेना को सीना तानकर रोकने वाले अमर वीर बाजीप्रभु।"},
    {"category": "warrior_lore", "query": "Hadi Rani", "fallback_title": "हाड़ी रानी का बलिदान: निशानी में शीश काटकर दे दिया", "fallback_topic": "hadi_rani_sheesh_daan", "fallback_summary": "युद्ध में जाते पति का मोह भंग करने के लिए नवविवाहिता हाड़ी रानी ने अपना ही सिर काटकर थाल में निशानी के रूप में भेज दिया।"},
    
    # Ancient Temple Mysteries & Sthala Puranas
    {"category": "temple_mysteries", "query": "Lepakshi Temple", "fallback_title": "लेपाक्षी मंदिर: हवा में झूलते 70 विशाल पाषाण स्तंभ", "fallback_topic": "lepakshi_hanging_pillar", "fallback_summary": "बिना किसी सहारे के जमीन से ऊपर हवा में झूलते पाषाण स्तंभ का वह रहस्य, जिसे आधुनिक विज्ञान भी आज तक नहीं सुलझा सका।"},
    {"category": "temple_mysteries", "query": "Padmanabhaswamy Temple", "fallback_title": "पद्मनाभस्वामी मंदिर: वॉल्ट बी का नाग-बंधन रहस्य", "fallback_topic": "padmanabhaswamy_vault_b", "fallback_summary": "तिरुवनंतपुरम के मंदिर का वह रहस्यमयी सातवां दरवाजा, जिसे केवल सिद्ध गरुड़ मंत्र से ही खोला जा सकता है।"},
    {"category": "temple_mysteries", "query": "Stambheshwar Mahadev", "fallback_title": "स्तंभेश्वर महादेव: दिन में दो बार समुद्र में विलीन होने वाला शिव मंदिर", "fallback_topic": "stambheshwar_mahadev_sea", "fallback_summary": "गुजरात के कावी कंबोई में स्थित वह अद्भुत शिवालय, जो समुद्र के ज्वार-भाटे में पूरी तरह जलमग्न होकर फिर प्रकट होता है।"},
    {"category": "temple_mysteries", "query": "Mehandipur Balaji", "fallback_title": "मेहंदीपुर बालाजी: बुरी शक्तियों और प्रेत बाधाओं से मुक्ति धाम", "fallback_topic": "mehandipur_balaji_miracle", "fallback_summary": "राजस्थान की अरावली पहाड़ियों में स्थित वह धाम, जहाँ बालाजी महाराज और प्रेतराज सरकार के दरबार में नकारात्मक शक्तियाँ कांप उठती हैं।"},
    {"category": "temple_mysteries", "query": "Brihadisvara Temple", "fallback_title": "तंजावुर का बृहदेश्वर मंदिर: दोपहर में भी कभी नहीं बनती जिसकी परछाई", "fallback_topic": "brihadisvara_shadow_mystery", "fallback_summary": "एक हजार वर्ष पूर्व बिना सीमेंट के 80 टन के अखंड ग्रेनाइट पत्थर से निर्मित शिखर का वह रहस्य, जिसकी जमीन पर छाया नहीं पड़ती।"},
    {"category": "temple_mysteries", "query": "Puri Jagannath", "fallback_title": "पुरी जगन्नाथ: हवा के विपरीत लहराती ध्वजा और महाप्रसाद का रहस्य", "fallback_topic": "puri_jagannath_mysteries", "fallback_summary": "समुद्र किनारे होने पर भी मंदिर में प्रवेश करते ही लहरों की आवाज बंद हो जाने और सात बर्तनों में भोजन का अद्भुत चमत्कार।"},
    
    # Hidden Puranic Episodes
    {"category": "puranic_hidden", "query": "Barbarika", "fallback_title": "खाटू श्याम जी (बर्बरीक): तीन बाणों से कुरुक्षेत्र जीतने वाला शीशदानी", "fallback_topic": "barbarika_khatu_shyam_sheesh", "fallback_summary": "तीन दिव्य बाणों से पूरा महाभारत युद्ध समाप्त करने की क्षमता रखने वाले वीर बर्बरीक ने श्रीकृष्ण के मांगने पर हंसते हुए शीश दान कर दिया।"},
    {"category": "puranic_hidden", "query": "Ghatotkacha", "fallback_title": "घटोत्कच का महापराक्रम: कर्ण की अमोघ शक्ति का बलिदान", "fallback_topic": "ghatotkacha_amogh_shakti", "fallback_summary": "कुरुक्षेत्र में रात्रि युद्ध में कौरव सेना पर आफत बनकर टूटे घटोत्कच ने अपने प्राण देकर अर्जुन के लिए रखी गई कर्ण की एकाघ्नी शक्ति को नष्ट किया।"},
    {"category": "puranic_hidden", "query": "Ashwatthama", "fallback_title": "अश्वत्थामा का मस्तक रत्न और चिरंजीवी होने का शाप", "fallback_topic": "ashwatthama_mani_curse", "fallback_summary": "अधर्म के बदले श्रीकृष्ण द्वारा माथे की अमर मणि छीनकर कलियुग के अंत तक घावों के साथ भटकने का भयानक शाप पाने वाले अश्वत्थामा।"},
    {"category": "puranic_hidden", "query": "Karna Vrishaketu", "fallback_title": "वृषकेतु: कर्ण का एकमात्र जीवित पुत्र जिसे अर्जुन ने पुत्र माना", "fallback_topic": "vrishaketu_karna_son", "fallback_summary": "महाभारत युद्ध के बाद जब अर्जुन को कर्ण की सच्चाई पता चली, तो उन्होंने कर्ण के अंतिम जीवित पुत्र वृषकेतु को गले लगाकर सारे अस्त्र-शस्त्र सिखाए।"},
    {"category": "puranic_hidden", "query": "Babruvahana", "fallback_title": "बब्रुवाहन: जब अर्जुन को अपने ही पुत्र के बाणों से वीरगति मिली", "fallback_topic": "babruvahana_arjuna_battle", "fallback_summary": "मणिपुर के राजा बब्रुवाहन ने अनजाने में अपने पिता अर्जुन को युद्ध में पराजित कर दिया, जिसे बाद में नागमणि से पुनर्जीवित किया गया।"}
]


def load_all_existing_topics():
    """Load all existing topic keys and normalized titles to avoid duplicates."""
    used_topics = set()
    used_titles = set()

    files = [
        ROOT / "data" / "myth_topics.json",
        ROOT / "data" / "myth_topics_extra.json",
        ROOT / "data" / "myth_history.json",
    ]
    for p in files:
        if p.exists():
            try:
                data = json.loads(p.read_text(encoding="utf-8"))
                if isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict):
                            t_id = item.get("topic") or item.get("topic_id")
                            t_title = item.get("title") or item.get("topic_title")
                            if t_id:
                                used_topics.add(str(t_id).strip().lower())
                            if t_title:
                                norm = re.sub(r"[^\w\s]", "", str(t_title).lower()).strip()
                                used_titles.add(norm)
            except Exception as e:
                print(f"[Harvester] Warning loading {p.name}: {e}")

    return used_topics, used_titles


def is_duplicate(candidate_topic, candidate_title, used_topics, used_titles):
    """Check if candidate topic is already in our repository."""
    t_id = candidate_topic.strip().lower()
    if t_id in used_topics:
        return True
    
    norm_title = re.sub(r"[^\w\s]", "", candidate_title.lower()).strip()
    if norm_title in used_titles:
        return True
        
    for ut in used_titles:
        # If words overlap heavily
        c_words = set(norm_title.split())
        u_words = set(ut.split())
        if len(c_words) >= 3 and len(u_words) >= 3:
            overlap = len(c_words & u_words) / max(len(c_words), len(u_words))
            if overlap > 0.75:
                return True
    return False


def fetch_wikipedia_summary(query, lang="hi"):
    """Fetch summary extract from Wikipedia API."""
    try:
        url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(query)}"
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            extract = data.get("extract", "")
            title = data.get("title", "")
            if extract and len(extract) > 40:
                return title, extract
    except Exception:
        pass
    return None, None


def fetch_reddit_posts(subreddit="hinduism", query="temple folklore", limit=10):
    """Fetch public interesting posts from Reddit without authentication."""
    try:
        encoded_q = urllib.parse.quote(query)
        url = f"https://www.reddit.com/r/{subreddit}/search.json?q={encoded_q}&restrict_sr=1&sort=top&limit={limit}"
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            posts = []
            for child in data.get("data", {}).get("children", []):
                p_data = child.get("data", {})
                title = p_data.get("title", "")
                selftext = p_data.get("selftext", "")
                ups = p_data.get("ups", 0)
                if ups >= 5 and len(title) > 15:
                    posts.append({"title": title, "text": selftext[:500]})
            return posts
    except Exception:
        return []


def distill_story_with_llm(raw_title, raw_context, fallback_item):
    """Use Groq or rule-based fallback to create a crisp MindSpark topic."""
    if not HAS_LLM or not os.getenv("GROQ_API_KEY"):
        return fallback_item

    prompt = f"""Tum ek expert Indian folklore and Sanatan mythology researcher ho.
Neeche diye gaye raw katha/topic ko MindSpark YouTube Shorts format me condense karo.

STRICT REQUIREMENTS:
1. 'title': Devanagari Hindi me ek dhamakedaar, suspenseful title (max 8-10 words) jisme asli paatra ka naam aur sankat ho.
2. 'topic': Unique english snake_case slug (jaise: 'aai_khodiyar_miracle').
3. 'summary': Exactly 1-2 short, punchy Hindi sentences (max 25 words). Koi meta-instruction ya lamba paragraph NAHI. Seedha katha ka chamatkar ya lalkaar.

RAW CONTEXT:
Title: {raw_title}
Text: {raw_context}

Return ONE valid JSON object only:
{{
  "title": "...",
  "topic": "...",
  "summary": "..."
}}
"""
    try:
        res = _call_groq(prompt) if os.getenv("GROQ_API_KEY") else _call_relay(prompt)
        res = res.strip()
        if "{" in res and "}" in res:
            res = res[res.index("{"):res.rindex("}") + 1]
            obj = json.loads(res)
            if obj.get("title") and obj.get("topic") and obj.get("summary"):
                # Clean prompt artifacts if any
                obj["title"] = str(obj["title"]).strip()
                obj["topic"] = re.sub(r"[^a-z0-9_]+", "", str(obj["topic"]).lower().strip())
                s = str(obj["summary"]).strip()
                s = re.sub(r"सिर्फ इसी.*$", "", s).strip()
                obj["summary"] = s
                return obj
    except Exception as e:
        print(f"[Harvester] LLM distillation failed ({e}), using curated seed.")

    return fallback_item


def harvest_topics(target_count=5, source="all", dry_run=False):
    """Harvest new unique mythology & folklore topics and add to myth_topics_extra.json."""
    used_topics, used_titles = load_all_existing_topics()
    print(f"[Harvester] Loaded {len(used_topics)} existing topic slugs and {len(used_titles)} titles.")

    harvested = []
    shuffled_seeds = list(SEED_THEMES)
    random.shuffle(shuffled_seeds)

    for item in shuffled_seeds:
        if len(harvested) >= target_count:
            break

        cand_topic = item["fallback_topic"]
        cand_title = item["fallback_title"]
        cand_summary = item["fallback_summary"]

        if is_duplicate(cand_topic, cand_title, used_topics, used_titles):
            continue

        raw_context = cand_summary
        wiki_title, wiki_extract = None, None
        
        # Try enrichment from Wikipedia if source permits
        if source in ("all", "wikipedia"):
            wiki_title, wiki_extract = fetch_wikipedia_summary(item["query"], lang="hi")
            if not wiki_extract:
                wiki_title, wiki_extract = fetch_wikipedia_summary(item["query"], lang="en")
            if wiki_extract:
                raw_context = f"{wiki_title}: {wiki_extract[:400]}"

        # Distill into clean topic
        distilled = distill_story_with_llm(
            raw_title=cand_title,
            raw_context=raw_context,
            fallback_item={
                "title": cand_title,
                "topic": cand_topic,
                "summary": cand_summary
            }
        )

        # Final check
        if not is_duplicate(distilled["topic"], distilled["title"], used_topics, used_titles):
            harvested.append(distilled)
            used_topics.add(distilled["topic"].lower())
            used_titles.add(re.sub(r"[^\w\s]", "", distilled["title"].lower()).strip())
            print(f"[Harvester] 🌟 Found New Topic ({len(harvested)}/{target_count}): {distilled['title']}")

    print(f"\n[Harvester] Total candidate topics harvested: {len(harvested)}")

    if not harvested:
        print("[Harvester] No new unique topics to add at this time.")
        return 0

    if dry_run:
        print("[Harvester] Dry-run enabled. The following topics would be added:")
        for t in harvested:
            print(f" - [{t['topic']}] {t['title']}\n   {t['summary']}")
        return len(harvested)

    # Persist to data/myth_topics_extra.json
    extra_path = ROOT / "data" / "myth_topics_extra.json"
    existing_data = []
    if extra_path.exists():
        try:
            existing_data = json.loads(extra_path.read_text(encoding="utf-8"))
        except Exception:
            existing_data = []

    existing_data.extend(harvested)
    with open(extra_path, "w", encoding="utf-8") as f:
        json.dump(existing_data, f, ensure_ascii=False, indent=2)

    print(f"[Harvester] ✅ Successfully appended {len(harvested)} new topics to {extra_path}!")
    print(f"[Harvester] New total topics in myth_topics_extra.json: {len(existing_data)}")
    return len(harvested)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Harvest Indian Mythology & Folklore Topics")
    parser.add_argument("--count", type=int, default=5, help="Number of new topics to harvest")
    parser.add_argument("--source", type=str, default="all", choices=["all", "wikipedia", "reddit", "local"], help="Source to query")
    parser.add_argument("--dry-run", action="store_true", help="Do not write to disk")
    args = parser.parse_args()

    count = harvest_topics(target_count=args.count, source=args.source, dry_run=args.dry_run)
    sys.exit(0 if count >= 0 else 1)
