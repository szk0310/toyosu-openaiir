<?php
// ============================================================
//  _auth.php — PHP エンドポイント用のサーバーサイド認証
//
//  背景:
//    upload_image*.php / mail.php は、認証が「出力するHTML内の
//    auth_guard.js」にしか無く、PHP の処理自体は誰でも curl で
//    直接実行できる状態だった。本ファイルでその穴を塞ぐ。
//
//  仕組み:
//    クライアントが Firebase の ID トークン(JWT)を POST し、
//    PHP が Google の公開鍵で署名を検証する。外部ライブラリ不要
//    （openssl / curl / json のみ使用）。
//
//  使い方:
//    require_once __DIR__ . '/../_auth.php';
//    $claims = require_login();                 // ログイン済み(非匿名)必須
//    $claims = require_admin();                 // 管理者必須
//    require_can_access('facilityData', $id);   // その文書の所有者(or管理者)必須
//
//  注意:
//    「管理者か」「その文書の所有者か」の判定は、利用者自身の ID トークンで
//    Firestore REST を叩き、セキュリティルールに判定させている。
//    サーバー側に資格情報を置かずに済む代わりに、Firestore ルールが
//    正しいことが前提になる。ルールを緩めるとここも緩む。
// ============================================================

if (!defined('OPENAIR_AUTH')) { define('OPENAIR_AUTH', 1); }

const OPENAIR_PROJECT_ID = 'toyosuopenair';
const OPENAIR_CERT_URL   = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const OPENAIR_CERT_CACHE = '/tmp/openair_fb_certs.json';
const OPENAIR_CERT_TTL   = 3600;   // 1時間
const OPENAIR_LEEWAY     = 60;     // 時刻ずれの許容（秒）

// ------------------------------------------------------------
//  エラー応答（HTMLを一切出さずに終了する）
// ------------------------------------------------------------
function openair_deny($code, $message) {
    http_response_code($code);
    header('Content-Type: text/plain; charset=UTF-8');
    header('X-Content-Type-Options: nosniff');
    echo $message . "\n";
    exit;
}

// ------------------------------------------------------------
//  base64url デコード
// ------------------------------------------------------------
function openair_b64url_decode($s) {
    $s = strtr($s, '-_', '+/');
    $pad = strlen($s) % 4;
    if ($pad) { $s .= str_repeat('=', 4 - $pad); }
    return base64_decode($s, true);
}

// ------------------------------------------------------------
//  Google の公開鍵を取得（/tmp にキャッシュ）
// ------------------------------------------------------------
function openair_fetch_certs() {
    if (is_readable(OPENAIR_CERT_CACHE)
        && (time() - filemtime(OPENAIR_CERT_CACHE)) < OPENAIR_CERT_TTL) {
        $cached = json_decode((string)file_get_contents(OPENAIR_CERT_CACHE), true);
        if (is_array($cached) && $cached) { return $cached; }
    }
    $body = false;
    if (extension_loaded('curl')) {
        $ch = curl_init(OPENAIR_CERT_URL);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        $body = curl_exec($ch);
        curl_close($ch);
    }
    if ($body === false && ini_get('allow_url_fopen')) {
        $body = @file_get_contents(OPENAIR_CERT_URL);
    }
    $certs = $body ? json_decode($body, true) : null;
    if (!is_array($certs) || !$certs) {
        // 取得できない場合、期限切れキャッシュでも使う（可用性を優先）
        if (is_readable(OPENAIR_CERT_CACHE)) {
            $stale = json_decode((string)file_get_contents(OPENAIR_CERT_CACHE), true);
            if (is_array($stale) && $stale) { return $stale; }
        }
        openair_deny(503, '認証基盤に接続できませんでした。時間をおいて再度お試しください。');
    }
    @file_put_contents(OPENAIR_CERT_CACHE, json_encode($certs));
    return $certs;
}

