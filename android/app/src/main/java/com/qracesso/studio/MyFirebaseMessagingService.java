package com.qracesso.studio;

import android.util.Log;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "FCM_NATIVO";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Map<String, String> data = remoteMessage.getData();
        if (data != null && "chamada-v2".equals(data.get("tipo"))) {
            Log.d(TAG, "Chamada V2 recebida: " + data.toString());
        }
    }
}
