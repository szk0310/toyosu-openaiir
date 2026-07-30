# コード変更明細書 — Firebase Auth 移行

最終更新: 2026-07-30

[HANDOFF_スタッフ向け.md](HANDOFF_スタッフ向け.md) が「何が起きたか」の概要資料であるのに対し、
この資料は **どのファイルをどう書き換えたか** を1件ずつ具体的に示すものです。
コードレビュー・引き継ぎ・障害切り分けの際の参照用です。

## 比較対象

| | |
|---|---|
| 変更前（baseline） | `origin/main` = `888de70` 「baseline: 現行のmanage管理画面（改修前）」 |
| 変更後 | ブランチ `firebase-auth-migration`（PR #1） |
| 差分の確認コマンド | `git diff origin/main..firebase-auth-migration` |

> ⚠️ baseline コミットは 2026-07-24 に既存ファイルをそのまま登録したものです。
> したがって「baseline に既にあったが、それ自体この一連の改修で作られたファイル」が一部あります
> （例: `assets/js/auth_guard.js`）。この資料では**あくまで baseline との差分**を記載します。

## 変更規模

| 種別 | ファイル数 |
|---|---|
| HTML | 17 |
| JavaScript | 22 |
| PHP | 6 |
| セキュリティルール | 1 |
| CI 定義（YAML） | 1 |
| **合計** | **47** |

（`vue.js` と Markdown 資料を除く。`vue.js` は内容変更ではなく `_shared-config/` への複製です）

---

# 第1部 横断的な変更（同じ書き換えを多数のファイルに適用）

## パターン A: 匿名ログインの撤廃 — 22箇所

これが今回の改修の中核です。改修前は**全ページが匿名ログインで Firestore に接続**していました。

```js
// 【改修前】ページを開いた誰でも Firestore に接続できた
firebase.auth().signInAnonymously()
  .then(() => {
     const db = firebase.firestore();
     ...
  })
```

```js
// 【改修後・施設ページ】ログイン済みの施設ユーザーでなければ login.html へ飛ばす
ensureAuth()
  .then(() => {
     const db = firebase.firestore();
     ...            // ← 中身は一切変更していない
  })
```

```js
// 【改修後・管理者ページ】admins/{uid} を持つ管理者でなければ master/login.html へ飛ばす
ensureAdmin("../master/login.html")
  .then(() => { ... })
```

`ensureAuth()` / `ensureAdmin()` は **`signInAnonymously()` と同じく Promise を返す**ように作ってあります。
そのため `.then()` 以降の既存ロジックには手を入れていません。**1行の置換で済ませることで改修範囲を最小化**しています。

**内訳**

| 置換後 | 呼び出し箇所 | 対象 |
|---|---|---|
| `ensureAuth()` | 12 | 施設（facility）系ページ |
| `ensureAdmin("../master/login.html")` | 11 | 管理者（master / idea / case）系ページ |

<details>
<summary>ensureAuth() に置換したファイル（12）</summary>

- `facility/assets/js/app_manage_detail_post.js`
- `facility/assets/js/app_manage_space.js`
- `facility/assets/js/app_manage_space_calender.js`
- `facility/assets/js/app_manage_space_image.js`
- `facility/assets/js/app_manage_space_image_order.js`
- `facility/assets/js/app_manage_space_post.js`
- `facility/assets/js/app_manage_space_post_000.js`
- `facility/assets/js/app_manage_space_post_100.js`
- `facility/assets/js/app_manage_space_post_err.js`
- `facility/upload_image.php`
- `facility/upload_image_icon.php`
- `facility/upload_image_space.php`
</details>

<details>
<summary>ensureAdmin() に置換したファイル（9ファイル・11箇所）</summary>

- `case/assets/js/app_manage_case.js`
- `case/assets/js/app_manage_detail_post.js`
- `case/assets/js/app_manage_post.js`（2箇所）
- `case/upload_image.php`
- `idea/assets/js/app_manage_detail_post.js`
- `idea/assets/js/app_manage_idea.js`
- `idea/assets/js/app_manage_post.js`（2箇所）
- `idea/upload_image.php`
- `master/assets/js/app_manage_master.js`
</details>

## パターン B: `auth_guard.js` の読み込み追加 — 25ファイル

パターンAの関数を使うため、全ページに1行追加しました。

```html
 <script src="../../assets/js/common/firestore_openAir.js"></script>
+<script src="../assets/js/auth_guard.js"></script>
```

⚠️ **読み込み順が重要です。** `firestore_openAir.js`（Firebase 初期化）より**後**に置いてください。
順序を逆にすると `firebase is not defined` で全ページが動かなくなります。

## パターン C: 画像アップロード PHP の Firestore 書き込みを認証で包む — 5ファイル

`upload_image*.php` はアップロード完了後に JavaScript を出力して Firestore を更新します。
その部分を `ensureAuth()` / `ensureAdmin()` で包みました。

```php
   alert("ファイルをアップロードしました。")
+  ensureAuth().then(function () {
   const db = firebase.firestore();
   db.collection("facilityData").doc(id).set({...})
+  });
```

> ⚠️ **これはブラウザ側の制御にすぎません。** PHP のファイル受け取り処理そのもの
> （`move_uploaded_file`）にはサーバー側の認証チェックがありません。詳細は第4部を参照してください。

---

# 第2部 ファイル単位の変更（重要なもの）

## 2-1. `_shared-config/assets/js/common/firestore_openAir.js` — Firebase 初期化設定

**変更点3つ**

**① 接続先をテストから本番へ切り替え**

```js
// 【改修前】テスト環境を向いていた
    apiKey: "AIzaSy...CUDA",
    projectId: "testtoyosuopenair",
    //本番 toyosuOpenAir
    //apiKey: "AIzaSy...PiQ8",
    //projectId: "toyosuopenair",
```
```js
// 【改修後】本番を向いている（テストは切り戻し用にコメントで残置）
    //========= 本番 toyosuOpenAir =========
    apiKey: "AIzaSy...PiQ8",
    projectId: "toyosuopenair",

    //========= テスト testtoyosuOpenAir（切り戻し用・コメント） =========
    //apiKey: "AIzaSy...CUDA",
    //projectId: "testtoyosuopenair",
```

**② 内部ドメイン定数を追加**

```js
+ window.AUTH_EMAIL_DOMAIN = "@toyosu-openair.local";
```

施設のログインIDを Firebase Auth 用のメールアドレスに変換するためのものです。
**実在しないドメインで、メールは一切送信されません。** Firebase Auth がメール形式のIDしか
受け付けないための便宜的な変換です。

**③ ファイル冒頭の匿名ログインを廃止**

```js
- firebase.auth().signInAnonymously().catch(error => console.log(error));
+ // 匿名ログインは廃止しました。
+ // 各ページは auth_guard.js の withAuth() でログイン済みセッションを利用します。
```

