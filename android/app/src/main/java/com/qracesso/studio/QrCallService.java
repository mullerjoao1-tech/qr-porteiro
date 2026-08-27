package com.qracesso.studio;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

public class QrCallService extends Service {

    public static final String ACTION_START =
            "com.qracesso.studio.QR_CALL_START";

    public static final String ACTION_STOP =
            "com.qracesso.studio.QR_CALL_STOP";

    public static final String ACTION_CANCEL_REMOTE =
            "com.qracesso.studio.QR_CALL_CANCEL_REMOTE";

    public static final String EXTRA_UNIDADE_ID = "unidadeId";
    public static final String EXTRA_NOME = "nome";
    public static final String EXTRA_MOTIVO = "motivo";
    public static final String EXTRA_RESPONSAVEL_UID = "responsavelAtualUid";

    private static final String CHANNEL_ID =
            "qr_call_incoming_v2";

    private static final int NOTIFICATION_ID =
            9102;

    private Ringtone ringtone;
    private Vibrator vibrator;

    private String chamadaAtivaUnidadeId = "";
    private String chamadaAtivaCriadoEm = "";
    private String chamadaAtivaResponsavelUid = "";

    private DatabaseReference referenciaChamadaFirebase;
    private ValueEventListener listenerChamadaFirebase;

    private final android.content.BroadcastReceiver receiverCancelarQrCall =
            new android.content.BroadcastReceiver() {
                @Override
                public void onReceive(
                        android.content.Context context,
                        Intent intent
                ) {
                    if (
                            intent == null ||
                            !ACTION_CANCEL_REMOTE.equals(
                                    intent.getAction()
                            )
                    ) {
                        return;
                    }

                    String unidadeId =
                            intent.getStringExtra(
                                    EXTRA_UNIDADE_ID
                            );

                    String criadoEm =
                            intent.getStringExtra(
                                    "criadoEm"
                            );

                    boolean mesmaChamada =
                            unidadeId != null &&
                            criadoEm != null &&
                            unidadeId.equals(
                                    chamadaAtivaUnidadeId
                            ) &&
                            criadoEm.equals(
                                    chamadaAtivaCriadoEm
                            );

                    if (!mesmaChamada) {
                        Log.d(
                                "QR_CALL_NEW",
                                "Cancelamento remoto ignorado: outra chamada"
                        );

                        return;
                    }

                    Log.d(
                            "QR_CALL_NEW",
                            "Cancelamento remoto confirmado"
                    );

                    timeoutHandler.removeCallbacks(
                            timeoutChamada
                    );

                    pararAlerta();
                    encerrarForeground();

                    chamadaAtivaUnidadeId = "";
                    chamadaAtivaCriadoEm = "";

                    stopSelf();
                }
            };


    private final android.os.Handler timeoutHandler =
            new android.os.Handler(android.os.Looper.getMainLooper());

