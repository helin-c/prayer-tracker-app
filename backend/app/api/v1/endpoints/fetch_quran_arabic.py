import json
import requests
from pathlib import Path

# AlQuran Cloud endpoint (Arapça Uthmani mushaf)
API_URL = "https://api.alquran.cloud/v1/quran/quran-uthmani"

# Çıkış dosyası (nerede olsun istiyorsan yolu değiştir)
OUTPUT_PATH = Path("quran_uthmani.json")


def fetch_quran():
    print(f"📥 Fetching full Quran from: {API_URL}")

    response = requests.get(API_URL)
    try:
        response.raise_for_status()
    except requests.HTTPError as e:
        print("❌ HTTP error:", e)
        print("Response text:", response.text[:500])
        return

    data = response.json()

    if data.get("code") != 200:
        print("❌ API error:", data.get("status"))
        return

    # Beklenen yapı:
    # {
    #   "code": 200,
    #   "status": "OK",
    #   "data": {
    #     "surahs": [
    #       {
    #         "number": 1,
    #         "name": "الفاتحة",
    #         "englishName": "Al-Faatiha",
    #         "englishNameTranslation": "The Opening",
    #         "revelationType": "Meccan",
    #         "ayahs": [
    #           {
    #             "number": 1,
    #             "numberInSurah": 1,
    #             "juz": 1,
    #             "page": 1,
    #             "text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    #             ...
    #           }, ...
    #         ]
    #       }, ...
    #     ]
    #   }
    # }

    surahs_raw = data.get("data", {}).get("surahs", [])

    simplified = {
        "meta": {
            "source": "api.alquran.cloud",
            "edition": "quran-uthmani",
            "description": "Full Quran Arabic text (Uthmani script)",
        },
        "surahs": [],
    }

    for s in surahs_raw:
        surah_obj = {
            "number": s.get("number"),            # 1..114
            "name_ar": s.get("name"),             # Arabic name: الفاتحة
            "name_en": s.get("englishName"),      # English name
            "name_en_translation": s.get("englishNameTranslation"),
            "revelation_type": s.get("revelationType"),  # Meccan / Medinan
            "ayahs": [],
        }

        for a in s.get("ayahs", []):
            ayah_obj = {
                "global_number": a.get("number"),          # 1..6236
                "number_in_surah": a.get("numberInSurah"), # ayet no (1,2,...)
                "juz": a.get("juz"),
                "page": a.get("page"),
                "text_ar": a.get("text"),                  # 🔹 ASIL ARAPÇA METİN
            }
            surah_obj["ayahs"].append(ayah_obj)

        simplified["surahs"].append(surah_obj)

    # JSON dosyaya yaz
    OUTPUT_PATH.write_text(
        json.dumps(simplified, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"✅ Quran saved to {OUTPUT_PATH.absolute()}")
    print(f"📦 Total surahs: {len(simplified['surahs'])}")
    total_ayahs = sum(len(s['ayahs']) for s in simplified['surahs'])
    print(f"📦 Total ayahs: {total_ayahs}")


if __name__ == "__main__":
    fetch_quran()
