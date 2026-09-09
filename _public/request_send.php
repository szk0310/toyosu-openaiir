<?php
header("Content-Type: application/json; charset=UTF-8");
date_default_timezone_set('Asia/Tokyo');

// mb_send_mail用の日本語設定
mb_language("Japanese");
mb_internal_encoding("UTF-8");

$data = json_decode(file_get_contents("php://input"), true);

$facilityName    = htmlspecialchars($data['facility_name'] ?? '', ENT_QUOTES, 'UTF-8');
$spaceName       = htmlspecialchars($data['space_name'] ?? '', ENT_QUOTES, 'UTF-8');
$customerType    = htmlspecialchars($data['customerType'] ?? '', ENT_QUOTES, 'UTF-8');
$companyName    = htmlspecialchars($data['companyName'] ?? '', ENT_QUOTES, 'UTF-8');
$name    = htmlspecialchars($data['name'] ?? '', ENT_QUOTES, 'UTF-8');
$email   = htmlspecialchars($data['email'] ?? '', ENT_QUOTES, 'UTF-8');
$purpose = htmlspecialchars($data['purpose'] ?? '', ENT_QUOTES, 'UTF-8');
$notes   = htmlspecialchars($data['notes'] ?? '', ENT_QUOTES, 'UTF-8');
$dates   = htmlspecialchars($data['dates'] ?? '', ENT_QUOTES, 'UTF-8');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "error" => "invalid email"]);
    exit;
}

$admin_to = "info@toyosu-smartcity-email.com";
$from = "no_reply@toyosu-smartcity.com";

/* =======================
   管理者へ送るメール
========================= */

$admin_subject = "予約リクエストがありました";

$admin_message  = "予約リクエスト\n\n";
$admin_message .= "施設名: {$facilityName}\n";
$admin_message .= "スペース名: {$spaceName}\n";
$admin_message .= "個人／法人: {$customerType}\n";
$admin_message .= "法人名: {$companyName}\n";
$admin_message .= "お名前: {$name}\n";
$admin_message .= "メール: {$email}\n";
$admin_message .= "利用目的: {$purpose}\n";
$admin_message .= "選択日:\n{$dates}\n\n";
$admin_message .= "ご質問:\n{$notes}\n";
$admin_message .= "送信日時: ".date("Y-m-d H:i:s")."\n";

$from_name = mb_encode_mimeheader("サイト名", "UTF-8", "B", "\n");

$headers  = "MIME-Version: 1.0\n";
$headers .= "From: {$from_name} <{$from}>\n";
$headers .= "Reply-To: {$email}\n";

//$admin_success = mail($admin_to, $admin_subject, $admin_message, $headers);
$admin_success = mb_send_mail(
    $admin_to,
    $admin_subject,
    $admin_message,
    $headers
);
//file_put_contents(__DIR__ . '/debug.log', date("Y-m-d H:i:s") . " admin_success: " . var_export($admin_success, true) . " headers=[" . str_replace("\n", "\\n", $headers) . "]\n", FILE_APPEND);

/* =========================
   お客様へ自動返信
========================= */

$auto_subject = "【自動返信】ご予約リクエストを受け付けました";

$auto_message  = "{$name} 様\n\n";
$auto_message .= "この度はご予約リクエストありがとうございます。\n";
$auto_message .= "以下の内容で受け付けました。\n\n";
$auto_message .= "-----------------------------\n";
$auto_message .= "施設名: {$facilityName}\n";
$auto_message .= "スペース名: {$spaceName}\n";
$auto_message .= "利用目的: {$purpose}\n";
$auto_message .= "選択日:\n{$dates}\n\n";
$auto_message .= "ご質問:\n{$notes}\n";
$auto_message .= "-----------------------------\n\n";
$auto_message .= "内容確認後、改めてご連絡いたします。\n\n";
$auto_message .= "送信日時: ".date("Y-m-d H:i:s")."\n";

$auto_headers  = "MIME-Version: 1.0\n";
$auto_headers .= "From: {$from_name} <{$from}>\n";
$auto_headers .= "Reply-To: {$admin_to}\n";

$auto_success = false;

//if (!empty($email)) {
    //$auto_success = mail($email, $auto_subject, $auto_message, $auto_headers);
//}
if (!empty($email)) {
    $auto_success = mb_send_mail(
        $email,
        $auto_subject,
        $auto_message,
        $auto_headers
    );
//file_put_contents(__DIR__ . '/debug.log', date("Y-m-d H:i:s") . " auto_success: " . var_export($auto_success, true) . " headers=[" . str_replace("\n", "\\n", $auto_headers) . "]\n", FILE_APPEND);
}

echo json_encode([
    "success" => ($admin_success && $auto_success)
]);
?>
