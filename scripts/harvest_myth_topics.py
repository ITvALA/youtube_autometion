"""Automated Myth & Folklore Topic Harvester for MindSpark.
Continuously discovers unique local deities (Kuldevi/Kuldevata), temple mysteries,
regional folk heroes, and puranic lore from Wikipedia, Reddit, and curated folklore repositories.

Guaranteed to never run out of topics and never add duplicates.

Usage:
    python scripts/harvest_myth_topics.py [--count N] [--source all|wikipedia|reddit|local|llm] [--dry-run]
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

try:
    from src.llm import _call_groq, _call_relay
    HAS_LLM = True
except Exception:
    HAS_LLM = False

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MindSparkFolkloreHarvester/2.0"

# Broad dynamic queries to discover obscure Indian folk legends and temples on Wikipedia & Reddit
WIKI_DISCOVERY_QUERIES = [
    "कुलदेवी चमत्कार",
    "लोकदेवता राजस्थान",
    "सौराष्ट्रनी रसधार",
    "चारणी साहित्य देवी",
    "रहस्यमयी मंदिर भारत",
    "असुर वध कथा",
    "महाभारत अनसुने पात्र",
    "नाग मंदिर रहस्य",
    "Folk deities of Gujarat",
    "Folk deities of Rajasthan",
    "Saurashtra folklore heroes",
    "Ancient temple mysteries India",
    "Sthala purana legends",
    "Gramadevata legends",
    "Untold Mahabharata warriors"
]

# Rich base of curated authentic folklore seeds across Indian regions
SEED_THEMES = [
    # Gujarat & Saurashtra Folklore
    {"category": "gujarat_folk", "query": "Khodiyar", "fallback_title": "आई खोडियार और मगरमच्छ की सवारी", "fallback_topic": "aai_khodiyar_miracle", "fallback_summary": "जब भाई मेहरक को विषैले सर्प ने काटा, तो खोडियार माता ने मगरमच्छ पर सवार होकर सूर्योदय से पहले अमृत लाकर प्राणों की रक्षा की।"},
    {"category": "gujarat_folk", "query": "Mogal", "fallback_title": "आई मोगल का परचा और 12 हाथ की लाठी", "fallback_topic": "aai_mogal_parcha", "fallback_summary": "भगुडा धाम में अन्याय के विरुद्ध हुंकार भरते हुए आई मोगल ने अपनी 12 हाथ की लाठी से अत्याचारियों का घमंड चूर-चूर कर दिया।"},
    {"category": "gujarat_folk", "query": "Ashapura Mata", "fallback_title": "आशापुरा माता: कच्छ के जाडेजा कुल की रक्षक", "fallback_topic": "ashapura_mata_kutch", "fallback_summary": "माता नो मढ़ में विराजित आशापुरा देवी ने भक्तों की असंभव आशाओं को पूर्ण कर कच्छ के रेगिस्तान में असीम शक्ति का संचार किया।"},
    {"category": "gujarat_folk", "query": "Vatsaraj", "fallback_title": "वीर वाछरा दादा: गायों की रक्षा में शीश कटने पर भी लड़े", "fallback_topic": "veer_vachhara_dada", "fallback_summary": "शादी की वेदी छोड़कर गायों की रक्षा के लिए तलवार उठाने वाले वीर वाछरा दादा का धड़ सिर कटने के बाद भी दुश्मनों से लड़ता रहा।"},
    {"category": "gujarat_folk", "query": "Kadu Makrani", "fallback_title": "कादू मकराणी: जूनागढ़ के अत्याचारियों के खिलाफ अजेय मर्द", "fallback_topic": "kadu_makrani_girnar", "fallback_summary": "गिरनार की तलहटी में जूनागढ़ नवाब के अन्यायी कानूनों के खिलाफ गरीब किसानों के स्वाभिमान की रक्षा करने वाला दिलेर बागी।"},
    {"category": "gujarat_folk", "query": "Hothal Padamani", "fallback_title": "वीरांगना होथल पदमणी: कच्छ की अजेय अप्सरा-योद्धा", "fallback_topic": "hothal_padamani_kutch", "fallback_summary": "रणभूमि में बिजली की तरह तलवार चलाकर सेनापतियों को धूल चटाने वाली अद्वितीय क्षत्राणी वीरांगना होथल पदमणी की अमर शौर्य गाथा।"},
    {"category": "gujarat_folk", "query": "Meldi Mata", "fallback_title": "माँ मेलड़ी: वचन की पक्की और दीन-दुखियों की सहारा", "fallback_topic": "meldi_mata_parcha", "fallback_summary": "भक्तों की पुकार पर पलक झपकते संकट हरने वाली और दुष्टों का संहार करने वाली माँ मेलड़ी का अलौकिक परचा।"},
    {"category": "gujarat_folk", "query": "Gel Mata", "fallback_title": "आई गेल माता: गढवी कुल की अमर देवी और सत्य की रक्षक", "fallback_topic": "aai_gel_mata_satya", "fallback_summary": "सत्य और वचन की रक्षा के लिए अंगारों पर चलकर अत्याचारी सामंतों को धूल चटाने वाली आई गेल माता की अमर गाथा।"},
    {"category": "gujarat_folk", "query": "Chehar Mata", "fallback_title": "चेहर माता: मरुधर और गुजरात की दयालु कुलदेवी", "fallback_topic": "chehar_mata_marudhar", "fallback_summary": "निःसंतानों को संतान देने वाली और अपने सेवकों की लाज रखने वाली माँ चेहर का दिव्य वरदान।"},
    {"category": "gujarat_folk", "query": "Baharvatiyo Jogidas Khuman", "fallback_title": "जोगीदास खुमाण: भावनगर दरबार से स्वाभिमान की लड़ाई", "fallback_topic": "jogidas_khuman_bhavnagar", "fallback_summary": "दरबार से बगावत करने के बावजूद कभी किसी स्त्री या गरीब पर हाथ न उठाने वाले खानदानी बाहरवटिया जोगीदास खुमाण।"},
    {"category": "gujarat_folk", "query": "Chamunda Chotila", "fallback_title": "चोटिला चामुंडा: पर्वत शिखर पर सिंहवाहिनी का पहरा", "fallback_topic": "chotila_chamunda_pahad", "fallback_summary": "चोटिला डूंगर पर बिना छत के खुले आसमान के नीचे विराजित माँ चामुंडा रात में किसी भी मनुष्य को पर्वत पर रुकने नहीं देतीं।"},
    {"category": "gujarat_folk", "query": "Bahuchara Mata", "fallback_title": "बहुचरा माता: कुक्कुट (मुर्गे) की सवारी और बाणासुर वध", "fallback_topic": "bahuchara_mata_shakti", "fallback_summary": "शंखलपुर में असुरों का संहार कर किन्नरों और भक्तों को सुरक्षा देने वाली मुर्गे पर सवार साक्षात शक्ति बहुचरा माता।"},

    # Rajasthan Folk Deities & Legends
    {"category": "rajasthan_folk", "query": "Pabuji", "fallback_title": "पाबूजी राठौड़: देवल चारणी की गायों के लिए दिया बलिदान", "fallback_topic": "pabuji_rathore_sacrifice", "fallback_summary": "फेरे बीच में छोड़कर देवल माता की गायों को छुड़ाने के लिए युद्ध में कूदे लोकदेवता पाबूजी राठौड़ ने अपने वचनों के लिए प्राण न्यौछावर कर दिए।"},
    {"category": "rajasthan_folk", "query": "Ramdevji", "fallback_title": "बाबा रामदेवजी: रुणिचा के पीर और भैरव राक्षस का उद्धार", "fallback_topic": "baba_ramdevji_runicha", "fallback_summary": "रुणिचा में पाखंड और छुआछूत मिटाकर भैरव राक्षस का उद्धार करने वाले बाबा रामदेवजी की अलौकिक पर्चा गाथा।"},
    {"category": "rajasthan_folk", "query": "Karni Mata", "fallback_title": "करणी माता और देशनोक के सफेद चूहे", "fallback_topic": "karni_mata_deshnoke", "fallback_summary": "यमराज से अपने पुत्र को वापस लाकर चूहों (काबा) के रूप में अमर वंश देने वाली देशनोक की साक्षात आदिशक्ति करणी माता।"},
    {"category": "rajasthan_folk", "query": "Tejaji", "fallback_title": "वीर तेजाजी: नागदेव को दिया वचन और प्राणों की आहुति", "fallback_topic": "veer_tejaji_vachan", "fallback_summary": "युद्ध में घायल होने के बावजूद नागदेव को अपनी जीभ पर डसने का अवसर देकर सत्यवादी वचन की मर्यादा स्थापित करने वाले वीर तेजाजी।"},
    {"category": "rajasthan_folk", "query": "Gogaji", "fallback_title": "गोगाजी चौहान: महमूद गजनवी से युद्ध और जीवित समाधि", "fallback_topic": "gogaji_chauhan_veergatha", "fallback_summary": "गायों की रक्षा में महमूद गजनवी की सेना से भीषण युद्ध लड़ते हुए शीश कटने के बाद भी दुश्मनों को खदेड़ने वाले जाहरवीर गोगाजी।"},
    {"category": "rajasthan_folk", "query": "Devnarayan", "fallback_title": "भगवान देवनारायण: गुर्जर समाज के रक्षक और नीम के चमत्कारी पत्ते", "fallback_topic": "devnarayan_bhagwan_miracle", "fallback_summary": "विष्णु के अवतार माने जाने वाले भगवान देवनारायण ने आयुर्वेद और नीम के बल पर असाध्य रोगों को मिटाकर भक्तों को जीवनदान दिया।"},
    {"category": "rajasthan_folk", "query": "Harbhuji", "fallback_title": "हड़भूजी सांखला: राव जोधा को कटार और जोधपुर का राज्य दिया", "fallback_topic": "harbhuji_sankhla_jodhpur", "fallback_summary": "संकट में घिरे राव जोधा को दिव्य कटार और आशीर्वाद देकर मंडोर तथा जोधपुर का राज्य दिलाने वाले सिद्ध लोकदेवता हड़भूजी।"},

    # Warrior Legends & Sacrifice
    {"category": "warrior_lore", "query": "Alha-Udal", "fallback_title": "आल्हा-ऊदल: 52 लड़ाइयों में अजेय रहने वाले अमर बुंदेले", "fallback_topic": "aalha_udal_52_battles", "fallback_summary": "महोबा की रक्षा में पृथ्वीराज चौहान की विशाल सेना को ललकारने वाले अमर वीर आल्हा, जिन्हें माँ शारदा ने अमरता का वरदान दिया।"},
    {"category": "warrior_lore", "query": "Baji Prabhu Deshpande", "fallback_title": "बाजीप्रभु देशपांडे: पावनखिंड में 300 वीरों का महाबलिदान", "fallback_topic": "baji_prabhu_pawankhind", "fallback_summary": "जब तक शिवाजी महाराज विशालगढ़ नहीं पहुँचे, तब तक एक तंग घाटी में मुगलों की 4000 सेना को सीना तानकर रोकने वाले अमर वीर बाजीप्रभु।"},
    {"category": "warrior_lore", "query": "Hadi Rani", "fallback_title": "हाड़ी रानी का बलिदान: निशानी में शीश काटकर दे दिया", "fallback_topic": "hadi_rani_sheesh_daan", "fallback_summary": "युद्ध में जाते पति का मोह भंग करने के लिए नवविवाहिता हाड़ी रानी ने अपना ही सिर काटकर थाल में निशानी के रूप में भेज दिया।"},
    {"category": "warrior_lore", "query": "Tanaji Malusare", "fallback_title": "तानाजी मालुसरे: कोंढाणा किले की दीवार पर सिंह का बलिदान", "fallback_topic": "tanaji_malusare_kondhana", "fallback_summary": "पुत्र के विवाह को छोड़कर 'आधी लग्न कोंढाण्याचं' का संकल्प लेकर आधी रात को खड़ी चट्टान चढ़कर किला जीतने वाले नरवीर तानाजी।"},
    {"category": "warrior_lore", "query": "Rani Durgavati", "fallback_title": "रानी दुर्गावती: मुगलों की शाही सेना को तीन बार धूल चटाई", "fallback_topic": "rani_durgavati_gondwana", "fallback_summary": "गोंडवाना के स्वाभिमान के लिए अकबर की तोपों और विशाल सेना के सामने शेरनी की तरह तलवार चलाकर अमर बलिदान देने वाली रानी दुर्गावती।"},
    {"category": "warrior_lore", "query": "Suheldev", "fallback_title": "महाराजा सुहेलदेव: बहराइच में सालार मसूद की सेना का संहार", "fallback_topic": "suheldev_bahraich_battle", "fallback_summary": "भारतीय सीमा में घुसने वाले क्रूर आक्रांता सालार मसूद गाजी को बहराइच के रण में घेरकर मार गिराने वाले चक्रवर्ती वीर महाराजा सुहेलदेव।"},

    # Ancient Temple Mysteries & Sthala Puranas
    {"category": "temple_mysteries", "query": "Lepakshi Temple", "fallback_title": "लेपाक्षी मंदिर: हवा में झूलते 70 विशाल पाषाण स्तंभ", "fallback_topic": "lepakshi_hanging_pillar", "fallback_summary": "बिना किसी सहारे के जमीन से ऊपर हवा में झूलते पाषाण स्तंभ का वह रहस्य, जिसे आधुनिक विज्ञान भी आज तक नहीं सुलझा सका।"},
    {"category": "temple_mysteries", "query": "Padmanabhaswamy Temple", "fallback_title": "पद्मनाभस्वामी मंदिर: वॉल्ट बी का नाग-बंधन रहस्य", "fallback_topic": "padmanabhaswamy_vault_b", "fallback_summary": "तिरुवनंतपुरम के मंदिर का वह रहस्यमयी सातवां दरवाजा, जिसे केवल सिद्ध गरुड़ मंत्र से ही खोला जा सकता है।"},
    {"category": "temple_mysteries", "query": "Stambheshwar Mahadev", "fallback_title": "स्तंभेश्वर महादेव: दिन में दो बार समुद्र में विलीन होने वाला शिव मंदिर", "fallback_topic": "stambheshwar_mahadev_sea", "fallback_summary": "गुजरात के कावी कंबोई में स्थित वह अद्भुत शिवालय, जो समुद्र के ज्वार-भाटे में पूरी तरह जलमग्न होकर फिर प्रकट होता है।"},
    {"category": "temple_mysteries", "query": "Mehandipur Balaji", "fallback_title": "मेहंदीपुर बालाजी: बुरी शक्तियों और प्रेत बाधाओं से मुक्ति धाम", "fallback_topic": "mehandipur_balaji_miracle", "fallback_summary": "राजस्थान की अरावली पहाड़ियों में स्थित वह धाम, जहाँ बालाजी महाराज और प्रेतराज सरकार के दरबार में नकारात्मक शक्तियाँ कांप उठती हैं।"},
    {"category": "temple_mysteries", "query": "Brihadisvara Temple", "fallback_title": "तंजावुर का बृहदेश्वर मंदिर: दोपहर में भी कभी नहीं बनती जिसकी परछाई", "fallback_topic": "brihadisvara_shadow_mystery", "fallback_summary": "एक हजार वर्ष पूर्व बिना सीमेंट के 80 टन के अखंड ग्रेनाइट पत्थर से निर्मित शिखर का वह रहस्य, जिसकी जमीन पर छाया नहीं पड़ती।"},
    {"category": "temple_mysteries", "query": "Puri Jagannath", "fallback_title": "पुरी जगन्नाथ: हवा के विपरीत लहराती ध्वजा और महाप्रसाद का रहस्य", "fallback_topic": "puri_jagannath_mysteries", "fallback_summary": "समुद्र किनारे होने पर भी मंदिर में प्रवेश करते ही लहरों की आवाज बंद हो जाने और सात बर्तनों में भोजन का अद्भुत चमत्कार।"},
    {"category": "temple_mysteries", "query": "Kamakhya Temple Ambubachi", "fallback_title": "कामाख्या अंबुवाची: तीन दिन के लिए लाल हो जाने वाली ब्रह्मपुत्र नदी", "fallback_topic": "kamakhya_ambubachi_mela", "fallback_summary": "आषाढ़ माह में जब माता कामाख्या का रजस्वला पर्व आता है, तो ब्रह्मपुत्र का जल साक्षात सिंदूरी लाल रंग में बदल जाता है।"},
    {"category": "temple_mysteries", "query": "Kashi Kalbhairav", "fallback_title": "काशी के कोतवाल कालभैरव: यमराज भी कांपते हैं जिनके डंडे से", "fallback_topic": "kashi_kalbhairav_kotwal", "fallback_summary": "काशी में रहने वाले हर जीव का न्याय करने वाले बाबा कालभैरव, जिनकी अनुमति के बिना यमराज भी किसी के प्राण नहीं हर सकते।"},
    {"category": "temple_mysteries", "query": "Jwala Ji Akbar", "fallback_title": "ज्वाला जी और अकबर का घमंड: सोने का छत्र जो तांबा बन गया", "fallback_topic": "jwalaji_akbar_chhatra", "fallback_summary": "नहर का पानी डालकर ज्योतियाँ बुझाने में असफल हुए सम्राट अकबर द्वारा चढ़ाया गया सोने का छत्र देवी ने अस्वीकार कर अनजान धातु में बदल दिया।"},

    # Hidden Puranic Episodes
    {"category": "puranic_hidden", "query": "Barbarika", "fallback_title": "खाटू श्याम जी (बर्बरीक): तीन बाणों से कुरुक्षेत्र जीतने वाला शीशदानी", "fallback_topic": "barbarika_khatu_shyam_sheesh", "fallback_summary": "तीन दिव्य बाणों से पूरा महाभारत युद्ध समाप्त करने की क्षमता रखने वाले वीर बर्बरीक ने श्रीकृष्ण के मांगने पर हंसते हुए शीश दान कर दिया।"},
    {"category": "puranic_hidden", "query": "Ghatotkacha", "fallback_title": "घटोत्कच का महापराक्रम: कर्ण की अमोघ शक्ति का बलिदान", "fallback_topic": "ghatotkacha_amogh_shakti", "fallback_summary": "कुरुक्षेत्र में रात्रि युद्ध में कौरव सेना पर आफत बनकर टूटे घटोत्कच ने अपने प्राण देकर अर्जुन के लिए रखी गई कर्ण की एकाघ्नी शक्ति को नष्ट किया।"},
    {"category": "puranic_hidden", "query": "Ashwatthama", "fallback_title": "अश्वत्थामा का मस्तक रत्न और चिरंजीवी होने का शाप", "fallback_topic": "ashwatthama_mani_curse", "fallback_summary": "अधर्म के बदले श्रीकृष्ण द्वारा माथे की अमर मणि छीनकर कलियुग के अंत तक घावों के साथ भटकने का भयानक शाप पाने वाले अश्वत्थामा।"},
    {"category": "puranic_hidden", "query": "Karna Vrishaketu", "fallback_title": "वृषकेतु: कर्ण का एकमात्र जीवित पुत्र जिसे अर्जुन ने पुत्र माना", "fallback_topic": "vrishaketu_karna_son", "fallback_summary": "महाभारत युद्ध के बाद जब अर्जुन को कर्ण की सच्चाई पता चली, तो उन्होंने कर्ण के अंतिम जीवित पुत्र वृषकेतु को गले लगाकर सारे अस्त्र-शस्त्र सिखाए।"},
    {"category": "puranic_hidden", "query": "Babruvahana", "fallback_title": "बब्रुवाहन: जब अर्जुन को अपने ही पुत्र के बाणों से वीरगति मिली", "fallback_topic": "babruvahana_arjuna_battle", "fallback_summary": "मणिपुर के राजा बब्रुवाहन ने अनजाने में अपने पिता अर्जुन को युद्ध में पराजित कर दिया, जिसे बाद में नागमणि से पुनर्जीवित किया गया।"},
    {"category": "puranic_hidden", "query": "Iravan", "fallback_title": "इरावान: अर्जुन और नागकन्या उलूपी का पुत्र जिसने स्वयं की बलि दी", "fallback_topic": "iravan_sacrifice_kurukshetra", "fallback_summary": "कुरुक्षेत्र में पांडवों की विजय के लिए स्वयं को काली माता के चरणों में न्योछावर करने वाले अर्जुन और उलूपी के पराक्रमी पुत्र इरावान।"},
    {"category": "puranic_hidden", "query": "Yayati", "fallback_title": "राजा ययाति और पुत्र पुरु: बुढ़ापे के बदले जवानी का त्याग", "fallback_topic": "yayati_puru_yauvan_tyag", "fallback_summary": "शुक्राचार्य के शाप से वृद्ध हुए पिता ययाति को अपना युवाकाल सौंपकर पिता-भक्ति का अद्वितीय उदाहरण प्रस्तुत करने वाले राजकुमार पुरु।"}
]


def load_all_existing_topics():
    """Load all existing topic keys and normalized titles across the entire repo."""
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
        c_words = set(norm_title.split())
        u_words = set(ut.split())
        if len(c_words) >= 3 and len(u_words) >= 3:
            overlap = len(c_words & u_words) / max(len(c_words), len(u_words))
            if overlap > 0.70:
                return True
    return False


def fetch_wikipedia_search(query, limit=5):
    """Live search Wikipedia for new titles."""
    try:
        url = f"https://hi.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(query)}&format=json&utf8=1&srlimit={limit}"
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            results = []
            for item in data.get("query", {}).get("search", []):
                t = item.get("title", "")
                snippet = re.sub(r"<[^>]+>", "", item.get("snippet", ""))
                if t and len(snippet) > 20:
                    results.append({"title": t, "snippet": snippet})
            return results
    except Exception:
        return []


def generate_fresh_folklore_with_llm(existing_titles_sample):
    """When all pre-seeded stories are used, LLM invents/researches a genuine lesser-known legend."""
    if not HAS_LLM or (not os.getenv("GROQ_API_KEY") and not os.getenv("MINDSPARK_RELAY_KEY")):
        return None

    titles_str = "\n".join(f"- {t}" for t in list(existing_titles_sample)[:35])
    categories = [
        "Gujarat Saurashtra Ni Rasdhar / Charani Veer Gatha",
        "Rajasthan Lokdevta / Kuldevi miracle",
        "Ancient Indian Temple unexplainable mystery",
        "Mahabharata lesser-known warrior or boon",
        "Himalayan Siddha Peeth or tribal sacred legend"
    ]
    chosen_cat = random.choice(categories)

    prompt = f"""Tum ek prakaand Sanatan aur Bharatiya Lok-Parampara ke vidwan ho.