// ------------------------------------------------------------
//  ID トークンを検証してクレームを返す。失敗時は null。
// ------------------------------------------------------------
function openair_verify_id_token($jwt) {
    if (!is_string($jwt) || substr_count($jwt, '.') !== 2) { return null; }
    list($h64, $p64, $s64) = explode('.', $jwt);

    $header  = json_decode((string)openair_b64url_decode($h64), true);
    $payload = json_decode((string)openair_b64url_decode($p64), true);
    $sig     = openair_b64url_decode($s64);
    if (!is_array($header) || !is_array($payload) || $sig === false) { return null; }

    // アルゴリズムを固定（alg:none などのすり替えを防ぐ）
    if (($header['alg'] ?? '') !== 'RS256' || empty($header['kid'])) { return null; }

    $certs = openair_fetch_certs();
    if (!isset($certs[$header['kid']])) { return null; }
    $pub = openssl_pkey_get_public($certs[$header['kid']]);
    if ($pub === false) { return null; }

    $ok = openssl_verify($h64 . '.' . $p64, $sig, $pub, OPENSSL_ALGO_SHA256);
    if (PHP_VERSION_ID < 80000 && is_resource($pub)) { openssl_free_key($pub); }
    if ($ok !== 1) { return null; }

    // クレーム検証
    $now = time();
    if (($payload['aud'] ?? '') !== OPENAIR_PROJECT_ID) { return null; }
    if (($payload['iss'] ?? '') !== 'https://securetoken.google.com/' . OPENAIR_PROJECT_ID) { return null; }
    if (empty($payload['sub'])) { return null; }
    if (($payload['exp'] ?? 0) < ($now - OPENAIR_LEEWAY)) { return null; }
    if (($payload['iat'] ?? 0) > ($now + OPENAIR_LEEWAY)) { return null; }
    if (isset($payload['auth_time']) && $payload['auth_time'] > ($now + OPENAIR_LEEWAY)) { return null; }

    // 匿名ユーザーは拒否（匿名プロバイダは無効化済みだが多層防御として残す）
    if (($payload['firebase']['sign_in_provider'] ?? '') === 'anonymous') { return null; }

    return $payload;
}

// ------------------------------------------------------------
//  リクエストから ID トークンを取り出す
// ------------------------------------------------------------
function openair_extract_token() {
    if (!empty($_POST['idToken']))  { return (string)$_POST['idToken']; }
    $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if ($hdr && stripos($hdr, 'Bearer ') === 0) { return trim(substr($hdr, 7)); }
    return '';
}

// ------------------------------------------------------------
//  ログイン済み(非匿名)を必須にする
// ------------------------------------------------------------
function require_login() {
    $claims = openair_verify_id_token(openair_extract_token());
    if ($claims === null) {
        openair_deny(401, 'ログインが必要です。管理画面からログインし直してください。');
    }
    return $claims;
}

// ------------------------------------------------------------
//  Firestore の1文書を、利用者自身のトークンで取得できるか試す。
//  取得できれば「ルール上アクセス権がある」ことの証明になる。
// ------------------------------------------------------------
function openair_firestore_can_get($collection, $docId, $idToken) {
    $url = 'https://firestore.googleapis.com/v1/projects/' . OPENAIR_PROJECT_ID
         . '/databases/%28default%29/documents/' . rawurlencode($collection) . '/' . rawurlencode($docId);
    $code = 0;
    if (extension_loaded('curl')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . $idToken],
        ]);
        curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
    }
    return $code === 200;
}

// ------------------------------------------------------------
//  管理者(admins/{uid} を持つ)を必須にする
// ------------------------------------------------------------
function require_admin() {
    $token  = openair_extract_token();
    $claims = openair_verify_id_token($token);
    if ($claims === null) {
        openair_deny(401, 'ログインが必要です。管理画面からログインし直してください。');
    }
    // admins/{uid} は本人だけが read できるルールになっている
    if (!openair_firestore_can_get('admins', $claims['sub'], $token)) {
        openair_deny(403, '管理者権限がありません。');
    }
    return $claims;
}

// ------------------------------------------------------------
//  指定コレクションの文書にアクセス権があること（所有者 or 管理者）
// ------------------------------------------------------------
function require_can_access($collection, $docId) {
    $token  = openair_extract_token();
    $claims = openair_verify_id_token($token);
    if ($claims === null) {
        openair_deny(401, 'ログインが必要です。管理画面からログインし直してください。');
    }
    if (!openair_firestore_can_get($collection, $docId, $token)) {
        openair_deny(403, 'このデータを操作する権限がありません。');
    }
    return $claims;
}

// ------------------------------------------------------------
//  ID のサニタイズ（パストラバーサル対策）
//  Firestore の文書IDは英数字。それ以外が来たら不正とみなす。
// ------------------------------------------------------------
function openair_safe_id($raw) {
    $id = trim((string)$raw);
    if ($id === '' || !preg_match('/\A[A-Za-z0-9_-]{1,64}\z/', $id)) {
        openair_deny(400, '不正なIDです。');
    }
    return $id;
}

// ------------------------------------------------------------
//  メールアドレスの検証（ヘッダインジェクション対策込み）
// ------------------------------------------------------------
function openair_safe_email($raw) {
    $mail = trim((string)$raw);
    // 改行・NULが1文字でも含まれていたら即座に拒否（Bcc追加等を防ぐ）
    if (preg_match('/[\r\n\0]/', $mail)) {
        openair_deny(400, '不正な宛先です。');
    }
    if (!filter_var($mail, FILTER_VALIDATE_EMAIL) || strlen($mail) > 254) {
        openair_deny(400, 'メールアドレスの形式が正しくありません。');
    }
    return $mail;
}

// 直接アクセスされても何も起きないようにする
if (realpath(__FILE__) === realpath($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    openair_deny(404, 'Not Found');
}
