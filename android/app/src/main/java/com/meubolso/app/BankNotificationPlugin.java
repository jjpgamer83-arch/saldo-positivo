package com.meubolso.app;

import android.content.Context;
import android.content.Intent;
import android.provider.Settings;

import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Map;
import java.util.Set;

@CapacitorPlugin(name = "BankNotificationPlugin")
public class BankNotificationPlugin extends Plugin {

    private static BankNotificationPlugin instance;

    public static void notifyBankTransactionReceived(Map<String, Object> data) {
        if (instance != null) {
            JSObject jsObj = new JSObject();
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                jsObj.put(entry.getKey(), entry.getValue());
            }
            instance.notifyListeners("onBankNotificationReceived", jsObj);
        }
    }

    @Override
    public void load() {
        super.load();
        instance = this;
    }

    /**
     * Verifica se o usuário já habilitou o acesso especial de notificações para o app.
     */
    @PluginMethod
    public void checkPermission(PluginCall call) {
        Context ctx = getContext();
        Set<String> enabledPackages = NotificationManagerCompat.getEnabledListenerPackages(ctx);
        boolean isGranted = enabledPackages.contains(ctx.getPackageName());

        JSObject ret = new JSObject();
        ret.put("granted", isGranted);
        call.resolve(ret);
    }

    /**
     * Abre a tela oficial de configurações do sistema Android onde o usuário concede o acesso.
     */
    @PluginMethod
    public void requestPermission(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    /**
     * Retorna a lista de notificações bancárias acumuladas enquanto o app estava em segundo plano.
     */
    @PluginMethod
    public void getPendingNotifications(PluginCall call) {
        JSArray array = new JSArray();

        while (!BankNotificationService.pendingNotifications.isEmpty()) {
            Map<String, Object> item = BankNotificationService.pendingNotifications.poll();
            if (item == null) break;
            JSObject jsItem = new JSObject();
            for (Map.Entry<String, Object> entry : item.entrySet()) {
                jsItem.put(entry.getKey(), entry.getValue());
            }
            array.put(jsItem);
        }

        JSObject ret = new JSObject();
        ret.put("notifications", array);
        call.resolve(ret);
    }

    /**
     * Remove uma notificação específica já tratada.
     */
    @PluginMethod
    public void clearNotification(PluginCall call) {
        String id = call.getString("id");
        if (id != null) {
            BankNotificationService.pendingNotifications.removeIf(item -> id.equals(item.get("id")));
        }
        call.resolve();
    }
}
