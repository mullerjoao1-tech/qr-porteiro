package com.qracesso.studio;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "FCM_NATIVO";
    private static final String CHANNEL_ID = "qr_acesso_chamadas";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Map<String, String> data = remoteMessage.getData();
        if (data != null && "chamada-v2".equals(data.get("tipo"))) {
            Log.d(TAG, "Chamada V2 recebida: " + data.toString());
            
            String unidadeId = data.get("unidadeId");
            String nome = data.get("nome");
            String motivo = data.get("motivo");

            if (unidadeId != null) {
                sendNotification(unidadeId, nome != null ? nome : "Visitante", motivo != null ? motivo : "");
            }
        }
    }

    private void sendNotification(String unidadeId, String nome, String motivo) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("route", "/morador-v2/" + unidadeId);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                unidadeId.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Chamadas QR Acesso",
                    NotificationManager.IMPORTANCE_HIGH
            );
            manager.createNotificationChannel(channel);
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_menu_call)
                .setContentTitle("Visitante chamando")
                .setContentText(nome + (motivo.isEmpty() ? "" : ": " + motivo))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true);

        manager.notify(unidadeId.hashCode(), builder.build());
    }
}
