package com.qracesso.studio;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.widget.Button;
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

        txtNome.setText(nome.trim());
        txtMotivo.setText(
                "Motivo: " + motivo.trim()
        );

        btnAtender.setEnabled(true);

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
}