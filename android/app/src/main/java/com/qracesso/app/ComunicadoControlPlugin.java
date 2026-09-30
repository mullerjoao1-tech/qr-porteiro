package com.qracesso.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ComunicadoControl")
public class ComunicadoControlPlugin extends Plugin {

    @PluginMethod
    public void comunicadoPronto(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (getActivity() instanceof MainActivity) {
                MainActivity activity =
                    (MainActivity) getActivity();

                android.util.Log.d(
                    "ComunicadoControl",
                    "WEB PRONTO - removendo cobertura"
                );

                /*
                 * DIAGNOSTICO TEMPORARIO:
                 * mostra que o React chegou ate o plugin.
                 * Depois de 1 segundo mantém o comportamento
                 * original e remove a cobertura.
                 */
                activity.diagnosticoComunicado(
                    "WEB PRONTO"
                );

                new android.os.Handler(
                    android.os.Looper.getMainLooper()
                ).postDelayed(
                    () -> activity.comunicadoWebPronto(),
                    1000
                );
            }

            JSObject retorno = new JSObject();
            retorno.put("ok", true);
            call.resolve(retorno);
        });
    }
}