//
//  WidgetLocalization.swift
//  MySalah
//
//  Created by Furkan Cinko on 5.01.2026.
//

import Foundation

// MARK: - Widget Localization Manager
struct WidgetLocalization {
    
    static let shared = WidgetLocalization()
    private let defaults = UserDefaults(suiteName: "group.com.furkancinko.mysalah")
    
    // MARK: - Get Current Language
    var currentLanguage: String {
        return defaults?.string(forKey: "app_language") ?? "en"
    }
    
    // MARK: - Prayer Name Translations
    func prayerName(_ key: String) -> String {
        let translations: [String: [String: String]] = [
            "en": [
                "fajr": "Fajr", "dhuhr": "Dhuhr", "asr": "Asr", "maghrib": "Maghrib", "isha": "Isha"
            ],
            "tr": [
                "fajr": "Sabah", "dhuhr": "Öğle", "asr": "İkindi", "maghrib": "Akşam", "isha": "Yatsı"
            ],
            "ar": [
                "fajr": "الفجر", "dhuhr": "الظهر", "asr": "العصر", "maghrib": "المغرب", "isha": "العشاء"
            ]
        ]
        
        let lang = currentLanguage
        return translations[lang]?[key.lowercased()] ?? key.capitalized
    }
    
    // MARK: - General Translations
    func translate(_ key: String) -> String {
        let translations: [String: [String: String]] = [
            "en": [
                "next_prayer": "NEXT PRAYER",
                "next": "NEXT",
                "today": "TODAY",
                "prayer_times": "PRAYER TIMES",
                "todays_progress": "TODAY'S PROGRESS",
                "prayers": "PRAYERS",
                "done": "Done",
                "streak": "Streak",
                "on_time": "On Time",
                "rate": "Rate",
                "completed": "Completed",
                "not_completed": "Not completed",
                "top_friend": "TOP FRIEND",
                "friend_streaks": "FRIEND STREAKS",
                "friends": "Friends",
                "no_friends_yet": "No Friends Yet",
                "add_friends": "Add Friends",
                "connect_friends": "Connect with friends to see their streaks",
                "connect_friends_desc": "Connect with friends to see their streaks",
                "connect_friends_desc_long": "Connect with friends to see their prayer streaks and stay motivated together",
                "day": "Day",
                "day_streak": "Day %d streak",
                "calculating": "Calculating...",
                "next_prayer_desc": "Shows your next prayer time and all daily prayers",
                "daily_progress_desc": "Track your daily prayer completion and streak",
                "friend_streaks_desc": "See your friends' prayer streaks and stay motivated",
                "daily_progress": "DAILY PROGRESS",
                // ✅ NEW KEYS
                "countdown_widget": "COUNTDOWN",
                "countdown_widget_desc": "Focuses on the time remaining until the next prayer.",
                "time_remaining": "TIME REMAINING"
            ],
            "tr": [
                "next_prayer": "SONRAKİ NAMAZ",
                "next": "SONRAKİ",
                "today": "BUGÜN",
                "prayer_times": "NAMAZ VAKİTLERİ",
                "todays_progress": "BUGÜNÜN İLERLEMESİ",
                "prayers": "NAMAZLAR",
                "done": "Tamamlandı",
                "streak": "Seri",
                "on_time": "Zamanında",
                "rate": "Oran",
                "completed": "Tamamlandı",
                "not_completed": "Tamamlanmadı",
                "top_friend": "EN İYİ ARKADAŞ",
                "friend_streaks": "ARKADAŞ SERİLERİ",
                "friends": "Arkadaşlar",
                "no_friends_yet": "Henüz Arkadaş Yok",
                "add_friends": "Arkadaş Ekle",
                "connect_friends": "Arkadaşlarınızın serilerini görmek için bağlanın",
                "connect_friends_desc": "Arkadaşlarınızın serilerini görmek için bağlanın",
                "connect_friends_desc_long": "Arkadaşlarınızla bağlanın, namaz serilerini görün ve birlikte motive olun",
                "day": "Gün",
                "day_streak": "%d günlük seri",
                "calculating": "Hesaplanıyor...",
                "next_prayer_desc": "Sonraki namaz vakti ve günlük tüm namazları gösterir",
                "daily_progress_desc": "Günlük namaz tamamlama ve serinizi takip edin",
                "friend_streaks_desc": "Arkadaşlarınızın namaz serilerini görün ve motive olun",
                "daily_progress": "GÜNLÜK İLERLEME",
                // ✅ NEW KEYS
                "countdown_widget": "GERİ SAYIM",
                "countdown_widget_desc": "Bir sonraki namaza kalan süreye odaklanır.",
                "time_remaining": "KALAN SÜRE"
            ],
            "ar": [
                "next_prayer": "الصلاة التالية",
                "next": "التالية",
                "today": "اليوم",
                "prayer_times": "أوقات الصلاة",
                "todays_progress": "تقدم اليوم",
                "prayers": "الصلوات",
                "done": "تم",
                "streak": "السلسلة",
                "on_time": "في الوقت",
                "rate": "النسبة",
                "completed": "مكتمل",
                "not_completed": "غير مكتمل",
                "top_friend": "أفضل صديق",
                "friend_streaks": "سلاسل الأصدقاء",
                "friends": "الأصدقاء",
                "no_friends_yet": "لا يوجد أصدقاء بعد",
                "add_friends": "إضافة أصدقاء",
                "connect_friends": "تواصل مع الأصدقاء لرؤية سلاسلهم",
                "connect_friends_desc": "تواصل مع الأصدقاء لرؤية سلاسلهم",
                "connect_friends_desc_long": "تواصل مع الأصدقاء لرؤية سلاسل صلاتهم وابق متحمسًا معًا",
                "day": "يوم",
                "day_streak": "سلسلة %d يوم",
                "calculating": "جاري الحساب...",
                "next_prayer_desc": "يعرض وقت صلاتك التالية وجميع الصلوات اليومية",
                "daily_progress_desc": "تتبع إكمال صلاتك اليومية وسلسلتك",
                "friend_streaks_desc": "شاهد سلاسل صلاة أصدقائك وابق متحمسًا",
                "daily_progress": "الإنجاز اليومي",
                // ✅ NEW KEYS
                "countdown_widget": "العد التنازلي",
                "countdown_widget_desc": "يركز على الوقت المتبقي حتى الصلاة التالية.",
                "time_remaining": "الوقت المتبقي"
            ]
        ]
        
        let lang = currentLanguage
        return translations[lang]?[key] ?? key
    }
}
