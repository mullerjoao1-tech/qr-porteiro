package com.qracesso.app;

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

            final String criadoEmNaoPosso =
                    getIntent().getStringExtra("criadoEm");

            final String responsavelUidNaoPosso =
                    getIntent().getStringExtra(
                            QrCallService.EXTRA_RESPONSAVEL_UID
                    );

            if (
                    unidadeIdNaoPosso == null ||
                    criadoEmNaoPosso == null ||
                    responsavelUidNaoPosso == null ||
                    unidadeIdNaoPosso.trim().isEmpty() ||
                    criadoEmNaoPosso.trim().isEmpty() ||
                    responsavelUidNaoPosso.trim().isEmpty()
            ) {
                android.util.Log.e(
                        "QR_CALL_NEW",
                        "NAO POSSO sem identidade completa"
                );

                btnNaoPosso.setEnabled(true);
                return;
            }

            new Thread(() -> {
                HttpURLConnection conexao = null;

                try {
                    URL url = new URL(
                            "https://qracesso.vercel.app/api/qrcall/nao-posso-atender"
                    );

                    conexao =
                            (HttpURLConnection) url.openConnection();

                    conexao.setRequestMethod("POST");
                    conexao.setConnectTimeout(10000);
                    conexao.setReadTimeout(15000);
                    conexao.setDoOutput(true);

                    conexao.setRequestProperty(
                            "Content-Type",
                            "application/json; charset=UTF-8"
                    );

                    JSONObject corpo = new JSONObject();

                    corpo.put(
                            "unidadeId",
                            unidadeIdNaoPosso.trim()
                    );

                    corpo.put(
                            "criadoEmEsperado",
                            criadoEmNaoPosso.trim()
                    );

                    corpo.put(
                            "responsavelUidEsperado",
                            responsavelUidNaoPosso.trim()
                    );

                    byte[] bytes =
                            corpo.toString().getBytes(
                                    StandardCharsets.UTF_8
                            );

                    try (OutputStream output =
                                 conexao.getOutputStream()) {
                        output.write(bytes);
                    }

                    int codigo =
                            conexao.getResponseCode();

                    android.util.Log.d(
                            "QR_CALL_NEW",
                            "NAO POSSO HTTP=" + codigo
                    );

                    if (
                            codigo < 200 ||
                            codigo >= 300
                    ) {
                        runOnUiThread(() ->
                                btnNaoPosso.setEnabled(true)
                        );
                    }

                    /*
                     * Em sucesso nao fazemos finish()
                     * nem ACTION_STOP.
                     *
                     * Se houver R2, a API muda o responsavel
                     * e o listener Firebase encerra o R1.
                     *
                     * Se nao houver R2, a API muda o status
                     * para Encerrado e o mesmo listener fecha.
                     */

                } catch (Exception erro) {
                    android.util.Log.e(
                            "QR_CALL_NEW",
                            "Erro no NAO POSSO",
                            erro
                    );

                    runOnUiThread(() ->
                            btnNaoPosso.setEnabled(true)
                    );

                } finally {
                    if (conexao != null) {
                        conexao.disconnect();
                    }
                }
            }).start();
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

            /*
             * Identidade exata da chamada que originou este STOP.
             * Um STOP antigo nao pode encerrar uma chamada nova.
             */
            parar.putExtra(
                    QrCallService.EXTRA_UNIDADE_ID,
                    getIntent().getStringExtra(
                            QrCallService.EXTRA_UNIDADE_ID
                    )
            );

            parar.putExtra(
                    "criadoEm",
                    getIntent().getStringExtra("criadoEm")
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
