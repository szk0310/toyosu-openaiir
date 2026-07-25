// ============================================================
//  Open Air 管理画面  Firebase 初期化（manage 専用・共有）
//  デプロイ先: assets/js/common/firestore_openAir.js
// ============================================================

firebase.initializeApp({
	//========= 本番 toyosuOpenAir =========
	apiKey: "AIzaSyCx6-2f7hPy8pgXEe0m2qpGHyx6oYZPiQ8",
	projectId: "toyosuopenair",

	//========= テスト testtoyosuOpenAir（切り戻し用・コメント） =========
	//apiKey: "AIzaSyCnnpdVubcLLthKdisrw9pfNWUxh52CUDA",
	//projectId: "testtoyosuopenair",
});

// ログインID(login_id)を Firebase Auth のメールアドレスへマッピングする内部ドメイン。
// 実在ドメインである必要はなく、外部にメールは送られない。
window.AUTH_EMAIL_DOMAIN = "@toyosu-openair.local";

// 匿名ログインは廃止しました。
// 各ページは auth_guard.js の withAuth() でログイン済みセッションを利用します。
// firebase.auth().signInAnonymously().catch(error => console.log(error));
