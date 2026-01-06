import WidgetKit
import SwiftUI

// MARK: - Entry
struct NextPrayerEntry: TimelineEntry {
    let date: Date
    let data: NextPrayerData
}

// MARK: - Provider
struct NextPrayerProvider: TimelineProvider {
    
    func placeholder(in context: Context) -> NextPrayerEntry {
        NextPrayerEntry(
            date: Date(),
            data: NextPrayerData(
                nextPrayer: "Fajr",
                nextPrayerTime: "05:30",
                location: "Istanbul",
                timeRemaining: "2h 15m",
                allPrayers: [],
                lastUpdate: Date()
            )
        )
    }
    
    func getSnapshot(in context: Context, completion: @escaping (NextPrayerEntry) -> ()) {
        let entry = NextPrayerEntry(date: Date(), data: NextPrayerData.load())
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<NextPrayerEntry>) -> ()) {
        let now = Date()
        let data = NextPrayerData.load()
        
        // 1. Calculate the actual next prayer date from the list
        let nextPrayerInfo = PrayerHelper.calculateNextPrayer(from: data.allPrayers)
        
        // Convert string time ("05:30") to Date object
        let nextPrayerDate = Date.from(timeString: nextPrayerInfo.time, referenceDate: now) ?? now.addingTimeInterval(900)
        
        // 2. Refresh 1 second after the prayer time
        let refreshAtPrayer = nextPrayerDate.addingTimeInterval(1)
        
        // 3. Refresh at Midnight
        let calendar = Calendar.current
        let tomorrowMidnight = calendar.startOfDay(for: calendar.date(byAdding: .day, value: 1, to: now)!)
        
        // 4. Policy: Refresh at whichever comes first (Next Prayer OR Midnight)
        let refreshDate = min(refreshAtPrayer, tomorrowMidnight)
        
        let entry = NextPrayerEntry(date: now, data: data)
        
        print("Widget Refresh Scheduled for: \(refreshDate)")
        
        completion(Timeline(entries: [entry], policy: .after(refreshDate)))
    }
}

// MARK: - Date Helper
extension Date {
    static func from(timeString: String, referenceDate: Date = Date()) -> Date? {
        let parts = timeString.split(separator: ":")
        guard parts.count == 2,
              let h = Int(parts[0]),
              let m = Int(parts[1]) else { return nil }
        
        let cal = Calendar.current
        var d = cal.date(bySettingHour: h, minute: m, second: 0, of: referenceDate)!
        
        // If the resulting date is earlier than reference, it implies the time is for tomorrow
        if d < referenceDate {
            d = cal.date(byAdding: .day, value: 1, to: d)!
        }
        return d
    }
}

// MARK: - Shared Countdown View
struct CountdownToDateView: View {
    let targetDate: Date
    let fontSize: CGFloat
    let iconSize: CGFloat
    
    var body: some View {
        HStack(spacing: 6) {
            
            if #available(iOS 17.0, *) {
                Text(targetDate, style: .timer)
                    .contentTransition(.numericText())
                    .monospacedDigit()
                    .font(.system(size: fontSize, weight: .semibold, design: .rounded))
                    .foregroundColor(.widgetTextSecondary)
                    .multilineTextAlignment(.center)
            } else {
                Text(targetDate, style: .timer)
                    .monospacedDigit()
                    .font(.system(size: fontSize, weight: .semibold, design: .rounded))
                    .foregroundColor(.widgetTextSecondary)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(alignment: .center)
        .transaction { $0.animation = nil }
    }
}

// MARK: - Small Widget
struct NextPrayerSmallView: View {
    let entry: NextPrayerEntry
    
    private var actualNextPrayer: (name: String, time: String) {
        return PrayerHelper.calculateNextPrayer(from: entry.data.allPrayers)
    }
    
    private var targetDate: Date {
        Date.from(timeString: actualNextPrayer.time, referenceDate: entry.date) ?? entry.date
    }
    
    var body: some View {
        ZStack {
            WidgetBackground()
                .ignoresSafeArea()
            
            VStack(spacing: 4) {
                LocationBadge(location: entry.data.location)
                
                Spacer()
                
                PrayerIconBadge(prayer: actualNextPrayer.name, size: 36)
                
                Text(WidgetLocalization.shared.translate("next_prayer"))
                    .font(.system(size: 6, weight: .bold))
                    .foregroundColor(.widgetPrimary)
                    .tracking(0.3)
                
                Text(PrayerHelper.localizedName(actualNextPrayer.name))
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.widgetText)
                
                Text(actualNextPrayer.time)
                    .font(.system(size: 20, weight: .heavy))
                    .foregroundColor(.widgetText)
                
                CountdownToDateView(
                    targetDate: targetDate,
                    fontSize: 11,
                    iconSize: 9
                )
                .padding(.top, 2)
                
                Spacer()
            }
            .padding(14)
        }
    }
}

// MARK: - Medium Widget
struct NextPrayerMediumView: View {
    let entry: NextPrayerEntry
    
    private var actualNextPrayer: (name: String, time: String) {
        return PrayerHelper.calculateNextPrayer(from: entry.data.allPrayers)
    }
    
    private var targetDate: Date {
        Date.from(timeString: actualNextPrayer.time, referenceDate: entry.date) ?? entry.date
    }
    
