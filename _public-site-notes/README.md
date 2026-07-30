# 公開サイト（/open_air/）について

このリポジトリは **管理画面（/open_air/manage/）だけ**をバージョン管理しています。
同じ `/open_air/` に**公開サイトが同居**しており、そちらは管理外です。

```
/open_air/
├─ index.html / search.html / map.html / facility.html / space.html
│  case-list.html / idea-list.html / request.html / terms.html / privacy.html
│  contact/                                   ← 公開サイト（このリポジトリの管理外）
├─ assets/
│   ├─ js/app_*.js                            ← 公開サイト（管理外）
│   ├─ js/common/firestore_openAir.js         ← ★管理画面のCIが上書きする共用ファイル
│   └─ js/common/vue.js                       ← ★同上
└─ manage/                                    ← このリポジトリ
```

## ⚠️ 3つの注意

1. **CI は `_shared-config/assets/` を `/open_air/assets/` へ同期します。**
   `js/common/firestore_openAir.js` と `js/common/vue.js` は、
   管理画面をデプロイすると**公開サイト側も上書きされます**。
2. **公開サイトは Firestore を直接読みます。** セキュリティルールを変更する前に
   必ず影響を確認してください（`HANDOFF_スタッフ向け.md` の 5-13）。
3. **公開サイトはバージョン管理されていません。** 本番サーバー上のファイルが唯一の
   正本です。**バージョン管理下に置くことを強く推奨します。**

## 公開サイトが読む Firestore（2026-07-30 時点・全数調査済み）

| ページ | コレクション | クエリ |
|---|---|---|
| index | `caseData` / `ideaData` | 全件 |
| index / search | `spaceData` | `where("s_release","==","on")` |
| search | `calendarData` | 全件 |
| **map** | **`facilityData`** | **`where("f_release","==","on")`** |
| facility | `facilityData` | `doc(f_id).get()` |
| facility | `spaceData` | `where("f_id",…).where("s_release","==","on")` |
| space | `caseData` / `ideaData` | `where("s_id",…)` |
| space / request | `spaceData` | `doc(s_id).get()` |
| request | `calendarData` | `doc(docId).get()` |
| case-list | `caseData` | 全件 |
| idea-list | `spaceData` | `where("s_release","==","on")` |

`facilityPrivate`（`login_id`・担当者メール）は**公開サイトからは参照しません**。

## 2026-07-30 に公開サイトへ加えた変更

変更前のファイルを `backup-before-2026-07-30/` に保存しています。

| ファイル | 変更内容 |
|---|---|
| `app_index_case.js` / `app_index_idea.js` / `app_index_pickup.js`<br>`app_search.js` / `app_case_list.js` / `app_idea_list.js` | `firebase.auth().signInAnonymously()` を `Promise.resolve()` に置換（匿名認証を無効化したため） |
| `map.html`（インライン） | 同上 |
| `app_facility.js` | `spaceData` のクエリに `.where("s_release","==","on")` を追加 |
| `app_idea_list.js` | `spaceData` のクエリに `.where("s_release","==","on")` を追加<br>（画面側で既に `s_release==='on'` を判定していたため表示は変わらない） |

> ⚠️ `backup-before-2026-07-30/map.html` の Mapbox アクセストークンは、
> リポジトリに秘匿値を残さないため伏せ字にしています。復元する場合は
> 本番の `map.html` から実際の値を転記してください。
> なお当該トークンは `pk.`（公開用）で、クライアント配置は正しい使い方です。