このファイルは**全ページが読み込む**ため、ここで匿名ログインしていたことが
「誰でも Firestore に接続できる」状態の原因でした。

## 2-2. `facility/assets/js/manage_login.js` — 施設ログイン（+30 / −41）

**最も重要な変更です。**

```js
// 【改修前】Firestore を平文パスワードで検索して照合していた
firebase.auth().signInAnonymously().then(() => {
  db.collection("facilityData")
    .where("login_id", "==", id_txt)
    .where("login_pass", "==", pass_txt)   // ← パスワードで検索
    .get()
    .then(querySnapshot => {
       if (!querySnapshot.empty) { ... location.href = "index.html"; }
       else { alert("IDまたはパスワードが違います"); }
    });
});
```

```js
// 【改修後】Firebase Auth で認証し、その後に施設データを引く
var email = id_txt + window.AUTH_EMAIL_DOMAIN;      // 10桁ID → 内部メールアドレス

firebase.auth().signInWithEmailAndPassword(email, pass_txt)
  .then(function (cred) {
     return db.collection("facilityData")
       .where("uid", "==", cred.user.uid)           // ← ※2026-07-30に login_id から変更（第6部）
       .limit(1)
       .get()
       .then(function (querySnapshot) {
          if (!querySnapshot.empty) {
             ... location.href = "index.html";
          } else {
             // 認証は通ったが施設データが無い（削除済みなど）
             alert("この施設のデータが見つかりません。管理者にお問い合わせください。");
             firebase.auth().signOut();
          }
       });
  })
  .catch(function (error) {
     alert("IDまたはパスワードが違います");
  });
```

**押さえるべき点**

- 改修前は「パスワードを含むクエリを投げる」＝**パスワードが通信内容とDBの両方に平文で存在**していました。
- 改修後は認証を Firebase Auth が担います。Firestore への問い合わせは当初 `login_id` でしたが、
  所有者限定ルールの導入に伴い **`uid` での検索に変更**しました（第6部）。
- **エラーメッセージが2種類に分かれました。** これが障害切り分けの手がかりになります。
  - 「IDまたはパスワードが違います」→ **認証で失敗**（Auth アカウントが無い or パスワード誤り）
  - 「この施設のデータが見つかりません」→ **認証は成功**したが Firestore にデータが無い

## 2-3. `master/login.html` + `master/assets/js/master_login.js` — 管理者ログイン（**新規**）

改修前、master / idea / case 画面には**ログイン画面が存在しませんでした**（URLを知っていれば誰でも開けた）。
今回、管理者用のログイン画面を新規作成しました。

```js
// master_login.js（全30行・新規）
firebase.auth().signInWithEmailAndPassword(email, pass)   // ← 実在のメールアドレスで認証
  .then(function (cred) {
     // admins/{uid} が存在する場合のみ管理者として許可
     return firebase.firestore().collection("admins").doc(cred.user.uid).get()
       .then(function (doc) {
          if (doc.exists) { location.href = "index.html"; }
          else {
             alert("管理者権限がありません");
             firebase.auth().signOut();
          }
       });
  })
  .catch(function (error) { alert("メールアドレスまたはパスワードが違います"); });
```

**2段構えになっています。** Firebase Auth で認証が通っても、`admins/{uid}` が無ければ入れません。
つまり**施設アカウントで管理者画面に入ることはできません。**

## 2-4. `master/assets/js/app_manage_post.js` — 施設登録（+72 / −68）

施設を新規登録する処理です。ここで **Firebase Auth のアカウントが自動生成**されます。

```js
// 【改修前】平文パスワードごと Firestore に保存していた
db.collection("facilityData").doc(fid).set({
    f_id: fid,
    login_id: l_id,
    login_pass: pass,        // ← 平文パスワードを保存
    ...
})
.then(() => { post("mail.php", {...}); });
```

```js
// 【改修後】Auth にユーザーを作り、Firestore にはパスワードを保存しない
const authEmail = l_id + window.AUTH_EMAIL_DOMAIN;

// ★ 二次アプリを使う（理由は下記）
const secondaryApp =
   (firebase.apps || []).filter(function (a) { return a.name === "Secondary"; })[0] ||
   firebase.initializeApp(firebase.app().options, "Secondary");

secondaryApp.auth().createUserWithEmailAndPassword(authEmail, pass)
  .then(function (cred) {
     const uid = cred.user.uid;
     secondaryApp.auth().signOut();          // 作成専用。すぐサインアウト

     return db.collection("facilityData").doc(fid).set({
        f_id: fid,
        uid: uid,              // ← 追加。ルールの所有者判定に使う
        login_id: l_id,
        // login_pass は保存しない
        ...
     });
  })
  .then(function () {
     post("mail.php", { email: contactMail, lid: l_id, pass: pass });  // メール通知は従来どおり
  })
  .catch(function (error) {
     if (error && error.code === "auth/email-already-in-use") {
        alert("このIDは既に使用されています。もう一度お試しください。");
     } else {
        alert("登録に失敗しました: " + error.message);
     }
  });
```

**⚠️ 「二次アプリ（Secondary）」を使っている理由 — 改修する人は必ず理解してください**

Firebase Auth では `createUserWithEmailAndPassword()` を実行すると、
**作成したユーザーとして自動的にログインし直してしまいます**。
通常のアプリインスタンスで実行すると、施設を1件登録するたびに
**管理者のログインセッションがその施設アカウントに切り替わってしまう**のです。

これを避けるため、`"Secondary"` という別名の Firebase アプリインスタンスを作り、
そちら側でユーザー作成 → 即サインアウトしています。管理者のセッションは無傷のまま保たれます。

**この構造を壊すと「施設を登録すると管理者が勝手にログアウトされる」不具合になります。**

## 2-5. `facility/assets/js/app_manage_idpass_post.js` — パスワード変更（+79 / −92）

施設が自分のパスワードを変更する画面です。

```js
// 【改修前】Firestore の平文パスワードを比較して、平文で上書きしていた
if (pass_input !== pass) { alert("パスワードが違います"); return false; }
...
db.collection("facilityData").doc(id).set({
    mail: form1.email.value,
    login_pass: form1.pass_new_conf.value,   // ← 新パスワードを平文で保存
    updated_at: ts
}, { merge: true });
```

```js
// 【改修後】Firebase Auth の再認証 → パスワード更新
var user = firebase.auth().currentUser;
if (!user) { alert("セッションが切れました。再度ログインしてください。"); location.href = "login.html"; return false; }

var cred = firebase.auth.EmailAuthProvider.credential(user.email, cur_pass);
user.reauthenticateWithCredential(cred)      // ① 現パスワードで再認証
  .then(function () { return user.updatePassword(pass_n); })   // ② Auth 側を更新
  .then(function () {
     return db.collection("facilityData").doc(self.fid).set({
        mail: form1.email.value,             // ③ Firestore は連絡先メールのみ更新
        updated_at: ts
     }, { merge: true });
  })
  .catch(function (error) {
     if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        alert("現パスワードが違います");
     }
  });
```

