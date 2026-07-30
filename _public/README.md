# 公開サイト（/open_air/）

デプロイ先: `<FTP_REMOTE_ROOT>/`（= `/open_air/`）
公開URL: https://toyosu-smartcity.com/open_air/

管理画面（リポジトリ直下）と**同じサーバーフォルダに同居**しています。
2026-07-30 にバージョン管理下へ移しました。それ以前は本番サーバー上の
ファイルが唯一の正本で、変更履歴も差し戻し手段もない状態でした。

## このディレクトリに含まれないもの

| 対象 | 理由 |
|---|---|
| `assets/upload_img/` | **実行時に管理画面からアップロードされる画像。**同期するとリポジトリ側の古い状態で本番の投稿画像を上書きしてしまう。workflow でも除外している |
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

## Mapbox のアクセストークン

`map.html` のトークンは**リポジトリに置いていません**。GitHub Secret `MAPBOX_TOKEN`
から、デプロイ時に `assets/js/common/mapbox_config.js` が自動生成されます。

- トークンを変更するとき: GitHub の Secret `MAPBOX_TOKEN` を更新して再デプロイ
- ローカルで地図を確認したいとき: 手元に同名ファイルを作る（`.gitignore` 済み）
  ```js
  window.MAPBOX_TOKEN = "pk.〜";
  ```

`pk.` で始まる公開用トークンなので、配信されるJSに含まれること自体は正しい使い方です。
リポジトリに入れないのは、GitHub のシークレット検出に引っかかるためと、
ローテーションをコミットなしで行えるようにするためです。
