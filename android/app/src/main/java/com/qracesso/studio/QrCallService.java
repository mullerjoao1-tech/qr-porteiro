package com.qracesso.studio;

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

public class QrCallService extends Service {

    public static final String ACTION_START =
            "com.qracesso.studio.QR_CALL_START";

    public static final String ACTION_STOP =
            "com.qracesso.studio.QR_CALL_STOP";

    public static final String EXTRA_UNIDADE_ID = "unidadeId";
    public static final String EXTRA_NOME = "nome";
    public static final String EXTRA_MOTIVO = "motivo";

    private Ringtone ringtone;
    private Vibrator vibrator;

    @Override
    public int onStartCommand(
            Intent intent,
            int flags,
            int startId
    ) {
        if (intent == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        String action = intent.getAction();

        if (ACTION_STOP.equals(action)) {
            pararAlerta();
            stopSelf();
            return START_NOT_STICKY;
        }

        if (!ACTION_START.equals(action)) {
            stopSelf();
            return START_NOT_STICKY;
        }

        String unidadeId =
                intent.getStringExtra(EXTRA_UNIDADE_ID);

        String nome =
                intent.getStringExtra(EXTRA_NOME);

        String motivo =
                intent.getStringExtra(EXTRA_MOTIVO);

        Log.d(
                "QR_CALL_NEW",
                "Nova chamada recebida. unidadeId=" + unidadeId
        );

        iniciarAlerta();

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

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
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
        pararAlerta();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}