- 現パスワードの照合を**アプリ側の文字列比較から Firebase Auth の再認証に置き換え**ました。
- Firestore に書くのは連絡先メールアドレスだけになりました。
- 画面テンプレート側も、パスワードを表示していた `<input v-model="appFacilityData.login_pass">` を
  コメントアウトしています（データが存在しなくなったため）。

## 2-6. `assets/js/auth_guard.js` — 認証ガード（既存ファイルに +46行）

> **このファイルは baseline 時点で既に存在していました**（`withAuth` / `withAdmin` / `logoutManage`）。
> 今回の差分は、既存コードを1行で置換できるようにする**互換ヘルパー2つの追加**です。

```js
+ global.ensureAuth = function (loginUrl) { ... }    // 施設ページ用
+ global.ensureAdmin = function (loginUrl) { ... }   // 管理者ページ用
```

| 関数 | 用途 | 未認証時の挙動 |
|---|---|---|
| `withAuth(cb, opts)` | 既存。コールバック形式 | `loginUrl` へ遷移 |
| `withAdmin(cb, opts)` | 既存。管理者用コールバック形式 | `loginUrl` へ遷移 |
| **`ensureAuth(loginUrl)`** | **今回追加。** Promise を返す | `loginUrl` へ遷移（Promise は解決しない） |
| **`ensureAdmin(loginUrl)`** | **今回追加。** Promise を返す | 権限が無ければ警告 → サインアウト → 遷移 |
| `logoutManage(loginUrl)` | 既存。ログアウト | — |

`ensureAuth` / `ensureAdmin` は**未認証時に Promise を解決しません**（画面遷移するため）。
`.then()` の中身が実行されないのは仕様です。バグではありません。

## 2-7. `firestore.rules` — セキュリティルール（**新規**）

改修前は**ルールファイルがリポジトリに存在しませんでした。**
新規作成して 2026-07-24 に適用し、その後 **2026-07-30 に2度改訂**しています（経緯は第6部）。
以下は**現行版**です。

```js
function signedIn() {                     // 非匿名でログインしているか
  return request.auth != null
    && request.auth.token.firebase.sign_in_provider != 'anonymous';
}
function isAdmin() {                      // 管理者か（admins/{uid} が存在するか）
  return signedIn()
    && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}
function ownsExisting() {                 // 既存ドキュメントの所有者か
  return signedIn() && resource.data.uid == request.auth.uid;
}
function ownsIncoming() {                 // 書き込む内容の所有者が自分か（uidの付け替え防止）
  return signedIn() && request.resource.data.uid == request.auth.uid;
}
function missingDoc() {                   // 存在しないドキュメントの取得
  return signedIn() && resource == null;
}
```

| コレクション | read | write |
|---|---|---|
| `facilityData` | 所有者(uid一致)と管理者のみ | create/delete = 管理者のみ<br>update = 所有者または管理者 |
| `spaceData` | 所有者と管理者のみ | 所有者または管理者 |
| `calendarData` | 所有者と管理者のみ | 所有者または管理者 |
| `ideaData` | **管理者のみ** | 管理者のみ |
| `caseData` | **管理者のみ** | 管理者のみ |
| `admins` | 本人のみ | **常に禁止**（コンソールから手動作成） |
| その他すべて | 禁止 | 禁止 |

### ★ 改修する人が必ず理解すべき3点

**① `list`（クエリ）はルールがフィルタしてくれない**

`resource.data.uid` を参照するルールの下では、**クエリ側も `.where("uid","==",自分のuid)` で
絞らないと Firestore がクエリごと拒否します**（一部だけ返す、という挙動にはなりません）。
施設側の全クエリは uid で絞るよう実装済みです。実測で確認しています。

| クエリ | 結果 |
|---|---|
| `where("uid","==",自分)` | ✅ 200 |
| `where("s_id","==",X).where("uid","==",自分)` | ✅ 200（複合インデックス不要） |
| `where("f_id","==",X)` のみ | ❌ 403 |
| `where("login_id","==",X)` のみ | ❌ 403 |
| 絞り込み無しの一覧（施設ユーザー） | ❌ 403 |
| 絞り込み無しの一覧（管理者） | ✅ 200 |

**② `spaceData` / `calendarData` の新規作成時は `uid` の書き込みが必須**

`uid` を入れずに作成するとルールに拒否されて保存できません。既存の13件には補完済みです。

**③ 存在しないドキュメントの取得は明示的に許可している**

`resource == null` のとき `resource.data.uid` を評価するとエラーになり拒否されてしまいます。
カレンダー画面は「まだ保存していない月」を必ず読みに行くため、これが無いと画面が壊れます。
実測では**存在しない文書は 404（403 ではない）**を返すことを確認済みです。

- `admins` は**ルール上コードから書き込めません**。管理者の追加は必ず Firebase コンソールで行ってください。

⚠️ **ルールはリポジトリに置くだけでは効きません。**
`firebase deploy --only firestore:rules --project toyosuopenair` で明示的に適用してください
（`firebase.json` を用意済み）。

## 2-8. `master/mail.php` — ログインURL（+1 / −1）

```php
- "ログインページ：http://toyosu-smartcity.com/xxxxxxxxxx/manage/facility/login.html"
+ "ログインページ：http://toyosu-smartcity.com/open_air/manage/facility/login.html"
```

本番の配置先が `/open_air/` に確定したことによる修正です。
それ以外の送信ロジック・文面は変更していません。

## 2-9. `.github/workflows/deploy.yml` — 自動デプロイ（**新規** 95行）

FTPS でサーバーへ同期する GitHub Actions です。詳細は
[DEPLOY_本番反映手順.md](DEPLOY_本番反映手順.md) を参照してください。

- トリガー: 手動実行、および `main` への push
- `lftp` で `mirror -R --only-newer` 実行（**サーバー側のファイルを削除しない**設定）
- Secrets 4件（`FTP_HOST` / `FTP_USER` / `FTP_PASS` / `FTP_REMOTE_ROOT`）に依存

> 当初 SFTP で作成しましたが、CPI サーバーが SFTP 非対応と実測で判明したため FTPS に変更しています。

---

# 第3部 データ構造の変更

## `facilityData` コレクション

| フィールド | 改修前 | 改修後 |
|---|---|---|
| `login_id` | あり（ランダム10桁） | **変更なし** |
| `login_pass` | **平文パスワード** | **削除**（フィールドごと廃止） |
| `uid` | 無し | **追加**（Firebase Auth の UID。ルールの所有者判定に使用） |
| その他 | — | 変更なし |

