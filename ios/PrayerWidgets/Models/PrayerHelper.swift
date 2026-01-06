//  PrayerHelper.swift
//  MySalah
//
//  Created by Furkan Cinko on 3.01.2026.
//
import SwiftUI
struct PrayerHelper {
    
    // MARK: - Prayer Icons
    static func icon(for prayer: String) -> String {
        switch prayer.lowercased() {
        case "fajr": return "sunrise.fill"
        case "dhuhr": return "sun.max.fill"
        case "asr": return "cloud.sun.fill"
        case "maghrib": return "sunset.fill"
        case "isha": return "moon.stars.fill"
        default: return "moon.fill"
        }
    }
    
    // MARK: - Prayer Colors
    static func color(for prayer: String) -> Color {
        switch prayer.lowercased() {
        case "fajr": return Color(hex: "FF8C42")
        case "dhuhr": return Color(hex: "F39C12")
        case "asr": return Color(hex: "3498DB")
        case "maghrib": return Color(hex: "9B59B6")
        case "isha": return Color(hex: "5BA895")
        default: return Color(hex: "5BA895")
        }
    }
    
    // MARK: - Format Prayer Name
    static func formatName(_ prayer: String) -> String {
        prayer.prefix(1).uppercased() + prayer.dropFirst().lowercased()
    }
}
// MARK: - Color Extension
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6: (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
// MARK: - App Colors
extension Color {
    static let widgetPrimary = Color(hex: "5BA895")
    static let widgetBackground = Color(hex: "F0FFF4")
    static let widgetBackgroundSecondary = Color(hex: "E0F5EC")
    static let widgetText = Color(hex: "1A1A1A")
    static let widgetTextSecondary = Color(hex: "666666")
}
