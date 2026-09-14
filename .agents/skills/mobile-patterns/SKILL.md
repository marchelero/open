---
name: mobile-patterns
description: Use this skill when building mobile applications with React Native, Flutter, or native iOS/Android. Covers navigation, state management, offline support, push notifications, and platform-specific patterns.
triggers: [React Native, Flutter, iOS, Android, mobile app, push notifications, offline support, mobile navigation, mobile state]
origin: starter-pack
---

# Mobile Development Patterns

Patterns for building cross-platform and native mobile applications.

## When to Activate

- Building React Native or Flutter apps
- Implementing mobile navigation
- Adding offline support
- Setting up push notifications
- Handling platform-specific code
- Optimizing mobile performance

## React Native Patterns

### Navigation (React Navigation)

```typescript
// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### Tab Navigation

```typescript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          )
        }}
      />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
```

### State Management (Zustand)

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthStore {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: async (email, password) => {
        const response = await api.login(email, password);
        set({ user: response.user, token: response.token });
      },
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### Offline Support

```typescript
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

class OfflineManager {
  private isOnline = true;
  private pendingActions: Action[] = [];
  
  async init() {
    // Check initial state
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? true;
    
    // Listen for changes
    NetInfo.addEventListener((state) => {
      this.isOnline = state.isConnected ?? true;
      if (this.isOnline) {
        this.syncPendingActions();
      }
    });
    
    // Load pending actions
    const stored = await AsyncStorage.getItem('pendingActions');
    if (stored) {
      this.pendingActions = JSON.parse(stored);
    }
  }
  
  async queueAction(action: Action) {
    this.pendingActions.push(action);
    await AsyncStorage.setItem('pendingActions', JSON.stringify(this.pendingActions));
  }
  
  private async syncPendingActions() {
    for (const action of this.pendingActions) {
      try {
        await api.execute(action);
      } catch (error) {
        console.error('Sync failed:', error);
        break;
      }
    }
    this.pendingActions = [];
    await AsyncStorage.removeItem('pendingActions');
  }
}
```

### Push Notifications

```typescript
import messaging from '@react-native-firebase/messaging';

async function requestPermission() {
  const auth = await messaging().requestPermission();
  if (auth === messaging.AuthorizationStatus.AUTHORIZED) {
    const token = await messaging().getToken();
    await api.registerDevice(token);
  }
}

// Handle foreground messages
messaging().onMessage(async (remoteMessage) => {
  // Show local notification
  PushNotification.localNotification({
    title: remoteMessage.notification?.title,
    message: remoteMessage.notification?.body,
  });
});

// Handle background messages
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  // Process in background
});
```

## Flutter Patterns

### State Management (Riverpod)

```dart
// Provider
final counterProvider = StateNotifierProvider<CounterNotifier, int>((ref) {
  return CounterNotifier();
});

class CounterNotifier extends StateNotifier<int> {
  CounterNotifier() : super(0);
  
  void increment() => state++;
  void decrement() => state--;
}

// Usage in widget
class MyWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(counterProvider);
    return Text('Count: $count');
  }
}
```

### Navigation (GoRouter)

```dart
final router = GoRouter(
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => HomeScreen(),
    ),
    GoRoute(
      path: '/product/:id',
      builder: (context, state) {
        final id = state.pathParameters['id']!;
        return ProductScreen(id: id);
      },
    ),
  ],
);
```

### Offline Database (Hive)

```dart
@HiveType(typeId: 0)
class Todo extends HiveObject {
  @HiveField(0)
  String id;
  
  @HiveField(1)
  String title;
  
  @HiveField(2)
  bool isCompleted;
}

// Usage
final box = await Hive.openBox<Todo>('todos');
box.add(Todo(id: '1', title: 'Buy milk', isCompleted: false));

// Query
final todos = box.values.where((t) => !t.isCompleted).toList();
```

### Push Notifications

```dart
import 'package:firebase_messaging/firebase_messaging.dart';

Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Handle background message
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  runApp(MyApp());
}

// Request permission
final messaging = FirebaseMessaging.instance;
final settings = await messaging.requestPermission(
  alert: true,
  badge: true,
  sound: true,
);

// Get token
final token = await messaging.getToken();
```

## Platform-Specific Code

### React Native (Platform API)

```typescript
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});

// Platform-specific files
// Button.ios.tsx
// Button.android.tsx
```

### Flutter (Platform Channels)

```dart
import 'package:flutter/services.dart';

class BatteryService {
  static const platform = MethodChannel('com.example/battery');
  
  Future<int> getBatteryLevel() async {
    final level = await platform.invokeMethod('getBatteryLevel');
    return level;
  }
}
```

## Anti-Patterns

1. **Ignoring platform differences** → iOS/Android behave differently
2. **No offline support** → Poor UX on flaky connections
3. **Blocking UI thread** → Janky animations
4. **Missing error boundaries** → App crashes
5. **No deep linking** → Broken sharing
6. **Ignoring memory limits** → OOM on low-end devices

## Related Skills

- `realtime-patterns` — for real-time mobile features
- `caching-patterns` — for mobile caching
- `security-hardening` — for mobile security

## Related Agents

- `performance-optimizer` — for mobile performance
- `code-reviewer` — for mobile code review
