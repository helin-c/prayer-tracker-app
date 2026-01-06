import WidgetKit
import SwiftUI

// MARK: - Entry
struct FriendStreaksEntry: TimelineEntry {
    let date: Date
    let data: FriendStreaksData
}

// MARK: - Provider with Smart Timeline
struct FriendStreaksProvider: TimelineProvider {
    
    // 1. Placeholder
    func placeholder(in context: Context) -> FriendStreaksEntry {
        FriendStreaksEntry(
            date: Date(),
            data: FriendStreaksData(
                friends: [
                    Friend(name: "Ahmed Ali", streak: 15, initials: "AA"),
                    Friend(name: "Fatima Hassan", streak: 12, initials: "FH"),
                    Friend(name: "Omar Ibrahim", streak: 8, initials: "OI")
                ],
                totalFriends: 3,
                lastUpdate: Date()
            )
        )
    }
    
    // 2. Snapshot
    func getSnapshot(in context: Context, completion: @escaping (FriendStreaksEntry) -> ()) {
        // Load actual data for the snapshot
        let entry = FriendStreaksEntry(date: Date(), data: FriendStreaksData.load())
        completion(entry)
    }
    
    // 3. Timeline (The Core Logic)
    func getTimeline(in context: Context, completion: @escaping (Timeline<FriendStreaksEntry>) -> ()) {
        let currentDate = Date()
        let calendar = Calendar.current
        
        // ✅ Load current data from shared file
        let data = FriendStreaksData.load()
        let dataDate = data.lastUpdate
        let isToday = calendar.isDateInToday(dataDate)
        
        // ✅ Create entry
        let entry = FriendStreaksEntry(date: currentDate, data: data)
        
        // ✅ SMART TIMELINE POLICY
        var nextUpdate: Date
        
        if isToday {
            // CASE A: Data is fresh (from today).
            // Friend streaks typically update once a day. We can safely wait until tomorrow midnight.
            // However, to be safe against mid-day friend additions, we can set a relaxed interval
            // like 4-6 hours, OR just stick to midnight if your app pushes updates via WidgetCenter.reloadAllTimelines().
            // Let's stick to Midnight + 1 hour as a failsafe, relying on the main app to push updates sooner.
            let midnight = calendar.startOfDay(for: calendar.date(byAdding: .day, value: 1, to: currentDate)!)
            // Add a small buffer (e.g., 1 hour past midnight) to ensure backend processing time
            nextUpdate = calendar.date(byAdding: .hour, value: 1, to: midnight)!
            
            print("📅 Friend Streaks Widget: Data is current. Next auto-update scheduled for: \(nextUpdate)")
        } else {
            // CASE B: Data is stale (yesterday or older).
            // We need to refresh ASAP.
            nextUpdate = calendar.date(byAdding: .minute, value: 15, to: currentDate)!
            
            print("⚠️ Friend Streaks Widget: Data is old (\(dataDate)). Forcing refresh in 15 minutes.")
        }
        
        // ✅ Create timeline
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

// MARK: - Small Widget (158x158)
struct FriendStreaksSmallView: View {
    let entry: FriendStreaksEntry
    
    var body: some View {
        ZStack {
            WidgetBackground()
                .ignoresSafeArea()
            
            if entry.data.friends.isEmpty {
                VStack(spacing: 6) {
                    Image(systemName: "person.2.fill")
                        .font(.system(size: 30))
                        .foregroundColor(.widgetPrimary.opacity(0.5))
                    
                    // Localized "No Friends Yet"
                    Text(WidgetLocalization.shared.translate("no_friends_yet"))
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(.widgetTextSecondary)
                        .multilineTextAlignment(.center)
                }
                .padding()
            } else {
                VStack(spacing: 5) {
                    // Localized "TOP FRIEND"
                    Text(WidgetLocalization.shared.translate("top_friend").uppercased())
                        .font(.system(size: 6, weight: .bold))
                        .foregroundColor(.widgetPrimary)
                        .tracking(0.3)
                    
                    Spacer()
                    
                    FriendAvatar(initials: entry.data.friends[0].initials, size: 44)
                    
                    Text(String(entry.data.friends[0].name.split(separator: " ").first ?? ""))
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.widgetText)
                        .lineLimit(1)
                    
                    StreakBadge(streak: entry.data.friends[0].streak)
                    
                    Spacer()
                    
                    // Localized "Friends" suffix
                    Text("\(entry.data.totalFriends) \(WidgetLocalization.shared.translate("friends"))")
                        .font(.system(size: 8, weight: .semibold))
                        .foregroundColor(.widgetTextSecondary)
                }
                .padding(14)
            }
        }
    }
}

// MARK: - Medium Widget (338x158)
struct FriendStreaksMediumView: View {
    let entry: FriendStreaksEntry
    
