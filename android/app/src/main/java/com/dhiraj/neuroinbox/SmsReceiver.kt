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

            // Save incoming message to System Content Provider (Inbox)
            try {
                val values = ContentValues().apply {
                    put(Telephony.Sms.ADDRESS, senderAddress)
                    put(Telephony.Sms.BODY, fullBody)
                    put(Telephony.Sms.DATE, if (timestamp > 0) timestamp else System.currentTimeMillis())
                    put(Telephony.Sms.READ, 0)
                    put(Telephony.Sms.TYPE, Telephony.Sms.MESSAGE_TYPE_INBOX)
                }
                context.contentResolver.insert(Telephony.Sms.Inbox.CONTENT_URI, values)
            } catch (e: Exception) {
                e.printStackTrace()
            }

            // Send real-time notification event to React Native JS
            try {
                DefaultSmsModule.sendSmsReceivedEvent(context, senderAddress, fullBody)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}
