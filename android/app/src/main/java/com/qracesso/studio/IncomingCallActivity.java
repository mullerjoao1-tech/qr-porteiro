package com.qracesso.studio;

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
        String motivoDisplay = (motivo != null && !motivo.trim().isEmpty()) ? motivo.trim() : "Chamada";

        TextView txtNome = findViewById(R.id.txt_nome_visitante);
        TextView txtMotivo = findViewById(R.id.txt_motivo_unidade);
        Button btnAtender = findViewById(R.id.btn_atender);
        Button btnNaoPossoAtender = findViewById(R.id.btn_nao_posso_atender);

        txtNome.setText(nomeDisplay);
        
        String infoCompleta = motivoDisplay;
        if (!unidadeDisplay.isEmpty()) {
            infoCompleta += " • Unidade " + unidadeDisplay;
        }
        txtMotivo.setText(infoCompleta);

        // Bloco 1: Ações apenas fecham a tela para teste isolado
        btnAtender.setOnClickListener(v -> finish());
        btnNaoPossoAtender.setOnClickListener(v -> finish());
    }
}
