package com.qracesso.studio;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.util.Log;

public class IncomingCallService extends Service {

    public static final String ACTION_START =
            "com.qracesso.studio.ACTION_START_CALL";

    public static final String ACTION_STOP =
            "com.qracesso.studio.ACTION_STOP_CALL";

    public static final String EXTRA_UNIDADE_ID =
            "unidadeId";

    public static final String EXTRA_NOME =
            "nome";

    public static final String EXTRA_MOTIVO =
            "motivo";

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

        if (ACTION_START.equals(action)) {

            String unidadeId =
                    intent.getStringExtra(EXTRA_UNIDADE_ID);

            String nome =
                    intent.getStringExtra(EXTRA_NOME);

            String motivo =
                    intent.getStringExtra(EXTRA_MOTIVO);

            Log.d(
                    "QR_CALL_ZERO",
                    "CHAMADA RECEBIDA NO TERRENO ZERO" +
                    " unidadeId=" + unidadeId +
                    " nome=" + nome +
                    " motivo=" + motivo
            );

            /*
             * TERRENO ZERO.
             *
             * Nenhuma chamada e exibida.
             * Nenhum ringtone e iniciado.
             * Nenhuma vibracao e iniciada.
             * Nenhuma Activity e aberta.
             * Nenhum overlay e aberto.
             * Nenhuma WebView e manipulada.
             *
             * A nova arquitetura nasce daqui.
             */

            stopSelf();

        } else if (ACTION_STOP.equals(action)) {

            Log.d(
                    "QR_CALL_ZERO",
                    "STOP recebido no terreno zero"
            );

            stopSelf();
        }

        return START_NOT_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
