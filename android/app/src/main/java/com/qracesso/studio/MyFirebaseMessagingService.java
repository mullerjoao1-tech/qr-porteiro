package com.qracesso.studio;

import android.content.Intent;
import android.util.Log;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "FCM_NATIVO";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Map<String, String> data = remoteMessage.getData();
        if (data != null && "chamada-v2".equals(data.get("tipo"))) {
            Log.d(TAG, "Chamada V2 recebida: " + data.toString());
            
            String unidadeId = data.get("unidadeId");
            String nome = data.get("nome");
            String motivo = data.get("motivo");

            if (unidadeId != null) {
                // Iniciar serviço de toque contínuo
                Intent serviceIntent = new Intent(this, QrCallService.class);
                serviceIntent.setAction(QrCallService.ACTION_START);
                serviceIntent.putExtra(QrCallService.EXTRA_UNIDADE_ID, unidadeId);
                serviceIntent.putExtra(QrCallService.EXTRA_NOME, nome != null ? nome : "Visitante");
                serviceIntent.putExtra(QrCallService.EXTRA_MOTIVO, motivo != null ? motivo : "");
                try {
                    androidx.core.content.ContextCompat.startForegroundService(this, serviceIntent);
                } catch (Exception e) {
                    android.util.Log.e(TAG, "Erro ao iniciar QrCallService", e);
                }
            }
        }
    }
}
