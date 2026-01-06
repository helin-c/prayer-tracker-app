//
//  WidgetData.swift
//  MySalah
//
//  Created by Furkan Cinko on 3.01.2026.
//

// ============================================================================
// FILE: ios/PrayerWidgets/Models/WidgetData.swift
// ============================================================================

import Foundation
import SwiftUI

// MARK: - Shared Data Models

struct NextPrayerData {
    let nextPrayer: String
    let nextPrayerTime: String
    let location: String
    let timeRemaining: String
    let allPrayers: [PrayerTime]
    let lastUpdate: Date
    
    static func load() -> NextPrayerData {
        let defaults = UserDefaults(suiteName: "group.com.furkancinko.mysalah")
        
        let nextPrayer = defaults?.string(forKey: "nextPrayer") ?? "Fajr"
        let nextPrayerTime = defaults?.string(forKey: "nextPrayerTime") ?? "--:--"
        let location = defaults?.string(forKey: "location") ?? "Unknown"
        let timeRemaining = defaults?.string(forKey: "timeRemaining") ?? "Calculating..."
        let lastUpdate = defaults?.object(forKey: "nextPrayerLastUpdate") as? Date ?? Date()
        
        var allPrayers: [PrayerTime] = []
        if let jsonData = defaults?.data(forKey: "allPrayers"),
           let prayersArray = try? JSONSerialization.jsonObject(with: jsonData) as? [[String: Any]] {
            allPrayers = prayersArray.compactMap { dict in
                guard let name = dict["name"] as? String,
                      let time = dict["time"] as? String else { return nil }
                return PrayerTime(name: name, time: time, icon: dict["icon"] as? String ?? "")
            }
        }
        
        return NextPrayerData(
            nextPrayer: nextPrayer,
            nextPrayerTime: nextPrayerTime,
            location: location,
            timeRemaining: timeRemaining,
            allPrayers: allPrayers,
            lastUpdate: lastUpdate
        )
    }
}

struct DailyProgressData {
    let completionPercentage: Int
    let completedPrayers: Int
    let totalPrayers: Int
    let onTimePrayers: Int
    let currentStreak: Int
    let prayers: [PrayerStatus]
    let lastUpdate: Date
    
    static func load() -> DailyProgressData {
        let defaults = UserDefaults(suiteName: "group.com.furkancinko.mysalah")
        
        let completionPercentage = defaults?.integer(forKey: "completionPercentage") ?? 0
        let completedPrayers = defaults?.integer(forKey: "completedPrayers") ?? 0
        let totalPrayers = defaults?.integer(forKey: "totalPrayers") ?? 5
        let onTimePrayers = defaults?.integer(forKey: "onTimePrayers") ?? 0
        let currentStreak = defaults?.integer(forKey: "currentStreak") ?? 0
        let lastUpdate = defaults?.object(forKey: "progressLastUpdate") as? Date ?? Date()
        
        var prayers: [PrayerStatus] = []
        if let jsonData = defaults?.data(forKey: "prayerStatuses"),
           let prayersArray = try? JSONSerialization.jsonObject(with: jsonData) as? [[String: Any]] {
            prayers = prayersArray.compactMap { dict in
                guard let name = dict["name"] as? String else { return nil }
                return PrayerStatus(
                    name: name,
                    completed: dict["completed"] as? Bool ?? false,
                    onTime: dict["onTime"] as? Bool ?? false
                )
            }
        }
        
        return DailyProgressData(
            completionPercentage: completionPercentage,
            completedPrayers: completedPrayers,
            totalPrayers: totalPrayers,
            onTimePrayers: onTimePrayers,
            currentStreak: currentStreak,
            prayers: prayers,
            lastUpdate: lastUpdate
        )
    }
}

struct FriendStreaksData {
    let friends: [Friend]
    let totalFriends: Int
    let lastUpdate: Date
    
    static func load() -> FriendStreaksData {
        let defaults = UserDefaults(suiteName: "group.com.furkancinko.mysalah")
        
        let totalFriends = defaults?.integer(forKey: "totalFriends") ?? 0
        let lastUpdate = defaults?.object(forKey: "friendsLastUpdate") as? Date ?? Date()
        
        var friends: [Friend] = []
        if let jsonData = defaults?.data(forKey: "topFriends"),
           let friendsArray = try? JSONSerialization.jsonObject(with: jsonData) as? [[String: Any]] {
            friends = friendsArray.compactMap { dict in
                guard let name = dict["name"] as? String,
                      let streak = dict["streak"] as? Int else { return nil }
                return Friend(
                    name: name,
                    streak: streak,
                    initials: dict["initials"] as? String ?? "?"
                )
            }
        }
        
        return FriendStreaksData(
            friends: friends,
            totalFriends: totalFriends,
            lastUpdate: lastUpdate
        )
    }
}

// MARK: - Supporting Models

struct PrayerTime {
    let name: String
    let time: String
    let icon: String
}

struct PrayerStatus {
    let name: String
    let completed: Bool
    let onTime: Bool
}

struct Friend {
    let name: String
    let streak: Int
    let initials: String
}
