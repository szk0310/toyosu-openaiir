# 豊洲OpenAir 管理画面 ハンドオフ資料（スタッフ向け）

最終更新: 2026-07-26

この資料は、2026年7月に実施した **Firebase Auth 移行**と**本番サーバーへの初回デプロイ**について、
運用を引き継ぐスタッフが理解しておくべき事項をまとめたものです。

---

## 0. 3行サマリー

1. **パスワードを Firestore に平文保存するのをやめ、Firebase Authentication に移行しました。**
2. 本番サーバーの **`/open_air/`** に初回デプロイ済み。公開URL → https://toyosu-smartcity.com/open_air/manage/facility/login.html
3. **施設データはまだ0件**です。運用開始には管理者が master 画面から施設を登録する必要があります。

---

## 1. 何が変わったか（コード変更点）

### 1-1. 最大の変更：パスワードの保存場所

| | 改修前 | 改修後 |
|---|---|---|
| パスワード保存先 | Firestore `facilityData` に**平文** | **Firebase Authentication**（scrypt でハッシュ管理） |
| Firestore 内のパスワード | あり | **無し**（項目ごと廃止） |
| 認証方法 | Firestore を検索してID/PASS照合 | `signInWithEmailAndPassword()` |

Firestore を直接読めば誰でもパスワードが見えてしまう状態でしたが、これが解消されました。

### 1-2. ログインの仕組み（2種類あります）

**施設ログイン** — [facility/login.html](facility/login.html)

