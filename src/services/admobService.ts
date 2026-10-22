import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  InterstitialAdPluginEvents,
} from '@capacitor-community/admob';
import { waitForDeviceReady } from './notificationListener';

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
 * Verifica com segurança total se o ambiente é nativo e se o AdMob está disponível
 */
export function isAdMobSupported(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if (!Capacitor.isNativePlatform()) return false;
    if (typeof Capacitor.isPluginAvailable === 'function' && !Capacitor.isPluginAvailable('AdMob')) {
      return false;
    }
    return true;
  } catch (error) {
    console.warn('AdMob error ignored (support check):', error);
    return false;
  }
}

/**
 * Inicializa o SDK do Google Mobile Ads (AdMob)
 * Totalmente blindado com try/catch e initializeForTesting: true para homologação no Android
 */
export async function initializeAdMob(): Promise<boolean> {
  if (isInitialized) return true;

  try {
    // Se não for ambiente nativo Android/iOS, simula sem executar código nativo
    if (!isAdMobSupported()) {
      console.log('[AdMob]: Ambiente Web/Preview ou plugin nativo ausente. Modo silencioso ativado.');
      isInitialized = true;
      return true;
    }

    // Aguarda o evento deviceready para garantir que o bridge nativo está pronto
    try {
      await waitForDeviceReady();
    } catch (e) {
      console.warn('AdMob error ignored (deviceready wait):', e);
    }

    // Inicializa o AdMob com initializeForTesting: true temporariamente enquanto não aprovado na Play Store
    await AdMob.initialize({
      initializeForTesting: true,
    });

    isInitialized = true;
    console.log('[AdMob Native]: Inicializado com sucesso em modo de teste/desenvolvimento.');

    // Registra listeners de forma segura
    try {
      await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        try {
          isInterstitialReady = false;
          preloadInterstitial().catch(() => {});
        } catch (e) {
          console.warn('AdMob error ignored (dismissed callback):', e);
        }
      });

      await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (err) => {
        try {
          isInterstitialReady = false;
          console.warn('AdMob error ignored (failed to show):', err);
          preloadInterstitial().catch(() => {});
        } catch (e) {
          console.warn('AdMob error ignored (failed to show callback):', e);
        }
      });
    } catch (listenerErr) {
      console.warn('AdMob error ignored (listeners):', listenerErr);
    }

    // Pré-carrega o primeiro anúncio intersticial em background
    try {
      preloadInterstitial().catch(() => {});
    } catch (e) {
      console.warn('AdMob error ignored (preload initial):', e);
    }

    // Exibe o Banner inferior após 500ms da inicialização
    setTimeout(() => {
      showBottomBanner().catch(err => {
        console.warn('AdMob error ignored (initial banner):', err);
      });
    }, 500);

    return true;
  } catch (error) {
    console.warn('AdMob error ignored (initialization):', error);
    return false;
  }
}

/**
 * Exibe o Banner fixo inferior com margem segura acima da barra de navegação móvel (64dp)
 */
export async function showBottomBanner(): Promise<void> {
  try {
    if (!isAdMobSupported()) {
      isBannerActive = true;
      return;
    }

    if (!isInitialized) {
      await initializeAdMob();
    }

    await AdMob.showBanner({
      adId: ADMOB_IDS.BANNER_UNIT,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 64, // Margem para posicionar acima da BottomNavigation do app
      isTesting: true, // Modo seguro durante testes de desenvolvimento
    });

    isBannerActive = true;
    console.log('[AdMob Banner]: Exibido com sucesso.');
  } catch (error) {
    console.warn('AdMob error ignored (showBanner):', error);
  }
}

/**
 * Oculta o Banner com segurança
 */
export async function hideBottomBanner(): Promise<void> {
  try {
    if (!isAdMobSupported() || !isBannerActive) return;
    await AdMob.hideBanner();
    isBannerActive = false;
  } catch (error) {
    console.warn('AdMob error ignored (hideBanner):', error);
  }
}

/**
 * Pré-carrega um Anúncio Intersticial em background
 */
export async function preloadInterstitial(): Promise<void> {
  try {
    if (!isAdMobSupported()) return;
    if (isPreparingInterstitial || isInterstitialReady) return;

    isPreparingInterstitial = true;

    await AdMob.prepareInterstitial({
      adId: ADMOB_IDS.INTERSTITIAL_UNIT,
      isTesting: true, // Modo seguro durante testes de desenvolvimento
    });

    isInterstitialReady = true;
    isPreparingInterstitial = false;
    console.log('[AdMob Interstitial]: Pré-carregado com sucesso.');
  } catch (error) {
    isPreparingInterstitial = false;
    isInterstitialReady = false;
    console.warn('AdMob error ignored (prepareInterstitial):', error);
  }
}

/**
 * Exibe o Anúncio Intersticial se estiver carregado
 */
export async function showInterstitial(): Promise<boolean> {
  try {
    if (!isAdMobSupported()) {
      return true;
    }

    if (!isInterstitialReady) {
      await preloadInterstitial();
    }

    if (isInterstitialReady) {
      await AdMob.showInterstitial();
      isInterstitialReady = false;
      return true;
    }
  } catch (error) {
    console.warn('AdMob error ignored (showInterstitial):', error);
    isInterstitialReady = false;
    try {
      preloadInterstitial().catch(() => {});
    } catch {}
  }

  return false;
}

/**
 * Incrementa o contador de transações salvas ou importadas via notificação.
 * A cada 3 transações, dispara o anúncio intersticial automaticamente de forma não bloqueante.
 */
export async function recordTransactionActionAndMaybeShowInterstitial(): Promise<void> {
  try {
    transactionCounter += 1;
    console.log(`[AdMob]: Contador de transações: ${transactionCounter}/${TRANSACTIONS_PER_INTERSTITIAL}`);

    if (transactionCounter >= TRANSACTIONS_PER_INTERSTITIAL) {
      transactionCounter = 0;
      setTimeout(() => {
        showInterstitial().catch(err => {
          console.warn('AdMob error ignored (transaction interstitial):', err);
        });
      }, 400);
    }
  } catch (error) {
    console.warn('AdMob error ignored (recordTransactionAction):', error);
  }
}
