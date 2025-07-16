# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# ✅ CRITIQUE: WatermelonDB pour éviter "No driver with tag 2 available"
-keep class com.nozbe.watermelondb.** { *; }
-dontwarn com.nozbe.watermelondb.**
-keep class com.facebook.jni.** { *; }

# ✅ SQLite pour Android Release
-keep class io.liteglue.** { *; }
-keep class org.sqlite.** { *; }
-dontwarn org.sqlite.**

# ✅ React Native JSI
-keep class com.facebook.jsi.** { *; }
-dontwarn com.facebook.jsi.**

# Add any project specific keep options here:
