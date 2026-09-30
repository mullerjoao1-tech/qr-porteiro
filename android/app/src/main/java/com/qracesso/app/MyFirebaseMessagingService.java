package com.qracesso.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;
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

        if ("comunicado-v2".equals(data.get("tipo"))) {
            Log.d(TAG, "Comunicado V2 recebido: " + data.toString());

            String titulo = data.get("titulo");
            String mensagem = data.get("mensagem");
            String url = data.get("url");
            String comunicadoId = data.get("comunicadoId");

            String route = "/dashboard/morador/comunicados";

            if (url != null && !url.trim().isEmpty()) {
                try {
                    java.net.URI uri = java.net.URI.create(url.trim());

                    String caminho = uri.getRawPath();
                    String consulta = uri.getRawQuery();

                    if (caminho != null && !caminho.trim().isEmpty()) {
                        route = caminho;

                        if (consulta != null && !consulta.trim().isEmpty()) {
                            route += "?" + consulta;
                        }
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Erro ao interpretar URL do comunicado", e);
                }
            }

            Intent abrirIntent = new Intent(this, MainActivity.class);
            abrirIntent.setFlags(
                    Intent.FLAG_ACTIVITY_CLEAR_TOP |
                    Intent.FLAG_ACTIVITY_SINGLE_TOP
            );
            abrirIntent.putExtra("route", route);
            abrirIntent.putExtra("comunicadoPush", true);
            abrirIntent.putExtra("comunicadoTitulo", titulo);
            abrirIntent.putExtra("comunicadoMensagem", mensagem);

            int requestCode =
                    comunicadoId != null
                            ? comunicadoId.hashCode()
                            : (int) System.currentTimeMillis();

            PendingIntent pendingIntent =
                    PendingIntent.getActivity(
                            this,
                            requestCode,
                            abrirIntent,
                            PendingIntent.FLAG_UPDATE_CURRENT |
                            PendingIntent.FLAG_IMMUTABLE
                    );

            String canalId = "qr_acesso_comunicados";

            NotificationManager notificationManager =
                    (NotificationManager) getSystemService(
                            NOTIFICATION_SERVICE
                    );

            if (
                    Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
                    notificationManager != null
            ) {
                NotificationChannel canal =
                        new NotificationChannel(
                                canalId,
                                "Comunicados",
                                NotificationManager.IMPORTANCE_HIGH
                        );

                canal.setDescription(
                        "Comunicados enviados pelo QR Acesso"
                );

                notificationManager.createNotificationChannel(canal);
            }

            NotificationCompat.Builder builder =
                    new NotificationCompat.Builder(this, canalId)
                            .setSmallIcon(R.mipmap.ic_launcher)
                            .setContentTitle(
                                    titulo != null &&
                                    !titulo.trim().isEmpty()
                                            ? titulo
                                            : "QR Acesso"
                            )
                            .setContentText(
                                    mensagem != null
                                            ? mensagem
                                            : "Novo comunicado"
                            )
                            .setStyle(
                                    new NotificationCompat.BigTextStyle()
                                            .bigText(
                                                    mensagem != null
                                                            ? mensagem
                                                            : "Novo comunicado"
                                            )
                            )
                            .setPriority(
                                    NotificationCompat.PRIORITY_HIGH
                            )
                            .setAutoCancel(true)
                            .setContentIntent(pendingIntent);

            if (notificationManager != null) {
                notificationManager.notify(
                        requestCode,
                        builder.build()
                );
            }

            try {
                abrirIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(abrirIntent);

                if (notificationManager != null) {
                    notificationManager.cancel(requestCode);
                }

                Log.d(TAG, "Comunicado aberto automaticamente: " + route);
            } catch (Exception e) {
                Log.e(TAG, "Erro ao abrir comunicado automaticamente", e);
            }

            return;
        }

        if ("chamada-v2".equals(data.get("tipo"))) {
            Log.d(TAG, "Chamada V2 recebida: " + data.toString());
            
            String unidadeId = data.get("unidadeId");
            String nome = data.get("nome");
            String motivo = data.get("motivo");
            String criadoEm = data.get("criadoEm");
            String responsavelAtualUid = data.get("responsavelAtualUid");

            // QRCALL_A9_5F_MODALIDADE_FCM
            String modalidadeChamada =
                    data.get("modalidadeChamada");

            if (
                    modalidadeChamada == null ||
                    modalidadeChamada.trim().isEmpty()
            ) {
                modalidadeChamada =
                        "comum";
            }

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

                serviceIntent.putExtra(
                        QrCallService.EXTRA_MODALIDADE_CHAMADA,
                        modalidadeChamada
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
