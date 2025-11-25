// src/api/supabaseClient.ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qjhsbupafhflkczyylyg.supabase.co';
const SUPABASE_ANON_KEY = 'qjhsbupafhflkczyylyg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: (key: string) => AsyncStorage.getItem(key),
      setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
      removeItem: (key: string) => AsyncStorage.removeItem(key),
    },
    // a key namespace for this app
    storageKey: 'prayer-tracker-auth',
    autoRefreshToken: true,
    persistSession: true,
  },
});
