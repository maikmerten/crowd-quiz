StyleManager = function() {
	$(document).keypress(function(e) {
		if(e.which == 115) {
			$("link").each(function(index) {
				let elem = $(this);
				if(elem.attr("rel").trim() == "stylesheet") {
					elem.attr("rel", "stylesheet alternate");
				} else {
					elem.attr("rel", "stylesheet");
				}
			});
		}
	});
}


QuizRenderer = function(topElementSelector) {
	var topElem = $(topElementSelector);
	if(!topElem.length) {
		throw "QuizRenderer: could not find topElement with selector " + topElementSelector;
	}

	var that = this;
	var revealed = false;
	var canvas = null;
	var img = null;
	var question = null;
	
	this.renderQuestion = function(question, clickcallback) {
		this.question = question;
		
		revealed = false;
		topElem.empty().append($("<div>").attr("id", "questiontext").text(question.text));

		if(question.image) {
			canvas = $("<canvas>");
			canvas.toggleClass("crosshair", "type" in question && question.type == 1 && clickcallback != null);
			topElem.append(canvas.attr("id", "questionimage").css("display", "block"));
			img = new Image();
			img.onload = function() {
				canvas.attr("width", img.width).attr("height", img.height);
				var ctx = canvas[0].getContext("2d");
				ctx.drawImage(img,0,0);
			};			
			img.src = question.image;

			if(clickcallback) {
				canvas.click(function(evt) {
					if(revealed) return;

					var x = evt.pageX - canvas[0].offsetLeft;
					var y = evt.pageY - canvas[0].offsetTop;

					var click = {
						type: "imageclick",
						x: x,
						y: y
					};
					clickcallback(click);
				});
			}
		}

		// question type 0 and 2: Display answer options
		if((!question.type || question.type == 0 || question.type == 2) && question.options) {
			var optionlist = $("<ul>").attr("id", "optionlist");
			topElem.append(optionlist);

			// generate entries of option list
			for(var i = 0; i < question.options.length; ++i) {
				optionlist.append($("<li>").attr("id", "option" + i).toggleClass("option", true));
			}

			// display answering options in random order
			var permute = [];
			for(var i = 0; i < question.options.length; ++i) {
				var randomizePosition = question.type != 2;
				var idx = 0;
				
				if(randomizePosition) {
					while(true) {
						var rand = Math.floor(Math.random() * question.options.length);
						if(!permute[rand]) {
							idx = rand;
							permute[idx] = true;
							break;
						}
					}
				} else {
					idx = i;
				}


				var option = $("#option" + idx).text(question.options[i]).data("originalindex", i);
				var count = $("<span>").attr("id", "optioncount" + idx).toggleClass("optioncount", true);
				option.append(count);

				if(clickcallback) {
					option.addClass("pointer");
					option.click(function() {
						if(revealed) return;

						$("li.option").toggleClass("selected", false);		
						var option = $(this).toggleClass("selected", true);
						var click = {
							type: "optionclick",
							clickedoption: option.data("originalindex")
						};
						clickcallback(click);
					});
				}
			}
		}

	}

	this.redrawImage = function() {
		var ctx = canvas[0].getContext("2d");
		ctx.drawImage(img,0,0);
	}


	this.markImagePosition = function(x, y) {
		var canvas = $("#questionimage");
		var ctx = canvas[0].getContext("2d");
		ctx.beginPath();
		ctx.arc(x, y, 5, 0, 2 * Math.PI, false);
		ctx.fillStyle = '#ffff3e';
		ctx.fill();
		ctx.lineWidth = 2;
		ctx.strokeStyle = '#330000';
		ctx.stroke();
	}

	this.reveal = function(votes) {
		revealed = true;

		// determine votes per option
		for(var i = 0; i < 999; ++i) {
			var option = $("#option" + i);
			if(!option.length) {
				break;
			}

			var originalidx = option.data("originalindex");
			var correctOption = originalidx == 0 || this.question.type == 2;

			option.toggleClass("correct", correctOption);
			option.toggleClass("incorrect", !correctOption);

			if(votes) {
				var optioncount = $("#optioncount" + i);
				var count = 0;
				for(var key in votes) {
					var click = votes[key];
					if(click.type != "optionclick") {
						continue;
					}
					if(originalidx === click.clickedoption) {
						count++;
					}
				}
				optioncount.text(count + "");
			}

		}


		// draw image markings
		if(votes) {
			for(var key in votes) {
				var click = votes[key];
				if(click.type != "imageclick") {
					continue;
				}

				that.markImagePosition(click.x, click.y);
			}
		}
	}

	this.isRevealed = function() {
		return revealed;
	}

}

QuizHolder = function(questions) {
	var quest = questions;
	var pos = 0;


	this.size = function() {
		return quest.length;
	}

	this.position = function() {
		return pos;
	}

	this.current = function() {
		return quest[pos];
	}

	this.hasNext = function() {
		return pos < (quest.length - 1);
	}

	this.next = function() {
		if(this.hasNext()) {
			pos++;
		}
		return this.current();
	}

	this.hasPrev = function() {
		return this.size() > 0 && pos > 0;
	}

	this.prev = function() {
		if(this.hasPrev()) {
			pos--;
		}
		return this.current();
	}
}

QuizUtil = {
	randomString: function() {
		var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
		var result = "";
		for (var i = 32; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
		return result;
	},

	permaId: function() {
		var id = localStorage.getItem("CrowdQuizId");
		if(!id) {
			id = QuizUtil.randomString();
			localStorage.setItem("CrowdQuizId", id);
		}
		return id;
	},

	clickIsRelevant: function(click, question) {
		if(!question.type || question.type == 0 || question.type == 2) {
			// standard type, user has to click an option
			return click.type == "optionclick";
		} else if(question.type == 1) {
			// user has to click a position in an image
			return click.type == "imageclick";
		}
		return false;
	}
}