- 入力するのは **`login_id`（ランダム10桁）とパスワード**です。
- コードが内部で `login_id + "@toyosu-openair.local"` という**架空のメールアドレス**に変換して Firebase Auth に問い合わせます（[manage_login.js:17](facility/assets/js/manage_login.js#L17)）。
- **このドメインは実在しません。メールは送られません。** Firebase Auth がメール形式のIDしか受け付けないための便宜的な変換です。
- 認証成功後、`facilityData` から `login_id` 一致のドキュメントを引き、施設情報を sessionStorage に保存します。
- ⚠️ 利用者に「`@toyosu-openair.local` まで入力してください」と案内しないでください。**10桁のIDだけ**が正解です。

**管理者ログイン** — [master/login.html](master/login.html)（今回**新設**）

- 入力するのは **実在のメールアドレス**とパスワードです。
- 認証後、Firestore の `admins/{uid}` ドキュメントが存在する場合のみ管理画面へ入れます（[master_login.js:16](master/assets/js/master_login.js#L16)）。
- master / idea / case の3画面がこの管理者認証で保護されます。

### 1-3. 認証ゲート

[assets/js/auth_guard.js](assets/js/auth_guard.js) を新規作成し、全ページに読み込みを追加しました。

| 関数 | 用途 |
|---|---|
| `withAuth(cb, opts)` | ログイン済みなら処理実行、未ログインならログイン画面へ |
| `ensureAuth(loginUrl)` | 施設ページ用のログイン必須チェック |
| `ensureAdmin(loginUrl)` | 管理者ページ用の権限チェック |

画像アップロード用の PHP（`upload_image*.php`）にも認証チェックを追加しています。

### 1-4. Firestore セキュリティルール（新規作成・**適用済み**）

[firestore.rules](firestore.rules) を新規作成し、**2026-07-24 に本番へ適用済み**です。

| コレクション | 読み取り | 書き込み |
|---|---|---|
| `facilityData` | 公開 | 作成/削除=管理者のみ、更新=本人(uid一致) or 管理者 |
| `spaceData` / `calendarData` | 公開 | ログイン済み（匿名を除く） |
| `ideaData` / `caseData` | 公開 | 管理者のみ |
| `admins` | 本人のみ | **禁止**（コンソールから手動で作成） |
| その他すべて | 禁止 | 禁止 |

- 読み取りを公開のままにしているのは、公開サイト側の表示を壊さないためです。**パスワードは保存されていないので情報漏えいにはなりません。**
- 匿名ログインは廃止しました。ルール上も匿名ユーザーの書き込みを遮断しています。

### 1-5. その他

- [master/mail.php:35](master/mail.php#L35) のログインURLを、プレースホルダ `xxxxxxxxxx` から実パス `open_air` に修正しました。
- 全22ページが参照する `vue.js` がリポジトリ外にあったため、`_shared-config/` に取り込みました。

---

## 2. Firebase の設定（現状）

### 2-1. プロジェクト

| 環境 | プロジェクトID |
|---|---|
| **本番** | `toyosuopenair` |
| テスト | `testtoyosuopenair` |

切り替えは共有config [_shared-config/assets/js/common/firestore_openAir.js](_shared-config/assets/js/common/firestore_openAir.js) のコメント入れ替えで行います。**現在は本番を指しています。**

### 2-2. Authentication

- **メール/パスワード認証：有効**
- 登録済みアカウント **4件**（2026-07-26 時点）

| アカウント | 用途 |
|---|---|
| suzuki@shiro-k.jp | 管理者 |
| maruyama@shiro-k.jp | 管理者 |
| （メールアドレス無し）× 2 | **旧・匿名ログインの残骸**。現在は未使用 |

- 施設用アカウント（`＠toyosu-openair.local`）は **まだ0件**です。

### 2-3. admins コレクション（管理者権限）

Firestore の `admins` に **2件**登録済み（2026-07-24作成）。

| ドキュメントID（= Auth の UID） | fields |
|---|---|
| `4tXpKupFTJe4IFTub2L9UPuJAay1` | `role: admin`, `staff: suzuki@shiro-k.jp` |
| `4I1podLFuaN4EC2DQ03oCaQkswv2` | `role: admin`, `staff: maruyama@shiro-k.jp` |

**管理者を増やす手順**（コンソール作業。ルール上コードからは作成できません）

1. `Authentication → Users → ユーザーを追加` でメールアドレスとパスワードを作成
2. 作成されたユーザーの **UID をコピー**
3. `Firestore → admins` コレクションに **ドキュメントID = そのUID** で作成し、`role: admin` を入れる

### 2-4. 認証メールの設定

| 項目 | 値 |
|---|---|
| 送信方式 | `DEFAULT`（Firebase 既定。カスタムSMTPなし） |
| 送信元 | **noreply@toyosuopenair.firebaseapp.com** |
| カスタムドメイン | 未設定（`NOT_STARTED`） |
| 表示言語 | **日本語**（2026-07-26 に `defaultLocale` を `en` → `ja` に変更） |
| メール列挙保護 | 有効（存在しないアドレスでも成否を返さない） |

- パスワードリセットメールの件名は「%APP_NAME% のパスワードを再設定してください」になりました。
- ⚠️ **実測（2026-07-26）: リセットメールは `shiro-k.jp` 宛で迷惑メールフォルダに振り分けられました。**
  送信元が `firebaseapp.com` で、独自ドメインの SPF/DKIM と紐づいていないためです。
  **利用者には「迷惑メールフォルダも確認してください」と必ず案内してください。**
  （このときのメールは英語版「Reset your password for toyosuopenair」でした。日本語化は同日実施済みのため、今後は日本語件名で届きます）
- 迷惑メール判定を根本的に解消するには、Firebase コンソールで**カスタムドメイン**を設定し、
  自社ドメインから送信するよう変更する必要があります（現在 `NOT_STARTED`）。
- 本文の文面をカスタマイズしたい場合は **Firebase コンソールから**行ってください（API 経由の本文変更はフィッシング対策で禁止されています）。

### 2-5. 承認済みドメイン

`localhost` / `toyosuopenair.firebaseapp.com` / `toyosuopenair.web.app` の3つのみ。
**`toyosu-smartcity.com` は登録されていません。** メール/パスワード認証には影響しないため現状は問題ありませんが、将来 Google ログイン等の外部認証を追加する場合は追加が必要です。

---

## 3. 本番デプロイの構成

### 3-1. サーバー上の配置

```
（FTPホーム = Webルート）
└─ open_air/                                 ← 今回新設
   ├─ manage/                                ← アプリ本体（リポジトリの中身）
   │  ├─ facility/  master/  idea/  case/  assets/
   └─ assets/                                ← 親階層の共有アセット
      ├─ js/common/firestore_openAir.js      （Firebase設定）
      ├─ js/common/vue.js
      ├─ json/categories.json                ⚠️ 未設置（後述）
      └─ upload_img/                         ← 画像アップロード先
         ├─ facility/{main,icon,space}/
         ├─ case/    ⚠️ no-image.svg 未設置
         └─ idea/    ⚠️ no-image.svg 未設置
```

- 各HTMLが `../../assets/...` で参照するため、**`assets/` は `manage/` の1つ上**でなければ動きません。
- ⚠️ **サーバー直下の `/manage/` は全く別の既存アプリ（news系）です。** 混同して上書きしないでください。

### 3-2. 公開URL

| 画面 | URL |
|---|---|
| 施設ログイン | https://toyosu-smartcity.com/open_air/manage/facility/login.html |
| 管理者ログイン | https://toyosu-smartcity.com/open_air/manage/master/login.html |

HTTP でアクセスすると HTTPS へ 301 リダイレクトされます。

### 3-3. 転送プロトコル

このサーバー（CPI）は実測の結果：

| プロトコル | 可否 |
|---|---|
| SFTP (22) | ❌ **利用不可** |
| FTPS（明示的SSL・証明書検証オフ） | ✅ 利用可 |
| 平文FTP (21) | ✅ 利用可（推奨しない） |

**FTPS を使用してください。** 証明書の検証はオフにする必要があります（サーバー証明書がホスト名と一致しないため）。

### 3-4. GitHub と自動デプロイ

- リポジトリ: https://github.com/szk0310/toyosu-openaiir
- ブランチ `firebase-auth-migration` → **PR #1（未マージ）**
- workflow: [.github/workflows/deploy.yml](.github/workflows/deploy.yml)（`lftp` による FTPS 同期）
- 登録済み Secrets（値は GitHub 上のみ。この資料には記載しません）

| Secret | 内容 |
|---|---|
| `FTP_HOST` | 接続先ホスト名 |
| `FTP_USER` | FTPユーザー名 |
| `FTP_PASS` | FTPパスワード |
| `FTP_REMOTE_ROOT` | `open_air` |

⚠️ **`main` への push（＝PR #1 のマージ）で自動デプロイが走ります。** 意図しないタイミングでマージしないでください。

---

## 4. 運用手順

### 4-1. 施設アカウントの発行

**必ず管理者ログインが先です。** 施設アカウントは master 画面から発行します。

1. https://toyosu-smartcity.com/open_air/manage/master/login.html に管理者のメールアドレスでログイン
2. 施設を新規登録する
3. 登録すると：
   - Firebase Auth に施設アカウントが**自動作成**される
   - `facilityData` に施設情報＋`uid` が保存される
   - **ID/PASS のお知らせメールが自動送信される**
4. 発行された `login_id`（10桁）で施設ログインを試す

### 4-2. ID/PASS メールについて

- 送信先は**登録フォームに入力した担当者メールアドレス**です。管理者宛には届きません。
- 送信元は `info@toyosu-smartcity-email.com`、件名は「豊洲OpenAirのID及びPASSのお知らせ」です。
- 2026-07-26 のテスト送信では `shiro-k.jp` 宛で**受信ボックスに到達**しました。
- ⚠️ ただし送信元ドメインの SPF に潜在的な懸念があります（→ 5-3）。他社ドメイン宛で「届かない」
  報告があった場合は 5-3 を参照してください。

### 4-3. 施設を削除したとき

**Firestore のデータだけが消え、Firebase Auth のアカウントは残ります。**
完全に削除したい場合は `Authentication → Users` から手動で削除してください。
（データが無ければログインしても何も使えないため、急ぎではありません）

---

## 5. 未解決の課題・要判断事項

### 5-1. `categories.json` が未設置 ⚠️ 実害あり

- **必要な場所**: `/open_air/assets/json/categories.json`
- **影響**: 施設の `space_post.html` / `detail_post.html` で**カテゴリのチェックボックスが1つも表示されません**
- **状況**: 原本が開発マシン内・本番サーバー・テスト環境のいずれにも見つかりませんでした
- **必要な形式**:
  ```json
  { "space": [ { "field": "フィールド名", "name": "表示ラベル", "items": ["選択肢1", "選択肢2"] } ] }
  ```
- **対応**: 原本を探すか、カテゴリ内容を決めて新規作成する必要があります

### 5-2. `no-image.svg` が未設置（表示のみ）

- **必要な場所**: `/open_air/assets/upload_img/case/no-image.svg` と `/open_air/assets/upload_img/idea/no-image.svg`
- **影響**: 事例・アイデア一覧で、画像未登録の項目が「壊れた画像」アイコンになります
- **対応**: 任意のプレースホルダSVGを置けば解消します

### 5-3. mail.php の送信元ドメインと SPF の不一致 ⚠️ 要判断（緊急度：中）

> **実測結果（2026-07-26）**: `suzuki@shiro-k.jp` 宛のテスト送信は **受信ボックスに正常到達**しました。
> つまり現時点で運用が止まるような問題ではありません。以下は「将来他社ドメイン宛で弾かれうる」
> 潜在リスクとして記録しておくものです。

**ID/PASS メールが受信側によっては迷惑メールに振り分けられる可能性があります。**

[master/mail.php:11](master/mail.php#L11) の送信元設定：

```php
$from_email = "info@toyosu-smartcity-email.com";   // ← ハイフン付きの別ドメイン
$additional_params = "-f " . $from_email;          // ← エンベロープFromにも使用
```

DNS を確認した結果：

| ドメイン | SPFレコード | 実体 |
|---|---|---|
| `toyosu-smartcity-email.com`（送信元に指定） | `v=spf1 a:www2321.sakura.ne.jp mx ~all` | **さくら** 112.78.125.161 |
| `toyosu-smartcity.com`（Webサーバー） | `v=spf1 ip4:150.60.232.67 -all` | **CPI** 150.60.244.62 |

`mail.php` は **CPI サーバー**で動作しますが、差出人は**さくら側のドメイン**です。
`toyosu-smartcity-email.com` の SPF は さくらのサーバーしか許可していないため、CPI から送ると
SPF 判定が softfail（`~all`）となり、受信側で迷惑メール扱いされやすくなります。

**これは今回の Auth 移行で作り込んだ問題ではなく、以前からの設定です。** 影響範囲が
メール到達性というドメイン運用の領域のため、**スタッフ判断とし、あえて変更していません。**

対応が必要になるとすれば、**Gmail や Microsoft 365 など DMARC 判定の厳しい受信側に
ID/PASS メールを送るようになったとき**です。実際に「届かない」報告が出たら以下を検討してください。

- **A案**: `$from_email` を `@toyosu-smartcity.com` のアドレスに変更する（CPI から送るなら筋が通る）
- **B案**: `toyosu-smartcity-email.com` の SPF に CPI の送信サーバーを追加する（ドメイン管理者の作業）

⚠️ ただし `toyosu-smartcity.com` の SPF は `-all`（ハードフェイル）かつ許可IPが `150.60.232.67` のみです。
A案を採る場合、CPI の実際の送信経路がこのIPを通るか**事前に検証**してください。検証せずに変更すると
**現在届いているものまで届かなくなる**恐れがあります（現状は softfail `~all` なので、むしろ寛容です）。

### 5-4. FTP パスワードの変更（作業完了後）

FTPパスワードが作業中にチャット上で平文でやり取りされました。
**一連の作業完了後にスタッフが変更する**方針です。変更後は GitHub Secrets の `FTP_PASS` の
再登録が必要です（再登録しないと自動デプロイが失敗します）。

### 5-5. 匿名ユーザー2件の残骸

匿名ログイン廃止前に作られた、メールアドレスを持たない Auth ユーザーが2件残っています。
セキュリティルールで匿名ユーザーの書き込みは遮断済みのため実害はありませんが、
不要であれば `Authentication → Users` から削除して構いません。

### 5-6. PR #1 が未マージ

現在 `firebase-auth-migration` ブランチに6コミット。動作確認が済み次第マージしてください。
マージすると自動デプロイが走り、同じ内容が再アップロードされます（冪等なので安全です）。

---

## 6. トラブルシュート早見表

| 症状 | 原因 | 対処 |
|---|---|---|
| 施設ログインで「IDまたはパスワードが違います」 | Auth アカウントが存在しない | master 画面から施設を登録してアカウントを発行する |
| 施設ログインで「この施設のデータが見つかりません」 | 認証は成功。`facilityData` に該当 `login_id` が無い | Firestore のデータを確認 |
| 管理者ログインで「管理者権限がありません」 | 認証は成功。`admins/{uid}` が未作成 | 2-3 の手順で UID を `admins` に登録 |
| パスワードリセットメールが届かない | `firebaseapp.com` 差出人のため**迷惑メール行きが実測で確認済み** | **迷惑メールフォルダを確認**（ほぼここにある）。恒久対策はカスタムドメイン設定 |
| ID/PASSメールが届かない | ①施設を登録していない ②SPF不一致（5-3） | 登録の有無を確認 → 迷惑メールを確認（`shiro-k.jp` 宛は受信ボックス到達を実測済み） |
| カテゴリのチェックボックスが出ない | `categories.json` 未設置（5-1） | ファイルを設置する |
| 画面が真っ白／Vueが動かない | `/open_air/assets/js/common/vue.js` の欠落 | 配置を確認 |
| 自動デプロイが失敗する | Secrets 未設定・FTPパスワード変更後の未更新 | GitHub Secrets を確認 |

---

## 7. 関連資料

- [DEPLOY_本番反映手順.md](DEPLOY_本番反映手順.md) — デプロイ手順の詳細
- [firestore.rules](firestore.rules) — セキュリティルール本体
- [.github/workflows/deploy.yml](.github/workflows/deploy.yml) — 自動デプロイ定義
- GitHub PR #1: https://github.com/szk0310/toyosu-openaiir/pull/1
