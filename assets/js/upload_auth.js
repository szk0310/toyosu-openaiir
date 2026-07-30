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
      var field = form.querySelector('input[name="idToken"]');
      // 既にトークンが入っていれば、そのまま通常送信させる
      if (field && field.value) { return; }

      ev.preventDefault();

      var user = firebase.auth().currentUser;
      if (!user) {
        alert("セッションが切れました。お手数ですが再度ログインしてください。");
        return;
      }

      // 送信直前に取得する。ページを長時間開いていても期限切れにならないよう
      // 強制リフレッシュ(true)する。
      user.getIdToken(true)
        .then(function (token) {
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
          alert("認証情報の取得に失敗しました。再度ログインしてください。");
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
