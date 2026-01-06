// ============================================================================
// FILE 1: ios/PrayerWidgets/WidgetBundle.swift
// ============================================================================
//
//  WidgetBundle.swift
//  PrayerWidgets
//

import WidgetKit
import SwiftUI

@main
struct PrayerWidgetsBundle: WidgetBundle {
    var body: some Widget {
        CountdownWidget()
        NextPrayerWidget()
        DailyProgressWidget()
        FriendStreaksWidget()
    }
}
