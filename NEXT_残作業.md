# 残作業リスト（2026-07-31 更新）

外部レビュー（Fable）の指摘のうち未対応のもの。着手しやすい順に番号を振っています。

## 優先度：高

### ~~1. `mb_send_mail()` の戻り値を確認していない~~ → **完了（2026-07-31）**
成功時は従来どおり `index.html` へ、失敗時はリダイレクトせずID/PASSを画面表示して
手動連絡へ誘導する形にした。

### ~~2. アップロードPHP5本の内部品質~~ → **完了（2026-07-31）**
共通処理を `_auth.php` に追加し5本から呼ぶ形に統一。

- アップロードのエラーコードを確認（従来は未確認）
- 画像を展開する前に `getimagesize()` で寸法と形式を判定。不正形式は明示的に拒否
  （従来は `exit` せず処理を続行していた）
- **`memory_limit` が 128M のため、iPhone Pro の48MP写真は展開できず白画面になっていた。**
  必要メモリを見積もって `ini_set` で引き上げる方式に変更（上限512MB）
  実測ピーク: 12MP=56MB / 24MP=110MB / 48MP=198MB
- 上限は 6000万画素 / 1辺20000px（48MP=8064x6048 を余裕でカバー）
- WebP は GD が対応していれば受け付ける。HEIC は iPhone の設定変更を案内して拒否
- 書き込み成功を確認してから成功メッセージを表示
- `mkdir` を 0755 に

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
