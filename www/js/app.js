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
			key: 'eff3gmdpo4t8d7vi'
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
		var self = this;
		id == "home" ? id = "tutor" : id = "home";
		conn = peer.connect(id);

		conn.on('open', function () {
			conn.on('data', function (data) {
				window.console.log('Received', data);
			});
			call(id);
		});
	}

	function call(id) {
		getAudio(
			function (MediaStream) {
				var call = peer.call(id, MediaStream);
				call.on('stream', onReceiveStream);
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
	}

	function onReceiveStream(stream) {
			var audio = document.getElementById('contact-audio');
			audio.src = window.URL.createObjectURL(stream);
			audio.onloadedmetadata = function () {
				window.alert("call started");
			};

		}
		/* ---------------- WEB RTC AUDIO CALL ---------------- */

}