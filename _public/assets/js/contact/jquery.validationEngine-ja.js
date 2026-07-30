;/*****************************************************************
 * Japanese language file for jquery.validationEngine.js (ver2.0)
 *
 * Transrator: tomotomo ( Tomoyuki SUGITA )
 * http://tomotomoSnippet.blogspot.com/
 * Licenced under the MIT Licence
 *******************************************************************/
(function($){
	$.fn.validationEngineLanguage = function(){
	};
	$.validationEngineLanguage = {
		newLang: function(){
			$.validationEngineLanguage.allRules = {
				"required": { // Add your regex rules here, you can take telephone as an example
					"regex": "none",
					"alertText": "必須項目です",
					"alertTextCheckboxMultiple": "選択してください",
					"alertTextCheckboxe": "チェックボックスをチェックしてください"
				},
				"requiredInFunction": { 
					"func": function(field, rules, i, options){
						return (field.val() == "test") ? true : false;
					},
					"alertText": "Field must equal test"
				},
				"minSize": {
					"regex": "none",
					"alertText": "",
					"alertText2": "文字以上にしてください"
				},
				"groupRequired": {
					"regex": "none",
					"alertText": "You must fill one of the following fields"
				},
				"maxSize": {
					"regex": "none",
					"alertText": "",
					"alertText2": "文字以下にしてください"
				},
				"min": {
					"regex": "none",
					"alertText": "",
					"alertText2": " 以上の数値にしてください"
				},
				"max": {
					"regex": "none",
					"alertText": "",
					"alertText2": " 以下の数値にしてください"
				},
				"past": {
					"regex": "none",
					"alertText": "",
					"alertText2": " より過去の日付にしてください"
				},
				"future": {
					"regex": "none",
					"alertText": "",
					"alertText2": " より最近の日付にしてください"
				},	
				"maxCheckbox": {
					"regex": "none",
					"alertText": "チェックしすぎです"
				},
				"minCheckbox": {
					"regex": "none",
					"alertText": "",
					"alertText2": "つ以上チェックしてください"
				},
				"equals": {
					"regex": "none",
					"alertText": "入力された値が一致しません"
				},
				"creditCard": {
					"regex": "none",
					"alertText": "無効なクレジットカード番号"
				},
				"phone": {
					// credit: jquery.h5validate.js / orefalo
					"regex": /^([\+][0-9]{1,3}([ \.\-])?)?([\(][0-9]{1,6}[\)])?([0-9 \.\-]{1,32})(([A-Za-z \:]{1,11})?[0-9]{1,4}?)$/,
					"alertText": "電話番号が正しくありません"
				},
				"email": {
					// Shamelessly lifted from Scott Gonzalez via the Bassistance Validation plugin http://projects.scottsplayground.com/email_address_validation/
					"regex": /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i,
					"alertText": "メールアドレスが正しくありません"
				},
				"integer": {
					"regex": /^[\-\+]?\d+$/,
					"alertText": "整数を半角で入力してください"
				},
				"number": {
					// Number, including positive, negative, and floating decimal. credit: orefalo
					"regex": /^[\-\+]?((([0-9]{1,3})([,][0-9]{3})*)|([0-9]+))?([\.]([0-9]+))?$/,
					"alertText": "数値を半角で入力してください"
				},
				"date": {
					"regex": /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/,
					"alertText": "日付は半角で YYYY-MM-DD の形式で入力してください"
				},
				"ipv4": {
					"regex": /^((([01]?[0-9]{1,2})|(2[0-4][0-9])|(25[0-5]))[.]){3}(([0-1]?[0-9]{1,2})|(2[0-4][0-9])|(25[0-5]))$/,
					"alertText": "IPアドレスが正しくありません"
				},
				"url": {
					"regex": /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i,
					"alertText": "URLが正しくありません"
				},
				"onlyNumberSp": {
					"regex": /^[0-9\ ]+$/,
					"alertText": "半角数字で入力してください"
				},
				"onlyLetterSp": {
					"regex": /^[a-zA-Z\ \']+$/,
					"alertText": "半角アルファベットで入力してください"
				},
				"onlyLetterNumber": {
					"regex": /^[0-9a-zA-Z]+$/,
					"alertText": "半角英数で入力してください"
				},
				// --- CUSTOM RULES -- Those are specific to the demos, they can be removed or changed to your likings
				"ajaxUserCall": {
					"url": "ajaxValidateFieldUser",
					// you may want to pass extra data on the ajax call
					"extraData": "name=eric",
					"alertText": "This user is already taken",
					"alertTextLoad": "Validating, please wait"
				},
				"ajaxNameCall": {
					// remote json service location
					"url": "ajaxValidateFieldName",
					// error
					"alertText": "This name is already taken",
					// if you provide an "alertTextOk", it will show as a green prompt when the field validates
					"alertTextOk": "This name is available",
					// speaks by itself
					"alertTextLoad": "Validating, please wait"
				},
				"validate2fields": {
					"alertText": "『HELLO』と入力してください"
				},
				"katakana": {
					// カタカナ
					"regex": /^[　ア-ンァ-ォャ-ョー]+$/,
					"alertText": "全角カタカナで入力してください"
				},
				"pdc": {
					// 機種依存文字
					"regex": /^(?!.*(\u2460|\u2461|\u2462|\u2463|\u2464|\u2465|\u2466|\u2467|\u2468|\u2469|\u246a|\u246b|\u246c|\u246d|\u246e|\u246f|\u2470|\u2471|\u2472|\u2473|\u2160|\u2161|\u2162|\u2163|\u2164|\u2165|\u2166|\u2167|\u2168|\u2169|\u3349|\u3314|\u3322|\u334d|\u3318|\u3327|\u3303|\u3336|\u3351|\u3357|\u330d|\u3326|\u3323|\u332b|\u334a|\u333b|\u339c|\u339d|\u339e|\u338e|\u338f|\u33c4|\u33a1 |\u301d|\u301f|\u2116|\u33cd|\u2121|\u32a4|\u32a5|\u32a6|\u32a7|\u32a8|\u3231|\u3232|\u3239|\u337e|\u337d|\u337c|\u337b|\u222e|\u221f|\u22bf|\u7e8a|\u891c|\u9348|\u9288|\u84dc|\u4fc9|\u70bb|\u6631|\u68c8|\u92f9|\u66fb|\u5f45|\u4e28|\u4ee1|\u4efc|\u4f00|\u4f03|\u4f39|\u4f56|\u4f92|\u4f8a|\u4f9a|\u4f94|\u4fcd|\u5040|\u5022|\u4fff|\u501e|\u5046|\u5070|\u5042|\u5094|\u50f4|\u50d8|\u514a|\u5164|\u519d|\u51be|\u51ec|\u5215|\u529c|\u52a6|\u52c0|\u52db|\u5300|\u5307|\u5324|\u5372|\u5393|\u53b2|\u53dd|\ufa0e|\u549c|\u548a|\u54a9|\u54ff|\u5586|\u5759|\u5765|\u57ac|\u57c8|\u57c7|\ufa0f|\ufa10|\u589e|\u58b2|\u590b|\u5953|\u595b|\u595d|\u5963|\u59a4|\u59ba|\u5b56|\u5bc0|\u752f|\u5bd8|\u5bec|\u5c1e|\u5ca6|\u5cba|\u5cf5|\u5d27|\u5d53|\ufa11|\u5d42|\u5d6d|\u5db8|\u5db9|\u5dd0|\u5f21|\u5f34|\u5f67|\u5fb7|\u5fde|\u605d|\u6085|\u608a|\u60de|\u60d5|\u6120|\u60f2|\u6111|\u6137|\u6130|\u6198|\u6213|\u62a6|\u63f5|\u6460|\u649d|\u64ce|\u654e|\u6600|\u6615|\u663b|\u6609|\u662e|\u661e|\u6624|\u6665|\u6657|\u6659|\ufa12|\u6673|\u6699|\u66a0|\u66b2|\u66bf|\u66fa|\u670e|\uf929|\u6766|\u67bb|\u6852|\u67c0|\u6801|\u6844|\u68cf|\ufa13|\u6968|\ufa14|\u6998|\u69e2|\u6a30|\u6a6b|\u6a46|\u6a73|\u6a7e|\u6ae2|\u6ae4|\u6bd6|\u6c3f|\u6c5c|\u6c86|\u6c6f|\u6cda|\u6d04|\u6d87|\u6d6f|\u6d96|\u6dac|\u6dcf|\u6df8|\u6df2|\u6dfc|\u6e39|\u6e5c|\u6e27|\u6e3c|\u6ebf|\u6f88|\u6fb5|\u6ff5|\u7005|\u7007|\u7028|\u7085|\u70ab|\u710f|\u7104|\u715c|\u7146|\u7147|\ufa15|\u71c1|\u71fe|\u72b1|\u72be|\u7324|\ufa16|\u7377|\u73bd|\u73c9|\u73d6|\u73e3|\u73d2|\u7407|\u73f5|\u7426|\u742a|\u7429|\u742e|\u7462|\u7489|\u749f|\u7501|\u756f|\u7682|\u769c|\u769e|\u769b|\u76a6|\ufa17|\u7746|\u52af|\u7821|\u784e|\u7864|\u787a|\u7930|\ufa18|\ufa19|\ufa1a|\u7994|\ufa1b|\u799b|\u7ad1|\u7ae7|\ufa1c|\u7aeb|\u7b9e|\ufa1d|\u7d48|\u7d5c|\u7db7|\u7da0|\u7dd6|\u7e52|\u7f47|\u7fa1|\ufa1e|\u8301|\u8362|\u837f|\u83c7|\u83f6|\u8448|\u84b4|\u8553|\u8559|\u856b|\ufa1f|\u85b0|\ufa20|\ufa21|\u8807|\u88f5|\u8a12|\u8a37|\u8a79|\u8aa7|\u8abe|\u8adf|\ufa22|\u8af6|\u8b53|\u8b7f|\u8cf0|\u8cf4|\u8d12|\u8d76|\ufa23|\u8ecf|\ufa24|\ufa25|\u9067|\u90de|\ufa26|\u9115|\u9127|\u91da|\u91d7|\u91de|\u91ed|\u91ee|\u91e4|\u91e5|\u9206|\u9210|\u920a|\u923a|\u9240|\u923c|\u924e|\u9259|\u9251|\u9239|\u9267|\u92a7|\u9277|\u9278|\u92e7|\u92d7|\u92d9|\u92d0|\ufa27|\u92d5|\u92e0|\u92d3|\u9325|\u9321|\u92fb|\ufa28|\u931e|\u92ff|\u931d|\u9302|\u9370|\u9357|\u93a4|\u93c6|\u93de|\u93f8|\u9431|\u9445|\u9448|\u9592|\uf9dc|\ufa29|\u969d|\u96af|\u9733|\u973b|\u9743|\u974d|\u974f|\u9751|\u9755|\u9857|\u9865|\ufa2a|\ufa2b|\u9927|\ufa2c|\u999e|\u9a4e|\u9ad9|\u9adc|\u9b75|\u9b72|\u9b8f|\u9bb1|\u9bbb|\u9c00|\u9d70|\u9d6b|\ufa2d|\u9e19|\u9ed1|\u2170|\u2171|\u2172|\u2173|\u2174|\u2175|\u2176|\u2177|\u2178|\u2179|\uffe2|\uffe4)).*$/,
					"alertText": "機種依存文字は入力できません。"
				}
			};

		}
	};
	$.validationEngineLanguage.newLang();
})(jQuery);