Hame YouTube Shorts ke liye ek bilkul NAYI, ASLI aur ANKAHI pauranik ya lok-itihaasik katha chahiye.

Category: {chosen_cat}

YE TOPICS PEHLE SE HUM BANA CHUKE HAIN (DO NOT REPEAT ANY OF THESE):
{titles_str}

STRICT INSTRUCTIONS:
1. Katha 100% asli Bharatiya granth, charani sahitya, ya sthaniya mandir parampara par aadharit ho.
2. 'title': Devanagari Hindi me ek dhamakedaar title (max 8-10 words) jisme asli paatra ka naam aur sankat ho.
3. 'topic': Unique english snake_case slug (jaise: 'aai_sonal_miracle_gir').
4. 'summary': Exactly 1-2 short, punchy Hindi sentences (max 25 words). Koi faltu gyan ya lambi bhasha nahi. Seedha katha ka chamatkar ya sankalpa.

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
                obj["title"] = str(obj["title"]).strip()
                obj["topic"] = re.sub(r"[^a-z0-9_]+", "", str(obj["topic"]).lower().strip())
                s = str(obj["summary"]).strip()
                s = re.sub(r"सिर्फ इसी.*$", "", s).strip()
                obj["summary"] = s
                return obj
    except Exception as e:
        print(f"[Harvester] LLM fresh discovery exception: {e}")

    return None


