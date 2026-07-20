import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import type { ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { ApiArticleSummary, ApiScoreEvent } from "../../../packages/api-contracts/src";
import { mediaUrl, readWithCache } from "../src/api";
import { Header } from "../src/header";
import { useDirectionStyle, useLocale } from "../src/locale";

export default function FeedScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const contentWidth = Math.max(width - 32, 0);
  const contentWidthStyle: ViewStyle = Platform.OS === "web"
    ? ({ width: "calc(100vw - 32px)", maxWidth: "calc(100vw - 32px)", boxSizing: "border-box" } as unknown as ViewStyle)
    : { width: contentWidth };
  const { isRtl, labels, locale } = useLocale();
  const directionStyle = useDirectionStyle();
  const [articles, setArticles] = useState<ApiArticleSummary[]>([]);
  const [scores, setScores] = useState<ApiScoreEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([
      readWithCache<ApiArticleSummary[]>(`/api/v1/articles?locale=${locale}`, `ilsp:v1:articles:${locale}`),
      readWithCache<ApiScoreEvent[]>("/api/v1/scores", "ilsp:v1:scores"),
    ])
      .then(([articleData, scoreData]) => {
        if (!active) return;
        setArticles(articleData);
        setScores(scoreData);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Feed unavailable");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [locale]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <Header />
      {loading ? <ActivityIndicator color="#1762ed" size="large" style={styles.loader} /> : null}
      {error ? <Text style={styles.message}>{error}</Text> : null}
      <FlatList
        contentContainerStyle={styles.feed}
        data={articles}
        keyExtractor={(article) => article.id}
        ListEmptyComponent={!loading ? <Text style={[styles.message, directionStyle]}>{labels.empty}</Text> : null}
        ListHeaderComponent={(
          <View style={contentWidthStyle}>
            <Text style={[styles.sectionTitle, directionStyle]}>{labels.scores}</Text>
            {scores.map((score) => (
              <View key={score.id} style={[styles.scoreCard, contentWidthStyle]}>
                <View style={[styles.scoreTop, isRtl ? styles.rowReverse : null]}>
                  <Text style={styles.scoreCompetition}>{score.competition}</Text>
                  <Text style={styles.scoreStatus}>{labels.scheduled}</Text>
                </View>
                <View style={[styles.scoreTeams, isRtl ? styles.rowReverse : null]}>
                  <Text style={styles.scoreTeam}>{score.home.name}</Text>
                  <Text style={styles.scoreVersus}>v</Text>
                  <Text style={styles.scoreTeam}>{score.away.name}</Text>
                </View>
              </View>
            ))}
            <Text style={[styles.sectionTitle, directionStyle]}>{labels.latest}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: "/article/[slug]", params: { slug: item.slug } })}
            style={[styles.card, contentWidthStyle]}
          >
            <View style={styles.mediaFrame}>
              <Image resizeMode="contain" source={{ uri: mediaUrl(item.media.src) }} style={styles.image} />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.category, directionStyle]}>{item.category}</Text>
              <Text style={[styles.headline, directionStyle]}>{item.title}</Text>
              <Text style={[styles.dek, directionStyle]}>{item.dek}</Text>
              <Text style={[styles.meta, directionStyle]}>{item.readMinutes} {labels.read}</Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f6f8" },
  loader: { marginTop: 20 },
  rowReverse: { flexDirection: "row-reverse" },
  feed: { paddingVertical: 16, gap: 16, alignItems: "center" },
  sectionTitle: { color: "#07152f", fontSize: 20, fontWeight: "900", marginBottom: 10, marginTop: 4 },
  scoreCard: { backgroundColor: "#07152f", borderRadius: 18, padding: 16, marginBottom: 20, overflow: "hidden" },
  scoreTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  scoreCompetition: { color: "#aabbd6", fontSize: 11, fontWeight: "800", textTransform: "uppercase", flex: 1, flexShrink: 1 },
  scoreStatus: { color: "#4f86ff", fontSize: 11, fontWeight: "900", textTransform: "uppercase", flexShrink: 0, marginStart: 8 },
  scoreTeams: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18 },
  scoreTeam: { color: "#ffffff", fontSize: 17, fontWeight: "900", flex: 1, flexShrink: 1, textAlign: "center" },
  scoreVersus: { color: "#4f86ff", fontSize: 12, fontWeight: "900", marginHorizontal: 12 },
  card: { overflow: "hidden", borderRadius: 18, backgroundColor: "#ffffff" },
  mediaFrame: { height: 210, backgroundColor: "#07152f" },
  image: { width: "100%", height: "100%" },
  copy: { padding: 18 },
  category: { color: "#1762ed", fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  headline: { color: "#07152f", fontSize: 22, fontWeight: "900", lineHeight: 26, marginTop: 8 },
  dek: { color: "#5f6979", fontSize: 15, lineHeight: 22, marginTop: 10 },
  meta: { color: "#7e8795", fontSize: 12, fontWeight: "700", marginTop: 14 },
  message: { color: "#5f6979", padding: 20, textAlign: "center" },
});
