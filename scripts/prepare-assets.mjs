import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const files = {
  "manifest.json": "public/manifest.json",
  "favicon.ico": "public/favicon.ico",
  "icon.svg": "public/icon.svg",
  "icon.png": "public/icon.png",
  "apple-icon.png": "public/apple-icon.png",
  "og.jpg": "public/images/og.jpg",
  "geist.woff2": "public/fonts/geist.woff2",
  "editorial-ultralight.woff2": "public/fonts/editorial-ultralight.woff2",
  "96abbebcdb69e4b13c6ff0e23da7784139ad7da3-2880x2234__66e6fc0f.jpg": "public/media/96abbebcdb69e4b13c6ff0e23da7784139ad7da3-2880x2234__66e6fc0f.jpg",
  "235781052416262c147da92950dc76d4d07b86ff-2880x2174__66e6fc0f.jpg": "public/media/235781052416262c147da92950dc76d4d07b86ff-2880x2174__66e6fc0f.jpg",
  "5831f81c6ffab5f5c73abf162d4b92c1a5a8c271-2880x2218__66e6fc0f.jpg": "public/media/5831f81c6ffab5f5c73abf162d4b92c1a5a8c271-2880x2218__66e6fc0f.jpg",
  "2dda49076a88dd6a1282c3858f405d756ff734f6-708x1402__66e6fc0f.png": "public/media/2dda49076a88dd6a1282c3858f405d756ff734f6-708x1402__66e6fc0f.png",
  "135b8a261d63c2eacb7a981b7479b94c4a74998c-708x1402__66e6fc0f.png": "public/media/135b8a261d63c2eacb7a981b7479b94c4a74998c-708x1402__66e6fc0f.png",
  "22884fd5c804bb7a4a5545e22f9dd51b353c0b27-707x1402__66e6fc0f.png": "public/media/22884fd5c804bb7a4a5545e22f9dd51b353c0b27-707x1402__66e6fc0f.png",
  "7d46ac246bd0990940600ffd72bac7105ee5cc0a-3840x2160__66e6fc0f.png": "public/media/7d46ac246bd0990940600ffd72bac7105ee5cc0a-3840x2160__66e6fc0f.png",
  "c6f15b9448f9090f3c7d9f0b5fab4e3cbc8e7284-2880x1800__8635803c.jpg": "public/media/c6f15b9448f9090f3c7d9f0b5fab4e3cbc8e7284-2880x1800__8635803c.jpg",
  "ca1704ba19e7015f94cf5ccb51d5f3db32fd3d96-2880x1868__66e6fc0f.jpg": "public/media/ca1704ba19e7015f94cf5ccb51d5f3db32fd3d96-2880x1868__66e6fc0f.jpg",
  "dc00a94ef171fe44f6a793a72a3fa9216dd48f15-1254x1254__375bb3c4.png": "public/media/dc00a94ef171fe44f6a793a72a3fa9216dd48f15-1254x1254__375bb3c4.png",
  "b98d6f2372e56bacbab8c532906ab79dd6a70581-1440x1800__375bb3c4.jpg": "public/media/b98d6f2372e56bacbab8c532906ab79dd6a70581-1440x1800__375bb3c4.jpg",
  "eba4e5fd9c980edaf3a36249253d9db5bdd4755c-1440x1800__375bb3c4.jpg": "public/media/eba4e5fd9c980edaf3a36249253d9db5bdd4755c-1440x1800__375bb3c4.jpg",
  "1afaca4dbc32c6ef8e332bb05c144f56bef61599-1440x1800__375bb3c4.jpg": "public/media/1afaca4dbc32c6ef8e332bb05c144f56bef61599-1440x1800__375bb3c4.jpg",
  "e7030382683e44699afff394af92ae564c998004-1440x1800__375bb3c4.jpg": "public/media/e7030382683e44699afff394af92ae564c998004-1440x1800__375bb3c4.jpg",
  "e2d7ada78adba232d267d00994ba320200322289-1440x1800__375bb3c4.jpg": "public/media/e2d7ada78adba232d267d00994ba320200322289-1440x1800__375bb3c4.jpg",

  "fcdbdf14cba64b77f457e40c415f08366cd05043-2880x3600__66e6fc0f.jpg": "public/media/fcdbdf14cba64b77f457e40c415f08366cd05043-2880x3600__66e6fc0f.jpg",
  "b871664eefaff2cd66ec941b2c22d0097d3415e9-540x960__66e6fc0f.jpg": "public/media/b871664eefaff2cd66ec941b2c22d0097d3415e9-540x960__66e6fc0f.jpg",
  "50184497f0c1b4f3ce1cdcdcfbd576ee4336f720-1520x2688__66e6fc0f.png": "public/media/50184497f0c1b4f3ce1cdcdcfbd576ee4336f720-1520x2688__66e6fc0f.png",
  "355c0715f1090f3eac38518ae07dd22b6c0c9c2e-1320x2388__66e6fc0f.jpg": "public/media/355c0715f1090f3eac38518ae07dd22b6c0c9c2e-1320x2388__66e6fc0f.jpg",
  "forged-carbon.jpg": "public/images/forged-carbon.jpg",
  "lineup.webp": "public/images/hero-depth/lineup.webp",
  "0376b1a1dd08bc79a767f1f5f46befe617f2882c-120x28.svg": "public/logos/aston-martin.svg",
  "2c9cafc8b15ad6961ff9d5c0a57a0dc2c97c2fa2-120x42.svg": "public/logos/audi.svg",
  "e271601746e95bcd1b5b1ebfce37d51ce581b8ad-120x38.svg": "public/logos/bentley.svg",
  "2cb28ac57667b0d9bbac8d68c0a630859ce889b2-120x10.svg": "public/logos/jaguar.svg",
  "57eab24a91878f828a2a6e7461c84a603eb8240b-52x60.svg": "public/logos/lamborghini.svg",
  "647bea4b10ef8f9bcea149298271657e9c72a670-115x60.svg": "public/logos/land-rover.svg",
  "69fee80a9c1bc7ec5d4b22c662319db174326f16-60x60.svg": "public/logos/lotus.svg",
  "5e7b943bfe0a0908a7035693ae1a9ed209b914b8-120x8.svg": "public/logos/lucid.svg",
  "e7cfeea594b2ac1cf927270961ace6ce8ebffb0e-120x60.svg": "public/logos/maserati.svg",
  "e8ce4b533a95fd19ebe5fa323495d1c2d3170074-120x18.svg": "public/logos/mclaren.svg",
  "6e49cc1f76bd2d6a2049408d12f00a58b2c6f889-60x60.svg": "public/logos/mercedes.svg",
  "8493e4780bacc8d8f9a4601cdb755bacf46b0ab7-120x27.svg": "public/logos/polestar.svg",
  "9e728876539cbcc9f82941b505b4522fd1db5e6b-120x8.svg": "public/logos/porsche.svg",
  "1056d91ce910f0816d6467e96bf2d2a28befa4ba-49x60.svg": "public/logos/rolls-royce.svg",
};

let copied = 0;
for (const [source, target] of Object.entries(files)) {
  if (!existsSync(source)) throw new Error(`Required asset missing: ${source}`);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
  copied++;
}
console.log(`Prepared ${copied} Forge assets in public/.`);