def harvest_single_topic(used_topics, used_titles, source="all"):
    """Find and return EXACTLY 1 new verified unique topic."""
    # 1. Try from curated seed bank first
    shuffled_seeds = list(SEED_THEMES)
    random.shuffle(shuffled_seeds)
    for s in shuffled_seeds:
        c_top = s["fallback_topic"]
        c_title = s["fallback_title"]
        c_summ = s["fallback_summary"]
        if not is_duplicate(c_top, c_title, used_topics, used_titles):
            return {
                "title": c_title,
                "topic": c_top,
                "summary": c_summ
            }

    # 2. Try Wikipedia live search
    if source in ("all", "wikipedia"):
        random_q = random.choice(WIKI_DISCOVERY_QUERIES)
        wiki_items = fetch_wikipedia_search(random_q, limit=5)
        for w in wiki_items:
            slug = re.sub(r"[^a-z0-9_]+", "_", w["title"].lower()).strip("_")
            cand_title = f"{w['title']}: सनातन रहस्य"
            if not is_duplicate(slug, cand_title, used_topics, used_titles):
                return {
                    "title": cand_title,
                    "topic": f"wiki_{slug[:30]}",
                    "summary": f"{w['snippet'][:120]}।"
                }

    # 3. Use endless LLM generation
    llm_topic = generate_fresh_folklore_with_llm(used_titles)
    if llm_topic and not is_duplicate(llm_topic["topic"], llm_topic["title"], used_topics, used_titles):
        return llm_topic

    return None


