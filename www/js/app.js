/*jslint browser:true */
/*global $:false, cordova:false, ons:false, Peer:false */


/*
Ready function: Everything should be called after the device is ready, so inside this function.
*/
ons.ready(function () {
	//Initialize the application
	var smartHome = new SmartHome();
});

//here we define all the functionalities
function SmartHome() {
	var peer;
	var conn;


	//First the click handler
	$("#connect").click(function () {
		connect();
	});

	$("#create").click(function () {
		create();
	});


	//Then all the functions


	/* ---------------- WEB RTC AUDIO CALL ---------------- */
	function create() {
		var self = this;
		var id = $('#client').find(":selected").val();
		peer = new Peer(id, {
			key: '174he8v79sbgldi'
		});
		peer.on('open', function (id) {
			$("#connect").show();
			$(".initQuestion").hide();

			window.console.log('My peer ID is: ' + id);
		});
		peer.on('call', onReceiveCall);
	}

	function getAudio(successCallback, errorCallback) {
		navigator.webkitGetUserMedia({
			audio: true,
			video: false
		}, successCallback, errorCallback);
	}

	function successCallback() {
		window.console.log("success");
	}

	function errorCallback(e) {
		window.console.log("error" + e);
	}

	function connect() {
		var id = $('#client').find(":selected").val();
		if (id == "home") {
			id = "tutor";
		} else {
			id = "home";
		}
		conn = peer.connect(id);

		conn.on('open', function () {
			conn.on('data', function (data) {
				window.console.log('Received', data);
				if (data == "closeCall") {
					$("#stopCall").hide();
					$("#connect").show();
				}
			});
			call(id);
		});


	}

	function call(id, self) {
		getAudio(
			function (MediaStream) {
				var call = peer.call(id, MediaStream);
				call.on('stream', onReceiveStream);
				closeHandler(call);
			},
			function (err) {
				window.alert("error");
			}
		);
	}

	function onReceiveCall(call) {
		window.alert("incoming call");
		getAudio(
			function (MediaStream) {
				call.answer(MediaStream);
			},
			function (err) {
				window.console.log(err);
			}
		);
		call.on('stream', onReceiveStream);
		closeHandler(call);

	}

	function closeHandler(call) {
		$("#stopCall").click(function () {
			call.close();
			$("#stopCall").hide();
			$("#connect").show();
		});


	}

	function onReceiveStream(stream) {
			var audio = document.getElementById('contact-audio');
			audio.src = window.URL.createObjectURL(stream);
			audio.onloadedmetadata = function () {
				$("#connect").hide();
				$("#stopCall").show();
			};

		}
		/* ---------------- WEB RTC AUDIO CALL ---------------- */

}