    private final Runnable timeoutChamada =
            new Runnable() {
                @Override
                public void run() {
                    Log.d(
                            "QR_CALL_NEW",
                            "Timeout nativo de 3 minutos atingido"
                    );

                    pararAlerta();
                    encerrarForeground();
                    stopSelf();
                }
            };
    @Override
    public void onCreate() {
        super.onCreate();

        android.content.IntentFilter filtroCancelar =
                new android.content.IntentFilter(
                        ACTION_CANCEL_REMOTE
                );

        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(
                    receiverCancelarQrCall,
                    filtroCancelar,
                    android.content.Context.RECEIVER_NOT_EXPORTED
            );
        } else {
            registerReceiver(
                    receiverCancelarQrCall,
                    filtroCancelar
            );
        }
    }


    @Override
    public int onStartCommand(
            Intent intent,
            int flags,
            int startId
    ) {
        if (intent == null) {
            encerrarForeground();
            stopSelf();
            return START_NOT_STICKY;
        }

        String action = intent.getAction();

        if (ACTION_STOP.equals(action)) {
            timeoutHandler.removeCallbacks(timeoutChamada);
            pararObservacaoFirebase();
            pararAlerta();
            encerrarForeground();
            chamadaAtivaUnidadeId = "";
            chamadaAtivaCriadoEm = "";
            chamadaAtivaResponsavelUid = "";
            stopSelf();
            return START_NOT_STICKY;
        }

        if (!ACTION_START.equals(action)) {
            encerrarForeground();
            stopSelf();
            return START_NOT_STICKY;
        }

        String unidadeId =
                intent.getStringExtra(EXTRA_UNIDADE_ID);

        String nome =
                intent.getStringExtra(EXTRA_NOME);

        String motivo =
                intent.getStringExtra(EXTRA_MOTIVO);

        String criadoEm =
                intent.getStringExtra("criadoEm");

        String responsavelAtualUid =
                intent.getStringExtra(
                        EXTRA_RESPONSAVEL_UID
                );

        chamadaAtivaUnidadeId =
                unidadeId != null ? unidadeId : "";

        chamadaAtivaCriadoEm =
                criadoEm != null ? criadoEm : "";

        chamadaAtivaResponsavelUid =
                responsavelAtualUid != null
                        ? responsavelAtualUid
                        : "";

        Log.d(
                "QR_CALL_NEW",
                "Nova chamada recebida. unidadeId=" + unidadeId
        );

        iniciarForeground(
                nome != null ? nome : "Visitante"
        );

        iniciarAlerta();

        iniciarObservacaoFirebase(
                chamadaAtivaUnidadeId,
                chamadaAtivaCriadoEm,
                chamadaAtivaResponsavelUid
        );

        timeoutHandler.removeCallbacks(timeoutChamada);
        timeoutHandler.postDelayed(
                timeoutChamada,
                3 * 60 * 1000L
        );

        Intent tela =
                new Intent(this, QrCallActivity.class);

        tela.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_SINGLE_TOP |
                Intent.FLAG_ACTIVITY_CLEAR_TOP
        );

        tela.putExtra(EXTRA_UNIDADE_ID, unidadeId);
        tela.putExtra(EXTRA_NOME, nome);
        tela.putExtra(EXTRA_MOTIVO, motivo);
        tela.putExtra("criadoEm", criadoEm);
        tela.putExtra(EXTRA_RESPONSAVEL_UID, responsavelAtualUid);

        try {
            startActivity(tela);

            Log.d(
                    "QR_CALL_NEW",
                    "QrCallActivity solicitada"
            );

        } catch (Exception e) {

            Log.e(
                    "QR_CALL_NEW",
                    "Erro ao abrir QrCallActivity",
                    e
            );
        }

        return START_NOT_STICKY;
    }

    private void pararObservacaoFirebase() {
        if (
                referenciaChamadaFirebase != null &&
                listenerChamadaFirebase != null
        ) {
            try {
                referenciaChamadaFirebase.removeEventListener(
                        listenerChamadaFirebase
                );
            } catch (Exception ignored) {
            }
        }

        referenciaChamadaFirebase = null;
        listenerChamadaFirebase = null;
    }

    private void encerrarPorEstadoFirebase(
            String motivo
    ) {
        if (
                chamadaAtivaUnidadeId.isEmpty() ||
                chamadaAtivaCriadoEm.isEmpty()
        ) {
            return;
        }

        Log.d(
                "QR_CALL_NEW",
                "Encerrando por estado Firebase: " + motivo
        );

        String unidadeIdEncerrada =
                chamadaAtivaUnidadeId;

        String criadoEmEncerrado =
                chamadaAtivaCriadoEm;

        pararObservacaoFirebase();
        timeoutHandler.removeCallbacks(timeoutChamada);
        pararAlerta();
        encerrarForeground();

        chamadaAtivaUnidadeId = "";
        chamadaAtivaCriadoEm = "";
        chamadaAtivaResponsavelUid = "";

        Intent fecharTela =
                new Intent(ACTION_CANCEL_REMOTE);

        fecharTela.setPackage(
                getPackageName()
        );

        fecharTela.putExtra(
                EXTRA_UNIDADE_ID,
                unidadeIdEncerrada
        );

        fecharTela.putExtra(
                "criadoEm",
                criadoEmEncerrado
        );

        sendBroadcast(fecharTela);
        stopSelf();
    }

    private void iniciarObservacaoFirebase(
            final String unidadeId,
            final String criadoEm,
            final String responsavelUid
    ) {
        pararObservacaoFirebase();

        if (
                unidadeId == null ||
                unidadeId.trim().isEmpty() ||
                criadoEm == null ||
                criadoEm.trim().isEmpty()
        ) {
            Log.d(
                    "QR_CALL_NEW",
                    "Observacao Firebase nao iniciada: identidade incompleta"
            );
            return;
        }

        referenciaChamadaFirebase =
                FirebaseDatabase
                        .getInstance(
                                "https://qr-acesso-studio-default-rtdb.firebaseio.com"
                        )
                        .getReference("unidades-v2")
                        .child(unidadeId.trim())
                        .child("chamada");

        listenerChamadaFirebase =
                new ValueEventListener() {
                    @Override
                    public void onDataChange(
                            DataSnapshot snapshot
                    ) {
                        if (
                                !unidadeId.equals(
                                        chamadaAtivaUnidadeId
                                ) ||
                                !criadoEm.equals(
                                        chamadaAtivaCriadoEm
                                )
                        ) {
                            return;
                        }

                        if (!snapshot.exists()) {
                            encerrarPorEstadoFirebase(
                                    "chamada removida"
                            );
                            return;
                        }

                        String criadoEmBanco =
                                snapshot.child("criadoEm")
                                        .getValue(String.class);

                        if (
                                criadoEmBanco == null ||
                                !criadoEm.equals(
                                        criadoEmBanco.trim()
                                )
                        ) {
                            encerrarPorEstadoFirebase(
                                    "identidade da chamada mudou"
                            );
                            return;
                        }

                        String status =
                                snapshot.child("status")
                                        .getValue(String.class);

                        if (
                                !"Aguardando atendimento".equals(
                                        status
                                )
                        ) {
                            encerrarPorEstadoFirebase(
                                    "status=" + status
                            );
                            return;
                        }

                        if (
                                responsavelUid != null &&
                                !responsavelUid.trim().isEmpty()
                        ) {
                            String uidBanco =
                                    snapshot
                                            .child("responsavelAtualUid")
                                            .getValue(String.class);

                            if (
                                    uidBanco == null ||
                                    !responsavelUid.trim().equals(
                                            uidBanco.trim()
                                    )
                            ) {
                                encerrarPorEstadoFirebase(
                                        "responsavel alterado"
                                );
                            }
                        }
                    }

                    @Override
                    public void onCancelled(
                            DatabaseError error
                    ) {
                        Log.e(
                                "QR_CALL_NEW",
                                "Firebase listener cancelado: " +
                                        error.getMessage()
                        );
                    }
                };

        referenciaChamadaFirebase
                .addValueEventListener(
                        listenerChamadaFirebase
                );

        Log.d(
                "QR_CALL_NEW",
                "Observacao Firebase iniciada. unidadeId=" +
                        unidadeId
        );
    }

    private void iniciarForeground(
            String nome
    ) {
        NotificationManager manager =
                (NotificationManager)
                        getSystemService(
                                NOTIFICATION_SERVICE
                        );

        if (
                Build.VERSION.SDK_INT >=
                        Build.VERSION_CODES.O
        ) {
            NotificationChannel channel =
                    new NotificationChannel(
                            CHANNEL_ID,
                            "Chamada QR Acesso",
                            NotificationManager.IMPORTANCE_HIGH
                    );

            channel.setDescription(
                    "Mantém ativa a chamada recebida."
            );

            channel.setSound(null, null);

            manager.createNotificationChannel(
                    channel
            );
        }

        Intent chamadaIntent =
                new Intent(
                        this,
                        QrCallActivity.class
                );

        chamadaIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_SINGLE_TOP |
                Intent.FLAG_ACTIVITY_CLEAR_TOP
        );

        PendingIntent chamadaPendingIntent =
                PendingIntent.getActivity(
                        this,
                        9103,
                        chamadaIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT |
                        PendingIntent.FLAG_IMMUTABLE
                );

        NotificationCompat.Builder builder =
                new NotificationCompat.Builder(
                        this,
                        CHANNEL_ID
                )
                        .setSmallIcon(
                                getApplicationInfo().icon
                        )
                        .setContentTitle(
                                "QR Acesso"
                        )
                        .setContentText(
                                "Chamada de " + nome
                        )
                        .setCategory(
                                NotificationCompat.CATEGORY_CALL
                        )
                        .setOngoing(true)
                        .setPriority(
                                NotificationCompat.PRIORITY_MAX
                        )
                        .setContentIntent(
                                chamadaPendingIntent
                        )
                        .setFullScreenIntent(
                                chamadaPendingIntent,
                                true
                        );

        startForeground(
                NOTIFICATION_ID,
                builder.build()
        );
    }

    private void encerrarForeground() {
        try {
            if (
                    Build.VERSION.SDK_INT >=
                            Build.VERSION_CODES.N
            ) {
                stopForeground(
                        STOP_FOREGROUND_REMOVE
                );
            } else {
                stopForeground(true);
            }
        } catch (Exception ignored) {
        }
    }

    private void iniciarAlerta() {
        pararAlerta();

        try {
            Uri uri =
                    RingtoneManager.getDefaultUri(
                            RingtoneManager.TYPE_RINGTONE
                    );

            if (uri != null) {
                ringtone =
                        RingtoneManager.getRingtone(
                                this,
                                uri
                        );

                if (ringtone != null) {
                    ringtone.play();
                }
            }
        } catch (Exception e) {
            Log.e(
                    "QR_CALL_NEW",
                    "Erro ao iniciar ringtone",
                    e
            );
        }

        try {
            vibrator =
                    (Vibrator) getSystemService(
                            VIBRATOR_SERVICE
                    );

            if (vibrator != null) {

                long[] padrao = {
                        0,
                        700,
                        500,
                        700,
                        500
                };

                if (
                        Build.VERSION.SDK_INT >=
                                Build.VERSION_CODES.O
                ) {
                    vibrator.vibrate(
                            VibrationEffect.createWaveform(
                                    padrao,
                                    1
                            )
                    );
                } else {
                    vibrator.vibrate(
                            padrao,
                            1
                    );
                }
            }

        } catch (Exception e) {
            Log.e(
                    "QR_CALL_NEW",
                    "Erro ao iniciar vibracao",
                    e
            );
        }
    }

    private void pararAlerta() {
        try {
            if (
                    ringtone != null &&
                    ringtone.isPlaying()
            ) {
                ringtone.stop();
            }
        } catch (Exception ignored) {
        }

        ringtone = null;

        try {
            if (vibrator != null) {
                vibrator.cancel();
            }
        } catch (Exception ignored) {
        }

        vibrator = null;
    }

    @Override
    public void onDestroy() {
        try {
            unregisterReceiver(
                    receiverCancelarQrCall
            );
        } catch (Exception ignored) {
        }

        timeoutHandler.removeCallbacks(timeoutChamada);
        pararObservacaoFirebase();
        pararAlerta();
        encerrarForeground();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
