const assetRoot =
  "https://cdn.prod.website-files.com/68f550992570ca0322737dc2";

export const teamLogos: Record<string, string> = {
  "Beitar Jerusalem": `${assetRoot}/68fe006d53c5bf2b4486c28a_beitar-jerusalem-footballlogos-org.svg`,
  "Bnei Sakhnin": `${assetRoot}/68fdfdbca03f2108b2634bce_ihud-bnei-sakhnin-footballlogos-org.svg`,
  "F.C. Ashdod": `${assetRoot}/68fdff1fa3b994823c3cb8a3_fc-ashdod-footballlogos-org.svg`,
  "Hapoel Be’er Sheva": `${assetRoot}/68fe00462d47fcfeb9a421eb_hapoel-beer-shiva-footballlogos-org.svg`,
  "Hapoel Beer Sheva": `${assetRoot}/68fe00462d47fcfeb9a421eb_hapoel-beer-shiva-footballlogos-org.svg`,
  "Hapoel Haifa": `${assetRoot}/68fdfd61b2193ead2c986ac0_hapoel-haifa-footballlogos-org.svg`,
  "Hapoel Jerusalem": `${assetRoot}/68fdff56eb82e801709a6071_hapoel-jerusalem-footballlogos-org.svg`,
  "Hapoel Petah Tikva": `${assetRoot}/68fdfe2ceef6426647f0d2aa_hapoel-petah-tikva-footballlogos-org.svg`,
  "Hapoel Tel Aviv": `${assetRoot}/68fe0260f92ceabc57d84282_hapoel-tel-aviv-footballlogos-org.svg`,
  "Ironi Kiryat Shmona": `${assetRoot}/68fdfec4582ba148e3f551b0_ironi-kiryat-shmona-footballlogos-org.svg`,
  "Ironi Tiberias": `${assetRoot}/68fdfe60020c9edd2db29489_ironi-tiberias-footballlogos-org.svg`,
  "Maccabi Bnei Reineh": `${assetRoot}/68fdfef5e11ca53c0c97c214_maccabi-nei-reineh-footballlogos-org.svg`,
  "Maccabi Haifa": `${assetRoot}/68fe017c2c0ff59fbb036d5c_maccabi-haifa-footballlogos-org.svg`,
  "Maccabi Netanya": `${assetRoot}/68fe00d4881af38c36d701eb_maccabi-netanya-footballlogos-org.svg`,
  "Maccabi Tel Aviv": `${assetRoot}/68fdff9d185f04e73de312e6_maccabi-tel-aviv-footballlogos-org.svg`,
};

export function teamLogo(name: string) {
  return teamLogos[name] ?? null;
}
