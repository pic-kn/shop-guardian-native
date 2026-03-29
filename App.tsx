import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppProvider } from './src/context/AppContext';
import { colors } from './src/theme/colors';
import { typography } from './src/theme/typography';
import HomeScreen from './src/screens/HomeScreen';
import WasteScreen from './src/screens/WasteScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { Package, Trash2, BarChart2, Settings } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ color, size }) => {
                const iconProps = { color, size: 24, strokeWidth: 2 };
                if (route.name === '発注') return <Package {...iconProps} />;
                if (route.name === '廃棄') return <Trash2 {...iconProps} />;
                if (route.name === '分析') return <BarChart2 {...iconProps} />;
                if (route.name === '設定') return <Settings {...iconProps} />;
                return null;
              },
              tabBarActiveTintColor: colors.text,
              tabBarInactiveTintColor: colors.border,
              tabBarStyle: {
                backgroundColor: colors.surface,
                borderTopWidth: 1,
                borderTopColor: colors.borderSubtle,
                height: 60,
                paddingBottom: 8,
              },
              tabBarLabelStyle: {
                fontSize: 10,
                fontWeight: '700',
              },
              headerStyle: {
                backgroundColor: colors.background,
                elevation: 0,
                shadowOpacity: 0,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderSubtle,
              },
              headerTitleStyle: {
                ...typography.h3,
                letterSpacing: 1,
              },
            })}
          >
            <Tab.Screen name="発注" component={HomeScreen} />
            <Tab.Screen name="廃棄" component={WasteScreen} />
            <Tab.Screen name="分析" component={AnalysisScreen} />
            <Tab.Screen name="設定" component={SettingsScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
