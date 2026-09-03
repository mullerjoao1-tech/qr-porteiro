package com.qracesso.app;

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
        if (data == null) return;

        if ("cancelar-chamada-v2".equals(data.get("tipo"))) {
            String unidadeId = data.get("unidadeId");
            String criadoEm = data.get("criadoEm");

            if (
                    unidadeId == null ||
                    unidadeId.trim().isEmpty() ||
                    criadoEm == null ||
                    criadoEm.trim().isEmpty()
            ) {
                Log.d(
                        TAG,
                        "Cancelamento ignorado: identidade incompleta"
                );

                return;
            }

            Intent cancelarIntent =
                    new Intent(
                            QrCallService.ACTION_CANCEL_REMOTE
                    );

            cancelarIntent.setPackage(
                    getPackageName()
            );

            cancelarIntent.putExtra(
                    QrCallService.EXTRA_UNIDADE_ID,
                    unidadeId
            );

            cancelarIntent.putExtra(
                    "criadoEm",
                    criadoEm
            );

            sendBroadcast(
                    cancelarIntent
            );

            Log.d(
                    TAG,
                    "Cancelamento QrCall enviado ao Service"
            );

            return;
        }

        if ("chamada-v2".equals(data.get("tipo"))) {
            Log.d(TAG, "Chamada V2 recebida: " + data.toString());
            
            String unidadeId = data.get("unidadeId");
            String nome = data.get("nome");
            String motivo = data.get("motivo");
            String criadoEm = data.get("criadoEm");
            String responsavelAtualUid = data.get("responsavelAtualUid");

            if (unidadeId != null) {
                // Iniciar serviço de toque contínuo
                Intent serviceIntent = new Intent(this, QrCallService.class);
                serviceIntent.setAction(QrCallService.ACTION_START);
                serviceIntent.putExtra(QrCallService.EXTRA_UNIDADE_ID, unidadeId);
                serviceIntent.putExtra(QrCallService.EXTRA_NOME, nome != null ? nome : "Visitante");
                serviceIntent.putExtra(QrCallService.EXTRA_MOTIVO, motivo != null ? motivo : "");
                serviceIntent.putExtra("criadoEm", criadoEm != null ? criadoEm : "");
                serviceIntent.putExtra(
                        "responsavelAtualUid",
                        responsavelAtualUid != null
                                ? responsavelAtualUid
                                : ""
                );
                try {
                    androidx.core.content.ContextCompat.startForegroundService(this, serviceIntent);
                } catch (Exception e) {
                    android.util.Log.e(TAG, "Erro ao iniciar QrCallService", e);
                }
            }
        }
    }
}
