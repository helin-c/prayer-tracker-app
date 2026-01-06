import WidgetKit
import SwiftUI

// MARK: - Entry
struct DailyProgressEntry: TimelineEntry {
    let date: Date
    let data: DailyProgressData
}

// MARK: - Provider with Smart Timeline
struct DailyProgressProvider: TimelineProvider {
    
    // 1. Placeholder (Used in Gallery)
    func placeholder(in context: Context) -> DailyProgressEntry {
        DailyProgressEntry(
            date: Date(),
            data: DailyProgressData(
                completionPercentage: 80,
                completedPrayers: 4,
                totalPrayers: 5,
                onTimePrayers: 3,
                currentStreak: 7,
                prayers: [
                    PrayerStatus(name: "Fajr", completed: true, onTime: true),
                    PrayerStatus(name: "Dhuhr", completed: true, onTime: true),
                    PrayerStatus(name: "Asr", completed: true, onTime: false),
                    PrayerStatus(name: "Maghrib", completed: true, onTime: true),
                    PrayerStatus(name: "Isha", completed: false, onTime: false)
                ],
                lastUpdate: Date()
            )
        )
    }
    
    // 2. Snapshot (Used for preview)
    func getSnapshot(in context: Context, completion: @escaping (DailyProgressEntry) -> ()) {
        // Load data
        var data = DailyProgressData.load()
        
        // If snapshot data is stale (not today), show empty state to simulate "reset"
        if !Calendar.current.isDateInToday(data.lastUpdate) {
             // Create a dummy empty state preserving only maybe the streak if we had logic for it,
             // but for now, a clean slate is better than yesterday's full progress.
             data = DailyProgressData(
                completionPercentage: 0,
                completedPrayers: 0,
                totalPrayers: 5,
                onTimePrayers: 0,
                currentStreak: data.currentStreak, // Keep streak visual
                prayers: [],
                lastUpdate: Date()
             )
        }
        
        let entry = DailyProgressEntry(date: Date(), data: data)
        completion(entry)
    }
    
    // 3. Timeline (The Core Logic)
    func getTimeline(in context: Context, completion: @escaping (Timeline<DailyProgressEntry>) -> ()) {
        let currentDate = Date()
        let calendar = Calendar.current
        
        // ✅ Load current data from shared file
        var data = DailyProgressData.load()
        let dataDate = data.lastUpdate
        let isToday = calendar.isDateInToday(dataDate)
        
        // ✅ UI RESET LOGIC:
        // If the data on disk is from yesterday (or older), we should NOT show it as today's progress.
        // We inject a "reset" state so the widget shows 0% instead of lingering 100% from yesterday.
        if !isToday {
            print("📅 Daily Progress: Data is stale (\(dataDate)). Resetting UI to empty state.")
            data = DailyProgressData(
                completionPercentage: 0,
                completedPrayers: 0,
                totalPrayers: 5,
                onTimePrayers: 0,
                currentStreak: data.currentStreak, // Preserve streak number visually
                prayers: [],
                lastUpdate: currentDate
            )
        }
        
      
        let entry = DailyProgressEntry(date: currentDate, data: data)
        
        
        let tomorrowMidnight = calendar.startOfDay(for: calendar.date(byAdding: .day, value: 1, to: currentDate)!)
        
        print("📅 Daily Progress Widget: Next auto-refresh scheduled for midnight: \(tomorrowMidnight)")
        
        let timeline = Timeline(entries: [entry], policy: .after(tomorrowMidnight))
        completion(timeline)
    }
}

// MARK: - Helper to Check Data Freshness (Optional but good practice)
extension DailyProgressData {
    var isFresh: Bool {
        let calendar = Calendar.current
        return calendar.isDateInToday(lastUpdate)
    }
}

// MARK: - Small Widget (158x158)
struct DailyProgressSmallView: View {
    let entry: DailyProgressEntry
    
