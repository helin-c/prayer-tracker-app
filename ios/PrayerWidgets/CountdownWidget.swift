//
//  CountdownWidget.swift
//  PrayerWidgets
//
//  Created by Furkan Cinko on 6.01.2026.
//

import WidgetKit
import SwiftUI

// MARK: - Countdown Provider
struct CountdownProvider: TimelineProvider {
    
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
        
        // 1. Calculate actual next prayer
        let nextPrayerInfo = PrayerHelper.calculateNextPrayer(from: data.allPrayers)
        let nextPrayerDate = Date.from(timeString: nextPrayerInfo.time, referenceDate: now) ?? now.addingTimeInterval(900)
        
        // 2. Refresh 1 second after prayer
        let refreshAtPrayer = nextPrayerDate.addingTimeInterval(1)
        
        // 3. Refresh at Midnight
        let calendar = Calendar.current
        let tomorrowMidnight = calendar.startOfDay(for: calendar.date(byAdding: .day, value: 1, to: now)!)
        
        // 4. Policy
        let refreshDate = min(refreshAtPrayer, tomorrowMidnight)
        let entry = NextPrayerEntry(date: now, data: data)
        
        completion(Timeline(entries: [entry], policy: .after(refreshDate)))
    }
}

// MARK: - Countdown Small View
struct CountdownSmallView: View {
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
            
            VStack(spacing: 0) {
                HStack {
                    PrayerIconBadge(prayer: actualNextPrayer.name, size: 24)
                    Spacer()
                    LocationBadge(location: entry.data.location)
                }
                .padding(.bottom, 4)
                
                Spacer()
                
                VStack(spacing: 0) {
                    
                    Text(PrayerHelper.localizedName(actualNextPrayer.name).uppercased())
                        .font(.system(size: 13, weight: .black))
                        .foregroundColor(.widgetPrimary)
                        .tracking(0.5)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                    
                    Text(WidgetLocalization.shared.translate("time_remaining"))
                        .font(.system(size: 7, weight: .bold))
                        .foregroundColor(.widgetTextSecondary.opacity(0.7))
                        .padding(.bottom, 2)
                    
                    if #available(iOS 17.0, *) {
                        Text(targetDate, style: .timer)
                            .contentTransition(.numericText())
                            .monospacedDigit()
                            .font(.system(size: 34, weight: .heavy, design: .rounded))
                            .foregroundColor(.widgetText)
                            .multilineTextAlignment(.center)
                            .lineLimit(1)
                            .minimumScaleFactor(0.5)
                    } else {
                        Text(targetDate, style: .timer)
                            .monospacedDigit()
                            .font(.system(size: 34, weight: .heavy, design: .rounded))
                            .foregroundColor(.widgetText)
                            .multilineTextAlignment(.center)
                            .lineLimit(1)
                            .minimumScaleFactor(0.5)
                    }
                }
                
                Spacer()
            }
            .padding(12)
        }
    }
}

// MARK: - Countdown Medium View
struct CountdownMediumView: View {
    let entry: NextPrayerEntry
    
    private var actualNextPrayer: (name: String, time: String) {
        return PrayerHelper.calculateNextPrayer(from: entry.data.allPrayers)
    }
    
    private var targetDate: Date {
        Date.from(timeString: actualNextPrayer.time, referenceDate: entry.date) ?? entry.date
    }
    
    var body: some View {
        HStack(spacing: 0) {
            
            // MARK: - LEFT SIDE (Info & Location)
            VStack(alignment: .center, spacing: 0) {
                
                // Location Top Left
                LocationBadge(location: entry.data.location)
                    .padding(.bottom, 4)
                
                Spacer()
                
                // Prayer Info Bottom Left
                VStack(alignment: .center, spacing: 4) {
                    PrayerIconBadge(prayer: actualNextPrayer.name, size: 32)
                        .padding(.bottom, 2)
                    
                    Text(WidgetLocalization.shared.translate("next").uppercased())
                        .font(.system(size: 8, weight: .bold))
                        .foregroundColor(.widgetPrimary)
                        .tracking(0.5)
                    
                    Text(PrayerHelper.localizedName(actualNextPrayer.name))
                        .font(.system(size: 18, weight: .heavy))
                        .foregroundColor(.widgetText)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                    
                    Text(actualNextPrayer.time)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.widgetTextSecondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .center)
            .padding(.vertical, 16)
            .padding(.leading, 16)
            
            
            Rectangle()
                .fill(Color.widgetPrimary.opacity(0.1))
                .frame(width: 1)
                .padding(.vertical, 16)
                .padding(.horizontal, 10)
            
            
            VStack(alignment: .center, spacing: 0) {
                
                Spacer()
                
          
                VStack(spacing: 2) {
                    
                    Text(WidgetLocalization.shared.translate("time_remaining"))
                        .font(.system(size: 8, weight: .bold))
                        .foregroundColor(.widgetTextSecondary)
                        .tracking(0.5)
                        .multilineTextAlignment(.center)
                    
                    if #available(iOS 17.0, *) {
                        Text(targetDate, style: .timer)
                            .contentTransition(.numericText())
                            .monospacedDigit()
                            .font(.system(size: 26, weight: .heavy, design: .rounded))
                            .foregroundColor(.widgetText)
                            .multilineTextAlignment(.center)
                            .lineLimit(1)
                    } else {
                        Text(targetDate, style: .timer)
                            .monospacedDigit()
                            .font(.system(size: 26, weight: .heavy, design: .rounded))
                            .foregroundColor(.widgetText)
                            .multilineTextAlignment(.center)
                            .lineLimit(1)
                    }
                }
                .padding(.top, 8)
                
                Spacer()
            }
            .frame(width: 160) 
            .frame(maxHeight: .infinity)
            .padding(.trailing, 16)
            
        }
    }
}

// MARK: - Widget Configuration
struct CountdownWidget: Widget {
    let kind: String = "CountdownWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: CountdownProvider()) { entry in
            CountdownWidgetView(entry: entry)
                .containerBackground(for: .widget) {
                    WidgetBackground()
                }
        }
        .configurationDisplayName(WidgetLocalization.shared.translate("countdown_widget"))
        .description(WidgetLocalization.shared.translate("countdown_widget_desc"))
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Adaptive View
struct CountdownWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: NextPrayerEntry
    
    var body: some View {
        switch family {
        case .systemSmall:
            CountdownSmallView(entry: entry)
        case .systemMedium:
            CountdownMediumView(entry: entry)
        default:
            CountdownSmallView(entry: entry)
        }
    }
}
