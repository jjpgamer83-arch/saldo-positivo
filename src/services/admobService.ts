import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  InterstitialAdPluginEvents,
} from '@capacitor-community/admob';
import { isCapacitorNative, waitForDeviceReady } from './notificationListener';

// ==========================================
// GOOGLE ADMOB CONFIGURAÇÕES E IDENTIFICADORES
// ==========================================

export const ADMOB_IDS = {
  APP_ID: 'ca-app-pub-2159452085267960~4576070561',
  BANNER_UNIT: 'ca-app-pub-2159452085267960/3518139762',
  INTERSTITIAL_UNIT: 'ca-app-pub-2159452085267960/3190836707',
} as const;

// Limiar para exibição do anúncio intersticial (a cada 3 transações)
const TRANSACTIONS_PER_INTERSTITIAL = 3;

// Estado interno do serviço
let isInitialized = false;
let isBannerActive = false;
let isPreparingInterstitial = false;
let isInterstitialReady = false;
let transactionCounter = 0;

/**
 * Inicializa o SDK do Google Mobile Ads (AdMob)
 * Executado com fallback seguro para não quebrar a versão web/preview.
 */
export async function initializeAdMob(): Promise<boolean> {
  if (isInitialized) return true;

  try {
    // No navegador / preview web, simula inicialização sem erros
    if (!isCapacitorNative()) {
      console.log('[AdMob Web Fallback]: Simulação ativa para web.');
      isInitialized = true;
      return true;
    }

    await waitForDeviceReady();

    // Inicializa o AdMob nativo para produção com os IDs reais do usuário
    await AdMob.initialize({
      initializeForTesting: false,
    });

    isInitialized = true;
    console.log('[AdMob Native]: Inicializado com sucesso.');

    // Registra listener para recarregar o Intersticial após o usuário fechá-lo
    try {
      await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        isInterstitialReady = false;
        console.log('[AdMob Interstitial]: Fechado pelo usuário. Preparando próximo...');
        preloadInterstitial().catch(() => {});
      });

      await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (err) => {
        isInterstitialReady = false;
        console.warn('[AdMob Interstitial]: Falha ao exibir:', err);
        preloadInterstitial().catch(() => {});
      });
    } catch (listenerErr) {
      console.warn('[AdMob]: Falha ao registrar listeners:', listenerErr);
    }

    // Pré-carrega o primeiro anúncio intersticial em background
    preloadInterstitial().catch(() => {});

    // Exibe o Banner inferior
    showBottomBanner().catch(err => {
      console.warn('[AdMob Banner]: Erro ao exibir banner inicial:', err);
    });

    return true;
  } catch (error) {
    console.warn('[AdMob]: Falha silenciosa na inicialização:', error);
    return false;
  }
}

/**
 * Exibe o Banner fixo inferior com margem segura acima da barra de navegação móvel (64dp)
 */
export async function showBottomBanner(): Promise<void> {
  if (!isCapacitorNative()) {
    console.log('[AdMob Web]: Banner simulado.');
    isBannerActive = true;
    return;
  }

  try {
    if (!isInitialized) {
      await initializeAdMob();
    }

    await AdMob.showBanner({
      adId: ADMOB_IDS.BANNER_UNIT,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 64, // Margem para posicionar acima da BottomNavigation do app
      isTesting: false,
    });

    isBannerActive = true;
    console.log('[AdMob Banner]: Exibido com sucesso acima da navegação.');
  } catch (error) {
    console.warn('[AdMob Banner]: Erro ao exibir banner:', error);
  }
}

/**
 * Oculta o Banner
 */
export async function hideBottomBanner(): Promise<void> {
  if (!isCapacitorNative() || !isBannerActive) return;

  try {
    await AdMob.hideBanner();
    isBannerActive = false;
  } catch (error) {
    console.warn('[AdMob Banner]: Erro ao ocultar banner:', error);
  }
}

/**
 * Pré-carrega um Anúncio Intersticial em background
 */
export async function preloadInterstitial(): Promise<void> {
  if (!isCapacitorNative()) return;
  if (isPreparingInterstitial || isInterstitialReady) return;

  try {
    isPreparingInterstitial = true;
    console.log('[AdMob Interstitial]: Pré-carregando...');

    await AdMob.prepareInterstitial({
      adId: ADMOB_IDS.INTERSTITIAL_UNIT,
      isTesting: false,
    });

    isInterstitialReady = true;
    isPreparingInterstitial = false;
    console.log('[AdMob Interstitial]: Pronto para exibição.');
  } catch (error) {
    isPreparingInterstitial = false;
    isInterstitialReady = false;
    console.warn('[AdMob Interstitial]: Erro no pré-carregamento:', error);
  }
}

/**
 * Exibe o Anúncio Intersticial se estiver carregado
 */
export async function showInterstitial(): Promise<boolean> {
  if (!isCapacitorNative()) {
    console.log('[AdMob Web]: Intersticial simulado (Web).');
    return true;
  }

  try {
    if (!isInterstitialReady) {
      console.log('[AdMob Interstitial]: Ainda não pronto. Forçando preload...');
      await preloadInterstitial();
    }

    if (isInterstitialReady) {
      await AdMob.showInterstitial();
      isInterstitialReady = false;
      return true;
    }
  } catch (error) {
    console.warn('[AdMob Interstitial]: Erro ao exibir anúncio:', error);
    isInterstitialReady = false;
    preloadInterstitial().catch(() => {});
  }

  return false;
}

/**
 * Incrementa o contador de transações salvas ou importadas via notificação.
 * A cada 3 transações, dispara o anúncio intersticial automaticamente.
 */
export async function recordTransactionActionAndMaybeShowInterstitial(): Promise<void> {
  transactionCounter += 1;
  console.log(`[AdMob]: Contador de transações: ${transactionCounter}/${TRANSACTIONS_PER_INTERSTITIAL}`);

  if (transactionCounter >= TRANSACTIONS_PER_INTERSTITIAL) {
    transactionCounter = 0;
    try {
      await showInterstitial();
    } catch (err) {
      console.warn('[AdMob]: Falha silenciosa ao tentar exibir intersticial de transação:', err);
    }
  }
}
