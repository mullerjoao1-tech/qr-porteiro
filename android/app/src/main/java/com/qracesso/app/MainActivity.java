package com.qracesso.app;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static volatile boolean activityVisivel = false;

    public static boolean isActivityVisivel() {
        return activityVisivel;
    }

    private String rotaPendente = null;
    private String acaoChamadaPendente = null;
    private final android.os.Handler chamadaHandler =
        new android.os.Handler(android.os.Looper.getMainLooper());
    private android.widget.TextView coberturaChamada = null;
    private boolean aguardandoInterfaceChamada = false;
    private int tentativasInterfaceChamada = 0;
    private int confirmacoesInterfaceChamada = 0;

    private boolean aguardandoQrCallAtendimento = false;
    private android.widget.TextView coberturaQrCallAtendimento = null;

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
                    "Boolean(document.getElementById('qrcall-atendimento-pronto'))",
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

    private void revelarQrCallAtendimento() {
        aguardandoQrCallAtendimento = false;

        chamadaHandler.removeCallbacks(
            verificarQrCallAtendimento
        );

        if (
            getBridge() != null &&
            getBridge().getWebView() != null
        ) {
            getBridge()
                .getWebView()
                .setVisibility(
                    android.view.View.VISIBLE
                );
        }

        if (coberturaQrCallAtendimento != null) {
            coberturaQrCallAtendimento.setVisibility(
                android.view.View.GONE
            );
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
        super.onCreate(savedInstanceState);
        handleIntent(getIntent());
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

        if (intent.getBooleanExtra("qrcallAtendimento", false)) {
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

