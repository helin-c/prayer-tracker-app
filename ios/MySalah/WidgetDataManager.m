//
//  WidgetDataManager.m
//  MySalah
//
//  Created by Furkan Cinko on 4.01.2026.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetDataManager, NSObject)

RCT_EXTERN_METHOD(updateNextPrayer:(NSDictionary *)data)
RCT_EXTERN_METHOD(updateDailyProgress:(NSDictionary *)data)
RCT_EXTERN_METHOD(updateFriendStreaks:(NSDictionary *)data)
RCT_EXTERN_METHOD(saveLanguage:(NSString *)language)
RCT_EXTERN_METHOD(reloadAllWidgets)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
