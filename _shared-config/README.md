# 共有設定ファイル（サーバー配置）

このフォルダの内容は manage の外側（サーバールート直下）に配置される共有ファイルを追跡用にミラーしたものです。

## デプロイ先
- `_shared-config/assets/js/common/firestore_openAir.js`
  → サーバーの `assets/js/common/firestore_openAir.js`（manage フォルダと同階層の親）

manage 内の各HTMLは `../../assets/js/common/firestore_openAir.js` として参照します。