    var body: some View {
        ZStack {
            WidgetBackground()
                .ignoresSafeArea()
            
            VStack(spacing: 4) {
                // Localized Title
                Text(WidgetLocalization.shared.translate("todays_progress"))
                    .font(.system(size: 6, weight: .bold))
                    .foregroundColor(.widgetPrimary)
                    .tracking(0.3)
                
                Spacer()
                
                CircularProgressView(
                    percentage: entry.data.completionPercentage,
                    size: 70,
                    lineWidth: 8
                )
                
                Spacer()
                
                HStack(spacing: 8) {
                    VStack(spacing: 1) {
                        Text("\(entry.data.completedPrayers)")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.widgetText)
                        // Localized "Done"
                        Text(WidgetLocalization.shared.translate("done"))
                            .font(.system(size: 7, weight: .semibold))
                            .foregroundColor(.widgetTextSecondary)
                    }
                    
                    Divider()
                        .frame(height: 20)
                        .background(Color.widgetPrimary.opacity(0.3))
                    
                    VStack(spacing: 1) {
                        HStack(spacing: 2) {
                            Image(systemName: "flame.fill")
                                .font(.system(size: 10))
                                .foregroundColor(Color(hex: "FF8C42"))
                            Text("\(entry.data.currentStreak)")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(.widgetText)
                        }
                        // Localized "Streak"
                        Text(WidgetLocalization.shared.translate("streak"))
                            .font(.system(size: 7, weight: .semibold))
                            .foregroundColor(.widgetTextSecondary)
                    }
                }
            }
            .padding(14)
        }
    }
}

// MARK: - Medium Widget (338x158)
struct DailyProgressMediumView: View {
    let entry: DailyProgressEntry
    
    var body: some View {
        ZStack {
            WidgetBackground()
                .ignoresSafeArea()
            
            HStack(spacing: 0) {
                // LEFT SIDE (Progress)
                VStack(spacing: 4) {
                    // Localized "TODAY"
                    Text(WidgetLocalization.shared.translate("today").uppercased())
                        .font(.system(size: 6, weight: .bold))
                        .foregroundColor(.widgetPrimary)
                        .tracking(0.3)
                    
                    Spacer()
                    
                    CircularProgressView(
                        percentage: entry.data.completionPercentage,
                        size: 76,
                        lineWidth: 9
                    )
                    
                    Spacer()
                    
                    StreakBadge(streak: entry.data.currentStreak)
                }
                .frame(width: 120)
                .padding(.vertical, 14)
                
                // RIGHT SIDE (List)
                VStack(alignment: .leading, spacing: 5) {
                    // Localized "PRAYERS"
                    Text(WidgetLocalization.shared.translate("prayers"))
                        .font(.system(size: 6, weight: .bold))
                        .foregroundColor(.widgetPrimary)
                        .tracking(0.3)
                        .padding(.bottom, 1)
                    
                    if entry.data.prayers.isEmpty {
                        // Empty state handling if prayers list is cleared
                        Spacer()
                        Text("No data")
                            .font(.system(size: 10))
                            .foregroundColor(.widgetTextSecondary)
                        Spacer()
                    } else {
                        ForEach(entry.data.prayers.prefix(5), id: \.name) { prayer in
                            HStack(spacing: 5) {
                                Image(systemName: PrayerHelper.icon(for: prayer.name))
                                    .font(.system(size: 9))
                                    .foregroundColor(PrayerHelper.color(for: prayer.name))
                                    .frame(width: 15)
                                
                                // UPDATED: Localized Prayer Name
                                Text(PrayerHelper.localizedName(prayer.name))
                                    .font(.system(size: 10, weight: .semibold))
                                    .foregroundColor(.widgetText)
                                    .frame(width: 52, alignment: .leading)
                                
                                Spacer()
                                
                                if prayer.completed {
                                    Image(systemName: prayer.onTime ? "checkmark.circle.fill" : "checkmark.circle")
                                        .font(.system(size: 11))
                                        .foregroundColor(prayer.onTime ? .green : .widgetTextSecondary)
                                } else {
                                    Image(systemName: "circle")
                                        .font(.system(size: 11))
                                        .foregroundColor(.widgetTextSecondary.opacity(0.3))
                                }
                            }
                        }
                    }
                }
                .padding(14)
            }
        }
    }
}

// MARK: - Large Widget (338x354)
struct DailyProgressLargeView: View {
    let entry: DailyProgressEntry
    