`login_pass` がコード中に残っていないことを確認済みです（残るのはコメントアウトされた
テンプレート行と説明コメントのみ）。

## `admins` コレクション（**新規**）

| | |
|---|---|
| ドキュメントID | Firebase Auth の UID |
| フィールド | `role: "admin"`、`staff: "メールアドレス"` |
| 作成方法 | Firebase コンソールで手動（ルールで書き込み禁止） |

**ドキュメントが存在すること自体が管理者権限**を意味します。`role` の値は判定に使っていません
（人間が見て分かるようにするための記録です）。

---

# 第4部 残存リスク・改修時の注意

## 4-1. ~~画像アップロード PHP にサーバー側の認証がない~~ → **解消済み（2026-07-30）**

以前は `upload_image*.php` に加えた `ensureAuth()` がブラウザ側の JavaScript にすぎず、
PHP がファイルを受け取って保存する処理自体には認証がありませんでした。
**現在は [_auth.php](_auth.php) が PHP 側で Firebase の IDトークンを検証します**（第7部）。

## 4-2. 施設削除時に Auth アカウントが残る

管理画面から施設を削除しても、消えるのは Firestore のデータだけです。
Firebase Auth のアカウントは残ります。完全に消すには
`Authentication → Users` から手動削除してください。
（データが無ければログインしても何もできないため、緊急性はありません）

## 4-3. 改修する際に壊してはいけない3点

1. **`auth_guard.js` の読み込み順** — `firestore_openAir.js` より後（パターンB）
2. **二次アプリ（Secondary）による施設アカウント作成** — 壊すと管理者が勝手にログアウトされる（2-4）
3. **`firestore.rules` の適用** — ファイルを直しただけでは反映されない（2-7）

## 4-4. 未検証の項目

以下は**まだ実機で確認できていません**（本番の施設データが0件のため）。

- 施設の新規登録 → Auth アカウント自動生成 → ID/PASS メール送信 → 施設ログインの一連の流れ
- 施設によるパスワード変更（再認証フロー）
- 画像アップロードと Firestore 反映
- スペース／カレンダーの登録・編集

**最初の施設を登録する際に、上記を一通り確認してください。**

---

# 第5部 手作業で Firebase のデータを直すときの注意

> **スタッフが最も踏みやすい地雷です。** コンソールから直接データを触る前に必ず読んでください。

## 5-1. 大前提：認証情報は Firestore に無い

「Firebase の DB」には性質の異なる2つがあり、**認証を握っているのは Authentication のほう**です。

| | 何が入っているか | 認証への影響 |
|---|---|---|
| **Authentication** | ログインID（内部メールアドレス）とパスワードのハッシュ | **ここが本体** |
| **Firestore** | 施設の業務データ（`login_id`・`f_id`・`uid` など） | **認証には使われない** |

改修前は Firestore に平文パスワードがあったため「DBを直せば直る」感覚が通用しましたが、
**移行後はまったく通用しません。**

## 5-2. どこを変えると何が起きるか

| 変更箇所 | 結果 |
|---|---|
| Firestore に `login_pass` を追加/変更 | **何も起きない。** 認証は Auth が行うため完全に無視される。⚠️ しかも `facilityData` は **read が公開**なので、平文パスワードを置くと誰でも読める状態になる。**絶対にやらないこと** |
| Firestore の `login_id` を変更 | ⚠️ **ログイン不能になる**（5-3 参照） |
| Firestore の `uid` を変更 | ⚠️ **その施設は自分のデータを一切参照・更新できなくなる。** ルールが `resource.data.uid == request.auth.uid` で所有者を判定しているため（管理者は引き続き可）。`spaceData` / `calendarData` の `uid` も同様 |
| `spaceData` / `calendarData` を `uid` 無しで手動作成 | ルールに拒否され、施設からは読めない。**必ず `uid` を入れること**（→ 第6部） |
| Firestore の `f_id` を変更 | スペース・カレンダー・画像との紐付けが切れる。`f_id` は各画面の `where("f_id", "==", ...)` の検索キー |
| **Auth** のパスワードを変更 | ✅ **正しく反映される。これが正規の変更方法** |
| **Auth** のメールアドレス（＝ID）を変更 | ⚠️ Firestore の `login_id` と食い違い、ログイン不能になる |

## 5-3. `login_id` を片方だけ変えると「どちらのIDでも入れなくなる」

ログイン処理は2段階です（[facility/assets/js/manage_login.js](facility/assets/js/manage_login.js)）。

```js
// ① Auth で認証する
signInWithEmailAndPassword(id_txt + "@toyosu-openair.local", pass)
// ② 認証が通ってから Firestore を login_id で検索する
  .where("login_id", "==", id_txt)
```

Firestore の `login_id` だけを新しい値に書き換えると、こうなります。

| 試すID | 結果 |
|---|---|
| **新しいID** | ①で失敗（Auth にそのアカウントが無い）→「IDまたはパスワードが違います」 |
| **古いID** | ①は成功するが②で見つからない →「この施設のデータが見つかりません」→ 強制サインアウト |

**どちらでもログインできません。** Auth と Firestore が食い違った状態は、
エラーメッセージからは原因が分かりにくいので特に注意してください。

## 5-4. 正しいやり方

**パスワードを変更したい**

| 誰が | 方法 |
|---|---|
| 施設本人 | 管理画面の `idpass_post.html`（現パスワードの入力が必要） |
| 管理者 | Firebase コンソール `Authentication → Users` から該当ユーザーのパスワードを設定し直す |

どちらも **Firestore は触りません。** Firestore にパスワードは存在しないので、触る必要も余地もありません。

⚠️ **Firebase のパスワードリセットメールは施設アカウントには使えません。**
施設のアドレスは `login_id@toyosu-openair.local` で、**このドメインは実在しないためメールが届きません。**
施設がパスワードを紛失した場合は、上記の管理者による再設定か、施設の削除→再登録で対応してください。

**IDを変更したい**

原則 **「変えない」** のが正解です。`login_id` はランダム10桁で、人が覚える類のものではありません。
どうしても必要なら **Auth のメールアドレスと Firestore の `login_id` を必ずセットで**変更してください
（`f_id` と `uid` は別物なので触らないこと）。
実務的には **施設を削除して再登録するほうが安全**です（新しいIDとパスワードが発番され、メールも自動送信されます）。

## 5-5. コンソールからの直接編集はセキュリティルールを迂回する

Firebase コンソールは管理者権限で動作するため、[firestore.rules](firestore.rules) の制約を受けません。
アプリ経由なら弾かれる不整合な変更も、コンソールからは通ってしまいます。
**ルールが守ってくれない前提で、5-2 の依存関係を意識して作業してください。**

---

