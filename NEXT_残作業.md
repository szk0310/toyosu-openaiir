# 残作業リスト（2026-07-30 時点）

外部レビュー（Fable）の指摘のうち未対応のもの。着手しやすい順に番号を振っています。

## 優先度：高

### 1. `mb_send_mail()` の戻り値を確認していない
`master/mail.php` — 送信が失敗しても成功として扱われ、誰も気づけません。
**パスワードは Firestore にも保存されないため、届かなければ誰も復元できません。**
戻り値を確認し、失敗時は画面にID/PASSを表示して手動連絡へ誘導するのが妥当です。

### 2. アップロードPHP5本の内部品質
`facility/upload_image{,_icon,_space}.php` / `case/upload_image.php` / `idea/upload_image.php`
（5本とも同じ行に同じ問題があるため一括修正できます）

- 不正MIME時に `exit` せず処理継続（48行が `//return false;` のまま）
  PHP8ではゼロ除算で致命的エラー、PHP7では拡張子なしファイル名がFirestoreに書かれる
- `$_FILES['error']` を確認していない
- 画素数・ファイルサイズの上限なし（認証必須にしたので無認証攻撃は不可。施設アカウントからは可能）
- `mkdir(0777)`
- 書き込み前に成功メッセージを表示している

## 優先度：中

### 3. 施設の連鎖削除が上限に触れる
`master/assets/js/app_manage_master.js`
- batch は500件上限。「スペース10件 × 49ヶ月 = 501件」で超える
- それより先に**ルール評価の document access 上限（バッチで20）**に当たる可能性
  （各 delete で `isAdmin()` の `exists()` が評価されるため）
- 超えるとバッチ全体が失敗し、その施設を管理画面から削除できなくなる
- 450件ずつ逐次コミットに分割し、`facilityData` の削除は最後に置く

### 4. 施設側のスペース単体削除で `calendarData` が孤児化
`facility/assets/js/app_manage_space.js:64-75`
master 側は連鎖削除を実装したが、施設側は未対応。`.catch` も無く、
遷移先が `space_index.html` ではなく `index.html` になっている。

### 5. `addess` typo の読み取り側にガードが無い
`facility/assets/js/manage_login.js:35` が `data.address` をそのまま
sessionStorage に入れており、未設定の施設では文字列 `"undefined"` が入り、
それが `spaceData.f_address` として保存される。`data.address || ''` にする。
あわせて `spaceData.f_address === "undefined"` の既存データを掃除する。

## 優先度：低

### 6. セッションが自動失効しない
`setPersistence` 未指定（=LOCAL 永続）でアイドルタイムアウトも無いため、
共有PCでログインしたまま離席すると次の利用者が操作できる。

### 7. HSTS を段階導入する
`.htaccess` でいきなり `max-age=31536000`（1年）を設定している。
ホスト全体に効くため、公開サイト側も全URLがHTTPSで正常と確認できるまでは
`max-age=300` 程度から始めるのが安全。

### 8. その他
- `facility/map.html` が唯一の認証ガード無しページ
- `v-html` の無サニタイズ描画
- `order` フィールドでソートしているが書き込むコードが存在しない（6箇所）
- master の公開切替が配下スペースの `s_release` を強制上書きする
- robots が22ページで `index, follow`

## 運用・判断待ち

- **FTPパスワードの変更**（作業完了後にスタッフが実施する方針）
  変更後は GitHub Secret `FTP_PASS` の再登録が必要
- **`info@toyosu-smartcity-email.com` の孤立アカウント**
  `admins` にも `facilityData` にも紐付いておらず、どの画面でもログイン不可。
  削除するか、`admins` にUID `KG06xLw84UWYgu2lk0YKTlBPo783` を登録するか
- **`mail.php` の送信元ドメインとSPFの不一致**
  `@toyosu-smartcity-email.com`（さくら）を CPI から送っている。
  `shiro-k.jp` 宛は受信ボックス到達を実測済みだが、DMARC の厳しい宛先では要注意
- **メール本文に平文パスワードを載せている件**
  対策案: 案内文に「ログイン後すみやかに変更を」の一文を追加するのが最小コスト
- **管理者への発行通知**（パスワード抜きの通知を送るか）
