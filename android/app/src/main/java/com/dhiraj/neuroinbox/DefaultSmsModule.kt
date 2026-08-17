package com.dhiraj.neuroinbox

import android.app.Activity
import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Telephony
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class DefaultSmsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var pendingPromise: Promise? = null

    companion object {
        private const val REQUEST_CODE_DEFAULT_SMS = 1001
        const val MODULE_NAME = "DefaultSmsModule"
    }

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String {
        return MODULE_NAME
    }

    private fun checkIsDefaultSmsApp(): Boolean {
        val packageName = reactApplicationContext.packageName
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = reactApplicationContext.getSystemService(Context.ROLE_SERVICE) as? RoleManager
            if (roleManager != null && roleManager.isRoleAvailable(RoleManager.ROLE_SMS)) {
                return roleManager.isRoleHeld(RoleManager.ROLE_SMS)
            }
        }
        val defaultSmsPackage = Telephony.Sms.getDefaultSmsPackage(reactApplicationContext)
        return defaultSmsPackage == packageName
    }

    @ReactMethod
    fun isDefaultSmsApp(promise: Promise) {
        try {
            val isDefault = checkIsDefaultSmsApp()
            promise.resolve(isDefault)
        } catch (e: Exception) {
            promise.reject("E_CHECK_DEFAULT_SMS_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun requestDefaultSmsApp(promise: Promise) {
        val activity: Activity? = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.reject("E_NO_ACTIVITY", "Current activity is null")
            return
        }

        if (checkIsDefaultSmsApp()) {
            promise.resolve(true)
            return
        }

        if (pendingPromise != null) {
            promise.reject("E_ALREADY_REQUESTING", "Default SMS request is already in progress")
            return
        }

        pendingPromise = promise

        try {
            val packageName = reactApplicationContext.packageName
            val intent: Intent

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val roleManager = activity.getSystemService(Context.ROLE_SERVICE) as? RoleManager
                if (roleManager != null && roleManager.isRoleAvailable(RoleManager.ROLE_SMS)) {
                    intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_SMS)
                } else {
                    intent = Intent(Telephony.Sms.Intents.ACTION_CHANGE_DEFAULT)
                    intent.putExtra(Telephony.Sms.Intents.EXTRA_PACKAGE_NAME, packageName)
                }
            } else {
                intent = Intent(Telephony.Sms.Intents.ACTION_CHANGE_DEFAULT)
                intent.putExtra(Telephony.Sms.Intents.EXTRA_PACKAGE_NAME, packageName)
            }

            activity.startActivityForResult(intent, REQUEST_CODE_DEFAULT_SMS)
        } catch (e: Exception) {
            pendingPromise?.reject("E_REQUEST_DEFAULT_SMS_FAILED", e.message, e)
            pendingPromise = null
        }
    }

    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == REQUEST_CODE_DEFAULT_SMS) {
            val isDefault = checkIsDefaultSmsApp()
            pendingPromise?.resolve(isDefault)
            pendingPromise = null
        }
    }

    override fun onNewIntent(intent: Intent) {
        // No action required
    }
}