# 第6部 セキュリティ修正（2026-07-30）— 施設データの外部公開と施設間の分離

Firebase Auth 移行とは別に、**データが外部から閲覧できる状態**が見つかり修正しました。

## 6-1. 何が起きていたか

スタッフから「他の施設の情報がコンソールで見えてしまう」と報告があり調査したところ、
**認証トークンを一切付けずに、インターネット上の誰でも全件取得できる状態**でした。

| コレクション | 公開されていた件数 | 含まれていた機微情報 |
|---|---|---|
| `facilityData` | 6件（全24項目） | **`login_id`（認証情報の半分）・担当者メールアドレス** |
| `spaceData` | 13件 | — |
| `ideaData` / `caseData` | 3件 / 2件 | — |

パスワードは Firebase Auth 管理のため流出していません。

**原因**は `allow read: if true`。「公開サイトの表示を壊さないため」としていましたが、
サーバー全体を調べた結果**このデータを参照する公開サイトは存在しませんでした**
（`/thub/` は別プロジェクト `toyosuevent` を使用）。守るべき互換性が無いまま公開されていました。

## 6-2. 第1段階 — read を認証必須に（即時遮断）

全コレクションの `allow read: if true` を `if signedIn()` に変更。外部からの閲覧を止めました。

## 6-3. 第2段階 — 所有者(uid)による分離

ログイン済みの施設同士はまだ相互に見えていたため、所有者と管理者のみに限定しました。
**ルール変更だけでは実現できず、データ・コード・ルールの3つを揃える必要があります。**

### ① データ: `spaceData` に `uid` を補完

既存13件に `uid` がありませんでした。`f_id` から `facilityData.uid` を引いて補完しています
（`updateMask` で `uid` のみ追加、他フィールドは未変更）。

### ② コード: クエリを `uid` ベースへ

**`list`（クエリ）はルールがフィルタしてくれません。** 所有者限定ルールの下では、
クエリ側も `uid` で絞らないと Firestore がクエリごと拒否します。

| ファイル | 変更前 | 変更後 |
|---|---|---|
| `facility/assets/js/manage_login.js` | `where("login_id","==",id)` | `where("uid","==",cred.user.uid)` |
| `facility/assets/js/app_manage_idpass_post.js` | `where("f_id","==",fid)` | `where("uid","==",user.uid)` |
| `facility/assets/js/app_manage_detail_post.js` | `where("f_id","==",fid)`（2箇所） | `where("uid","==",...)` |
| `facility/assets/js/app_manage_space.js` | `where("f_id","==",fid)` | `where("uid","==",user.uid)` |
| `app_manage_space_image.js` / `_image_order.js` / `_calender.js` | `where("s_id","==",sid)` | `.where("s_id",...).where("uid",...)` |
| `app_manage_space_post{,_000,_100,_err}.js` | — | 新規作成時に `uid` を保存 |
| `app_manage_space_calender.js` | — | `calendarData` 作成時に `uid` / `s_id` を保存 |

`ensureAuth()` は認証済みユーザーを解決するため、`.then((user) => ...)` で `user.uid` を受け取っています。

### ③ ルール: 所有者限定へ

現行のルールは 2-7 を参照してください。

## 6-4. 適用順序（重要）

**データ → コード → ルール** の順で適用しました。逆順にするとアプリが停止します。

| 順 | 内容 | 理由 |
|---|---|---|
| 1 | `spaceData` に `uid` を補完 | ルール適用時に既存データが弾かれないようにするため |
| 2 | コードを本番へデプロイ | 新しい `uid` クエリは**旧ルールでも動く**ので先に出せる |
| 3 | ルールを本番へ適用 | 最後。この時点で新コードが揃っている |

## 6-5. 検証方法

ルールのテスト API には**再現できない挙動が2つ**あることが分かりました。

- `list`（クエリ）を正しく評価できない
- `resource == null`（存在しないドキュメント）を再現できない

いずれも「`if true` のルールでも DENY になる」対照実験で確認しました。そこで
**テスト環境 `testtoyosuopenair` に検証用ユーザーを作成し、実際の Firestore に対して
end-to-end で検証**しています。

| 検証項目 | 結果 |
|---|---|
| 自分の `facilityData` を取得 | ✅ 200 |
| 他施設の `facilityData` を取得 | ✅ 403 |
| 絞り込み無しで一覧（施設ユーザー） | ✅ 403 |
| `where("uid","==",自分)` で一覧 | ✅ 200 |
| `where("s_id",X).where("uid",自分)` | ✅ 200（複合インデックス不要） |
| `where("f_id",X)` のみ（旧クエリ） | ✅ 403 ＝ コード変更が必須だった裏付け |
| 存在しない文書を取得 | ✅ **404**（403 ではない） |
| 管理者が全件一覧 | ✅ 200 |
| 管理者が `ideaData` を取得 | ✅ 許可（404＝存在しないだけ） |

検証用のユーザーとデータは削除済みです。なお検証のため、テスト環境で
**①メール/パスワード認証を有効化、②本番と同じルールを適用**しました。本番と条件を揃える
意味があるため、そのままにしてあります。

## 6-6. 今後の教訓

「読み取りは公開でよい」という判断は、**そのデータに認証情報や個人情報が混ざっていないか**を
確認してから行ってください。今回は `facilityData` に `login_id` と担当者メールアドレスが
同居していたことが問題を大きくしました。表示用データと認証・連絡先データは、本来
別コレクションに分けるべきです。

---

# 第7部 セキュリティ改修 第2弾（2026-07-30）— PHPの防御とバグ修正

外部レビューを受けて実施した改修。フェーズ0〜5に分けて適用した。

## 7-1. 何が問題だったか

フロントは Firebase Auth と Firestore ルールで守られていた一方、**PHP は同じ守りの外**にあった。
認証は PHP が出力する HTML 内の `auth_guard.js` にしか無く、PHP の処理は認証と無関係に実行される。
本番URLは公開済みのため、第三者が `curl` で直接叩ける状態だった。

| # | 問題 | 悪用の内容 |
|---|---|---|
| 1 | mail.php に認証・宛先検証が無い | 当社名義で任意の宛先へ、ID/PASSとログインリンクを含む信用度の高いフィッシングメールを無制限に送信できる。改行除去も無いためBcc追加も成立 |
| 2 | パストラバーサル | `id=../../foo` で `/open_air/` 配下の任意ディレクトリに画像を設置。`time()` が予測可能なため既存画像の上書き改ざんも可能 |
| 3 | 反射型XSS | `$js_id = '"'.$id.'"'` を `<script>` 内へ直出力。管理者に踏ませれば Firestore を全操作できる |
| 4 | 認証ガード未読込5ページ | `sessionStorage.setItem(...)` 一行で開けた |
| 5 | idea/case の参照切れ | `../assets/js/firestore.js` が404で Firebase が初期化されていなかった |

