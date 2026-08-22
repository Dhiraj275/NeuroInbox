package com.dhiraj.neuroinbox
import expo.modules.splashscreen.SplashScreenManager

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Telephony

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    // setTheme(R.style.AppTheme);
    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen
    handleSmsIntent(intent)
    super.onCreate(null)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    handleSmsIntent(intent)
    setIntent(intent)
  }

  private fun handleSmsIntent(intent: Intent?) {
    if (intent == null) return
    val action = intent.action
    val data = intent.data

    if (action == Intent.ACTION_SENDTO || action == Intent.ACTION_VIEW || action == Intent.ACTION_SEND) {
      var phoneNumber: String? = null

      if (data != null) {
        val scheme = data.scheme
        if (scheme == "sms" || scheme == "smsto" || scheme == "mms" || scheme == "mmsto") {
          phoneNumber = Uri.decode(data.schemeSpecificPart)
        }
      }

      if (phoneNumber.isNullOrBlank()) {
        phoneNumber = intent.getStringExtra("address") ?: intent.getStringExtra(Intent.EXTRA_PHONE_NUMBER)
      }

      if (!phoneNumber.isNullOrBlank()) {
        if (phoneNumber.contains("?")) {
          phoneNumber = phoneNumber.substringBefore("?")
        }

        try {
          val threadId = Telephony.Threads.getOrCreateThreadId(this, phoneNumber)
          val deepLinkUri = Uri.parse(
            "neuroinbox://thread/$threadId?address=${Uri.encode(phoneNumber)}"
          )
          intent.data = deepLinkUri
          intent.action = Intent.ACTION_VIEW
        } catch (e: Exception) {
          e.printStackTrace()
        }
      }
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }
}
