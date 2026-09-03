package com.qracesso.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "CallControl")
public class CallControlPlugin extends Plugin {

    /*
     * TERRENO ZERO DA NOVA CHAMADA.
     *
     * O plugin permanece registrado temporariamente
     * para nao quebrar o codigo web existente.
     *
     * Nenhuma logica antiga de chamada e executada aqui.
     */

    @PluginMethod
    public void stopIncomingCall(PluginCall call) {
        call.resolve();
    }
}