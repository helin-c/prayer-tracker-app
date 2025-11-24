import React from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { useSettings } from "../../context/SettingsContext";
import { getStrings } from "../../i18n/translations";
import { getPalette, Palette } from "../../theme/theme";

type DhikrItem = {
  id: number;
  arabic: string;
  transliterationEn: string;
  meaningEn: string;
  transliterationTr: string;
  meaningTr: string;
};

const ITEMS: DhikrItem[] = [
  {
    id: 1,
    arabic: "سُبْحَانَ ٱللّٰهِ",
    transliterationEn: "Subhanallah",
    meaningEn: "Glory be to Allah.",
    transliterationTr: "Sübhanallah",
    meaningTr: "Allah her türlü eksiklikten uzaktır.",
  },
  {
    id: 2,
    arabic: "ٱلْحَمْدُ لِلّٰهِ",
    transliterationEn: "Alhamdulillah",
    meaningEn: "All praise is due to Allah.",
    transliterationTr: "Elhamdülillah",
    meaningTr: "Hamd, övgü ve şükür Allah’a aittir.",
  },
  {
    id: 3,
    arabic: "ٱللّٰهُ أَكْبَرُ",
    transliterationEn: "Allahu Akbar",
    meaningEn: "Allah is the Greatest.",
    transliterationTr: "Allahu Ekber",
    meaningTr: "Allah en yücedir, en büyüktür.",
  },
  {
    id: 4,
    arabic: "لَا إِلٰهَ إِلَّا ٱللّٰهُ",
    transliterationEn: "La ilaha illallah",
    meaningEn: "There is no deity except Allah.",
    transliterationTr: "La ilahe illallah",
    meaningTr: "Allah’tan başka ilah yoktur.",
  },
];

export function DhikrScreen() {
  const { settings } = useSettings();
  const t = getStrings(settings.language);
  const palette = getPalette(settings.theme);
  const styles = React.useMemo(() => createStyles(palette), [palette]);

  const isTR = settings.language === "tr";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t.dhikr.title}</Text>

        {ITEMS.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.arabic}>{item.arabic}</Text>
            <Text style={styles.translit}>
              {isTR ? item.transliterationTr : item.transliterationEn}
            </Text>
            <Text style={styles.meaning}>
              {isTR ? item.meaningTr : item.meaningEn}
            </Text>
          </View>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (palette: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: palette.textPrimary,
      marginBottom: 12,
    },
    card: {
      backgroundColor: palette.card,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: palette.border,
    },
    arabic: {
      fontSize: 22,
      textAlign: "right",
      color: palette.textPrimary,
      marginBottom: 8,
    },
    translit: {
      fontWeight: "600",
      color: palette.accent,
      marginBottom: 4,
    },
    meaning: {
      color: palette.textSecondary,
    },
  });