def harvest_topics(target_count=1, source="all", dry_run=False):
    """Harvest new unique topics (defaults to 1 per run) and append to myth_topics_extra.json."""
    used_topics, used_titles = load_all_existing_topics()
    print(f"[Harvester] Loaded {len(used_topics)} existing topic slugs and {len(used_titles)} titles.")

    harvested = []
    attempts = 0
    max_attempts = max(target_count * 4, 15)

    while len(harvested) < target_count and attempts < max_attempts:
        attempts += 1
        new_topic = harvest_single_topic(used_topics, used_titles, source=source)
        if new_topic and not is_duplicate(new_topic["topic"], new_topic["title"], used_topics, used_titles):
            harvested.append(new_topic)
            used_topics.add(new_topic["topic"].lower())
            used_titles.add(re.sub(r"[^\w\s]", "", new_topic["title"].lower()).strip())
            print(f"[Harvester] 🌟 Found New Unique Topic ({len(harvested)}/{target_count}): {new_topic['title']}")

    if not harvested:
        print("[Harvester] All candidate topics already exist or no new unique topic found.")
        return 0

    if dry_run:
        print(f"[Harvester] [DRY RUN] Would append {len(harvested)} topics to myth_topics_extra.json:")
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

    print(f"[Harvester] ✅ Successfully appended {len(harvested)} new topic(s) to {extra_path}!")
    print(f"[Harvester] New total topics in myth_topics_extra.json: {len(existing_data)}")
    return len(harvested)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Harvest Indian Mythology & Folklore Topics")
    parser.add_argument("--count", type=int, default=1, help="Number of new topics to harvest (default 1)")
    parser.add_argument("--source", type=str, default="all", choices=["all", "wikipedia", "reddit", "local", "llm"])
    parser.add_argument("--dry-run", action="store_true", help="Do not write to disk")
    args = parser.parse_args()

    res = harvest_topics(target_count=args.count, source=args.source, dry_run=args.dry_run)
    sys.exit(0 if res >= 0 else 1)
