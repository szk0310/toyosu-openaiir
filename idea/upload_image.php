<?php
// ============================================================
//  サーバーサイド認証（2026-07-30 追加）
//  このファイルは URL を知っていれば curl で直接実行できてしまうため、
//  出力HTML内の auth_guard.js だけでは保護にならない。ここで必ず検証する。
//  権限: 管理者のみ
// ============================================================
require_once __DIR__ . '/../_auth.php';
$id = openair_safe_id($_REQUEST['id'] ?? '');   // パストラバーサル対策
require_admin();
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

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($tmpName);

    if($mime == 'image/jpeg' || $mime == 'image/pjpeg'){
        $ext = '.jpg';
        $image1 = imagecreatefromjpeg($tmpName);
    } elseif($mime == 'image/png' || $mime == 'image/x-png'){
        $ext = '.png';
        $image1 = imagecreatefrompng($tmpName);
    } elseif($mime == 'image/gif'){
        $ext = '.gif';
        $image1 = imagecreatefromgif($tmpName);
    } else {
        //return false;
			echo <<<EOM
			<script type="text/javascript">
			  alert( "ファイル形式を確認してください。JPEG・PNG・GIFの画像のみアップロードできます。")
			  location.href = 'image_post.html';
			</script>
			EOM;

    }
    
    list($width1, $height1) = getimagesize($tmpName);

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
        mkdir($dir, 0777, true);
    }

    //$filename = sha1(microtime() . $_SERVER['REMOTE_ADDR'] . $tmpName) . $ext;
	$imgid = $id.'-' .time();
	$filename = $imgid . $ext;
	
	// json_encode でエスケープする。文字列連結だと <script> 内にコードを注入できる
	$js_filename = json_encode($filename, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
	$js_imgid    = json_encode($imgid,    JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
	$js_id       = json_encode($id,       JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);

	echo <<<EOM
			<script type="text/javascript">
			 var imgid = {$js_imgid};
			 var filename = {$js_filename};
			  var id ={$js_id};
			  alert("ファイルをアップロードしました。")
			  ensureAdmin("../master/login.html").then(function () {
			  const db = firebase.firestore();
				  const ts = firebase.firestore.FieldValue.serverTimestamp();
				  db.collection("ideaData").doc(id).set({
				  image:filename,
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
	
	
    $saveTo = rtrim($dir, '/\\') . '/' . $filename;

    if($ext == '.jpg'){
        $quality = 80;
        imagejpeg($image2, $saveTo, $quality);
    } else if($ext == '.png'){
        imagepng($image2, $saveTo);
    } else if($ext == '.gif'){
        imagegif($image2, $saveTo);
    }

    imagedestroy($image1);
    imagedestroy($image2);

    return $saveTo;

}

if($_SERVER["REQUEST_METHOD"] === 'POST'
    && !empty($_FILES['image']['tmp_name']))
{
    $now = new DateTime();
	

    $maxWidth = 680;    // 最大幅
    $maxHeight = 440;   // 最大高さ

    // 一時ファイルの場所
    $tmpName = $_FILES['image']['tmp_name'];

    // 保存先のディレクトリ
    //$dir = __DIR__ . '../../../assets/upload_img/';
	$dir = '../../assets/upload_img/idea/';
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