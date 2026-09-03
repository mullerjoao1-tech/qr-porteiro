package com.qracesso.app;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

public class IncomingCallActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Configuração de visibilidade acima do lockscreen
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            );
        }

        setContentView(R.layout.activity_incoming_call);

        // Recuperar Dados do Intent
        String nome = getIntent().getStringExtra("nome");
        String unidadeId = getIntent().getStringExtra("unidadeId");
        String motivo = getIntent().getStringExtra("motivo");
        
        // Tratar valores ausentes de forma segura
        String nomeDisplay = (nome != null && !nome.trim().isEmpty()) ? nome.trim() : "Visitante";
        String unidadeDisplay = (unidadeId != null && !unidadeId.trim().isEmpty()) ? unidadeId.trim() : "";
        String motivoDisplay = (motivo != null && !motivo.trim().isEmpty()) ? motivo.trim() : "Não informado";

        TextView txtNome = findViewById(R.id.txt_nome_visitante);
        TextView txtMotivo = findViewById(R.id.txt_motivo_unidade);
        Button btnAtender = findViewById(R.id.btn_atender);
        Button btnNaoPossoAtender = findViewById(R.id.btn_nao_posso_atender);

        txtNome.setText(nomeDisplay);
        
        // Evitar duplicidade visual (Nome vs Motivo)
        String motivoFinal = "Motivo: " + motivoDisplay;
        if (!unidadeDisplay.isEmpty()) {
            motivoFinal += " • Unidade " + unidadeDisplay;
        }
        
        // Se o motivo for idêntico ao nome, omitimos o prefixo redundante
        if (motivoDisplay.equalsIgnoreCase(nomeDisplay)) {
            txtMotivo.setText("Unidade " + unidadeDisplay);
        } else {
            txtMotivo.setText(motivoFinal);
        }

        // Bloco 2B: Ações ainda apenas fecham a tela
        btnAtender.setOnClickListener(v ->
                encaminharAcaoParaPainel("atender", unidadeDisplay)
        );
        btnNaoPossoAtender.setOnClickListener(v ->
                encaminharAcaoParaPainel("nao-posso-atender", unidadeDisplay)
        );
    }

    private void encaminharAcaoParaPainel(
            String acao,
            String unidadeId
    ) {
        // Para imediatamente ringtone, vibracao e foreground.
        Intent stopIntent =
                new Intent(this, IncomingCallService.class);
        stopIntent.setAction(IncomingCallService.ACTION_STOP);

        try {
            startService(stopIntent);
        } catch (Exception ignored) {
        }

        // Entrega a acao ao mesmo painel Morador V2 ja usado no fluxo aberto.
        String route = "/morador-v2/" + unidadeId;

        Intent painelIntent =
                new Intent(this, MainActivity.class);

        painelIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_SINGLE_TOP |
                Intent.FLAG_ACTIVITY_CLEAR_TOP
        );

        painelIntent.putExtra("route", route);
        painelIntent.putExtra("pararToqueChamada", true);
        painelIntent.putExtra("acaoChamada", acao);

        startActivity(painelIntent);
        finish();
    }

}
