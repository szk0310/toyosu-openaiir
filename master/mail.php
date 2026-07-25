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


// 自動返信メール送信
	mb_send_mail( $_POST['email'], $auto_reply_subject, $auto_reply_text, $header,$additional_params,);

header('Location: index.html');
exit;

?>