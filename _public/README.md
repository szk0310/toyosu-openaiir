# 公開サイト（/open_air/）

> **このディレクトリは本番の写しです（2026-09-09 同期）。**
> 反映はスタッフの手動FTPで行われ、**ここから本番へ配信されることはありません。**
> 本番を直接編集した場合は、このディレクトリにも取り込んで差分ゼロを保ってください。

デプロイ先: `<FTP_REMOTE_ROOT>/`（= `/open_air/`）
公開URL: https://toyosu-smartcity.com/open_air/

管理画面（リポジトリ直下）と**同じサーバーフォルダに同居**しています。
2026-07-30 にバージョン管理下へ移しました。それ以前は本番サーバー上の
ファイルが唯一の正本で、変更履歴も差し戻し手段もない状態でした。

## このディレクトリに含まれないもの

| 対象 | 理由 |
|---|---|
| `assets/upload_img/` | **実行時に管理画面からアップロードされる画像。**同期するとリポジトリ側の古い状態で本番の投稿画像を上書きしてしまう |
| `assets/js/common/firestore_openAir.js` | 管理画面と共用。`_shared-config/` を正本とする |
| `assets/js/common/vue.js` | 同上 |

## 公開サイトが読む Firestore（2026-07-30 全数調査）

| ページ | コレクション | クエリ |
|---|---|---|
| index | `caseData` / `ideaData` | 全件 |
| index / search / idea-list | `spaceData` | `where("s_release","==","on")` |
| search | `calendarData` | 全件 |
| **map** | **`facilityData`** | **`where("f_release","==","on")`** |
| facility | `facilityData` | `doc(f_id).get()` |
| facility | `spaceData` | `where("f_id",…).where("s_release","==","on")` |
| space | `caseData` / `ideaData` | `where("s_id",…)` |
| space / request | `spaceData` | `doc(s_id).get()` |
| request | `calendarData` | `doc(docId).get()` |
| case-list | `caseData` | 全件 |

- `facilityPrivate`（`login_id`・担当者メール）は**公開サイトからは参照しません**。
- **Firestore のセキュリティルールを変更するときは、必ずこの表の全クエリへの影響を確認してください。**
  2026-07-30 に確認漏れで公開サイトを2度停止させています。

## 認証について

公開サイトは **認証なし**で Firestore を読みます（2026-07-30 に匿名ログインを廃止）。
`firebase.auth().signInAnonymously()` を復活させないでください。匿名認証は
プロジェクト側で無効化しており、呼び出すと `ADMIN_ONLY_OPERATION` で
Promise が reject し、以降の処理が全て止まります。

## Google Maps の API キー

`map.html` のキーは**リポジトリに置いていません**。本番サーバー上の
`assets/js/common/google_maps_config.js` が唯一の正本です。

> **2026-09-09 変更**: 自動デプロイを無効化したため、このファイルは
> GitHub Secret からは生成されなくなりました。**サーバー上のファイルを直接編集**してください。

- キーを変更するとき: 本番の `assets/js/common/google_maps_config.js` を FTP で差し替える
- ローカルで地図を確認したいとき: 手元に同名ファイルを作る（`.gitignore` 済み）
  ```js
  window.GOOGLE_MAPS_API_KEY = "AIza〜";
  window.GOOGLE_MAPS_MAP_ID = ""; // 任意。角丸アイコンマーカーにクラウドスタイルを使う場合のみ設定
  ```

ブラウザから直接呼び出すクライアントサイド用の公開キーなので、配信されるJSに含まれること
自体は正しい使い方です。リポジトリに入れないのは、GitHub のシークレット検出に引っかかるためと、
ローテーションをコミットなしで行えるようにするためです。Google Cloud Console 側で
「HTTP リファラー」制限を必ずかけてください。
