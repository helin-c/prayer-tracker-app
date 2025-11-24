import React from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
} from "react-native";

const WUDU_STEPS = [
  "1. Niyet etmek – Intend to perform wudu for the sake of Allah.",
  "2. Bismillah diyerek başlamak – Begin by saying 'Bismillah'.",
  "3. Elleri bileklere kadar üç kez yıkamak.",
  "4. Ağıza üç kez su verip çalkalamak.",
  "5. Buruna üç kez su çekip temizlemek.",
  "6. Yüzü saç diplerinden çene altına kadar üç kez yıkamak.",
  "7. Kolları dirseklerle birlikte üç kez yıkamak – önce sağ, sonra sol.",
  "8. Başın mesh edilmesi – başın üstünü ıslak elle meshetmek.",
  "9. Kulakları mesh etmek – iç ve dış kısımlarını silmek.",
  "10. Ayakları topuklarla birlikte üç kez yıkamak – önce sağ, sonra sol.",
];

const PRAYER_STEPS = [
  "1. Niyet – Stand facing the Qibla and make intention for the specific prayer.",
  "2. Tekbir (Allahu Ekber) – Raise hands to ears/shoulders and say 'Allahu Ekber'.",
  "3. Kıyam – Stand and recite Surah Al-Fatiha + another surah.",
  "4. Rüku – Bow, hands on knees, saying 'Subhana Rabbiyal Azim' three times.",
  "5. Kıyama dönüş – Stand back up, saying 'Sami'allahu liman hamidah'.",
  "6. Secde – Prostrate with forehead, nose, palms, knees and toes on the ground.",
  "7. Celse – Sit briefly between two sajdahs.",
  "8. İkinci secde – Perform the second sajdah.",
  "9. Ka'de/Teşehhud – Sit and recite 'At-tahiyyat', salawat etc.",
  "10. Selam – End the prayer by turning the head right and left saying 'Assalamu alaykum wa rahmatullah'.",
];

export function GuideScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Abdest ve Namaz Kılma Rehberi</Text>
        <Text style={styles.subtitle}>
          Wudu (abdest) ve namaz adımlarını özetleyen kısa bir rehber. Metinleri
          istedikçe detaylandırabilirsin.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Abdest Adımları (Wudu)</Text>
          {WUDU_STEPS.map((step, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.cardIndex}>Adım {index + 1}</Text>
              <Text style={styles.cardText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Namaz Kılma Adımları</Text>
          {PRAYER_STEPS.map((step, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.cardIndex}>Adım {index + 1}</Text>
              <Text style={styles.cardText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
  },
  subtitle: {
    marginTop: 4,
    color: "#9ca3af",
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e5e7eb",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  cardIndex: {
    fontSize: 12,
    color: "#a5b4fc",
    marginBottom: 4,
  },
  cardText: {
    color: "#e5e7eb",
  },
});
