package com.dhiraj.neuroinbox

import android.app.Activity
import android.app.role.RoleManager
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Telephony
import android.telephony.SmsManager
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class DefaultSmsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var pendingPromise: Promise? = null

    companion object {
        private const val REQUEST_CODE_DEFAULT_SMS = 1001
        const val MODULE_NAME = "DefaultSmsModule"
        const val EVENT_SMS_RECEIVED = "onSmsReceived"
        private var reactApplicationContextInstance: ReactApplicationContext? = null

        fun sendSmsReceivedEvent(context: Context, address: String, body: String) {
            val reactContext = reactApplicationContextInstance ?: return
            if (reactContext.hasActiveReactInstance()) {
                val params: WritableMap = Arguments.createMap().apply {
                    putString("address", address)
                    putString("body", body)
                    putDouble("timestamp", System.currentTimeMillis().toDouble())
                }
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(EVENT_SMS_RECEIVED, params)
            }
        }
    }

    init {
        reactContext.addActivityEventListener(this)
        reactApplicationContextInstance = reactContext
    }

    override fun getName(): String {
        return MODULE_NAME
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN NativeEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN NativeEventEmitter
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

    @ReactMethod
    fun sendSms(phoneNumber: String, message: String, promise: Promise) {
        try {
            val smsManager: SmsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                reactApplicationContext.getSystemService(SmsManager::class.java)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }

            val parts = smsManager.divideMessage(message)
            if (parts.size > 1) {
                smsManager.sendMultipartTextMessage(phoneNumber, null, parts, null, null)
            } else {
                smsManager.sendTextMessage(phoneNumber, null, message, null, null)
            }

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("E_SEND_SMS_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun markThreadAsRead(threadId: Double, promise: Promise) {
        try {
            val values = ContentValues().apply {
                put(Telephony.Sms.READ, 1)
                put(Telephony.Sms.SEEN, 1)
            }
            val where = "${Telephony.Sms.THREAD_ID} = ? AND ${Telephony.Sms.READ} = 0"
            val selectionArgs = arrayOf(threadId.toLong().toString())
            val count = reactApplicationContext.contentResolver.update(
                Telephony.Sms.CONTENT_URI,
                values,
                where,
                selectionArgs
            )
            promise.resolve(count)
        } catch (e: Exception) {
            promise.reject("E_MARK_THREAD_READ_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun markMessageAsRead(messageId: String, promise: Promise) {
        try {
            val values = ContentValues().apply {
                put(Telephony.Sms.READ, 1)
                put(Telephony.Sms.SEEN, 1)
            }
            val where = "${Telephony.Sms._ID} = ?"
            val selectionArgs = arrayOf(messageId)
            val count = reactApplicationContext.contentResolver.update(
                Telephony.Sms.CONTENT_URI,
                values,
                where,
                selectionArgs
            )
            promise.resolve(count)
        } catch (e: Exception) {
            promise.reject("E_MARK_MSG_READ_FAILED", e.message, e)
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
