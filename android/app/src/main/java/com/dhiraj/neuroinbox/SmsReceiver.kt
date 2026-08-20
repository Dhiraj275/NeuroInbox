package com.dhiraj.neuroinbox

import android.content.BroadcastReceiver
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.telephony.SmsMessage

class SmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        if (context == null || intent == null) return

        val action = intent.action
        if (action == Telephony.Sms.Intents.SMS_DELIVER_ACTION || action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val messages: Array<SmsMessage>? = try {
                Telephony.Sms.Intents.getMessagesFromIntent(intent)
            } catch (e: Exception) {
                null
            }

            if (messages.isNullOrEmpty()) return

            val senderAddress = messages[0].displayOriginatingAddress ?: messages[0].originatingAddress ?: "Unknown"
            val timestamp = messages[0].timestampMillis

            val bodyBuilder = StringBuilder()
            for (msg in messages) {
                if (msg.displayMessageBody != null) {
                    bodyBuilder.append(msg.displayMessageBody)
                } else if (msg.messageBody != null) {
                    bodyBuilder.append(msg.messageBody)
                }
            }
            val fullBody = bodyBuilder.toString()

            // Save incoming message to System Content Provider (Inbox) if not already saved
            try {
                val msgTime = if (timestamp > 0) timestamp else System.currentTimeMillis()
                val projection = arrayOf(Telephony.Sms._ID)
                val selection = "${Telephony.Sms.ADDRESS} = ? AND ${Telephony.Sms.BODY} = ? AND ${Telephony.Sms.DATE} >= ?"
                val selectionArgs = arrayOf(senderAddress, fullBody, (msgTime - 5000).toString())
                val cursor = context.contentResolver.query(
                    Telephony.Sms.CONTENT_URI,
                    projection,
                    selection,
                    selectionArgs,
                    null
                )
                val exists = cursor?.use { it.count > 0 } ?: false
                if (!exists) {
                    val values = ContentValues().apply {
                        put(Telephony.Sms.ADDRESS, senderAddress)
                        put(Telephony.Sms.BODY, fullBody)
                        put(Telephony.Sms.DATE, msgTime)
                        put(Telephony.Sms.READ, 0)
                        put(Telephony.Sms.TYPE, Telephony.Sms.MESSAGE_TYPE_INBOX)
                    }
                    context.contentResolver.insert(Telephony.Sms.Inbox.CONTENT_URI, values)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }

            // Send real-time notification event to React Native JS
            try {
                DefaultSmsModule.sendSmsReceivedEvent(context, senderAddress, fullBody)
            } catch (e: Exception) {
                e.printStackTrace()
            }

            // Trigger heads-up system notification
            try {
                NotificationHelper.showSmsNotification(context, senderAddress, fullBody)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}
