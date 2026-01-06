import Foundation
import WidgetKit

@objc(WidgetDataManager)
class WidgetDataManager: NSObject {
  
  static let appGroup = "group.com.furkancinko.mysalah"
  
  // MARK: - Update All Widgets
  @objc static func updateAllWidgets() {
    print("🔄 WidgetDataManager: Reloading all timelines")
    WidgetCenter.shared.reloadAllTimelines()
  }
  
  // MARK: - Save Language
  @objc static func saveLanguage(_ language: String) {
    print("🌐 Saving language: \(language)")
    
    guard let defaults = UserDefaults(suiteName: appGroup) else {
      print("❌ Failed to access app group: \(appGroup)")
      return
    }
    
    defaults.set(language, forKey: "app_language")
    defaults.synchronize()
    print("✅ Language saved to UserDefaults")
  }
  
  // MARK: - Save Next Prayer Data
  @objc static func saveNextPrayerData(_ data: [String: Any]) {
    print("📝 Saving Next Prayer: \(data)")
    
    guard let defaults = UserDefaults(suiteName: appGroup) else {
      print("❌ Failed to access app group: \(appGroup)")
      return
    }
    
    defaults.set(data["nextPrayer"] as? String, forKey: "nextPrayer")
    defaults.set(data["nextPrayerTime"] as? String, forKey: "nextPrayerTime")
    defaults.set(data["location"] as? String, forKey: "location")
    defaults.set(data["timeRemaining"] as? String, forKey: "timeRemaining")
    defaults.set(Date(), forKey: "nextPrayerLastUpdate")
    
    if let allPrayers = data["allPrayers"] as? [[String: Any]] {
      if let jsonData = try? JSONSerialization.data(withJSONObject: allPrayers) {
        defaults.set(jsonData, forKey: "allPrayers")
      }
    }
    
    defaults.synchronize()
    print("✅ Data saved, reloading NextPrayerWidget")
    WidgetCenter.shared.reloadTimelines(ofKind: "NextPrayerWidget")
  }
  
  // MARK: - Save Daily Progress Data
  @objc static func saveDailyProgressData(_ data: [String: Any]) {
    print("📝 Saving Daily Progress: \(data)")
    
    guard let defaults = UserDefaults(suiteName: appGroup) else {
      print("❌ Failed to access app group: \(appGroup)")
      return
    }
    
    defaults.set(data["completionPercentage"] as? Int, forKey: "completionPercentage")
    defaults.set(data["completedPrayers"] as? Int, forKey: "completedPrayers")
    defaults.set(data["totalPrayers"] as? Int, forKey: "totalPrayers")
    defaults.set(data["onTimePrayers"] as? Int, forKey: "onTimePrayers")
    defaults.set(data["currentStreak"] as? Int, forKey: "currentStreak")
    defaults.set(Date(), forKey: "progressLastUpdate")
    
    if let prayers = data["prayers"] as? [[String: Any]] {
      if let jsonData = try? JSONSerialization.data(withJSONObject: prayers) {
        defaults.set(jsonData, forKey: "prayerStatuses")
      }
    }
    
    defaults.synchronize()
    print("✅ Data saved, reloading DailyProgressWidget")
    WidgetCenter.shared.reloadTimelines(ofKind: "DailyProgressWidget")
  }
  
  // MARK: - Save Friend Streaks Data
  @objc static func saveFriendStreaksData(_ data: [String: Any]) {
    print("📝 Saving Friend Streaks: \(data)")
    
    guard let defaults = UserDefaults(suiteName: appGroup) else {
      print("❌ Failed to access app group: \(appGroup)")
      return
    }
    
    defaults.set(data["totalFriends"] as? Int, forKey: "totalFriends")
    defaults.set(Date(), forKey: "friendsLastUpdate")
    
    if let friends = data["friends"] as? [[String: Any]] {
      if let jsonData = try? JSONSerialization.data(withJSONObject: friends) {
        defaults.set(jsonData, forKey: "topFriends")
      }
    }
    
    defaults.synchronize()
    print("✅ Data saved, reloading FriendStreaksWidget")
    WidgetCenter.shared.reloadTimelines(ofKind: "FriendStreaksWidget")
  }
  
  // MARK: - React Native Bridge Methods
  @objc func updateNextPrayer(_ data: [String: Any]) {
    print("🌉 Bridge called: updateNextPrayer")
    WidgetDataManager.saveNextPrayerData(data)
  }
  
  @objc func updateDailyProgress(_ data: [String: Any]) {
    print("🌉 Bridge called: updateDailyProgress")
    WidgetDataManager.saveDailyProgressData(data)
  }
  
  @objc func updateFriendStreaks(_ data: [String: Any]) {
    print("🌉 Bridge called: updateFriendStreaks")
    WidgetDataManager.saveFriendStreaksData(data)
  }
  
  @objc func saveLanguage(_ language: String) {
    print("🌉 Bridge called: saveLanguage")
    WidgetDataManager.saveLanguage(language)
  }
  
  @objc func reloadAllWidgets() {
    print("🌉 Bridge called: reloadAllWidgets")
    WidgetDataManager.updateAllWidgets()
  }
}