    var body: some View {
        ZStack {
            WidgetBackground()
                .ignoresSafeArea()
            
            if entry.data.friends.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "person.2.fill")
                        .font(.system(size: 36))
                        .foregroundColor(.widgetPrimary.opacity(0.5))
                    
                    // Localized "Add Friends"
                    Text(WidgetLocalization.shared.translate("add_friends"))
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.widgetText)
                    
                    // Localized Description
                    Text(WidgetLocalization.shared.translate("connect_friends_desc"))
                        .font(.system(size: 9, weight: .semibold))
                        .foregroundColor(.widgetTextSecondary)
                        .multilineTextAlignment(.center)
                }
                .padding()
            } else {
                VStack(spacing: 8) {
                    HStack {
                        // Localized "FRIEND STREAKS"
                        Text(WidgetLocalization.shared.translate("friend_streaks").uppercased())
                            .font(.system(size: 6, weight: .bold))
                            .foregroundColor(.widgetPrimary)
                            .tracking(0.3)
                        
                        Spacer()
                        
                        HStack(spacing: 2) {
                            Image(systemName: "person.2.fill")
                                .font(.system(size: 7))
                            Text("\(entry.data.totalFriends)")
                                .font(.system(size: 8, weight: .bold))
                        }
                        .foregroundColor(.widgetTextSecondary)
                    }
                    
                    ForEach(Array(entry.data.friends.prefix(3).enumerated()), id: \.element.name) { index, friend in
                        FriendRow(friend: friend, rank: index + 1)
                    }
                }
                .padding(14)
            }
        }
    }
}

// MARK: - Large Widget (338x354)
struct FriendStreaksLargeView: View {
    let entry: FriendStreaksEntry
    
    var body: some View {
        ZStack {
            WidgetBackground()
                .ignoresSafeArea()
            
            if entry.data.friends.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "person.2.fill")
                        .font(.system(size: 44))
                        .foregroundColor(.widgetPrimary.opacity(0.5))
                    
                    // Localized "Add Friends"
                    Text(WidgetLocalization.shared.translate("add_friends"))
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.widgetText)
                    
