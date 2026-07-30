$(function(){
	// セッションストレージ非対応環境
	if (!window.sessionStorage) return;

	var $text = $('input[type=text], input[type=email], textarea');
	var $checkbox = $('input[type=checkbox]');
	var $radio = $('input[type=radio]');
	var $select = $('select');

	//セッションストレージの読み込み
	function init(){
		//text, email, textarea
		$.each($text, function(){
			var inputName = $(this).attr('name');
			if(sessionStorage[inputName]){
				$(this).val(sessionStorage[inputName]);
			}
		});

		//checkbox
		$.each($checkbox, function(){
			var inputName = $(this).attr('name');
			var inputValue = $(this).attr('value');
			var cbValues = JSON.parse(sessionStorage.getItem(inputName));
			if(cbValues && $.inArray(inputValue, cbValues) != -1){
				$(this).attr('checked','checked');
			}
		});

		//radio
		$.each($radio, function(){
			var inputName = $(this).attr('name');
			var inputValue = $(this).attr('value');
			if(sessionStorage[inputName]){
				if(inputValue == sessionStorage[inputName]){
					$(this).attr('checked','checked');
				}
			}
		});

		//select
		$.each($select, function(){
			var inputName = $(this).attr('name');
			var optionValue = sessionStorage[inputName];
			$('[name="' + inputName + '"]')
				.find('option[value="' + optionValue + '"]')
				.attr('selected', true);
		});

		bindEvent();
	}//init

	init();

	//セッションストレージへの保存・削除
	function bindEvent(){
		//text, email, textarea, radio, select
		$('input[type=text], input[type=email], textarea, input[type=radio], select')
			.change(function(){
				sessionStorage.setItem($(this).attr('name'), $(this).val());
			});

		//checkbox
		$checkbox.change(function(){
			var inputName = $(this).attr('name');
			var inputValue = $(this).attr('value');
			var cbValues = new Array;

			$.each($('[name="' + inputName + '"]'), function(){
				if($(this).is(':checked')){
					cbValues.push($(this).attr('value'));
				}
			});

			//配列の格納
			sessionStorage.setItem(inputName, JSON.stringify(cbValues));
		});

		//データ削除
		$('input[type=reset]').click(function(){
			sessionStorage.clear();
		});
	}
});
