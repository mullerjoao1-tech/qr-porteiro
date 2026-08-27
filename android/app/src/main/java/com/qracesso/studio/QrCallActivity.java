package com.qracesso.studio;

import org.json.JSONObject;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class QrCallActivity extends AppCompatActivity {

    private final android.os.Handler timeoutHandler =
            new android.os.Handler(android.os.Looper.getMainLooper());

    private final Runnable timeoutTela =
            new Runnable() {
                @Override
                public void run() {
                    finish();
                }
            };

    private final android.content.BroadcastReceiver receiverCancelarRemoto =
            new android.content.BroadcastReceiver() {
                @Override
                public void onReceive(
                        android.content.Context context,
                        Intent intent
                ) {
                    if (
                            intent == null ||
                            !QrCallService.ACTION_CANCEL_REMOTE.equals(
                                    intent.getAction()
                            )
                    ) {
                        return;
                    }

                    String unidadeIdRecebido =
                            intent.getStringExtra(
                                    QrCallService.EXTRA_UNIDADE_ID
                            );

                    String criadoEmRecebido =
                            intent.getStringExtra(
                                    "criadoEm"
                            );

                    String unidadeIdExibido =
                            getIntent().getStringExtra(
                                    QrCallService.EXTRA_UNIDADE_ID
                            );

                    String criadoEmExibido =
                            getIntent().getStringExtra(
                                    "criadoEm"
                            );

                    boolean mesmaChamada =
                            unidadeIdRecebido != null &&
                            criadoEmRecebido != null &&
                            unidadeIdRecebido.equals(unidadeIdExibido) &&
                            criadoEmRecebido.equals(criadoEmExibido);

                    if (mesmaChamada) {
                        finish();
                    }
                }
            };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        timeoutHandler.removeCallbacks(timeoutTela);
        timeoutHandler.postDelayed(
                timeoutTela,
                3 * 60 * 1000L
        );

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            );
        }

        getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        );

        setContentView(R.layout.activity_qr_call);

        android.content.IntentFilter filtroCancelar =
                new android.content.IntentFilter(
                        QrCallService.ACTION_CANCEL_REMOTE
                );

        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(
                    receiverCancelarRemoto,
                    filtroCancelar,
                    android.content.Context.RECEIVER_NOT_EXPORTED
            );
        } else {
            registerReceiver(
                    receiverCancelarRemoto,
                    filtroCancelar
            );
        }

        String nome =
                getIntent().getStringExtra("nome");

        String motivo =
                getIntent().getStringExtra("motivo");

        String unidadeId =
                getIntent().getStringExtra("unidadeId");

        if (nome == null || nome.trim().isEmpty()) {
            nome = "Visitante";
        }

        if (motivo == null || motivo.trim().isEmpty()) {
            motivo = "Não informado";
        }

        TextView txtNome =
                findViewById(R.id.qr_call_nome);

        TextView txtMotivo =
                findViewById(R.id.qr_call_motivo);

        Button btnAtender =
                findViewById(R.id.qr_call_atender);

        Button btnNaoPosso =
                findViewById(R.id.qr_call_nao_posso);

        txtNome.setText(nome.trim());
        txtMotivo.setText(
                "Motivo: " + motivo.trim()
        );

        btnAtender.setEnabled(true);
        btnNaoPosso.setEnabled(true);

        btnNaoPosso.setOnClickListener(v -> {
            btnNaoPosso.setEnabled(false);

            final String unidadeIdNaoPosso =
                    getIntent().getStringExtra(
                            QrCallService.EXTRA_UNIDADE_ID
                    );

            if (
                    unidadeIdNaoPosso == null ||
                    unidadeIdNaoPosso.trim().isEmpty()
            ) {
                btnNaoPosso.setEnabled(true);
                return;
            }

            com.google.firebase.database.DatabaseReference chamadaRef =
                    com.google.firebase.database.FirebaseDatabase
                            .getInstance(
                                    "https://qr-acesso-studio-default-rtdb.firebaseio.com"
                            )
                            .getReference("unidades-v2")
                            .child(unidadeIdNaoPosso.trim())
                            .child("chamada");

            java.util.Map<String, Object> atualizacao =
                    new java.util.HashMap<>();

            atualizacao.put(
                    "status",
                    "Encerrado"
            );

            atualizacao.put(
                    "mensagemResponsavel",
                    "NAO_POSSO_ATENDER"
            );

            atualizacao.put(
                    "notificar",
                    false
            );

            atualizacao.put(
                    "encerradoEm",
                    com.google.firebase.database.ServerValue.TIMESTAMP
            );

            chamadaRef.updateChildren(atualizacao)
                    .addOnSuccessListener(ignorado -> {
                        /*
                         * NAO damos finish() aqui.
                         * O QrCallService observa o mesmo Firebase.
                         * Ao enxergar status Encerrado ele para
                         * ringtone, foreground e fecha a Activity.
                         */
                    })
                    .addOnFailureListener(erro -> {
                        btnNaoPosso.setEnabled(true);
                        android.util.Log.e(
                                "QR_CALL_NEW",
                                "Falha ao encerrar pelo NAO POSSO",
                                erro
                        );
                    });
        });

        btnAtender.setOnClickListener(v -> {

            /*
             * 1. Para imediatamente a camada nativa da chamada.
             */
            Intent parar =
                    new Intent(
                            QrCallActivity.this,
                            QrCallService.class
                    );

            parar.setAction(
                    QrCallService.ACTION_STOP
            );

            try {
                startService(parar);
            } catch (Exception ignored) {
            }

            /*
             * 2. Abre SOMENTE a nova arquitetura
             * de atendimento.
             *
             * Nenhuma rota Morador V2 e utilizada.
             */
            if (
                    unidadeId != null &&
                    !unidadeId.trim().isEmpty()
            ) {
                Intent atendimento =
                        new Intent(
                                QrCallActivity.this,
                                MainActivity.class
                        );

                atendimento.addFlags(
                        Intent.FLAG_ACTIVITY_CLEAR_TOP |
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                );

                atendimento.putExtra(
                        "route",
                        "/atendimento-chamada/" +
                        unidadeId.trim() +
                        "?iniciar=1"
                );

                atendimento.putExtra(
                        "qrcallAtendimento",
                        true
                );

                startActivity(atendimento);
            }

            finish();
        });
    }

    @Override
    protected void onDestroy() {
        try {
            unregisterReceiver(
                    receiverCancelarRemoto
            );
        } catch (Exception ignored) {
        }

        timeoutHandler.removeCallbacks(timeoutTela);
        super.onDestroy();
    }
}
