<?php
header("Content-Type: application/json; charset=UTF-8");
date_default_timezone_set('Asia/Tokyo');

//$data = json_decode(file_get_contents("php://input"), true);
//
//$kind    = htmlspecialchars($data['kind'] ?? '', ENT_QUOTES, 'UTF-8');
//$name    = htmlspecialchars($data['name'] ?? '', ENT_QUOTES, 'UTF-8');
//$email   = htmlspecialchars($data['email'] ?? '', ENT_QUOTES, 'UTF-8');
//$company = htmlspecialchars($data['company'] ?? '', ENT_QUOTES, 'UTF-8');
//$inquiry   = htmlspecialchars($data['inquiry'] ?? '', ENT_QUOTES, 'UTF-8');

$kind = trim( $_REQUEST[ 'kind' ] );
$name = trim( $_REQUEST[ 'name' ] );
$email = trim( $_REQUEST[ 'email' ] );
$company = trim( $_REQUEST[ 'company' ] );
$tel = trim( $_REQUEST[ 'tel' ] );
$inquiry = trim( $_REQUEST[ 'inquiry' ] );


if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "error" => "invalid email"]);
    exit;
}

$admin_to = "info@toyosu-smartcity-email.com";
$from = "info@toyosu-smartcity-email.com";
/* =======================
   管理者へ送るメール
========================= */

$admin_subject = "お問い合わせがありました";

$admin_message  = "お問い合わせ種別\n\n";
$admin_message .= "お名前: {$name}\n";
$admin_message .= "法人名/団体名: {$company}\n";
$admin_message .= "メール: {$email}\n";
$admin_message .= "ご質問:\n{$inquiry}\n";
$admin_message .= "送信日時: ".date("Y-m-d H:i:s")."\n";

$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "From: サイト名 <{$from}>\r\n";
$headers .= "Reply-To: {$email}\r\n";

$admin_success = mail(
    $admin_to,
    $admin_subject,
    $admin_message,
    $headers,
    "-f {$from}" 
);

/* =========================
   お客様へ自動返信
========================= */

$auto_subject = "【自動返信】お問い合わせを受け付けました";

$auto_message  = "{$name} 様\n\n";
$auto_message .= "この度はお問い合わせありがとうございます。\n";
$auto_message .= "内容確認後、改めてご連絡いたします。\n\n";
$auto_message .= "送信日時: ".date("Y-m-d H:i:s")."\n";

$auto_headers  = "MIME-Version: 1.0\r\n";
$auto_headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$auto_headers .= "From: サイト名 <{$from}>\r\n";
$auto_headers .= "Reply-To: {$admin_to}\r\n";

$auto_success = false;

//if (!empty($email)) {
    //$auto_success = mail($email, $auto_subject, $auto_message, $auto_headers);
//}
if (!empty($email)) {
    $auto_success = mail(
        $email,
        $auto_subject,
        $auto_message,
        $auto_headers,
        "-f {$from}"
    );
}

echo json_encode([
    "success" => ($admin_success && $auto_success)
]);

header('Location: contact_end.html');
exit;
?>