> なおアップロードは `finfo` でMIME判定し GD で再エンコードしているため、
> PHPファイルアップロードによる任意コード実行は成立しない。ここは元の設計が正しく効いていた。

## 7-2. 適用順序

| フェーズ | 内容 |
|---|---|
| 0 | **mail.php の送信を緊急停止**（メールレピュテーション毀損は回復不能なため最優先） |
| 1 | `_auth.php` を新設し5本のPHPへ適用。サニタイズ・XSS対策・宛先検証。送信を安全な形で復旧 |
| 2 | 認証ガード未読込5ページの修正、参照切れ修正、`logoutManage()` で `sessionStorage.clear()` |
| 3 | Firestoreルールに親所有チェックとフィールド固定を追加 |
| 4 | データを壊すバグの修正 |
| 5 | ライブラリ固定・デッドコード削除・セキュリティヘッダ |

## 7-3. `_auth.php` の設計

外部ライブラリを使わず（openssl / curl / json のみ）、Firebase の IDトークン(JWT)を検証する。

```php
require_once __DIR__ . '/../_auth.php';
$id = openair_safe_id($_REQUEST['id'] ?? '');   // 英数字のみ。パストラバーサル対策
require_can_access('facilityData', $id);        // 所有者 or 管理者
```

| 関数 | 用途 |
|---|---|
| `require_login()` | ログイン済み(非匿名)を必須にする |
| `require_admin()` | 管理者を必須にする |
| `require_can_access($col, $id)` | その文書の所有者(または管理者)を必須にする |
| `openair_safe_id($raw)` | 文書IDを英数字のみに制限 |
| `openair_safe_email($raw)` | メール形式の検証＋改行の拒否 |

**検証内容**: 署名(RS256・kid照合)、`iss`、`aud`、`exp`、`iat`、`sub` の存在、
`alg` の固定（`alg:none` すり替えの防止）、匿名プロバイダの拒否。
Googleの公開鍵は `/tmp` に1時間キャッシュし、取得失敗時は期限切れキャッシュで可用性を優先する。

**★ 設計上の要点**: 「管理者か」「所有者か」の判定は、**利用者自身のIDトークンで Firestore REST を
叩き、セキュリティルールに判定させている**。サーバー側に資格情報（サービスアカウント鍵）を
置かずに済む代わりに、**Firestore ルールが正しいことが前提**になる。ルールを緩めるとPHPの防御も緩む。

**クライアント側**: [assets/js/upload_auth.js](assets/js/upload_auth.js) が、action に `.php` を含む
フォームの送信直前にIDトークンを取得し hidden フィールドへ入れる。
`form.submit()` は submit イベントを発火しないため無限ループしない。

## 7-4. 適用先と権限

| ファイル | 要求する権限 |
|---|---|
| `master/mail.php` | 管理者 |
| `facility/upload_image.php` / `upload_image_icon.php` | その施設の所有者 or 管理者 |
| `facility/upload_image_space.php` | そのスペースの所有者 or 管理者 |
| `case/upload_image.php` / `idea/upload_image.php` | 管理者 |

## 7-5. 本番での攻撃再現テスト

改修後、実際に本番へ攻撃を試みてすべて拒否されることを確認した。

| 試行 | 結果 |
|---|---|
| mail.php へ無認証POST（オープンリレー） | 401 |
| upload_image.php へ無認証POST | 401 |
| パストラバーサル `id=../../foo` | 403（サーバーのWAFが先に遮断） |
| ヘッダインジェクション（改行入り宛先） | 403（同上） |
| `alg:none` による署名回避 | 401 |
| 偽造トークン | 401 |
| `_auth.php` への直接アクセス | 403 |

正規の multipart アップロード（実PNG）では `$_POST['id']` と `$_FILES['image']` が
正しく解析されることも、診断スクリプトで確認済み（実行後に削除）。

## 7-6. Firestoreルールの追加防御

| 対象 | 追加した条件 |
|---|---|
| `spaceData` create | 親 `facilityData` の uid 一致（`ownsParentFacility()`） |
| `calendarData` create | 親 `spaceData` の uid 一致 ＋ ドキュメントIDと `s_id` の整合 |
| `facilityData` update | `f_id` / `login_id` を変更不可 |
| `spaceData` update | `f_id` / `s_id` を変更不可 |
| `calendarData` update | `s_id` を変更不可 |

`calendarData` のドキュメントIDは `{s_id}_{年}_{月}`。他施設のスペースIDで先回り作成されると、
その施設は当該月を読むことも保存することもできなくなる（doc が存在するので update 扱いになり
所有者チェックで弾かれる）ため、親の所有とIDの整合を両方要求している。

`f_release`（公開フラグ）は**施設が自分で切り替える業務仕様**のため制限していない。

## 7-7. データを壊すバグ

**① カテゴリ選択の消失（最も危険だった）**

`loadCategories()` を待たずに Firestore を読んでいたため、doc取得が先に終わると
`categories` が空で選択値の代入が no-op になり、後から走る `loadCategories` が
選択を全解除する。そのまま保存すると既存カテゴリが空配列で上書きされる。

```js
// 【修正前】並行して走るため順序が不定
this.loadCategories();
ensureAuth().then(() => db.collection("spaceData").doc(sid).get())

// 【修正後】直列化。loadCategories は Promise を返すよう変更
ensureAuth()
  .then(() => this.loadCategories())
  .then(() => db.collection("spaceData").doc(sid).get())
```

`categories.json` が本番未設置のため顕在化していなかったが、**設置した瞬間に破壊が始まる**状態だった。

**② 施設削除の孤児化** — 配下の `spaceData` / `calendarData` を batch でまとめて削除するよう変更。
Authアカウントとアップロード画像はクライアントから削除できないため、確認ダイアログで明示する。

**③ `addess` typo** — 作成側を `address` に修正し、本番の既存6件から不要フィールドを削除。

**④ パスワード変更の順序** — 取り消せない操作（パスワード更新）を最後に移動。
以前は「変更に失敗しました」と表示されるのに実際は変わっている状態が起こり得た。
入力欄3つを `type="password"` に変更し、画面名も実態に合わせた（ログインIDは変わらないため）。

## 7-8. 保守性

- **jQuery**: 既知のXSS脆弱性がある 1.8.2（23ページ）を 3.7.1 に統一。二重ロード5ページを解消。
  `common.js` は24行で、jQuery 3.x で削除されたAPIを使っていないことを確認済み
- **axios**: バージョン未固定のCDN参照をやめ、1.7.9 をローカル配置（CDN依存そのものを排除）
- **デッドコード削除**: `app_manage_space_post_{000,100,err}.js`、`assets/js/vue.js`、
  `jquery-1.8.2.min.js`。サーバー上からもFTPSで削除済み
