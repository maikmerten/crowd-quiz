function displayQuestion(question, clickfunction) {
	var optionlist = $("#optionlist");
	optionlist.empty();

	// generate entries of option list
	for(var i = 0; i < question.options.length; ++i) {
		var option = $("<li>");
		option.attr("id", "option" + i);
		optionlist.append(option);
	}

	$("#questiontext").text(question.text);

	var permute = [];
	for(var i = 0; i < question.options.length; ++i) {

		// display answering options in random order
		var idx = 0;
		while(true) {
			var rand = Math.floor(Math.random() * question.options.length);
			if(!permute[rand]) {
				idx = rand;
				permute[idx] = true;
				break;
			}
		}

		var option = $("#option" + idx);

		option.text(question.options[i]);
		option.toggleClass("option", true);
		option.attr("originalindex", i);

		var count = $("<span>");
		count.attr("id", "optioncount" + idx);
		count.toggleClass("optioncount", true);
		option.append(count);

		if(clickfunction) {
			option.click(clickfunction);
		}
	}
}

function revealCorrect() {
	for(var i = 0; i < 999; ++i) {
		var option = $("#option" + i);
		if(!option.length) {
			break;
		}

		var originalidx = option.attr("originalindex");
		option.toggleClass("correct", originalidx == 0);
		option.toggleClass("incorrect", originalidx != 0);
	}
}
