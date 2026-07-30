// ============================================================
//  upload_auth.js — アップロード系フォームに認証情報を付与する
//
//  背景:
//    upload_image*.php / mail.php は URL を知っていれば curl で直接
//    実行できてしまうため、サーバー側（_auth.php）で Firebase の
//    ID トークンを検証するようにした。
//    このファイルは、その ID トークンをフォーム送信時に hidden
//    フィールドとして付与する役割を持つ。
//
//  依存: firebase-app / firebase-auth（firestore_openAir.js より後に読み込むこと）
//
//  使い方: 読み込むだけでよい。DOMContentLoaded 時に、action が .php の
//         フォームすべてに自動で適用される。
// ============================================================
(function () {
  "use strict";

  function attach(form) {
    if (form.getAttribute("data-token-attached")) { return; }
    form.setAttribute("data-token-attached", "1");

    form.addEventListener("submit", function (ev) {
      // ★ 常に横取りする。トークンは毎回取り直す（戻る操作で
      //   期限切れトークンが再送されるのを防ぐため、値の使い回しはしない）。
      ev.preventDefault();

      if (form.getAttribute("data-submitting")) { return; }   // 連打による二重送信の防止
      form.setAttribute("data-submitting", "1");

      var buttons = form.querySelectorAll('input[type="submit"], button');
      Array.prototype.forEach.call(buttons, function (b) { b.disabled = true; });

      function fail(msg) {
        form.removeAttribute("data-submitting");
        Array.prototype.forEach.call(buttons, function (b) { b.disabled = false; });
        alert(msg);
      }

      // ★ currentUser を同期で読んではいけない。
      //   ページを開いた直後は Firebase の認証状態がまだ復元されておらず
      //   null になるため、すぐ送信すると誤って「セッションが切れました」に
      //   なってしまう。onAuthStateChanged で復元を待ってから判断する。
      var settled = false;
      var unsub = firebase.auth().onAuthStateChanged(function (user) {
        if (settled) { return; }
        settled = true;
        unsub();

        if (!user || user.isAnonymous) {
          fail("セッションが切れました。お手数ですが再度ログインしてください。");
          return;
        }

        // ページを長時間開いていても期限切れにならないよう強制リフレッシュする
        user.getIdToken(true)
          .then(function (token) {
            var field = form.querySelector('input[name="idToken"]');
            if (!field) {
              field = document.createElement("input");
              field.type = "hidden";
              field.name = "idToken";
              form.appendChild(field);
            }
            field.value = token;
            // form.submit() は submit イベントを発火しないため無限ループしない
            form.submit();
          })
          .catch(function (err) {
            console.error("IDトークン取得エラー:", err);
            fail("認証情報の取得に失敗しました。通信環境を確認のうえ、再度お試しください。");
          });
      });
    });
  }

  function attachAll() {
    var forms = document.querySelectorAll("form");
    Array.prototype.forEach.call(forms, function (f) {
      var action = (f.getAttribute("action") || "");
      if (action.indexOf(".php") !== -1) { attach(f); }
    });
  }

  window.attachIdTokenToForms = attachAll;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attachAll);
  } else {
    attachAll();
  }
})();
