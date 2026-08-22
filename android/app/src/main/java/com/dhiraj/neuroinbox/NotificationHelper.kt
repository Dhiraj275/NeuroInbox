package com.dhiraj.neuroinbox

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.ContactsContract
import android.provider.Telephony
import androidx.core.app.NotificationCompat

object NotificationHelper {
    private const val CHANNEL_ID = "incoming_sms_channel"
    private const val CHANNEL_NAME = "Incoming Messages"
    private const val CHANNEL_DESCRIPTION = "Notifications for incoming SMS messages"

    private fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val existingChannel = notificationManager.getNotificationChannel(CHANNEL_ID)
            if (existingChannel == null) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = CHANNEL_DESCRIPTION
                    enableVibration(true)
                    enableLights(true)
                }
                notificationManager.createNotificationChannel(channel)
            }
        }
    }

    private fun resolveContactName(context: Context, address: String): String {
        if (address.isBlank()) return "Unknown"
        var contactName = address
        try {
            val uri = Uri.withAppendedPath(
                ContactsContract.PhoneLookup.CONTENT_FILTER_URI,
                Uri.encode(address)
            )
            val projection = arrayOf(ContactsContract.PhoneLookup.DISPLAY_NAME)
            context.contentResolver.query(uri, projection, null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val nameIdx = cursor.getColumnIndex(ContactsContract.PhoneLookup.DISPLAY_NAME)
                    if (nameIdx != -1) {
                        val name = cursor.getString(nameIdx)
                        if (!name.isNullOrBlank()) {
                            contactName = name
                        }
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return contactName
    }

    private fun resolveThreadId(context: Context, address: String): Long {
        if (address.isBlank()) return 0L
        return try {
            Telephony.Threads.getOrCreateThreadId(context, address)
        } catch (e: Exception) {
            e.printStackTrace()
            0L
        }
    }

    fun showSmsNotification(context: Context, senderAddress: String, body: String) {
        try {
            createNotificationChannel(context)

            val titleName = resolveContactName(context, senderAddress)
            val threadId = resolveThreadId(context, senderAddress)

            val deepLinkUri = Uri.parse(
                "neuroinbox://thread/$threadId?address=${Uri.encode(senderAddress)}&contactName=${Uri.encode(titleName)}"
            )

            val intent = Intent(Intent.ACTION_VIEW, deepLinkUri).apply {
                setClass(context, MainActivity::class.java)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("threadId", threadId)
                putExtra("address", senderAddress)
                putExtra("contactName", titleName)
            }

            val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }

            val notificationId = senderAddress.hashCode()

            val pendingIntent = PendingIntent.getActivity(
                context,
                notificationId,
                intent,
                pendingIntentFlags
            )

            val builder = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(titleName)
                .setContentText(body)
                .setStyle(NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)

            val notificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.notify(notificationId, builder.build())
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
