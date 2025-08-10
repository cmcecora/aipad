import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Bell, Shield, CreditCard, CircleHelp as HelpCircle, LogOut, ChevronRight, Crown, Camera, Wifi, Database, Target } from 'lucide-react-native';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [highQuality, setHighQuality] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => console.log('Logout') }
      ]
    );
  };

  const handleUpgrade = () => {
    Alert.alert(
      'Upgrade to Premium',
      'Unlock advanced analytics, unlimited recordings, and priority support.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', onPress: () => console.log('Upgrade') }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1a1a1a', '#2a2a2a']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Customize your experience</Text>
      </LinearGradient>

      {/* Premium Banner */}
      <TouchableOpacity style={styles.premiumBanner} onPress={handleUpgrade}>
        <LinearGradient
          colors={['#FFD700', '#FFA500']}
          style={styles.premiumGradient}
        >
          <Crown size={24} color="#000" />
          <View style={styles.premiumContent}>
            <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
            <Text style={styles.premiumSubtitle}>Unlock advanced features</Text>
          </View>
          <ChevronRight size={20} color="#000" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <User size={20} color="#00D4FF" />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Profile Settings</Text>
            <Text style={styles.settingSubtitle}>Update your personal information</Text>
          </View>
          <ChevronRight size={20} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Shield size={20} color="#00D4FF" />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Privacy & Security</Text>
            <Text style={styles.settingSubtitle}>Manage your data and security</Text>
          </View>
          <ChevronRight size={20} color="#888" />
        </TouchableOpacity>
      </View>

      {/* Subscription Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <CreditCard size={20} color="#00D4FF" />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Billing & Payments</Text>
            <Text style={styles.settingSubtitle}>Manage your subscription</Text>
          </View>
          <ChevronRight size={20} color="#888" />
        </TouchableOpacity>
      </View>

      {/* App Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Preferences</Text>
        
        <View style={styles.settingItem}>
          <Bell size={20} color="#00D4FF" />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Notifications</Text>
            <Text style={styles.settingSubtitle}>Match alerts and updates</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#333', true: '#00D4FF' }}
            thumbColor={notifications ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.settingItem}>
          <Database size={20} color="#00D4FF" />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Auto Sync</Text>
            <Text style={styles.settingSubtitle}>Automatically sync data when online</Text>
          </View>
          <Switch
            value={autoSync}
            onValueChange={setAutoSync}
            trackColor={{ false: '#333', true: '#00D4FF' }}
            thumbColor={autoSync ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.settingItem}>
          <Camera size={20} color="#00D4FF" />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>High Quality Recording</Text>
            <Text style={styles.settingSubtitle}>Better quality, larger file sizes</Text>
          </View>
          <Switch
            value={highQuality}
            onValueChange={setHighQuality}
            trackColor={{ false: '#333', true: '#00D4FF' }}
            thumbColor={highQuality ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.settingItem}>
          <Target size={20} color="#00D4FF" />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>AI Processing Level</Text>
            <Text style={styles.settingSubtitle}>Advanced analysis uses more battery</Text>
          </View>
          <Switch
            value={true}
            onValueChange={() => {}}
            trackColor={{ false: '#333', true: '#00D4FF' }}
            thumbColor={'#fff'}
          />
        </View>
        <View style={styles.settingItem}>
          <Wifi size={20} color="#00D4FF" />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Offline Mode</Text>
            <Text style={styles.settingSubtitle}>Continue recording without internet</Text>
          </View>
          <Switch
            value={offlineMode}
            onValueChange={setOfflineMode}
            trackColor={{ false: '#333', true: '#00D4FF' }}
            thumbColor={offlineMode ? '#fff' : '#888'}
          />
        </View>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <HelpCircle size={20} color="#00D4FF" />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Help & Support</Text>
            <Text style={styles.settingSubtitle}>FAQs and contact support</Text>
          </View>
          <ChevronRight size={20} color="#888" />
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <View style={styles.appInfo}>
          <Text style={styles.appInfoTitle}>Raydel Padel Analytics</Text>
          <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
          <Text style={styles.appInfoCopyright}>© 2024 Raydel Technologies</Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color="#FF6B6B" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  premiumBanner: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  premiumGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumContent: {
    flex: 1,
    marginLeft: 12,
  },
  premiumTitle: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
  },
  premiumSubtitle: {
    fontSize: 14,
    color: '#000',
    opacity: 0.8,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appInfoTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  appInfoVersion: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  appInfoCopyright: {
    fontSize: 12,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 40,
  },
});