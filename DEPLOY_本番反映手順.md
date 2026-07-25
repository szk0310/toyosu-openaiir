# 本番反映手順（Firebase Auth 移行）

対象プロジェクト: **toyosuopenair**（本番）
ブランチ: `firebase-auth-migration`

この改修で **パスワードは Firestore に一切保存されなくなり、Firebase Authentication（scryptで安全にハッシュ管理）に移行**します。

---

## 0. 前提と影響範囲

- 変更は `manage` アプリ内に閉じています（共有 config を使うのは manage の17ファイルのみ）。
- ログインID（`login_id`）は従来どおりランダム10桁を維持。内部的に `login_id@toyosu-openair.local` として Auth に登録します（外部にメールは送りません）。
- 既存の本番施設データには Auth アカウントが無いため、**移行後に master 画面から登録し直す**必要があります（実利用者がいない今のうちに）。

---

## 1. Firebase コンソールでの作業（あなたの作業・コードでは不可）

### 1-1. メール/パスワード認証を有効化
`Authentication` → `Sign-in method` → **「メール/パスワード」を有効化**
（プロジェクトが **toyosuopenair** になっていることを確認）

### 1-2. 管理者アカウントを作成
`Authentication` → `Users` → **ユーザーを追加**
- メール: あなたのメール（例 `suzuki@shiro-k.jp`）
- パスワード: 任意（master ログインで使用）

作成後、その **ユーザーUID をコピー**。

### 1-3. 管理者を admins コレクションに登録
`Firestore` → コレクション `admins` を作成し、**ドキュメントID = 上でコピーしたUID** の空ドキュメント（または `{ role: "admin" }`）を作成。
→ これで master / idea / case 画面に入れるようになります。もう一人のスタッフも同様に追加。

### 1-4. セキュリティルールをデプロイ
`Firestore` → `ルール` に、リポジトリの [`firestore.rules`](firestore.rules) の内容を貼り付けて **公開**。

---

## 2. ファイルのデプロイ（サーバーへアップロード）

以下をサーバーへ反映します。

| ローカル | サーバー配置先 |
|---|---|
| `manage/` 一式 | 既存の `manage/` を上書き |
| `_shared-config/assets/js/common/firestore_openAir.js` | サーバーの `assets/js/common/firestore_openAir.js`（manage の親階層）を上書き |

- `manage/assets/js/auth_guard.js` は manage 内なので、manage を上げれば一緒に反映されます。
- `firestore_openAir.js` は **本番(toyosuopenair)に切替済み**（テスト設定はコメントで残置。切り戻す時はコメントを入れ替え）。

---

## 3. 既存施設アカウントの作り直し

1. master 画面（`master/login.html`）に管理者でログイン。
2. 既存の施設（あなた＋スタッフ分）を **新規登録**し直す（新しいID/PASSがメール送信されます）。
   - 登録時に Firebase Auth ユーザーが自動作成され、`facilityData` に `uid` が保存されます。
3. 旧レコード（`login_pass` が残っている古いドキュメント）は master 一覧から **削除**。
   - ※ 施設削除では Firestore のデータのみ削除されます。Auth ユーザーの完全削除が必要な場合は
     コンソールの `Authentication → Users` から手動削除してください（データが無ければログインしても使えません）。

---

## 4. 動作確認チェックリスト

- [ ] master/login.html に管理者でログインできる／権限なしは弾かれる
- [ ] master で施設を新規登録 → ID・PASS がメール受信できる
- [ ] facility/login.html にそのID/PASSでログインできる
- [ ] 誤ったID/PASSでログインが弾かれる
- [ ] スペース・画像・カレンダー等の登録/更新ができる（施設ログイン中）
- [ ] idpass_post.html でパスワード変更できる（現パス誤りは弾かれる／変更後は新パスでログイン可）
- [ ] ログインせずに管理ページを直接開くとログイン画面へ飛ぶ
- [ ] （検証）ブラウザのコンソールから匿名で `facilityData` に **書き込みできない**ことを確認

---

## 5. 切り戻し（万一のとき）

- Git: `git checkout main` で改修前（`baseline`）に戻せます。
- config: `firestore_openAir.js` のテスト/本番のコメントを入れ替え。
- ルール: 旧ルールに戻す（改修前は匿名 read/write 許可だったはず）。

---

## 補足: セキュリティ上の効果

| 項目 | 改修前 | 改修後 |
|---|---|---|
| パスワード保存 | Firestore に**平文** | Firestore に保存せず、**Firebase Auth が scrypt でハッシュ管理** |
| 認証照合 | ブラウザ側で平文比較 | Firebase サーバー側で認証 |
| 匿名での書き込み | 可能（改ざんリスク） | **不可**（非匿名ログイン必須） |
| 管理画面(master/idea/case) | 無認証 | **管理者ログイン必須** |

