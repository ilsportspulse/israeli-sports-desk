import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import type { ViewStyle } from "react-native";

import { useDirectionStyle, useLocale } from "./locale";

export function Header() {
  const { canPreviewPrototypeLocale, isRtl, labels, toggleLocale } = useLocale();
  const { width } = useWindowDimensions();
  const headerWidthStyle: ViewStyle = Platform.OS === "web"
    ? ({ width: "100vw", maxWidth: "100vw", boxSizing: "border-box" } as unknown as ViewStyle)
    : { width };
  const brandWidthStyle: ViewStyle = Platform.OS === "web"
    ? ({ maxWidth: "calc(100vw - 116px)" } as unknown as ViewStyle)
    : { maxWidth: Math.max(width - 116, 0) };
  const directionStyle = useDirectionStyle();
  return (
    <View style={[styles.header, headerWidthStyle, isRtl ? styles.rowReverse : null]}>
      <View style={[styles.brandCopy, brandWidthStyle]}>
        <Text style={[styles.eyebrow, directionStyle]}>ILSP</Text>
        <Text style={[styles.title, directionStyle]}>{labels.brand}</Text>
        <Text style={[styles.subtitle, directionStyle]}>{labels.subtitle}</Text>
      </View>
      {canPreviewPrototypeLocale ? (
        <Pressable
          accessibilityHint="Internal locale prototype only"
          accessibilityLabel={labels.language}
          accessibilityRole="button"
          onPress={toggleLocale}
          style={[styles.languageButton, isRtl ? styles.languageButtonRtl : styles.languageButtonLtr]}
        >
          <Text style={styles.languageButtonText}>{labels.language}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: "#07152f",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  rowReverse: { flexDirection: "row-reverse" },
  brandCopy: { flex: 1, flexShrink: 1, minWidth: 0 },
  eyebrow: { color: "#4f86ff", fontSize: 12, fontWeight: "900", letterSpacing: 2 },
  title: { color: "#ffffff", fontSize: 22, fontWeight: "900", marginTop: 3 },
  subtitle: { color: "#aabbd6", fontSize: 13, marginTop: 3 },
  languageButton: {
    borderColor: "#356dbf",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginStart: 8,
    flexShrink: 0,
    position: "absolute",
  },
  languageButtonLtr: { right: 20 },
  languageButtonRtl: { left: 20 },
  languageButtonText: { color: "#ffffff", fontSize: 11, fontWeight: "800" },
});