- **`.htaccess` 新設**: `X-Frame-Options: DENY` ほかを付与。`mod_headers` が無い環境で
  500にならないよう `IfModule` で保護。内部ファイルへの直接アクセスも拒否
- **`firebase.json`**: デプロイ対象から除外

---

# 第8部 2回目レビューへの対応（2026-07-30）

第7部の改修を外部レビューにかけ、指摘された重大4件に対応した。

## 8-1. ルールの正規表現迂回 —「直したつもりで残っていた」

第7部で `calendarData` の枠の先取りを塞いだつもりだったが、**実質そのまま残っていた。**

```js
// 【修正前】s_id をそのまま正規表現に連結していた
allow create: if ... && doc.matches(request.resource.data.s_id + '_.*');
```

`spaceData` の create は docID と `s_id` の一致も文字種も検証していなかったため、
**`s_id` に `.*` を入れたスペースを正規の手順で作成できた**。それを親として
`calendarData` を作ると `doc.matches('.*_.*')` が任意のIDに一致し、他施設の
未保存カレンダー月を奪える。検証が検証になっていなかった。

```js
// 【修正後】IDを数字のみに限定し、docID との一致を要求する
function numericId(v) { return v is string && v.matches('^[0-9]+$'); }

// spaceData
allow create: if isAdmin()
              || (ownsIncoming() && ownsParentFacility()
                  && doc == request.resource.data.s_id
                  && numericId(doc)
                  && numericId(request.resource.data.f_id));

// calendarData
allow create: if isAdmin()
              || (ownsIncoming() && ownsParentSpace()
                  && numericId(request.resource.data.s_id)
                  && doc.matches('^' + request.resource.data.s_id + '_[0-9]{4}_[0-9]{1,2}$'));

// facilityData
allow create: if isAdmin() && fid == request.resource.data.f_id && numericId(fid);
```

`f_id` は `new Date().getTime()`、`s_id` は `Date.now()` 由来でいずれも数字列。
既存データも全件が数字IDであることを確認済みなので、この制限で既存機能は壊れない。

**教訓**: ユーザーが値を決められるフィールドを正規表現に連結してはいけない。
文字種を先に固定すること。

## 8-2. 新規スペース登録でカテゴリが読み込まれない（第7部で作り込んだ退行）

第7部でカテゴリの競合を直した際、`loadCategories()` を `ensureAuth()` チェーンへ
移した。しかしその手前に `if (!sid) return;` があり、**新規登録では必ずここで抜ける**ため
一度も呼ばれなくなっていた。

```js
// 【修正後】読み込みは early return より前に開始し、完了はチェーン内で待つ
const catsReady = this.loadCategories();

const sid = sessionStorage.getItem("toyosu_manage_space_id");
if (!sid) return;              // 新規登録

ensureAuth()
  .then(() => catsReady)       // 競合対策は維持
  .then(() => db.collection("spaceData").doc(sid).get())
```

`categories.json` が未設置のため顕在化していなかったが、設置すると
「新規登録だけカテゴリが付かない」という別の不整合になるところだった。

## 8-3. `upload_auth.js` が認証状態の復元を待っていなかった

`firebase.auth().currentUser` を同期で読んでいたため、ページを開いた直後に
送信すると `null` になり、誤って「セッションが切れました」と表示されていた。
`onAuthStateChanged` で復元を待つよう変更。あわせて以下も対応。

- 二重送信の防止（送信中はボタンを無効化）
- トークンの使い回しを廃止（戻る操作で期限切れトークンが再送されるのを防ぐ）

## 8-4. `_auth.php` の公開鍵キャッシュ

`/tmp/openair_fb_certs.json` を無検証で読み、署名検証鍵として使っていた。
共有ホスティングで `/tmp` が他テナントから書き込める構成なら、**偽の公開鍵を
置かれるだけで任意のIDトークンを偽造でき、認証全体が突破される。**

- キャッシュ先を `__DIR__/.cache` に移動（`.htaccess` と `.gitignore` で遮断）
- `fileowner() === getmyuid()` を確認してから信用する
- 作成時に `0700` / `0600` を設定

あわせて、`curl` が無い環境で権限判定が常に失敗し全員403になる問題も修正
（`file_get_contents` のフォールバックを追加、判定不能時は 503 で区別）。

## 8-5. レビューで「問題なし」と確認された設計判断

- **CSRF**: Cookie ではなくPOSTボディでIDトークンを明示的に送る方式は、それ自体が
  標準的なCSRF対策。攻撃者は被害者のトークンを読めない
- **JWT検証ロジック**: alg固定・kid必須・署名対象・`$ok !== 1` での 0/-1 両方の拒否・
  各クレーム検証・匿名拒否、いずれも正しい
- **`require_can_access()` の 200 判定**: 文書が無ければ404が返るため、
  `missingDoc()` の抜け穴にはならない。curl不在時のフェイルクローズも正しい

## 8-6. 検証方法

ルールの修正は **Rules テスト API で8ケース**確認した（テスト環境を壊さないため）。
`--dry-run` で構文だけ確認し、実挙動はテストAPIで検証、本番へは直接適用という流れ。

| 検証 | 結果 |
|---|---|
| `s_id` に `.*` を仕込んだスペース作成 | DENY |
| docID と `s_id` の不一致 | DENY |
| 他施設の `s_id` で枠を先取り | DENY |
| `s_id=.*` による docID 詐称 | DENY |
| 親施設が他人 | DENY |
| 正常な作成（spaceData / calendarData） | ALLOW |

---

# 第9部 公開サイトの存在を見落としていた件（2026-07-30）

## 9-1. 何が起きたか

読み取りを認証必須にした結果、**`/open_air/` の公開サイトの表示が壊れた。**

第7部の調査で「このデータを参照する公開サイトは存在しない」と結論していたが、
これは**誤り**だった。`/open_air/` を管理画面専用のフォルダと思い込み、配下の
`manage/` と `assets/js/common/` しか確認していなかった。実際には同じフォルダに
他社さんが公開サイト（`index.html` / `search.html` / `map.html` ほか）を配置しており、
Firestore を直接読んでいた。

外部レビューでも「要確認（このリポジトリ外）」として挙げられていた項目であり、
そこで誤った回答をしてしまった。

## 9-2. 復旧（第3段階のルール変更）

公開サイトが実際に読むものを実機で特定し、**必要な分だけ**公開readへ戻した。

| コレクション | 公開サイトのクエリ | ルール |
|---|---|---|
| `caseData` | `.get()` 全件 | `allow read: if true` |
| `ideaData` | `.get()` 全件 | `allow read: if true` |
| `spaceData` | `.where("s_release","==","on")` | `... \|\| resource.data.s_release == 'on'` |
| `calendarData` | `.get()` 全件 | `allow read: if true` |
| `facilityData` | **読んでいない** | 所有者と管理者のみ（変更なし） |