---

## 6. GitHub Actions での自動デプロイ（任意）

`.github/workflows/deploy.yml` を用意済み。**main への push または手動実行**で、CPI サーバーへ FTPS（暗号化）で自動反映されます。
**2026-07-26 に初回実行し成功済み**（run ID `30164894746` / 1分1秒）。

> このサーバー(CPI)は **SFTP(22)は不可**、**FTPS（明示的SSL・証明書検証オフ）で接続可**であることを実測で確認済み。認証情報・データはSSLで暗号化して転送します。

### 6-1. 事前に GitHub Secrets を登録
リポジトリ → **Settings → Secrets and variables → Actions → New repository secret** で以下を登録:

| Secret 名 | 内容 | 例 |
|---|---|---|
| `FTP_HOST` | 接続先ホスト名 | `toyosu-smartcity.com` |
| `FTP_USER` | FTP ユーザー名 | `smartcity_ftp` |
| `FTP_PASS` | パスワード | （CPIのFTPパスワード） |
| `FTP_REMOTE_ROOT` | `manage/` の1つ上の階層のパス（FTPホームからの相対でも可、末尾スラッシュ不要） | `open_air` |
| `FTP_PORT` | （任意）FTPポート。未設定なら 21 | `21` |

- `FTP_REMOTE_ROOT` は「`manage/` と共有`assets/` を置く親フォルダ」です。公開URL `https://toyosu-smartcity.com/<ROOT>/manage/facility/login.html` の `<ROOT>` に相当します。
- **確定済み（2026-07-25）**: `<ROOT>` = **`open_air`**。Secrets 4件とも登録済み。本番サーバー直下の `/manage/` は別の既存アプリ（news系）なので混同しないこと。
- サーバーは HTTP → HTTPS に 301 リダイレクトします。

### 6-2. 反映されるファイル
| ローカル | サーバー |
|---|---|
| リポジトリ直下の管理画面一式（`facility/` `master/` `idea/` `case/` `assets/`） | `<ROOT>/manage/` |
| `_shared-config/assets/` 一式（`js/common/firestore_openAir.js`・`js/common/vue.js` など） | `<ROOT>/assets/` |

#### リポジトリに含まれない、サーバー側にだけ存在するもの
`<ROOT>/assets/` 配下には、各HTMLが `../../assets/...` で参照する以下も必要です。CIの同期対象外なので**サーバー上で維持**します。

| パス | 用途 | 状態 |
|---|---|---|
| `<ROOT>/assets/json/categories.json` | space_post / detail_post のカテゴリ選択肢 | ⚠️ **未設置**（原本が見つかっていない） |
| `<ROOT>/assets/upload_img/facility/{main,icon,space}/` | 施設画像のアップロード先 | ディレクトリ作成済み |
| `<ROOT>/assets/upload_img/{case,idea}/` | 事例・アイデア画像のアップロード先 | ディレクトリ作成済み |
| `<ROOT>/assets/upload_img/{case,idea}/no-image.svg` | 画像未登録時のプレースホルダ | ⚠️ **未設置** |

`categories.json` の形式:
```json
{ "space": [ { "field": "フィールド名", "name": "表示ラベル", "items": ["選択肢1", "選択肢2"] } ] }
```

`_shared-config/`・`.git`・`.github`・`*.md`・`firestore.rules` はサーバーへは転送されません（管理画面の動作に不要なため）。

### 6-3. 実行方法
- **手動**: Actions タブ → 「Deploy to CPI (FTPS)」→ Run workflow
- **自動**: `main` に push した時（PR #1 は 2026-07-26 にマージ済み）

> ⚠️ Secrets を登録する**前**に main へマージすると、初回デプロイは失敗します（認証情報が無いため）。**先に 6-1 の Secrets を登録**してからマージ／手動実行してください。

### 6-4. 手動FTPでの反映（Actionsを使わない場合）
Actions を使わず、FTPクライアント（FileZilla等）で直接上げてもOKです。その場合も配置は 6-2 の対応表どおり:
`<ROOT>/manage/` にリポジトリ直下の管理画面一式、`<ROOT>/assets/` に `_shared-config/assets/` の中身。

### 6-5. 初回デプロイ記録（2026-07-25）
`<ROOT>` = `open_air` に **FTPS で手動アップロード済み**（67ファイル＋共有config＋vue.js）。`upload_img` のディレクトリツリーも作成済み。
公開URL: https://toyosu-smartcity.com/open_air/manage/facility/login.html