    var body: some View {
        ZStack {
            WidgetBackground()
                .ignoresSafeArea()
            
            VStack(spacing: 7) {
                HStack {
                    // Localized "TODAY'S PROGRESS"
                    Text(WidgetLocalization.shared.translate("todays_progress"))
                        .font(.system(size: 8, weight: .bold))
                        .foregroundColor(.widgetPrimary)
                        .tracking(0.3)
                    
                    Spacer()
                    
                    let dateFormatter = DateFormatter()
                    let _ = dateFormatter.dateFormat = "MMM d"
                    Text(dateFormatter.string(from: entry.date))
                        .font(.system(size: 8, weight: .semibold))
                        .foregroundColor(.widgetTextSecondary)
                }
                
                HStack(spacing: 11) {
                    CircularProgressView(
                        percentage: entry.data.completionPercentage,
                        size: 82,
                        lineWidth: 9
                    )
                    
                    VStack(spacing: 6) {
                        HStack(spacing: 6) {
                            StatCard(
                                icon: "checkmark.circle.fill",
                                value: "\(entry.data.completedPrayers)/\(entry.data.totalPrayers)",
                                label: WidgetLocalization.shared.translate("done"),
                                color: .green
                            )
                            
                            StatCard(
                                icon: "clock.fill",
                                value: "\(entry.data.onTimePrayers)",
                                label: WidgetLocalization.shared.translate("on_time"),
                                color: .blue
                            )
                        }
                        
                        HStack(spacing: 6) {
                            StatCard(
                                icon: "flame.fill",
                                value: "\(entry.data.currentStreak)",
                                label: WidgetLocalization.shared.translate("streak"),
                                color: Color(hex: "FF8C42")
                            )
                            
                            StatCard(
                                icon: "chart.line.uptrend.xyaxis",
                                value: "\(entry.data.completionPercentage)%",
                                label: WidgetLocalization.shared.translate("rate"),
                                color: .widgetPrimary
                            )
                        }
                    }
                }
                
                VStack(spacing: 5) {
                    HStack {
                        // Localized "PRAYERS"
                        Text(WidgetLocalization.shared.translate("prayers"))
                            .font(.system(size: 7, weight: .bold))
                            .foregroundColor(.widgetPrimary)
                            .tracking(0.3)
                        Spacer()
                    }
                    
                    if entry.data.prayers.isEmpty {
                        Spacer()
                        Text("No data")
                            .font(.system(size: 10))
                            .foregroundColor(.widgetTextSecondary)
                        Spacer()
                    } else {
                        ForEach(entry.data.prayers, id: \.name) { prayer in
                            HStack(spacing: 7) {
                                PrayerIconBadge(prayer: prayer.name, size: 24)
                                
                                VStack(alignment: .leading, spacing: 0) {
                                    // UPDATED: Localized Prayer Name
                                    Text(PrayerHelper.localizedName(prayer.name))
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundColor(.widgetText)
                                    
                                    // Localized status text logic
                                    Text(prayer.completed
                                         ? (prayer.onTime
                                            ? WidgetLocalization.shared.translate("on_time")
                                            : WidgetLocalization.shared.translate("completed"))
                                         : WidgetLocalization.shared.translate("not_completed"))
                                    .font(.system(size: 7, weight: .semibold))
                                    .foregroundColor(prayer.completed ? (prayer.onTime ? .green : .widgetTextSecondary) : .widgetTextSecondary.opacity(0.5))
                                }
                                
                                Spacer()
                                
                                if prayer.completed {
                                    Image(systemName: prayer.onTime ? "checkmark.circle.fill" : "checkmark.circle")
                                        .font(.system(size: 14))
                                        .foregroundColor(prayer.onTime ? .green : .widgetTextSecondary)
                                } else {
                                    Image(systemName: "circle")
                                        .font(.system(size: 14))
                                        .foregroundColor(.widgetTextSecondary.opacity(0.3))
                                }
                            }
                            .padding(.horizontal, 8)
                            .padding(.vertical, 6)
                            .background(
                                prayer.completed
                                ? Color.green.opacity(0.08)
                                : Color.white.opacity(0.3)
                            )
                            .cornerRadius(8)
                        }
                    }
                }
            }
            .padding(14)
        }
    }
}

// MARK: - Stat Card
struct StatCard: View {
    let icon: String
    let value: String
    let label: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 2) {
            Image(systemName: icon)
                .font(.system(size: 11))
                .foregroundColor(color)
            
            Text(value)
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(.widgetText)
            
            Text(label)
                .font(.system(size: 7, weight: .semibold))
                .foregroundColor(.widgetTextSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 6)
        .background(Color.white.opacity(0.5))
        .cornerRadius(7)
    }
}

// MARK: - Adaptive View
struct DailyProgressWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: DailyProgressEntry
    
    var body: some View {
        switch family {
        case .systemSmall:
            DailyProgressSmallView(entry: entry)
        case .systemMedium:
            DailyProgressMediumView(entry: entry)
        case .systemLarge:
            DailyProgressLargeView(entry: entry)
        default:
            DailyProgressSmallView(entry: entry)
        }
    }
}

// MARK: - Widget Configuration
struct DailyProgressWidget: Widget {
    let kind: String = "DailyProgressWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DailyProgressProvider()) { entry in
            DailyProgressWidgetView(entry: entry)
                .containerBackground(for: .widget) {
                    WidgetBackground()
                }
        }
        // Localized Configuration Display Name and Description
        .configurationDisplayName(WidgetLocalization.shared.translate("daily_progress"))
        .description(WidgetLocalization.shared.translate("daily_progress_desc"))
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}
