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

    // QRCALL_A9_1_VIDEO_PREVIEW_ACTIVITY
    private QrCallVideoPreview videoPreview;

    // QRCALL_A9_14_PRESERVAR_NO_DESTROY
    private boolean preservarVideoPreviewNoDestroy =
            false;

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
                        encerrarVideoPreview();
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

        // QRCALL_A9_5F_LAYOUT_VIDEO
        String modalidadeChamada =
                getIntent().getStringExtra(
                        QrCallService.EXTRA_MODALIDADE_CHAMADA
                );

        boolean chamadaDeVideo =
                modalidadeChamada != null &&
                "video".equalsIgnoreCase(
                        modalidadeChamada.trim()
                );

        setContentView(
                chamadaDeVideo
                        ? R.layout.activity_qr_call_video
                        : R.layout.activity_qr_call
        );

        /*
         * QRCALL_A9_1_VIDEO_PREVIEW_START
         *
         * Chamadas comuns nao possuem sessao
         * qrcall-video-preview e permanecem iguais.
         */
        String unidadeIdPreview =
                getIntent().getStringExtra(
                        QrCallService.EXTRA_UNIDADE_ID
                );

        String criadoEmPreview =
                getIntent().getStringExtra(
                        "criadoEm"
                );

        if (
                unidadeIdPreview != null &&
                criadoEmPreview != null &&
                !unidadeIdPreview.trim().isEmpty() &&
                !criadoEmPreview.trim().isEmpty()
        ) {
            try {
                videoPreview =
                        new QrCallVideoPreview(
                                this,
                                unidadeIdPreview,
                                criadoEmPreview
                        );

                videoPreview.iniciar();

            } catch (Throwable erroPreview) {
                android.util.Log.w(
                        "QR_CALL_VIDEO_PREVIEW",
                        "Preview indisponivel; chamada continua.",
                        erroPreview
                );

                videoPreview =
                        null;
            }
        }

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
            motivo = "N\u00e3o informado";
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
            encerrarVideoPreview();
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
            // QRCALL_A9_10_ACEITE_DIRETO
            // Remove somente o A9-8 de fotografia/frame.
            // O balao nativo continua sendo o aceite definitivo.
            btnAtender.setEnabled(false);

            // QRCALL_A9_14_HANDOFF_ATENDER
            if (
                    chamadaDeVideo &&
                    videoPreview != null
            ) {
                try {
                    videoPreview.prepararHandoff();
                    preservarVideoPreviewNoDestroy =
                            true;
                } catch (Throwable erroHandoff) {
                    android.util.Log.w(
                            "QR_CALL_NEW",
                            "Falha ao preparar handoff de video.",
                            erroHandoff
                    );
                }
            }

            concluirAceite(
                    unidadeId,
                    chamadaDeVideo,
                    null
            );
        });
    }

    // QRCALL_A9_8_FRAME_PERSISTENTE_CONCLUIR_ACEITE
    private void concluirAceite(
            String unidadeId,
            boolean chamadaDeVideo,
            String caminhoFrame
    ) {
        if (
                isFinishing() ||
                (
                        Build.VERSION.SDK_INT >=
                                Build.VERSION_CODES.JELLY_BEAN_MR1 &&
                        isDestroyed()
                )
        ) {
            return;
        }

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
                    "?iniciar=1" +
                    (chamadaDeVideo ? "&video=1" : "&audio=1")
            );

            atendimento.putExtra(
                    "qrcallAtendimento",
                    true
            );

            atendimento.putExtra(
                    "qrcallAtendimentoVideo",
                    chamadaDeVideo
            );

            android.util.Log.d(
                    "QR_FRAME_TRANSICAO",
                    "6_ANTES_INTENT caminho=" + String.valueOf(caminhoFrame)
            );

            if (
                    caminhoFrame != null &&
                    !caminhoFrame.trim().isEmpty()
            ) {
                atendimento.putExtra(
                        "qrcallFramePath",
                        caminhoFrame.trim()
                );
            }

            startActivity(atendimento);
        }

        /*
         * O preview WebRTC sera encerrado pelo onDestroy(),
         * somente DEPOIS de a imagem persistente ja ter sido
         * entregue para a MainActivity.
         */
        finish();
    }

    // QRCALL_A9_1_VIDEO_PREVIEW_CLEANUP
    private synchronized void encerrarVideoPreview() {
        QrCallVideoPreview atual =
                videoPreview;

        videoPreview =
                null;

        if (atual != null) {
            try {
                atual.encerrar();
            } catch (Throwable ignored) {
            }
        }
    }
    @Override
    protected void onDestroy() {
        // QRCALL_A9_14_ONDESTROY_HANDOFF
        if (!preservarVideoPreviewNoDestroy) {
            encerrarVideoPreview();
        } else {
            videoPreview =
                    null;
        }
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
