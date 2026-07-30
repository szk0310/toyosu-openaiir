<?php
// ============================================================
//  サーバーサイド認証（2026-07-30 追加）
//  このファイルは URL を知っていれば curl で直接実行できてしまうため、
//  出力HTML内の auth_guard.js だけでは保護にならない。ここで必ず検証する。
//  権限: 施設の所有者(または管理者)のみ
// ============================================================
require_once __DIR__ . '/../_auth.php';
$id = openair_safe_id($_REQUEST['id'] ?? '');   // パストラバーサル対策
require_can_access('facilityData', $id);
?>
<!DOCTYPE html>
<html>
<head>
<meta charset='utf-8'>
<title></title>
<!-- firestore用 -->
	<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
	<script src="../../assets/js/common/firestore_openAir.js"></script>
	<script src="../assets/js/auth_guard.js"></script>

	

</head>
<body>
	
<?php


function uploadImage($tmpName, $dir, $maxWidth, $maxHeight){
$id = openair_safe_id($_REQUEST['id'] ?? '');

    // ---- 展開前の検証（2026-07-31）--------------------------------
    //  従来は形式が不正でも処理を続行しており、拡張子なしのファイル名が
    //  Firestore に書かれたり、大きすぎる画像でメモリ不足の白画面になっていた。
    //  getimagesize() は画像を展開しないので、ここで安全に判定できる。
    list($width1, $height1, $mime, $ext) = openair_prepare_image($tmpName, 'image_post.html');

    switch ($ext) {
        case '.jpg':  $image1 = @imagecreatefromjpeg($tmpName); break;
        case '.png':  $image1 = @imagecreatefrompng($tmpName);  break;
        case '.gif':  $image1 = @imagecreatefromgif($tmpName);  break;
        case '.webp': $image1 = @imagecreatefromwebp($tmpName); break;
    }
    if (empty($image1)) {
        openair_upload_error('画像を読み込めませんでした。ファイルが壊れている可能性があります。', 'image_post.html');
    }

	//if($width1 <= $maxWidth && $height1 <= $maxHeight){
        //$scale = 1.0;
    //} else {
        //$scale = min($maxWidth / $width1, $maxHeight / $height1);
    //}

	$scale = max($maxWidth / $width1, $maxHeight / $height1);
    $width2 = $width1 * $scale;
    $height2 = $height1 * $scale;


    //$image2 = imagecreatetruecolor($width2, $height2);
	
	$image2 = imagecreatetruecolor($maxWidth, $maxHeight);

    if($ext == '.gif'){
        $transparent1 = imagecolortransparent($image1);
        if($transparent1 >= 0){
            $index = imagecolorsforindex($image1, $transparent1);
            $transparent2 = imagecolorallocate($image2, $index['red'], $index['green'], $index['blue']);
            imagefill($image2, 0, 0, $transparent2);
            imagecolortransparent($image2, $transparent2);
        }
    } elseif($ext == '.png'){
        imagealphablending($image2, false);
        $transparent = imagecolorallocatealpha($image2, 0, 0, 0, 127);
        imagefill($image2, 0, 0, $transparent);
        imagesavealpha($image2, true);
    }
	
$centerX = $maxWidth /2;
$centerY = $maxHeight /2;
$centerImgX = $width2 /2;
$centerImgY = $height2 /2;
		
//開始点の算出
	
$startPointX = $centerX - $centerImgX ;
$startPointY = $centerY - $centerImgY ;
	
	    
imagecopyresampled($image2, $image1, $startPointX , $startPointY, 0, 0,  $width2, $height2, $width1, $height1);

    if(!file_exists($dir)){
        mkdir($dir, 0755, true);
    }

    //$filename = sha1(microtime() . $_SERVER['REMOTE_ADDR'] . $tmpName) . $ext;
	$imgid = $id.'-' .time();
	$filename = $imgid . $ext;
	
	// json_encode でエスケープする。文字列連結だと <script> 内にコードを注入できる
	$js_filename = json_encode($filename, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
	$js_imgid    = json_encode($imgid,    JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
	$js_id       = json_encode($id,       JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);

	
	
    $saveTo = rtrim($dir, '/\\') . '/' . $filename;

    // 書き込みが成功してから結果を表示する。
    // 従来は保存前に「アップロードしました」と出していたため、
    // 失敗しても成功したように見えていた。
    $written = false;
    if ($ext == '.jpg') {
        $written = imagejpeg($image2, $saveTo, 80);
    } else if ($ext == '.png') {
        $written = imagepng($image2, $saveTo);
    } else if ($ext == '.gif') {
        $written = imagegif($image2, $saveTo);
    } else if ($ext == '.webp') {
        $written = imagewebp($image2, $saveTo);
    }
    if (!$written || !file_exists($saveTo)) {
        imagedestroy($image1); imagedestroy($image2);
        openair_upload_error('画像の保存に失敗しました。時間をおいて再度お試しください。', 'image_post.html');
    }

	echo <<<EOM
			<script type="text/javascript">
			 var imgid = {$js_imgid};
			 var filename = {$js_filename};
			  var id ={$js_id};
			  alert("ファイルをアップロードしました。")
			  ensureAuth().then(function () {
			  const db = firebase.firestore();
				  const ts = firebase.firestore.FieldValue.serverTimestamp();
				  db.collection("facilityData").doc(id).set({
				  f_image:filename,
				  updated_at:ts
				  }, {merge: true})
				  .then(() => {
					  console.log("Document successfully written!");
					  location.href = 'index.html';
				  })
				  .catch((error) => {
					  console.error("Error writing document: ", error);
				  });
				});
			</script>
			EOM;

    imagedestroy($image1);
    imagedestroy($image2);

    return $saveTo;

}

if($_SERVER["REQUEST_METHOD"] === 'POST'
    && !empty($_FILES['image']['tmp_name']))
{
    $now = new DateTime();
	

    $maxWidth = 1360;    // 最大幅
    $maxHeight = 880;   // 最大高さ

    // 一時ファイルの場所
    // アップロード自体が成功しているかを先に確認する（従来は未確認）
    openair_check_upload('image', 'image_post.html');
    $tmpName = $_FILES['image']['tmp_name'];

    // 保存先のディレクトリ
    //$dir = __DIR__ . '../../../assets/upload_img/';
	$dir = '../../assets/upload_img/facility/main/';
    $path = uploadImage($tmpName, $dir, $maxWidth, $maxHeight);
    //var_dump($path);
	
    exit;
}else{
	echo <<<EOM
			<script type="text/javascript">
			  alert( "ファイルが選択されていません。")
			  location.href = 'image_post.html';
			</script>
			EOM;
}	
?>
</body>
</html>