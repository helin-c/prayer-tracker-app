//
//  PrayerHelper+Localization.swift
//  MySalah
//
//  Created by Furkan Cinko on 4.01.2026.
//

import Foundation
import SwiftUI

// MARK: - PrayerHelper Extension with Localization
extension PrayerHelper {
    
    // MARK: - Format Prayer Name with Localization
    static func localizedName(_ prayer: String) -> String {
        return WidgetLocalization.shared.prayerName(prayer)
    }
    
    // MARK: - Calculate Next Prayer
    static func calculateNextPrayer(from prayers: [PrayerTime]) -> (name: String, time: String) {
        guard !prayers.isEmpty else {
            return ("Fajr", "--:--")
        }
        
        let now = Date()
        let calendar = Calendar.current
        let currentHour = calendar.component(.hour, from: now)
        let currentMinute = calendar.component(.minute, from: now)
        let currentTimeInMinutes = currentHour * 60 + currentMinute
        
        // Find next prayer
        for prayer in prayers {
            let timeComponents = prayer.time.split(separator: ":")
            guard timeComponents.count == 2,
                  let hour = Int(timeComponents[0]),
                  let minute = Int(timeComponents[1]) else {
                continue
            }
            
            let prayerTimeInMinutes = hour * 60 + minute
            
            if prayerTimeInMinutes > currentTimeInMinutes {
                return (prayer.name, prayer.time)
            }
        }
        
        // If no prayer found (all prayers passed), return first prayer (Fajr) for tomorrow
        return (prayers[0].name, prayers[0].time)
    }
    
    // MARK: - Calculate Time Remaining
    static func calculateTimeRemaining(to prayerTime: String) -> String {
        let timeComponents = prayerTime.split(separator: ":")
        guard timeComponents.count == 2,
              let hour = Int(timeComponents[0]),
              let minute = Int(timeComponents[1]) else {
            return WidgetLocalization.shared.translate("calculating")
        }
        
        let now = Date()
        let calendar = Calendar.current
        
        var prayerDate = calendar.date(bySettingHour: hour, minute: minute, second: 0, of: now) ?? now
        
        // If prayer time is in the past, set it for tomorrow
        if prayerDate < now {
            prayerDate = calendar.date(byAdding: .day, value: 1, to: prayerDate) ?? prayerDate
        }
        
        let diff = calendar.dateComponents([.hour, .minute], from: now, to: prayerDate)
        
        guard let hours = diff.hour, let minutes = diff.minute else {
            return WidgetLocalization.shared.translate("calculating")
        }
        
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }
}
