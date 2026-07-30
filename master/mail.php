<?php
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


	$auto_reply_text .= "ID：" . $_POST['lid'] . "\n";
	$auto_reply_text .= "Pass：" . $_POST['pass'] . "\n\n";

$auto_reply_text .= "ログインページ：http://toyosu-smartcity.com/open_air/manage/facility/login.html\n\n";


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


// ============================================================
//  【一時停止中】2026-07-30 〜
//
//  このスクリプトは認証が無く、宛先($_POST['email'])も無検証のまま
//  mb_send_mail() に渡していたため、第三者が当社名義で任意の宛先へ
//  メールを送信できる状態（オープンリレー相当）でした。
//  実際に外部から curl で送信できることを確認済みです。
//
//  Firebase ID トークンによる認証（_auth.php）の実装が完了するまで、
//  送信を停止します。代わりに発行された ID / PASS を画面に表示するので、
//  管理者が施設へ手動で連絡してください。
//
//  ※ 復旧時はこのブロックを削除し、下部のコメントアウトを解除したうえで
//    必ず認証と宛先検証を入れてから有効化すること。
// ============================================================
$SEND_DISABLED = true;

if ($SEND_DISABLED) {
	header('Content-Type: text/html; charset=UTF-8');
	$e = function ($v) { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); };
	echo '<!doctype html><html lang="ja"><head><meta charset="utf-8">';
	echo '<title>ID/PASS発行完了（メール送信は停止中）</title>';
	echo '<style>body{font-family:sans-serif;max-width:640px;margin:40px auto;padding:0 16px;line-height:1.8}';
	echo '.box{border:2px solid #c00;background:#fff5f5;padding:16px;border-radius:8px}';
	echo '.cred{background:#f4f4f4;padding:12px;border-radius:6px;font-family:monospace;font-size:16px}';
	echo 'a{display:inline-block;margin-top:24px}</style></head><body>';
	echo '<h1>施設の登録は完了しました</h1>';
	echo '<div class="box"><strong>⚠️ 自動メール送信は現在停止しています。</strong><br>';
	echo 'セキュリティ対応のため一時的に停止中です。';
	echo '下記の ID と PASS を、施設のご担当者へ<strong>手動でご連絡ください。</strong></div>';
	echo '<p>送信予定だった宛先: <code>' . $e($_POST['email'] ?? '') . '</code></p>';
	echo '<div class="cred">ID：' . $e($_POST['lid'] ?? '') . '<br>Pass：' . $e($_POST['pass'] ?? '') . '</div>';
	echo '<p>ログインページ：<br>https://toyosu-smartcity.com/open_air/manage/facility/login.html</p>';
	echo '<a href="index.html">← 施設一覧へ戻る</a>';
	echo '</body></html>';
	exit;
}

// 自動返信メール送信
//	mb_send_mail( $_POST['email'], $auto_reply_subject, $auto_reply_text, $header,$additional_params,);

header('Location: index.html');
exit;

?>