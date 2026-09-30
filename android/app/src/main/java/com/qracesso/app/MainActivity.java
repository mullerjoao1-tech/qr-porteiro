package com.qracesso.app;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends BridgeActivity {

    private AppUpdateManager appUpdateManager = null;

    private static volatile boolean activityVisivel = false;

    public static boolean isActivityVisivel() {
        return activityVisivel;
    }

    private String rotaPendente = null;
    private String acaoChamadaPendente = null;
    private android.widget.FrameLayout coberturaComunicado = null;
    private android.widget.TextView diagnosticoComunicadoView = null;
    private final android.os.Handler chamadaHandler =
        new android.os.Handler(android.os.Looper.getMainLooper());
    private android.widget.TextView coberturaChamada = null;
    private boolean aguardandoInterfaceChamada = false;
    private int tentativasInterfaceChamada = 0;
    private int confirmacoesInterfaceChamada = 0;

    private boolean aguardandoQrCallAtendimento = false;
    private final Runnable verificarQrCallAtendimento =
        new Runnable() {
            @Override
            public void run() {
                if (
                    !aguardandoQrCallAtendimento ||
                    getBridge() == null ||
                    getBridge().getWebView() == null
                ) {
                    return;
                }

                getBridge().getWebView().evaluateJavascript(
                    "Boolean(document.getElementById('qrcall-atendimento-pronto') || document.getElementById('qrcall-video-base-inerte'))",
                    resultado -> {
                        if ("true".equals(resultado)) {
                            revelarQrCallAtendimento();
                            return;
                        }

                        chamadaHandler.postDelayed(
                            verificarQrCallAtendimento,
                            50
                        );
                    }
                );
            }
        };

    // QRCALL_A9_7K_VIDEO_TRANSICAO
    private void ocultarQrCallAtendimentoVideo(Intent intent) {
        // QRCALL_TRANSICAO_DIRETA_LIVE
        // Nao esconder o WebView.
        // Nao criar tela preta.
        // Nao criar frame/imagem de cobertura.
        try {
            if (bridge != null && bridge.getWebView() != null) {
                bridge.getWebView().setVisibility(android.view.View.VISIBLE);
            }
        } catch (Exception ignored) {
        }
    }
    private void revelarQrCallAtendimento() {
        // QRCALL_TRANSICAO_DIRETA_LIVE
        // A propria Live principal assume a tela.
        try {
            if (bridge != null && bridge.getWebView() != null) {
                bridge.getWebView().setVisibility(android.view.View.VISIBLE);
            }
        } catch (Exception ignored) {
        }
    }
    private final Runnable verificarInterfaceChamada =
        new Runnable() {
            @Override
            public void run() {
                if (
                    !aguardandoInterfaceChamada ||
                    getBridge() == null ||
                    getBridge().getWebView() == null
                ) {
                    return;
                }

                getBridge().getWebView().evaluateJavascript(
                    "Boolean(document.body && document.body.innerText.includes('CHAMADA RECEBIDA'))",
                    resultado -> {
                        if ("true".equals(resultado)) {
                            confirmacoesInterfaceChamada++;

                            if (confirmacoesInterfaceChamada >= 5) {
                                revelarInterfaceChamada();
                                return;
                            }
                        } else {
                            confirmacoesInterfaceChamada = 0;
                        }

                        tentativasInterfaceChamada++;

                        if (tentativasInterfaceChamada >= 150) {
                            Log.w(
                                "MainActivity",
                                "Tempo limite aguardando interface web da chamada"
                            );
                            revelarInterfaceChamada();
                            return;
                        }

                        chamadaHandler.postDelayed(
                            verificarInterfaceChamada,
                            100
                        );
                    }
                );
            }
        };

    private void ocultarWebViewParaChamada() {
        aguardandoInterfaceChamada = true;
        tentativasInterfaceChamada = 0;
        confirmacoesInterfaceChamada = 0;
        chamadaHandler.removeCallbacks(verificarInterfaceChamada);

        if (
            getBridge() != null &&
            getBridge().getWebView() != null
        ) {
            getBridge().getWebView().setVisibility(
                android.view.View.INVISIBLE
            );
        }

        if (coberturaChamada == null) {
            coberturaChamada = new android.widget.TextView(this);
            coberturaChamada.setText("");
            coberturaChamada.setTextColor(android.graphics.Color.WHITE);
            coberturaChamada.setTextSize(26);
            coberturaChamada.setGravity(android.view.Gravity.CENTER);
            coberturaChamada.setBackgroundColor(
                android.graphics.Color.rgb(2, 6, 23)
            );
            coberturaChamada.setElevation(100f);

            addContentView(
                coberturaChamada,
                new android.view.ViewGroup.LayoutParams(
                    android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                    android.view.ViewGroup.LayoutParams.MATCH_PARENT
                )
            );
        }

        coberturaChamada.setVisibility(android.view.View.VISIBLE);
    }

    private void revelarInterfaceChamada() {
        aguardandoInterfaceChamada = false;
        chamadaHandler.removeCallbacks(verificarInterfaceChamada);

        if (
            getBridge() != null &&
            getBridge().getWebView() != null
        ) {
            getBridge().getWebView().setVisibility(
                android.view.View.VISIBLE
            );
        }

        if (coberturaChamada != null) {
            coberturaChamada.setVisibility(android.view.View.GONE);
        }
    }

    private void prepararTelaDeChamada() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            );
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {

        prepararTelaDeChamada();

        registerPlugin(CallControlPlugin.class);
        registerPlugin(QrCallLivePlugin.class);
        registerPlugin(MaterialPdfPlugin.class);
        registerPlugin(QrDownloadPlugin.class);
        registerPlugin(ComunicadoControlPlugin.class);
        super.onCreate(savedInstanceState);

        FirebaseMessaging.getInstance()
            .getToken()
            .addOnCompleteListener(task -> {
                if (!task.isSuccessful()) {
                    Log.e(
                        "FCM_NATIVO",
                        "Falha ao obter token FCM atual",
                        task.getException()
                    );
                    return;
                }

                String tokenAtual = task.getResult();

                Log.d(
                    "FCM_NATIVO",
                    "Token FCM atual obtido: " + tokenAtual
                );
            });

        handleIntent(getIntent());

        appUpdateManager = new AppUpdateManager(this);

        Intent intentInicial = getIntent();

        boolean abriuPorChamada =
            intentInicial != null &&
            (
                intentInicial.getBooleanExtra("qrcallAtendimento", false) ||
                intentInicial.getBooleanExtra("chamadaFullscreen", false)
            );

        if (!abriuPorChamada) {
            appUpdateManager.verificarAtualizacao();
        }
    }

    private void mostrarCoberturaComunicado(
        String titulo,
        String mensagem
    ) {
        if (titulo == null) titulo = "Novo comunicado";
        if (mensagem == null) mensagem = "";

        if (coberturaComunicado != null) {
            ((android.view.ViewGroup) coberturaComunicado.getParent())
                .removeView(coberturaComunicado);
        }

        android.widget.FrameLayout fundo =
            new android.widget.FrameLayout(this);

        fundo.setBackgroundColor(
            android.graphics.Color.rgb(248, 250, 252)
        );
        fundo.setElevation(200f);

        android.widget.LinearLayout card =
            new android.widget.LinearLayout(this);
        card.setOrientation(android.widget.LinearLayout.VERTICAL);
        card.setPadding(48, 42, 48, 42);
        card.setGravity(android.view.Gravity.CENTER_VERTICAL);

        android.graphics.drawable.GradientDrawable bg =
            new android.graphics.drawable.GradientDrawable();
        bg.setColor(android.graphics.Color.WHITE);
        bg.setCornerRadius(32f);
        card.setBackground(bg);
        card.setElevation(16f);

        android.widget.TextView rotulo =
            new android.widget.TextView(this);
        rotulo.setText("COMUNICADO");
        rotulo.setTextSize(13);
        rotulo.setTextColor(android.graphics.Color.rgb(37, 99, 235));
        rotulo.setTypeface(null, android.graphics.Typeface.BOLD);

        android.widget.TextView tituloView =
            new android.widget.TextView(this);
        tituloView.setText(titulo);
        tituloView.setTextSize(23);
        tituloView.setTextColor(android.graphics.Color.rgb(15, 23, 42));
        tituloView.setTypeface(null, android.graphics.Typeface.BOLD);
        tituloView.setPadding(0, 18, 0, 12);

        android.widget.TextView mensagemView =
            new android.widget.TextView(this);
        mensagemView.setText(mensagem);
        mensagemView.setTextSize(17);
        mensagemView.setTextColor(android.graphics.Color.rgb(71, 85, 105));

        android.widget.TextView carregando =
            new android.widget.TextView(this);
        carregando.setText("Abrindo comunicado...");
        diagnosticoComunicadoView = carregando;
        carregando.setTextSize(13);
        carregando.setTextColor(android.graphics.Color.rgb(100, 116, 139));
        carregando.setPadding(0, 26, 0, 0);

        card.addView(rotulo);
        card.addView(tituloView);
        card.addView(mensagemView);
        card.addView(carregando);

        android.widget.FrameLayout.LayoutParams cardParams =
            new android.widget.FrameLayout.LayoutParams(
                android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                android.view.ViewGroup.LayoutParams.WRAP_CONTENT
            );
        cardParams.gravity = android.view.Gravity.CENTER;
        cardParams.setMargins(40, 40, 40, 40);

        fundo.addView(card, cardParams);

        addContentView(
            fundo,
            new android.view.ViewGroup.LayoutParams(
                android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                android.view.ViewGroup.LayoutParams.MATCH_PARENT
            )
        );

        coberturaComunicado = fundo;
    }

    public void diagnosticoComunicado(String etapa) {
        runOnUiThread(() -> {
            if (diagnosticoComunicadoView != null) {
                diagnosticoComunicadoView.setText(
                    "Abrindo comunicado...\n" + etapa
                );
            }
        });
    }

    public void comunicadoWebPronto() {
        removerCoberturaComunicado();
    }

    private void removerCoberturaComunicado() {
        if (coberturaComunicado == null) return;

        android.view.ViewParent pai =
            coberturaComunicado.getParent();

        if (pai instanceof android.view.ViewGroup) {
            ((android.view.ViewGroup) pai)
                .removeView(coberturaComunicado);
        }

        coberturaComunicado = null;
        diagnosticoComunicadoView = null;
    }

    private void enviarParadaParaServicoDeChamada() {
        Log.d(
            "MainActivity",
            "Solicitacao de parada do alerta nativo"
        );

        Intent stopIntent =
            new Intent(this, IncomingCallService.class);

        stopIntent.setAction(
            IncomingCallService.ACTION_STOP
        );

        try {
            startService(stopIntent);
        } catch (Exception e) {
            Log.e(
                "MainActivity",
                "Erro ao enviar ACTION_STOP para IncomingCallService",
                e
            );
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);

        prepararTelaDeChamada();

        setIntent(intent);
        handleIntent(intent);
    }

    @Override
    public void onResume() {
        super.onResume();
        activityVisivel = true;
        abrirRotaPendente();

        if (appUpdateManager != null) {
            appUpdateManager.retomarAposPermissao();
        }
    }

    @Override
    public void onPause() {
        activityVisivel = false;
        super.onPause();
    }

    private void handleIntent(Intent intent) {
        if (intent == null) {
            return;
        }

        boolean qrcallAtendimento =
            intent.getBooleanExtra(
                "qrcallAtendimento",
                false
            );

        boolean qrcallAtendimentoVideo =
            intent.getBooleanExtra(
                "qrcallAtendimentoVideo",
                false
            );

        if (qrcallAtendimentoVideo) {
            // QRCALL_A9_7K_VIDEO_TRANSICAO
            ocultarQrCallAtendimentoVideo(intent);

        } else if (qrcallAtendimento) {
            // QRCALL_TRANSICAO_DIRETA_20260910
            aguardandoQrCallAtendimento = false;

            chamadaHandler.removeCallbacks(
                verificarQrCallAtendimento
            );

            revelarQrCallAtendimento();
        }
        if (intent.getBooleanExtra("chamadaFullscreen", false)) {
            ocultarWebViewParaChamada();
        }

        if (intent.getBooleanExtra("pararToqueChamada", false)) {
            enviarParadaParaServicoDeChamada();
        }

        String route =
            intent.getStringExtra("route");

        boolean comunicadoPush =
            intent.getBooleanExtra(
                "comunicadoPush",
                false
            );

        String comunicadoTitulo =
            intent.getStringExtra("comunicadoTitulo");

        String comunicadoMensagem =
            intent.getStringExtra("comunicadoMensagem");

        boolean chamadaFullscreen =
            intent.getBooleanExtra(
                "chamadaFullscreen",
                false
            );

        String acaoChamada =
            intent.getStringExtra("acaoChamada");

        if (
            acaoChamada != null &&
            !acaoChamada.trim().isEmpty()
        ) {
            acaoChamadaPendente =
                acaoChamada.trim();

            Log.d(
                "MainActivity",
                "Acao de chamada recebida para integracao futura: " +
                acaoChamadaPendente
            );
        }

        if (
            route != null &&
            !route.trim().isEmpty()
        ) {
            rotaPendente = route.trim();

            if (chamadaFullscreen) {
                rotaPendente +=
                    rotaPendente.contains("?")
                        ? "&chamadaFullscreen=1"
                        : "?chamadaFullscreen=1";
            }

            if (
                acaoChamadaPendente != null &&
                !acaoChamadaPendente.isEmpty()
            ) {
                rotaPendente +=
                    rotaPendente.contains("?")
                        ? "&acaoChamada=" + acaoChamadaPendente
                        : "?acaoChamada=" + acaoChamadaPendente;

                acaoChamadaPendente = null;
            }

            Log.d(
                "MainActivity",
                "Rota recebida pela notificacao: " +
                rotaPendente
            );

            if (
                comunicadoPush &&
                activityVisivel &&
                getBridge() != null &&
                getBridge().getWebView() != null
            ) {
                final String rotaComunicado =
                    rotaPendente;

                getBridge().getWebView().post(() -> {
                    try {
                        String rotaJs =
                            org.json.JSONObject.quote(
                                rotaComunicado
                            );

                        getBridge()
                            .getWebView()
                            .evaluateJavascript(
                                "window.dispatchEvent(new CustomEvent(" +
                                "'qr-acesso:abrir-comunicado'," +
                                "{detail:{route:" + rotaJs + "}}));",
                                null
                            );

                        rotaPendente = null;

                        Log.d(
                            "MainActivity",
                            "Comunicado enviado para navegacao interna: " +
                            rotaComunicado
                        );
                    } catch (Exception e) {
                        Log.e(
                            "MainActivity",
                            "Falha na navegacao interna do comunicado",
                            e
                        );

                        abrirRotaPendente();
                    }
                });

                return;
            }

            abrirRotaPendente();
        }
    }

    private void abrirRotaPendente() {
        if (
            rotaPendente == null ||
            rotaPendente.isEmpty()
        ) {
            return;
        }

        if (!activityVisivel) {
            return;
        }

        if (
            getBridge() == null ||
            getBridge().getWebView() == null
        ) {
            return;
        }

        final String route = rotaPendente;
        rotaPendente = null;

        getBridge()
            .getWebView()
            .post(() -> {
                try {
                    String origem =
                        getBridge()
                            .getWebView()
                            .getUrl();

                    if (
                        origem == null ||
                        origem.isEmpty()
                    ) {
                        rotaPendente = route;
                        return;
                    }

                    java.net.URI uri =
                        java.net.URI.create(origem);

                    String destino =
                        uri.getScheme() +
                        "://" +
                        uri.getAuthority() +
                        route;

                    Log.d(
                        "MainActivity",
                        "Abrindo rota da chamada: " +
                        destino
                    );

                    getBridge()
                        .getWebView()
                        .loadUrl(destino);

                    if (aguardandoQrCallAtendimento) {
                        chamadaHandler.post(
                            verificarQrCallAtendimento
                        );
                    }

                    if (aguardandoInterfaceChamada) {
                        chamadaHandler.post(
                            verificarInterfaceChamada
                        );
                    }

                } catch (Exception e) {
                    rotaPendente = route;

                    Log.e(
                        "MainActivity",
                        "Erro ao abrir rota da chamada",
                        e
                    );
                }
            });
    }

    @Override
    public void onDestroy() {
        chamadaHandler.removeCallbacks(verificarInterfaceChamada);
        chamadaHandler.removeCallbacks(verificarQrCallAtendimento);
        super.onDestroy();
    }
}


