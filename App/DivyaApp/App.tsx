/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState, useCallback } from 'react';
import { PermissionsAndroid, Platform, StatusBar, StyleSheet, NativeModules } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import BootSplash from 'react-native-bootsplash';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';
import LoginScreen from './src/components/LoginScreen';
import AudioScreen from './src/components/AudioScreen';
import WelcomeScreen from './src/components/WelcomeScreen';
import ChatScreen from './src/components/ChatScreen';
import SignupScreen from './src/components/SignupScreen';
import InviteScreen from './src/components/InviteScreen';
import CameraScreen from './src/components/CameraScreen';
import ItineraryDetailScreen from './src/components/ItineraryDetailScreen';
import { wsService } from './src/services/wsService';
import { env } from './src/config/env';
import { sessionLogger } from './src/services/sessionLogger';
import { Itinerary } from './src/utils/itinerary';

function App() {
  const [screen, setScreen] = useState<'login' | 'signup' | 'invite' | 'welcome' | 'audio' | 'chat' | 'camera' | 'itinerary'>('login');
  const [token, setToken] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
  const [returnToScreen, setReturnToScreen] = useState<'audio' | 'chat' | 'camera' | 'welcome'>('audio');
  const [locationReady, setLocationReady] = useState(false);
  const [ticketLocation, setTicketLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const stored = await AsyncStorage.getItem('authToken');
        if (stored) {
          const parts = stored.split('.');
          let expOk = true;
          if (parts.length === 3) {
            try {
              const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
              if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
                expOk = false;
              }
            } catch {}
          }
          if (expOk) {
            setToken(stored);
            setScreen('welcome');
          } else {
            await AsyncStorage.removeItem('authToken');
          }
        }
      } catch {}
      // Allow intro text to show once per app launch.
      await AsyncStorage.removeItem('intro_seen_once');
      // Hide immediately (no fade) to shorten splash time.
      BootSplash.hide({ fade: false });
      setBooting(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    NativeModules.NativeOfflineBanner?.start?.();
  }, []);

  const requestLocationPermission = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    const alreadyGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    if (alreadyGranted) return;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'Allow location access to improve nearby suggestions.',
        buttonPositive: 'OK',
      },
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      console.log('[app] location permission denied');
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    AsyncStorage.getItem('location_permission_prompted')
      .then(val => {
        if (val === '1') return;
        void requestLocationPermission().finally(() => {
          void AsyncStorage.setItem('location_permission_prompted', '1');
        });
      })
      .catch(() => {
        void requestLocationPermission();
      });
  }, [token, requestLocationPermission]);

  useEffect(() => {
    if (!token) return;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      if (timeout) clearTimeout(timeout);
      setLocationReady(true);
    };

    // Avoid blocking WS connect forever if GPS hangs.
    timeout = setTimeout(() => {
      console.log('[app] location lookup timeout');
      finish();
    }, 5000);

    if (Platform.OS === 'ios' && Geolocation.requestAuthorization) {
      Geolocation.requestAuthorization('whenInUse');
    }

    Geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        setTicketLocation({ lat: latitude, lng: longitude });
        finish();
      },
      err => {
        console.log('[app] location lookup failed', err);
        finish();
      },
      {
        enableHighAccuracy: true,
        timeout: 4000,
        maximumAge: 60000,
      },
    );
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [token]);

  // Single shared WS connection (AUDIO modality by default for audio/camera)
  useEffect(() => {
    if (token && env.wsHost && locationReady) {
      wsService.connect({
        host: env.wsHost,
        apiKey: env.wsApiKey,
        authToken: token,
        modality: ['AUDIO', 'TEXT'],
        ticketLat: ticketLocation?.lat,
        ticketLng: ticketLocation?.lng,
      });
      return () => wsService.disconnect();
    }
  }, [token, locationReady, ticketLocation?.lat, ticketLocation?.lng]);

  const handleAuthSuccess = async (t: string) => {
    setToken(t);
    await AsyncStorage.setItem('authToken', t);
    setScreen('welcome');
  };

  const handleLogout = useCallback(async () => {
    await AsyncStorage.removeItem('authToken');
    wsService.disconnect();
    await sessionLogger.clear();
    setToken(null);
    setScreen('login');
    setSelectedItinerary(null);
  }, []);

  const openItinerary = (itinerary: Itinerary, from: 'audio' | 'chat' | 'camera' | 'welcome') => {
    setSelectedItinerary(itinerary);
    setReturnToScreen(from);
    setScreen('itinerary');
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f6fa" />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {booting ? null : (!token && screen === 'login') && (
          <LoginScreen
            onLoginSuccess={handleAuthSuccess}
            onSignup={() => setScreen('signup')}
            onInvite={() => setScreen('invite')}
          />
        )}
        {!token && screen === 'signup' && (
          <SignupScreen
            onSignupSuccess={handleAuthSuccess}
            onBackToLogin={() => setScreen('login')}
          />
        )}
        {!token && screen === 'invite' && (
          <InviteScreen onBack={() => setScreen('login')} />
        )}
        {token && screen === 'welcome' && (
          <WelcomeScreen
            onStartAudio={() => setScreen('audio')}
            onLogin={() => setScreen('login')}
          />
        )}
        {token && screen === 'audio' && (
          <AudioScreen
            token={token}
            onBack={() => setScreen('welcome')}
            onOpenChat={() => setScreen('chat')}
            onOpenCamera={() => setScreen('camera')}
            onOpenItinerary={itin => openItinerary(itin, 'audio')}
            onLogout={handleLogout}
          />
        )}
        {token && screen === 'chat' && (
          <ChatScreen
            token={token}
            onBack={() => setScreen('audio')}
            onOpenAudio={() => setScreen('audio')}
            onOpenCamera={() => setScreen('camera')}
            onOpenItinerary={itin => openItinerary(itin, 'chat')}
            onLogout={handleLogout}
          />
        )}
        {token && screen === 'camera' && (
          <CameraScreen
            token={token}
            onBack={() => setScreen('audio')}
            onLogout={handleLogout}
          />
        )}
        {token && screen === 'itinerary' && selectedItinerary && (
          <ItineraryDetailScreen
            itinerary={selectedItinerary}
            onBack={() => setScreen(returnToScreen)}
            onLogout={handleLogout}
            isConnected={wsService.isOpen()}
            isConnecting={!wsService.isOpen()}
            onOpenAudio={() => setScreen('audio')}
            onOpenChat={() => setScreen('chat')}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
});

export default App;
