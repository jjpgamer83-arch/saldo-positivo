package com.meubolso.app;

import android.app.Notification;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentLinkedQueue;

/**
 * Serviço nativo Android para escutar notificações postadas por bancos brasileiros autorizados.
 * Requer permissão explícita concedida pelo usuário em Configurações > Acesso a notificações.
 */
public class BankNotificationService extends NotificationListenerService {

    private static final String TAG = "BankNotificationService";

    // Whitelist rigorosa de bancos brasileiros
    public static final Set<String> WHITELIST_PACKAGES = Collections.unmodifiableSet(
        new HashSet<>(Arrays.asList(
            "com.nu.production",        // Nubank
            "com.itau",                 // Itaú
            "br.com.bb.android",        // Banco do Brasil
            "com.bradesco",             // Bradesco
            "com.intermedium",          // Banco Inter
            "com.santander.app",        // Santander
            "com.mercadopago.wallet",   // Mercado Pago
            "br.com.c6bank.app",        // C6 Bank
            "br.com.gabba.caixa",       // Caixa Econômica
            "com.picpay"                // PicPay
        ))
    );

    // Fila segura em memória para notificações bancárias pendentes
    public static final ConcurrentLinkedQueue<Map<String, Object>> pendingNotifications = new ConcurrentLinkedQueue<>();
    public static BankNotificationService listenerInstance = null;

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        listenerInstance = this;
        Log.i(TAG, "BankNotificationService conectado com sucesso!");
    }

    @Override
    public void onListenerDisconnected() {
        super.onListenerDisconnected();
        listenerInstance = null;
        Log.i(TAG, "BankNotificationService desconectado.");
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) return;

        String packageName = sbn.getPackageName();
        if (packageName == null) return;

        // 1. FILTRO DE PRIVACIDADE: Processa única e exclusivamente apps bancários da whitelist
        if (!WHITELIST_PACKAGES.contains(packageName)) {
            return;
        }

        try {
            Notification notification = sbn.getNotification();
            if (notification == null) return;

            Bundle extras = notification.extras;
            if (extras == null) return;

            CharSequence titleSeq = extras.getCharSequence(Notification.EXTRA_TITLE);
            CharSequence textSeq = extras.getCharSequence(Notification.EXTRA_TEXT);
            CharSequence bigTextSeq = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);

            String title = titleSeq != null ? titleSeq.toString() : "";
            String text = textSeq != null ? textSeq.toString() : "";
            String bigText = bigTextSeq != null ? bigTextSeq.toString() : "";

            // Se o texto não tiver conteúdo, ignora
            if (title.trim().isEmpty() && text.trim().isEmpty()) {
                return;
            }

            // Mapeia os dados estruturados
            Map<String, Object> notificationMap = new HashMap<>();
            notificationMap.put("id", sbn.getKey() + "_" + sbn.getPostTime());
            notificationMap.put("packageName", packageName);
            notificationMap.put("bankName", getBankName(packageName));
            notificationMap.put("title", title);
            notificationMap.put("text", text);
            notificationMap.put("bigText", bigText);
            notificationMap.put("timestamp", sbn.getPostTime());

            // Insere na fila de pendentes
            pendingNotifications.add(notificationMap);
            Log.d(TAG, "Notificação bancária capturada: " + packageName + " - " + text);

            // Se o plugin Capacitor estiver registrado, despacha o evento em tempo real
            BankNotificationPlugin.notifyBankTransactionReceived(notificationMap);

        } catch (Exception e) {
            Log.e(TAG, "Erro ao processar notificação bancária: " + e.getMessage(), e);
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // Nada a fazer ao remover notificação
    }

    private String getBankName(String pkg) {
        if ("com.nu.production".equals(pkg)) return "Nubank";
        if ("com.itau".equals(pkg)) return "Itaú";
        if ("br.com.bb.android".equals(pkg)) return "Banco do Brasil";
        if ("com.bradesco".equals(pkg)) return "Bradesco";
        if ("com.intermedium".equals(pkg)) return "Banco Inter";
        if ("com.santander.app".equals(pkg)) return "Santander";
        if ("com.mercadopago.wallet".equals(pkg)) return "Mercado Pago";
        if ("br.com.c6bank.app".equals(pkg)) return "C6 Bank";
        if ("br.com.gabba.caixa".equals(pkg)) return "Caixa Econômica";
        if ("com.picpay".equals(pkg)) return "PicPay";
        return "Banco";
    }
}
