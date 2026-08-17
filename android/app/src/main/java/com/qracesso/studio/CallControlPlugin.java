package com.qracesso.studio;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.JSObject;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.UUID;

@CapacitorPlugin(name = "CallControl")
public class CallControlPlugin extends Plugin {
    @PluginMethod
    public void stopIncomingCall(PluginCall call) {
        String diagnosticToken = UUID.randomUUID().toString();
        SharedPreferences preferences = getContext().getSharedPreferences(
                IncomingCallService.DIAGNOSTIC_PREFS,
                android.content.Context.MODE_PRIVATE
        );
        preferences.edit().clear().commit();

        Intent stopIntent =
                new Intent(getContext(), IncomingCallService.class);
        stopIntent.setAction(IncomingCallService.ACTION_STOP);
        stopIntent.putExtra(
                IncomingCallService.EXTRA_DIAGNOSTIC_TOKEN,
                diagnosticToken
        );

        try {
            getContext().startService(stopIntent);
            Log.d("CallControl", "ACTION_STOP enviado ao IncomingCallService");
            aguardarDiagnostico(
                    call,
                    diagnosticToken,
                    preferences,
                    0
            );
        } catch (Exception e) {
            Log.e("CallControl", "Erro ao parar alerta de chamada", e);
            call.reject("Não foi possível parar o alerta de chamada", e);
        }
    }

    private void aguardarDiagnostico(
            PluginCall call,
            String diagnosticToken,
            SharedPreferences preferences,
            int tentativa
    ) {
        boolean tokenCorreto = diagnosticToken.equals(
                preferences.getString("token", "")
        );
        boolean stopSelfExecutado = tokenCorreto &&
                preferences.getBoolean("stopSelfExecutado", false);

        if (stopSelfExecutado || tentativa >= 60) {
            JSObject resultado = new JSObject();
            resultado.put("ok", stopSelfExecutado);
            resultado.put("etapa", stopSelfExecutado
                    ? "STOP_SELF_EXECUTADO"
                    : "TIMEOUT_AGUARDANDO_SERVICO");
            resultado.put("pluginRecebeuChamada", true);
            resultado.put("actionStopEnviado", true);
            resultado.put(
                    "actionStopRecebido",
                    tokenCorreto && preferences.getBoolean("actionStopRecebido", false)
            );
            resultado.put(
                    "stopAlertExecutado",
                    tokenCorreto && preferences.getBoolean("stopAlertExecutado", false)
            );
            resultado.put(
                    "stopForegroundExecutado",
                    tokenCorreto && preferences.getBoolean("stopForegroundExecutado", false)
            );
            resultado.put(
                    "notificationCancelExecutado",
                    tokenCorreto && preferences.getBoolean("notificationCancelExecutado", false)
            );
            resultado.put("stopSelfExecutado", stopSelfExecutado);
            call.resolve(resultado);
            return;
        }

        new Handler(Looper.getMainLooper()).postDelayed(
                () -> aguardarDiagnostico(
                        call,
                        diagnosticToken,
                        preferences,
                        tentativa + 1
                ),
                50
        );
    }
}
