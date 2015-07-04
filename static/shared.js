QuestionRenderer = function(topElementSelector) {
	this.topElem = $(topElementSelector);
	if(!this.topElem.length) {
		throw "QuestionRenderer: could not find topElement with selector " + topElementSelector;
	}

	var that = this;
	var optionselected = false;
}

QuestionRenderer.prototype.renderQuestion = function(question, clickcallback) {
	optionselected = false;
	this.topElem.empty().append($("<div>").attr("id", "questiontext").text(question.text));

	if(question.image) {
		this.topElem.append($("<img>").attr("id", "questionimage").attr("src", question.image).css("display", "block"));
	}

	if(question.options && question.options.length) {
		var optionlist = $("<ul>").attr("id", "optionlist");
		this.topElem.append(optionlist);

		// generate entries of option list
		for(var i = 0; i < question.options.length; ++i) {
			optionlist.append($("<li>").attr("id", "option" + i).toggleClass("option", true));
		}

		// display answering options in random order
		var permute = [];
		for(var i = 0; i < question.options.length; ++i) {
			var idx = 0;
			while(true) {
				var rand = Math.floor(Math.random() * question.options.length);
				if(!permute[rand]) {
					idx = rand;
					permute[idx] = true;
					break;
				}
			}

			var option = $("#option" + idx).text(question.options[i]).data("originalindex", i);
			var count = $("<span>").attr("id", "optioncount" + idx).toggleClass("optioncount", true);
			option.append(count);

			if(clickcallback) {
				option.click(function() {
					if(optionselected) {
						return;
					}
					optionselected = true;
		
					var option = $(this).toggleClass("selected", true);
					clickcallback(option.data("originalindex"));
				});
			}
		}
	}

}

QuestionRenderer.prototype.revealAnswer = function() {
	optionselected = true;

	for(var i = 0; i < 999; ++i) {
		var option = $("#option" + i);
		if(!option.length) {
			break;
		}

		var originalidx = option.data("originalindex");
		option.toggleClass("correct", originalidx == 0);
		option.toggleClass("incorrect", originalidx != 0);
	}
}
