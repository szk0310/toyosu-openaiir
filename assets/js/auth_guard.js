// ============================================================
//  auth_guard.js  —  manage 共通の認証ガード
//  依存: firebase-app / firebase-auth / firebase-firestore
//        firestore_openAir.js（initializeApp 済み）より後に読み込むこと
//
//  使い方:
//    facility ページ（施設ログイン必須）:
//        withAuth(function (user, db) { ... }, { loginUrl: "login.html" });
//    master / idea / case ページ（管理者ログイン必須）:
//        withAdmin(function (user, db) { ... }, { loginUrl: "login.html" });
//
//  かつての firebase.auth().signInAnonymously().then(() => { ... }) を
//  上記に置き換える。中の DB 処理はそのまま。
// ============================================================
(function (global) {
  var auth = firebase.auth();

  function isLoggedIn(user) {
    return !!user && user.isAnonymous === false;
  }

  // ログイン済み(非匿名)ユーザーを保証。なければ loginUrl へ遷移。
  function requireUser(loginUrl) {
    return new Promise(function (resolve) {
      var unsub = auth.onAuthStateChanged(function (user) {
        unsub();
        if (isLoggedIn(user)) {
          resolve(user);
        } else {
          location.href = loginUrl;
        }
      });
    });
  }

  // admins/{uid} ドキュメントの有無で管理者判定
  function checkAdmin(user) {
    return firebase.firestore().collection("admins").doc(user.uid).get()
      .then(function (doc) { return doc.exists; })
      .catch(function () { return false; });
  }

  // --- facility ページ用: 任意のログイン済み施設ユーザー ---
  global.withAuth = function (callback, opts) {
    opts = opts || {};
    var loginUrl = opts.loginUrl || "login.html";
    return requireUser(loginUrl).then(function (user) {
      return callback(user, firebase.firestore());
    });
  };

  // --- master / idea / case ページ用: 管理者のみ ---
  global.withAdmin = function (callback, opts) {
    opts = opts || {};
    var loginUrl = opts.loginUrl || "login.html";
    return requireUser(loginUrl).then(function (user) {
      return checkAdmin(user).then(function (ok) {
        if (!ok) {
          alert("管理者権限がありません。再度ログインしてください。");
          firebase.auth().signOut().finally(function () {
            location.href = loginUrl;
          });
          return;
        }
        return callback(user, firebase.firestore());
      });
    });
  };

  // ------------------------------------------------------------
  //  既存コード互換ヘルパー
  //  かつての `firebase.auth().signInAnonymously()` を1トークンで置換するための関数。
  //  signInAnonymously と同じく Promise を返すので、後続の .then(() => {...}).catch(...)
  //  をそのまま使える。未ログイン/権限なしの場合は loginUrl へ遷移し Promise は解決しない。
  // ------------------------------------------------------------

  // facility ページ用（任意のログイン済み施設ユーザー）
  global.ensureAuth = function (loginUrl) {
    var url = loginUrl || "login.html";
    return new Promise(function (resolve) {
      var unsub = auth.onAuthStateChanged(function (user) {
        unsub();
        if (isLoggedIn(user)) {
          resolve(user);
        } else {
          location.href = url; // ページ遷移。resolve/reject しない。
        }
      });
    });
  };

  // master / idea / case ページ用（管理者のみ）
  global.ensureAdmin = function (loginUrl) {
    var url = loginUrl || "login.html";
    return new Promise(function (resolve) {
      var unsub = auth.onAuthStateChanged(function (user) {
        unsub();
        if (!isLoggedIn(user)) {
          location.href = url;
          return;
        }
        checkAdmin(user).then(function (ok) {
          if (ok) {
            resolve(user);
          } else {
            alert("管理者権限がありません。再度ログインしてください。");
            firebase.auth().signOut().finally(function () {
              location.href = url;
            });
          }
        });
      });
    });
  };

  // ログアウト共通処理
  global.logoutManage = function (loginUrl) {
    return firebase.auth().signOut().finally(function () {
      // 共有PCでの利用を想定し、施設名などの残留情報も必ず消す。
      // これを消さないと、ログアウト後も前の利用者の施設名が画面に残る。
      try { sessionStorage.clear(); } catch (e) { /* 参照できない環境は無視 */ }
      location.href = loginUrl || "login.html";
    });
  };
})(window);
