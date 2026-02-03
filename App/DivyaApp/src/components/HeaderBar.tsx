import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type Props = {
  onSwitchToChat?: () => void;
  showChatView?: boolean;
  onBackClick?: () => void;
  isConnected?: boolean;
  isConnecting?: boolean;
  responseModality?: 'AUDIO' | 'TEXT';
  onConnectionToggle?: () => void;
  onAudioEnable?: () => void;
  isAudioEnabled?: boolean;
  onToggleChatView?: () => void;
  onChatClick?: () => void;
  onLogout?: () => void;
  showBack?: boolean;
  isJsBusy?: boolean;
};

const HeaderBar = ({
  showChatView,
  onBackClick,
  isConnected,
  isConnecting,
  onConnectionToggle,
  onToggleChatView,
  onChatClick,
  onLogout,
  showBack,
  isJsBusy,
}: Props) => {
  return (
    <View style={styles.root}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBackClick}>
            <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <Path
                d="M15.8333 10H4.16666M4.16666 10L10 15.8333M4.16666 10L10 4.16666"
                stroke="white"
                strokeWidth={1.67}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Divya Darshak</Text>
      </View>

      <View style={styles.right}>
        <View
          style={[
            styles.busyDot,
            isJsBusy ? styles.busyOn : styles.busyOff,
          ]}
        />
        <TouchableOpacity onPress={onToggleChatView} style={styles.toggleBtn}>
          <Text style={styles.toggleText}>{showChatView ? 'Voice' : 'Chat'}</Text>
          <SwitchIcon />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onChatClick}
        >
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <LogoutIcon />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: '#E9842F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 36,
    height: 36,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFAF4',
    minWidth: 80,
    height: 30,
    borderRadius: 8,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  toggleText: {
    color: '#757575',
    fontSize: 13,
  },
  toggleIcon: {
    width: 16,
    height: 16,
  },
  connBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  connOn: {
    backgroundColor: 'rgba(34,197,94,0.3)',
  },
  connOff: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  connConnecting: {
    backgroundColor: 'rgba(234,179,8,0.2)',
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  busyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    marginRight: 6,
  },
  busyOn: {
    backgroundColor: '#DC2626',
  },
  busyOff: {
    backgroundColor: '#FDE047',
  },
});

export default HeaderBar;

const SwitchIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M7 7h13M4 7l3-3-3 3zm0 0l3 3-3-3zM17 17H4m16 0l-3-3 3 3zm0 0l-3 3 3-3z"
      stroke="#757575"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LogoutIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 3H6a2 2 0 00-2 2v14a2 2 0 002 2h9M10 12h10m0 0l-3-3m3 3l-3 3"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