`spaceData` は公開サイトのクエリが `s_release` で絞っているため、
ルール側も同じフィールドで許可すれば**非公開スペースは漏れない**。
施設側の管理画面は `where("uid","==",自分)` で絞るので `ownsExisting()` の
分岐で通り、管理者は `isAdmin()` で全件見える。3者が両立している。

**最も重要な点**: `facilityData` は非公開のままにできた。ここに `login_id` と
担当者メールアドレスがあるため、当初の対応（認証情報の流出を塞ぐ）は維持されている。

## 9-3. 検証

```
未認証 caseData                     OK  2件
未認証 ideaData                     OK  3件
未認証 calendarData                 OK  0件
未認証 spaceData（s_release==on）    OK 10件   ← 公開サイトと同じクエリ
未認証 spaceData（絞り込みなし）      PERMISSION_DENIED
未認証 facilityData                 PERMISSION_DENIED
```

## 9-4. 教訓

**「参照元が無い」と判断する前に、同じディレクトリに他者のアプリが同居していないか
必ず確認すること。** 特に共用サーバーでは、自分が作ったフォルダに後から別の成果物が
置かれることがある。ルール変更のような影響範囲の広い作業では、
ディレクトリ一覧を実際に取得して確認するのが確実。

---

# 第10部 秘匿情報の分離（2026-07-30）— facilityPrivate の新設

## 10-1. 解けなかった制約

公開サイトの施設詳細ページ（`facility.html`）は次のように読む。

```js
const doc = await db.collection("facilityData").doc(this.fid).get();
this.facilityArray = doc.data();     // ← 文書全体がブラウザに渡る
```

表示に使うのは `f_name` / `address` / `access` / `f_introduction` の4つだけだが、
**Firestore にはフィールド単位で読み取りを制限する仕組みがない。**
`facilityData` に `login_id` と担当者メールが同居している限り、
read を許可した瞬間にそれらも流出する。

`f_id` は公開されている `spaceData` にも入っているため、
「IDを知らなければ大丈夫」も成り立たない。

## 10-2. 分離の設計

| コレクション | 内容 | read |
|---|---|---|
| `facilityData` | 表示用の施設情報＋`uid`（所有者判定用） | 単体は公開／一覧は `f_release=='on'` のみ公開 |
| **`facilityPrivate/{f_id}`** | **`login_id`・`mail`**・`uid`・`f_id` | 所有者と管理者のみ |

ドキュメントIDは両方 `f_id` で対応させ、参照を単純にした。

```js
match /facilityPrivate/{fid} {
  allow get:    if isAdmin() || missingDoc() || ownsExisting();
  allow list:   if isAdmin();
  allow create: if isAdmin() && fid == request.resource.data.f_id && numericId(fid);
  // 施設本人は連絡先メールのみ変更できる。login_id と f_id は固定。
  allow update: if isAdmin()
                || (ownsExisting() && ownsIncoming()
                    && unchanged('f_id') && unchanged('login_id'));
  allow delete: if isAdmin();
}
```

`facilityData` の `list` を「公開中のみ」に留めたのは、公開サイトの
「マップから探す」が `.where("f_release","==","on")` で一覧するため。
**無条件の一覧は管理者と本人のみ**なので、全施設の情報を機械的に収集することはできない。

## 10-3. コード変更

| ファイル | 変更 |
|---|---|
| `master/assets/js/app_manage_post.js` | 登録時に `facilityPrivate` → `facilityData` の順で2回書き込み。編集画面の読み込みと更新も2コレクションに対応 |
| `facility/assets/js/app_manage_idpass_post.js` | 連絡先メールの読み書きを `facilityPrivate` へ。`fid` を sessionStorage ではなく取得した文書IDから取るよう変更 |

`manage_login.js` は `uid` で引くため変更不要。`master/app_manage_master.js` の
一覧は `f_name` と `f_release` しか表示せず、公開切替も `f_release` / `s_release` だけを
書くため影響なし。

## 10-4. 適用順序（露出の窓を作らない）

| 順 | 内容 | なぜこの順か |
|---|---|---|
| 1 | `facilityPrivate` を6件作成 | 追加のみ。既存への影響なし |
| 2 | ルールに `facilityPrivate` を追加（`facilityData` はまだ非公開） | この時点で公開はしない |
| 3 | 管理画面のコードをデプロイ | 新旧どちらのデータ形でも動く状態にする |
| 4 | `facilityData` から `login_id` / `mail` を削除 | ここで秘匿情報が無くなる |
| 5 | `facilityData` の read を公開 | 秘匿情報が無くなった**後**に公開する |

逆順にすると、秘匿情報を含んだまま公開される瞬間が生まれる。

## 10-5. 検証

作業中にスタッフが新コードで施設を登録しており、**実運用での検証が取れた。**

```
facilityPrivate/1785399138156
  login_id = 7NNJz0T27d      ← Auth の 7nnjz0t27d@toyosu-openair.local と一致
  mail     = niya@yogus.com
  uid      = Ug2OT1wj...      ← facilityData 側と一致

facilityData/1785399138156
  login_id / mail の混入: なし
```

整合性チェック（全7件）: `facilityPrivate` の欠落0件、孤児0件、`facilityData` に
秘匿情報が残る文書0件。

未認証アクセスの最終確認:

| | 結果 |
|---|---|
| `facilityData` 単体 / `spaceData` 単体 / `caseData` / `ideaData` / `calendarData` | 200 |
| `facilityData` 公開中一覧 / `spaceData` 公開中一覧 | 200（4件 / 10件）|
| **`facilityPrivate` 単体・一覧** | **403** |
| `facilityData` 無条件一覧 / `spaceData` 無条件一覧 | 403 |

## 10-6. 途中で起きた事故

**リポジトリのルールが本番より古いまま残った。** GitHub のプッシュ保護
（Mapbox トークンの誤検知）でコミットが弾かれた際、`git reset` の操作で
ローカルの `firestore.rules` の編集が失われ、コミットされていなかった。
本番には適用済みだったため気づきにくく、**その状態でリポジトリからデプロイすると
公開サイトが再び壊れる**危険があった。検証で発見し、本番の内容を書き戻して同期した。

**教訓**: 本番に直接適用する変更は、リポジトリとの一致を必ず差分で確認する。
`firebase deploy` はローカルファイルを送るため、「本番に出したから
リポジトリにも入っている」とは限らない。

---

# 参照

- [HANDOFF_スタッフ向け.md](HANDOFF_スタッフ向け.md) — 概要・運用手順・未解決課題
- [DEPLOY_本番反映手順.md](DEPLOY_本番反映手順.md) — デプロイ手順
- GitHub PR #1: https://github.com/szk0310/toyosu-openaiir/pull/1
