<?php
// ============================================================
//  サーバーサイド認証（2026-07-30 追加）
//
//  このファイルは認証が無く、宛先も無検証だったため、第三者が当社名義で
//  任意の宛先へメールを送信できる状態だった（オープンリレー相当）。
//  以下で「管理者であること」と「宛先が正当なメールアドレスであること」を
//  必ず検証する。どちらも通らなければメールは1通も送らない。
// ============================================================
require_once __DIR__ . '/../_auth.php';
require_admin();

// 宛先を検証（改行が含まれていれば拒否＝ヘッダインジェクション対策）
$to_email = openair_safe_email($_POST['email'] ?? '');

// 本文に入れる値からも改行を除去する（本文への任意行の挿入を防ぐ）
$strip = function ($v) { return trim(preg_replace('/[\r\n\0]+/', ' ', (string)$v)); };
$post_lid  = $strip($_POST['lid']  ?? '');
$post_pass = $strip($_POST['pass'] ?? '');

	// 変数とタイムゾーンを初期化
	$header = null;
	$auto_reply_subject = null;
	$auto_reply_text = null;
	$admin_reply_subject = null;
	$admin_reply_text = null;
	date_default_timezone_set('Asia/Tokyo');

$from_name = mb_encode_mimeheader("清水建設株式会社");
$from_email = "info@toyosu-smartcity-email.com";

$header = "MIME-Version: 1.0\r\n";
//$header .= "Content-Type: text/plain; charset=UTF-8\r\n";
$header .= "From: " . $from_name . " <" . $from_email . ">\r\n";
$header .= "Reply-To: " . $from_email . "\r\n";
$additional_params = "-f " . $from_email;

	// 件名を設定
	$auto_reply_subject = '豊洲OpenAirのID及びPASSのお知らせ';

	// 本文を設定
	$auto_reply_text = "※このメールはシステムからの自動送信です。返信はできません。\n\n";

	$auto_reply_text .= "お世話になっております。\n";
	$auto_reply_text .= "この度は豊洲スマートイベントへの実証へのご協力ありがとうございます。\n\n";

	$auto_reply_text .= "以下の様ID、PASS発行いたしましたので、\n";
	$auto_reply_text .= "ご確認のほど、よろしくお願いいたします。\n\n";


	$auto_reply_text .= "ID：" . $post_lid . "\n";
	$auto_reply_text .= "Pass：" . $post_pass . "\n\n";

$auto_reply_text .= "ログインページ：https://toyosu-smartcity.com/open_air/manage/facility/login.html\n\n";


	$auto_reply_text .= "ID、PASSについては店舗ページにログインする際に必要となるため\n";
	$auto_reply_text .= "必ず忘れないよう、保管をお願いいたします。\n\n";

	$auto_reply_text .= "********************************************************\n";
	$auto_reply_text .= "実証に関する問い合わせについては下記にご連絡ください。\n";
	$auto_reply_text .= "なお、営業時間は平日9時〜18時となっております。\n";
	$auto_reply_text .= "時間外のお問い合わせは翌営業日にご連絡差し上げます。\n";
	$auto_reply_text .= "清水建設株式会社\n";
	$auto_reply_text .= "谷口：電話番号　090-2548-9325\n";
	$auto_reply_text .= "　　　メール　h.taniguchi@shimz.co.jp\n\n";
	$auto_reply_text .= "森：電話番号　090-7220-7563\n";
	$auto_reply_text .= "　　メール　tetsuya.mori@shimz.co.jp\n";
	$auto_reply_text .= "********************************************************\n\n";


// ------------------------------------------------------------
//  自動返信メール送信
//  ※ ここに到達する時点で以下が保証されている:
//     - 呼び出し元が Firebase 認証済みの管理者であること（require_admin）
//     - $to_email が正当なメールアドレスで、改行を含まないこと
// ------------------------------------------------------------
$sent = mb_send_mail($to_email, $auto_reply_subject, $auto_reply_text, $header, $additional_params);

// ★ 戻り値を必ず確認する。
//   パスワードは Firestore にも保存されないため、メールが届かなければ
//   誰も復元できない。失敗を黙って握りつぶしてはいけない。
if ($sent) {
	// 成功時は従来どおり一覧へ戻る
	header('Location: index.html');
	exit;
}

// 失敗時はリダイレクトせず、発行された ID/PASS を画面に出して手動連絡へ誘導する
header('Content-Type: text/html; charset=UTF-8');
$e = function ($v) { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); };
echo '<!doctype html><html lang="ja"><head><meta charset="utf-8">';
echo '<title>メール送信に失敗しました</title>';
echo '<style>body{font-family:sans-serif;max-width:640px;margin:40px auto;padding:0 16px;line-height:1.8}';
echo '.box{border:2px solid #c00;background:#fff5f5;padding:16px;border-radius:8px}';
echo '.cred{background:#f4f4f4;padding:12px;border-radius:6px;font-family:monospace;font-size:16px}';
echo 'a{display:inline-block;margin-top:24px}</style></head><body>';
echo '<h1>施設の登録は完了しました</h1>';
echo '<div class="box"><strong>⚠️ ID/PASS のメール送信に失敗しました。</strong><br>';
echo '下記の内容を、施設のご担当者へ<strong>手動でご連絡ください。</strong><br>';
echo 'この画面を閉じると再表示できません。必ず控えを取ってください。</div>';
echo '<p>送信先: <code>' . $e($to_email) . '</code></p>';
echo '<div class="cred">ID：' . $e($post_lid) . '<br>Pass：' . $e($post_pass) . '</div>';
echo '<p>ログインページ：<br>https://toyosu-smartcity.com/open_air/manage/facility/login.html</p>';
echo '<a href="index.html">← 施設一覧へ戻る</a>';
echo '</body></html>';
exit;

?>