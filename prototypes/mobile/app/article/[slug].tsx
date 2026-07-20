import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { ApiArticleDetail } from "../../../../packages/api-contracts/src";
import { mediaUrl, readWithCache } from "../../src/api";
import { Header } from "../../src/header";
import { useDirectionStyle, useLocale } from "../../src/locale";

export default function ArticleScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { labels, locale } = useLocale();
  const directionStyle = useDirectionStyle();
  const [article, setArticle] = useState<ApiArticleDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const articleDirectionStyle = article?.locale === "he" ? styles.articleRtl : styles.articleLtr;

  useEffect(() => {
    if (!slug) return;
    readWithCache<ApiArticleDetail>(`/api/v1/articles/${slug}`, `ilsp:v1:article:${slug}:en`)
      .then(setArticle)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Article unavailable"));
  }, [slug]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <Header />
      {!article && !error ? <ActivityIndicator color="#1762ed" size="large" style={styles.loader} /> : null}
      {error ? <Text style={styles.message}>{error}</Text> : null}
      {article ? (
        <ScrollView contentContainerStyle={styles.detail}>
          <Pressable accessibilityRole="button" onPress={() => router.back()}>
            <Text style={[styles.back, directionStyle]}>‹ {labels.back}</Text>
          </Pressable>
          {article.locale !== locale ? (
            <Text style={[styles.languageNotice, directionStyle]}>{labels.englishArticle}</Text>
          ) : null}
          <Text style={[styles.category, articleDirectionStyle]}>{article.category}</Text>
          <Text style={[styles.detailHeadline, articleDirectionStyle]}>{article.title}</Text>
          <Text style={[styles.detailDek, articleDirectionStyle]}>{article.dek}</Text>
          {article.matchRecap ? (
            <View style={styles.gameCard}>
              <Text style={styles.gameCompetition}>{article.matchRecap.competition} · FT</Text>
              <View style={styles.gameScore}>
                <View style={styles.gameTeam}>
                  {article.matchRecap.home.logo ? <Image source={{ uri: mediaUrl(article.matchRecap.home.logo) }} style={styles.teamLogo} /> : null}
                  <Text style={styles.gameTeamName}>{article.matchRecap.home.shortName}</Text>
                </View>
                <Text style={styles.gameScoreText}>{article.matchRecap.home.score} – {article.matchRecap.away.score}</Text>
                <View style={styles.gameTeam}>
                  {article.matchRecap.away.logo ? <Image source={{ uri: mediaUrl(article.matchRecap.away.logo) }} style={styles.teamLogo} /> : null}
                  <Text style={styles.gameTeamName}>{article.matchRecap.away.shortName}</Text>
                </View>
              </View>
              <Text style={styles.gameVenue}>
                {article.matchRecap.venue} · {article.matchRecap.city}{"\n"}
                {article.matchRecap.attendance
                  ? `${article.matchRecap.attendance.toLocaleString()} spectators`
                  : article.matchRecap.attendanceNote ?? "Attendance not published"} · Referee {article.matchRecap.referee}
              </Text>
              <Text style={styles.matchSectionTitle}>Match events</Text>
              {article.matchRecap.events.map((event, index) => {
                const eventLabel = event.type === "goal" ? "GOAL" : event.type === "yellow" ? "YC" : event.type === "second-yellow" ? "2YC" : event.type === "red" ? "RC" : "VAR";
                const eventStyle = event.type === "goal" ? styles.eventTagGoal : event.type === "yellow" ? styles.eventTagYellow : event.type === "second-yellow" || event.type === "red" ? styles.eventTagRed : styles.eventTagVar;
                return (
                  <View key={`${event.minute}-${event.player}-${index}`} style={styles.eventRow}>
                    <Text style={styles.eventMinute}>{event.minute}′</Text>
                    <Text style={[styles.eventTag, eventStyle]}>{eventLabel}</Text>
                    <View style={styles.eventCopy}>
                      <Text style={styles.eventPlayer}>{event.player}{event.score ? ` · ${event.score}` : ""}</Text>
                      <Text style={styles.eventTeam}>{event.team}</Text>
                      {event.detail ? <Text style={styles.eventDetail}>{event.detail}</Text> : null}
                    </View>
                  </View>
                );
              })}
              <Text style={styles.matchSectionTitle}>Starting line-ups</Text>
              <View style={styles.lineupColumns}>
                {[article.matchRecap.home, article.matchRecap.away].map((team, teamIndex) => (
                  <View key={team.name} style={[styles.lineupTeam, teamIndex === 0 ? styles.lineupTeamLeft : styles.lineupTeamRight]}>
                    <Text style={styles.lineupTeamName}>{team.shortName}</Text>
                    <Text style={styles.lineupCoach}>Coach: {team.coach}</Text>
                    {team.lineup.map((player, playerIndex) => (
                      <Text key={player} style={styles.lineupPlayer}>{playerIndex + 1}. {player}</Text>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          ) : null}
          {article.basketballRecap ? (
            <View style={styles.gameCard}>
              <Text style={styles.gameCompetition}>{article.basketballRecap.competition}</Text>
              <View style={styles.gameScore}>
                <View style={styles.gameTeam}>{article.basketballRecap.home.logo ? <Image source={{ uri: mediaUrl(article.basketballRecap.home.logo) }} style={styles.teamLogo} /> : <Text style={styles.gameFlag}>{article.basketballRecap.home.flag}</Text>}<Text style={styles.gameTeamName}>{article.basketballRecap.home.shortName}</Text></View>
                <Text style={styles.gameScoreText}>{article.basketballRecap.home.score} – {article.basketballRecap.away.score}</Text>
                <View style={styles.gameTeam}>{article.basketballRecap.away.logo ? <Image source={{ uri: mediaUrl(article.basketballRecap.away.logo) }} style={styles.teamLogo} /> : <Text style={styles.gameFlag}>{article.basketballRecap.away.flag}</Text>}<Text style={styles.gameTeamName}>{article.basketballRecap.away.shortName}</Text></View>
              </View>
              <View style={styles.quarterStrip}>
                <Text style={styles.quarterTeam}>{article.basketballRecap.home.shortName}</Text>
                {article.basketballRecap.home.quarters.map((score, index) => <Text key={`home-${index}`} style={styles.quarterScore}>Q{index + 1} {score}</Text>)}
              </View>
              <View style={styles.quarterStrip}>
                <Text style={styles.quarterTeam}>{article.basketballRecap.away.shortName}</Text>
                {article.basketballRecap.away.quarters.map((score, index) => <Text key={`away-${index}`} style={styles.quarterScore}>Q{index + 1} {score}</Text>)}
              </View>
              <Text style={styles.gameVenue}>{article.basketballRecap.venue} · {article.basketballRecap.city} · FT</Text>
              <Text style={styles.gameVenue}>
                {article.basketballRecap.attendance ? `${article.basketballRecap.attendance.toLocaleString()} spectators` : article.basketballRecap.attendanceNote ?? "Attendance not published"} · {article.basketballRecap.officials.join(" · ")}
              </Text>
              {article.basketballRecap.stats.map((stat) => (
                <View key={stat.label} style={styles.statRow}><Text style={styles.statValue}>{stat.home}</Text><Text style={styles.statLabel}>{stat.label}</Text><Text style={styles.statValue}>{stat.away}</Text></View>
              ))}
              <Text style={styles.matchSectionTitle}>Game leaders</Text>
              {article.basketballRecap.leaders.map((leader) => (
                <View key={`${leader.player}-${leader.label}`} style={styles.statRow}><Text style={styles.statValue}>{leader.value}</Text><Text style={styles.statLabel}>{leader.player}{"\n"}{leader.team} · {leader.label}</Text><Text style={styles.statValue} /> </View>
              ))}
            </View>
          ) : null}
          <View style={styles.detailMediaFrame}>
            <Image resizeMode="contain" source={{ uri: mediaUrl(article.media.src) }} style={styles.image} />
          </View>
          <Text style={[styles.caption, articleDirectionStyle]}>{article.media.caption} · {article.media.credit}</Text>
          {article.body.map((paragraph) => (
            <Text key={paragraph} style={[styles.paragraph, articleDirectionStyle]}>{paragraph}</Text>
          ))}
          <View style={styles.facts}>
            <Text style={[styles.factsTitle, directionStyle]}>{labels.keyDetails}</Text>
            {article.facts.map((fact, index) => (
              <Text key={fact} style={[styles.fact, articleDirectionStyle]}>{index + 1}. {fact}</Text>
            ))}
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f6f8" },
  loader: { marginTop: 28 },
  message: { color: "#5f6979", padding: 20, textAlign: "center" },
  detail: { paddingStart: 20, paddingEnd: 36, paddingTop: 20, paddingBottom: 52 },
  back: { color: "#1762ed", fontSize: 14, fontWeight: "800", marginBottom: 22 },
  languageNotice: { alignSelf: "flex-start", backgroundColor: "#dbe8ff", borderRadius: 999, color: "#124fbf", fontSize: 12, fontWeight: "800", marginBottom: 16, paddingHorizontal: 12, paddingVertical: 7 },
  articleLtr: { writingDirection: "ltr", textAlign: "left" },
  articleRtl: { writingDirection: "rtl", textAlign: "right" },
  category: { color: "#1762ed", fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  detailHeadline: { color: "#07152f", fontSize: 33, lineHeight: 37, fontWeight: "900", marginTop: 10 },
  detailDek: { color: "#5f6979", fontSize: 18, lineHeight: 27, marginTop: 14, marginBottom: 22 },
  gameCard: { backgroundColor: "#07152f", borderRadius: 20, marginBottom: 22, padding: 18 },
  gameCompetition: { color: "#91a5c5", fontSize: 10, fontWeight: "900", letterSpacing: 1, textAlign: "center", textTransform: "uppercase" },
  gameScore: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginVertical: 18 },
  gameTeam: { alignItems: "center", flex: 1 },
  gameFlag: { fontSize: 28 },
  gameTeamName: { color: "#ffffff", fontSize: 12, fontWeight: "900", marginTop: 5 },
  teamLogo: { height: 44, width: 44 },
  gameScoreText: { color: "#ffffff", fontSize: 30, fontWeight: "900", letterSpacing: -1.5 },
  quarterStrip: { borderTopColor: "#1f3355", borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 },
  quarterTeam: { color: "#ffffff", fontSize: 10, fontWeight: "900", width: 48 },
  quarterScore: { color: "#aebbd0", fontSize: 9 },
  gameVenue: { color: "#91a5c5", fontSize: 9, marginBottom: 8, marginTop: 4, textAlign: "center" },
  statRow: { borderTopColor: "#1f3355", borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingVertical: 9 },
  statValue: { color: "#ffffff", fontSize: 12, fontWeight: "900", width: 64, textAlign: "center" },
  statLabel: { color: "#91a5c5", fontSize: 9, textAlign: "center" },
  matchSectionTitle: { borderTopColor: "#1f3355", borderTopWidth: 1, color: "#ffffff", fontSize: 13, fontWeight: "900", marginTop: 12, paddingTop: 14 },
  eventRow: { alignItems: "flex-start", borderBottomColor: "#1f3355", borderBottomWidth: 1, flexDirection: "row", paddingVertical: 10 },
  eventMinute: { color: "#ffffff", fontSize: 11, fontWeight: "900", paddingTop: 4, width: 42 },
  eventTag: { borderRadius: 5, fontSize: 8, fontWeight: "900", overflow: "hidden", paddingHorizontal: 6, paddingVertical: 4, textAlign: "center", width: 42 },
  eventTagGoal: { backgroundColor: "#8ef0d0", color: "#07152f" },
  eventTagYellow: { backgroundColor: "#f3d500", color: "#07152f" },
  eventTagRed: { backgroundColor: "#dc2636", color: "#ffffff" },
  eventTagVar: { backgroundColor: "#1762ed", color: "#ffffff" },
  eventCopy: { flex: 1, paddingStart: 10 },
  eventPlayer: { color: "#ffffff", fontSize: 11, fontWeight: "900" },
  eventTeam: { color: "#91a5c5", fontSize: 9, marginTop: 2 },
  eventDetail: { color: "#c5d0e2", fontSize: 9, lineHeight: 13, marginTop: 4 },
  lineupColumns: { flexDirection: "row", marginTop: 12 },
  lineupTeam: { flex: 1 },
  lineupTeamLeft: { marginEnd: 7 },
  lineupTeamRight: { marginStart: 7 },
  lineupTeamName: { color: "#ffffff", fontSize: 11, fontWeight: "900", marginBottom: 2 },
  lineupCoach: { color: "#91a5c5", fontSize: 8, lineHeight: 12, marginBottom: 7 },
  lineupPlayer: { color: "#c5d0e2", fontSize: 9, lineHeight: 15 },
  detailMediaFrame: { height: 260, borderRadius: 18, overflow: "hidden", backgroundColor: "#07152f" },
  image: { width: "100%", height: "100%" },
  caption: { color: "#7e8795", fontSize: 11, lineHeight: 16, marginTop: 9, marginBottom: 20 },
  paragraph: { color: "#172238", fontSize: 17, lineHeight: 28, marginBottom: 18 },
  facts: { backgroundColor: "#e9eff9", borderRadius: 18, padding: 18, marginTop: 10 },
  factsTitle: { color: "#07152f", fontSize: 20, fontWeight: "900", marginBottom: 12 },
  fact: { color: "#354056", fontSize: 15, lineHeight: 22, marginBottom: 9 },
});
