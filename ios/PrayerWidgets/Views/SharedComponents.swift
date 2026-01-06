//
//  SharedComponents.swift
//  MySalah
//

import SwiftUI
import WidgetKit

// MARK: - Widget Background
struct WidgetBackground: View {
    var body: some View {
        LinearGradient(
            colors: [Color.widgetBackground, Color.widgetBackgroundSecondary],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}

// MARK: - Location Badge
struct LocationBadge: View {
    let location: String
    
    var body: some View {
        HStack(spacing: 2) {
            Image(systemName: "location.fill")
                .font(.system(size: 7, weight: .semibold))
            Text(location)
                .font(.system(size: 8, weight: .semibold))
                .lineLimit(1)
        }
        .foregroundColor(.widgetText)
        .padding(.horizontal, 6)
        .padding(.vertical, 3)
        .background(Color.white.opacity(0.7))
        .cornerRadius(6)
    }
}

// MARK: - Circular Progress View
struct CircularProgressView: View {
    let percentage: Int
    let size: CGFloat
    let lineWidth: CGFloat
    
    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.widgetPrimary.opacity(0.2), lineWidth: lineWidth)
            
            Circle()
                .trim(from: 0, to: CGFloat(percentage) / 100.0)
                .stroke(
                    Color.widgetPrimary,
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
            
            VStack(spacing: 0) {
                Text("\(percentage)%")
                    .font(.system(size: size * 0.22, weight: .bold))
                    .foregroundColor(.widgetText)
            }
        }
        .frame(width: size, height: size)
    }
}

// MARK: - Prayer Icon Badge
struct PrayerIconBadge: View {
    let prayer: String
    let size: CGFloat
    
    var body: some View {
        ZStack {
            Circle()
                .fill(PrayerHelper.color(for: prayer).opacity(0.15))
            
            Image(systemName: PrayerHelper.icon(for: prayer))
                .font(.system(size: size * 0.40, weight: .semibold))
                .foregroundColor(PrayerHelper.color(for: prayer))
        }
        .frame(width: size, height: size)
    }
}

// MARK: - Streak Badge
struct StreakBadge: View {
    let streak: Int
    
    var body: some View {
        HStack(spacing: 2) {
            Image(systemName: "flame.fill")
                .font(.system(size: 8, weight: .bold))
            Text("\(streak)")
                .font(.system(size: 9, weight: .bold))
        }
        .foregroundColor(.white)
        .padding(.horizontal, 6)
        .padding(.vertical, 3)
        .background(
            LinearGradient(
                colors: [Color(hex: "FF8C42"), Color(hex: "FF6B35")],
                startPoint: .leading,
                endPoint: .trailing
            )
        )
        .cornerRadius(6)
    }
}

// MARK: - Friend Avatar
struct FriendAvatar: View {
    let initials: String
    let size: CGFloat
    
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color.widgetPrimary, Color.widgetPrimary.opacity(0.8)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            Text(initials)
                .font(.system(size: size * 0.36, weight: .bold))
                .foregroundColor(.white)
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
        .overlay(
            Circle()
                .stroke(Color.white, lineWidth: 2)
        )
    }
}
