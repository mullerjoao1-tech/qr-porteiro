package com.qracesso.studio;

import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class QrCallActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

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

        String nome = getIntent().getStringExtra("nome");
        String motivo = getIntent().getStringExtra("motivo");

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

        txtNome.setText(nome.trim());
        txtMotivo.setText("Motivo: " + motivo.trim());

        /*
         * ETAPA 1:
         *
         * Os botoes sao somente visuais.
         * Nenhuma acao de atendimento existe ainda.
         */
    }
}