                    // Localized Long Description
                    Text(WidgetLocalization.shared.translate("connect_friends_desc_long"))
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(.widgetTextSecondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
            } else {
                VStack(spacing: 10) {
                    HStack {
                        // Localized "FRIEND STREAKS"
                        Text(WidgetLocalization.shared.translate("friend_streaks").uppercased())
                            .font(.system(size: 8, weight: .bold))
                            .foregroundColor(.widgetPrimary)
                            .tracking(0.3)
                        
                        Spacer()
                        
                        HStack(spacing: 4) {
                            Image(systemName: "person.2.fill")
                                .font(.system(size: 9))
                            // Localized "Friends" suffix
                            Text("\(entry.data.totalFriends) \(WidgetLocalization.shared.translate("friends"))")
                                .font(.system(size: 9, weight: .bold))
                        }
                        .foregroundColor(.widgetTextSecondary)
                    }
                    
                    if entry.data.friends.count >= 3 {
                        HStack(alignment: .bottom, spacing: 8) {
                            VStack(spacing: 4) {
                                Text("🥈")
                                    .font(.system(size: 16))
                                FriendAvatar(initials: entry.data.friends[1].initials, size: 36)
                                Text(String(entry.data.friends[1].name.split(separator: " ").first ?? ""))
                                    .font(.system(size: 9, weight: .bold))
                                    .foregroundColor(.widgetText)
                                    .lineLimit(1)
                                StreakBadge(streak: entry.data.friends[1].streak)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.bottom, 12)
                            
                            VStack(spacing: 5) {
                                Text("🏆")
                                    .font(.system(size: 22))
                                FriendAvatar(initials: entry.data.friends[0].initials, size: 48)
                                Text(String(entry.data.friends[0].name.split(separator: " ").first ?? ""))
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(.widgetText)
                                    .lineLimit(1)
                                StreakBadge(streak: entry.data.friends[0].streak)
                            }
                            .frame(maxWidth: .infinity)
                            
                            VStack(spacing: 3) {
                                Text("🥉")
                                    .font(.system(size: 14))
                                FriendAvatar(initials: entry.data.friends[2].initials, size: 32)
                                Text(String(entry.data.friends[2].name.split(separator: " ").first ?? ""))
                                    .font(.system(size: 8, weight: .bold))
                                    .foregroundColor(.widgetText)
                                    .lineLimit(1)
                                StreakBadge(streak: entry.data.friends[2].streak)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.bottom, 18)
                        }
                    }
                    
                    VStack(spacing: 6) {
                        ForEach(Array(entry.data.friends.enumerated()), id: \.element.name) { index, friend in
                            FriendRow(friend: friend, rank: index + 1, expanded: true)
                        }
                    }
                }
                .padding(14)
            }
        }
    }
}

// MARK: - Friend Row
struct FriendRow: View {
    let friend: Friend
    let rank: Int
    var expanded: Bool = false
    
    var body: some View {
        HStack(spacing: 8) {
            Text("\(rank)")
                .font(.system(size: expanded ? 12 : 10, weight: .bold))
                .foregroundColor(.widgetTextSecondary)
                .frame(width: 16)
            
            FriendAvatar(initials: friend.initials, size: expanded ? 32 : 28)
            
            VStack(alignment: .leading, spacing: 0) {
                Text(friend.name)
                    .font(.system(size: expanded ? 10 : 9, weight: .bold))
                    .foregroundColor(.widgetText)
                    .lineLimit(1)
                
                if expanded {
                    // Localized "Day X streak" -> "Day" + X + "streak"
                    Text("\(WidgetLocalization.shared.translate("day")) \(friend.streak) \(WidgetLocalization.shared.translate("streak").lowercased())")
                        .font(.system(size: 7, weight: .semibold))
                        .foregroundColor(.widgetTextSecondary)
                }
            }
            
            Spacer()
            
            StreakBadge(streak: friend.streak)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 7)
        .background(
            rank <= 3
            ? LinearGradient(
                colors: [Color.widgetPrimary.opacity(0.15), Color.widgetPrimary.opacity(0.08)],
                startPoint: .leading,
                endPoint: .trailing
            )
            : LinearGradient(colors: [Color.white.opacity(0.5), Color.white.opacity(0.3)], startPoint: .leading, endPoint: .trailing)
        )
        .cornerRadius(8)
    }
}

// MARK: - Widget Configuration
struct FriendStreaksWidget: Widget {
    let kind: String = "FriendStreaksWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: FriendStreaksProvider()) { entry in
            FriendStreaksWidgetView(entry: entry)
                .containerBackground(for: .widget) {
                    WidgetBackground()
                }
        }
        // Localized Display Name and Description
        .configurationDisplayName(WidgetLocalization.shared.translate("friend_streaks"))
        .description(WidgetLocalization.shared.translate("friend_streaks_desc"))
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Adaptive View
struct FriendStreaksWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: FriendStreaksEntry
    
    var body: some View {
        switch family {
        case .systemSmall:
            FriendStreaksSmallView(entry: entry)
        case .systemMedium:
            FriendStreaksMediumView(entry: entry)
        case .systemLarge:
            FriendStreaksLargeView(entry: entry)
        default:
            FriendStreaksSmallView(entry: entry)
        }
    }
}