    var body: some View {
        ZStack {
            WidgetBackground()
                .ignoresSafeArea()
            
            HStack(spacing: 0) {
                // Left Side - Next Prayer
                VStack(alignment: .center, spacing: 3) {
                    LocationBadge(location: entry.data.location)
                    
                    Spacer()
                    
                    PrayerIconBadge(prayer: actualNextPrayer.name, size: 40)
                    
                    Text(WidgetLocalization.shared.translate("next").uppercased())
                        .font(.system(size: 6, weight: .bold))
                        .foregroundColor(.widgetPrimary)
                        .tracking(0.3)
                    
                    Text(PrayerHelper.localizedName(actualNextPrayer.name))
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.widgetText)
                    
                    Text(actualNextPrayer.time)
                        .font(.system(size: 22, weight: .heavy))
                        .foregroundColor(.widgetText)
                    
                    // Centered Countdown with Hourglass next to it
                    CountdownToDateView(
                        targetDate: targetDate,
                        fontSize: 10,
                        iconSize: 8
                    )
                    .padding(.top, 4)
                    
                    Spacer()
                }
                .frame(width: 140)
                .padding(.vertical, 14)
                
                // Right Side - All Prayers
                VStack(alignment: .leading, spacing: 5) {
                    Text(WidgetLocalization.shared.translate("today").uppercased())
                        .font(.system(size: 6, weight: .bold))
                        .foregroundColor(.widgetPrimary)
                        .tracking(0.3)
                        .padding(.bottom, 1)
                    
                    ForEach(entry.data.allPrayers.prefix(5), id: \.name) { prayer in
                        HStack(spacing: 5) {
                            Image(systemName: PrayerHelper.icon(for: prayer.name))
                                .font(.system(size: 9))
                                .foregroundColor(PrayerHelper.color(for: prayer.name))
                                .frame(width: 15)
                            
                            Text(PrayerHelper.localizedName(prayer.name))
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundColor(.widgetText)
                                .frame(width: 52, alignment: .leading)
                            
                            Spacer()
                            
                            Text(prayer.time)
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(.widgetText)
                        }
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .padding(.trailing, 14)
            }
            .padding(.leading, 14)
        }
    }
}

// MARK: - Large Widget
struct NextPrayerLargeView: View {
    let entry: NextPrayerEntry
    
    private var actualNextPrayer: (name: String, time: String) {
        return PrayerHelper.calculateNextPrayer(from: entry.data.allPrayers)
    }
    
    private var targetDate: Date {
        Date.from(timeString: actualNextPrayer.time, referenceDate: entry.date) ?? entry.date
    }
    
    var body: some View {
        ZStack {
            WidgetBackground()
                .ignoresSafeArea()
            
            VStack(spacing: 8) {
                HStack {
                    LocationBadge(location: entry.data.location)
                    Spacer()
                    Text(WidgetLocalization.shared.translate("prayer_times").uppercased())
                        .font(.system(size: 7, weight: .bold))
                        .foregroundColor(.widgetPrimary)
                        .tracking(0.3)
                }
                
                // Inner VStack for Next Prayer Info
                VStack(spacing: 4) {
                    PrayerIconBadge(prayer: actualNextPrayer.name, size: 48)
                    
                    Text(WidgetLocalization.shared.translate("next_prayer"))
                        .font(.system(size: 7, weight: .bold))
                        .foregroundColor(.widgetPrimary)
                        .tracking(0.3)
                    
                    Text(PrayerHelper.localizedName(actualNextPrayer.name))
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.widgetText)
                    
                    Text(actualNextPrayer.time)
                        .font(.system(size: 28, weight: .heavy))
                        .foregroundColor(.widgetText)
                    
                    // Centered Countdown Block - UPDATED to use shared View
                    // This guarantees the hourglass is next to the time
                    CountdownToDateView(
                        targetDate: targetDate,
                        fontSize: 15,
                        iconSize: 12
                    )
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.widgetPrimary.opacity(0.1))
                    .cornerRadius(12)
                }
                .padding(.vertical, 10)
                .frame(maxWidth: .infinity)
                .background(Color.white.opacity(0.4))
                .cornerRadius(12)
                
                VStack(spacing: 5) {
                    ForEach(entry.data.allPrayers, id: \.name) { prayer in
                        HStack(spacing: 8) {
                            Image(systemName: PrayerHelper.icon(for: prayer.name))
                                .font(.system(size: 10))
                                .foregroundColor(PrayerHelper.color(for: prayer.name))
                                .frame(width: 18)
                            
                            Text(PrayerHelper.localizedName(prayer.name))
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundColor(.widgetText)
                            
                            Spacer()
                            
                            Text(prayer.time)
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(.widgetText)
                        }
                        .padding(.horizontal, 9)
                        .padding(.vertical, 5)
                        .background(
                            prayer.name.lowercased() == actualNextPrayer.name.lowercased()
                            ? Color.widgetPrimary.opacity(0.15)
                            : Color.clear
                        )
                        .cornerRadius(8)
                    }
                }
            }
            .padding(14)
        }
    }
}

// MARK: - Widget Configuration
struct NextPrayerWidget: Widget {
    let kind: String = "NextPrayerWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: NextPrayerProvider()) { entry in
            NextPrayerWidgetView(entry: entry)
                .containerBackground(for: .widget) {
                    WidgetBackground()
                }
        }
        .configurationDisplayName(WidgetLocalization.shared.translate("next_prayer"))
        .description(WidgetLocalization.shared.translate("next_prayer_desc"))
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Adaptive View
struct NextPrayerWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: NextPrayerEntry
    
    var body: some View {
        switch family {
        case .systemSmall:
            NextPrayerSmallView(entry: entry)
        case .systemMedium:
            NextPrayerMediumView(entry: entry)
        case .systemLarge:
            NextPrayerLargeView(entry: entry)
        default:
            NextPrayerSmallView(entry: entry)
        }
    }
}
