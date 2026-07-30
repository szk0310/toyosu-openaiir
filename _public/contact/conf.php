<?php
$kind = trim( $_REQUEST[ 'kind' ] );
$name = trim( $_REQUEST[ 'name' ] );
$email = trim( $_REQUEST[ 'email' ] );
$company = trim( $_REQUEST[ 'company' ] );
$tel = trim( $_REQUEST[ 'tel' ] );
$inquiry = trim( $_REQUEST[ 'inquiry' ] );
?>

<!doctype html>
<html lang="ja">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width,initial-scale=1.0, minimum-scale=1.0">
	<meta name="format-detection" content="telephone=no">

	<!-- favicon -->
	<link rel="icon" type="image/x-icon" href="../assets/images/common/favicon.ico">
	<link rel="apple-touch-icon" href="../assets/images/common/apple-touch-icon.png" sizes="152x152">
	<link rel="icon" href="../assets/images/common/android-chrome.png" sizes="192x192" type="image/png">


	<!-- SEO -->
	<title>お問い合わせ | TOYOSU OPEN AIR</title>
	<meta name="description" content="">
	<meta name="keywords" content="">
	<link rel="canonical" href="">

	<!-- font -->
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap" rel="stylesheet">


	<!-- css -->
	<link href="../assets/css/common/base.css" rel="stylesheet" type="text/css">
	<link href="../assets/css/common/common.css" rel="stylesheet" type="text/css">
	<link href="../assets/css/common/page.css" rel="stylesheet" type="text/css">
	<link href="../assets/css/contact/contact.css" rel="stylesheet" type="text/css">
	
	<link href="../assets/css/contact/validationEngine.jquery.css" rel="stylesheet" type="text/css">
   
</head>
    
<body id="pagetop">
    
	<!-- header -->
	<header>
		<div class="header-inn">

			<div class="header-logo"><a href="../index.html">TOYOSU <span>OPEN AIR</span></a></div>

			<button class="sp-menu-trigger sp">
				<div class="sp-menu-btn">
					<span></span>
					<span></span>
					<span></span>
				</div>
			</button>
			<nav class="gnav-wrap">
				<ul id="gnav">
			 <!-- ▼ ドロップダウン対象 -->
				<li class="has-dropdown">
				  <a class="dropdown-toggle">
					<span>スペースを</span><span>探す</span>
				  </a>
				  <ul class="dropdown">
					<li><a href="../map.html" class="btn_dropdown blue">マップから探す</a></li>
					<li><a href="../search.html" class="btn_dropdown green">目的から探す</a></li>
				  </ul>
				</li>
					<li><a href="../index.html#event"><span>活用</span><span>事例</span></a></li>
					<li><a href="../index.html#idea"><span>活用</span><span>アイデア</span></a></li>
					<li><a href="../contact" class="btn"><span>お問い合わせ</span></a></li>
				</ul>
			</nav>
		</div>
	</header>
	<!-- header -->


	<main class="main bg-blue">

			<!-- ==================== パンくず ここから ==================== -->
			 <div class="breadcrumb-wrap bg-blue">
				<div class="breadcrumb-in">
						<nav class="breadcrumbs">
							<ol itemscope itemtype="https://schema.org/BreadcrumbList">
								<li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
									<a itemprop="item" href="../index.html"><span itemprop="name">トップ</span></a>
									<meta itemprop="position" content="1" />
								</li>
								<li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
									<span itemprop="name">お問い合わせ</span>
									<meta itemprop="position" content="2" />
								</li>
						   </ol>
						</nav>
				 </div>
			 </div>
			<!-- ==================== パンくず ここまで ==================== -->

		<div class="section conf">
			<div class="cont-inn">
				<div class="contact-wrap">
						<h1 class="sec-ttl">お問い合わせ</h1>
						<p class="sec-seb-txt">入力内容をご確認ください。</p>

					<form action="send.php" method="post" id="contact_form">
						<div class="form-wrap">
						<input type="hidden" name="kind" value="<?php echo h($kind)?>" />
						<input type="hidden" name="name" value="<?php echo h($name)?>" />
						<input type="hidden" name="email" value="<?php echo h($email)?>" />
						<input type="hidden" name="company" value="<?php echo h($company)?>" />
						<input type="hidden" name="tel" value="<?php echo h($tel)?>" />
						<input type="hidden" name="inquiry" value="<?php echo h($inquiry)?>" />
							
						<div class="ttl">お問い合わせ種別 <span class="req">必須</span></div>
						<div class="input">
						  <?php echo h($kind)?>
						</div>

						<div class="ttl">お名前 <span class="req">必須</span></div>
						<div class="input">
						  <?php echo h($name)?>
						</div>
						
						<div class="ttl">法人名/団体名</div>
						<div class="input">
						  <?php echo h($company)?>
						</div>

						<div class="ttl">メールアドレス<span class="req">必須</span></div>
						<div class="input">
							<?php echo h($email)?>
						</div>

						<div class="ttl">電話番号</div>
						<div class="input">
						  <?php echo h($tel)?>
						</div>

						<div class="ttl">お問い合わせ内容<span class="req">必須</span></div>
						<div class="input">
						  <?php echo h($inquiry)?>
						</div>


						<div class="submit">
							<a  href="index.html" class="submit-button btn green min">戻る</a>
							<input type="submit" value="入力内容を送信する" class="submit-button btn blue min">
							</div>
					</div>
					</form>				
				</div>
            </div>
		</div>
		

	</main>
<?php
function h($str) 
{ 
	return htmlspecialchars($str, ENT_QUOTES, 'UTF-8'); 
}
?>


	<footer>
		<!--<p class="pagetop"><a href="#pagetop" class="is-imghover">pagetop</a></p>-->
		<div class="cont-inn">
			<div class="link-wrap">
				<a href="https://toyosu-smartcity.com" target="_blank">運営会社</a>
				<a href="../terms.html">利用規約</a>
				<a href="../privacy.html">プライバシーポリシー</a>
				<a href="../contact/">お問い合わせ</a>
			</div>
			<p class="copyright">© 2026 （一社）豊洲スマートシティ推進協議会. All Rights Reserved.</p>
		</div>
	</footer>


	<!-- js -->
	<script src="../assets/js/common/jquery-3.6.0.min.js"></script>
	<script src="../assets/js/common/common.js"></script>

</body>
</html>
