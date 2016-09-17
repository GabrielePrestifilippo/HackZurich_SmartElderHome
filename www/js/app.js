/*jslint browser:true */
/*global $:false, cordova:false, ons:false, Peer:false, DecibelMeter, SpeechRecognition */

var audioSources;
var meter;
var recognizer;
var conn;





ons.ready(function () {


	//Initialize the application
	var smartHome = new SmartHome();



});


//here we define all the functionalities
function SmartHome(meter) {
	var peer;

	var recording = 0;




	//Initialize Audio Detector
	var dec = new DecibelMeter(window, navigator, document);
	meter = dec.create('meter');

	meter.on('ready', function (meter, sources) {
		audioSources = sources;
		meter.connect(audioSources[0]);
	});

	meter.on('sample', sampleReceived);



	//Initialize Speech recognition
	window.SpeechRecognition = window.SpeechRecognition ||
		window.webkitSpeechRecognition ||
		null;

	recognizer = new SpeechRecognition();
	recognizer.lang = "en-US";
	recognizer.continuous = true;
	recognizer.interimResults = false;
	var transcription;


	recognizer.addEventListener('result', function (event) {
		transcription = '';
		for (var i = event.resultIndex; i < event.results.length; i++) {
			if (event.results[i].isFinal) {
				transcription = event.results[i][0].transcript;
				window.console.log(transcription);
				sendContentToGoogle(transcription);
			}
		}
	});

	recognizer.addEventListener('end', function () {
		recording = 0;
		meter.listen();
	});



	//Instantiate the click handlers
	$("#choose").click(function () {
		create();
		$("#connect").show();
	});


	$("#connect").click(function () {
		connect();
		$("#startCall").show();
		$("#connect").hide();
	});



	$("#startCall").click(function () {
		var id = $('#client').find(":selected").val();

		if (id == "home") {
			id = "tutor";
		} else {
			id = "home";
		}
		call(id);
	});

	//Then all the functions


	/* ---------------- SPEECH RECOGNITION ---------------- */
	function sampleReceived(dB, percent, value) {
		if (percent > 0.3) {
			if (!recording) {
				meter.stopListening();
				recording = 1;
				try {
					recordAudio();
				} catch (e) {
					console.log(e);
					meter.listen();
				}
			}
		}
	}

	function recordAudio() {
			recognizer.start();
			setTimeout(function () {
				recognizer.stop();
			}, 10000);
		}
		/* ---------------- SPEECH RECOGNITION ---------------- */


	/* ---------------- SPEECH ANALYSIS ---------------- */
	function sendContentToGoogle(text) {

	}

	function textResult(result, text) {
			var positive = result.positive;
			var negative = result.negative;
			if (negative > positive) {
				meter.stopListening();
				conn.send({
					type: "problem",
					message: "help"
				});
			}

		}
		/* ---------------- SPEECH ANALYSIS ---------------- */




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

		peer.on('connection', function (connection) {
			conn = connection;
			console.log("someoneConnected");
			connection.on('open', function () {
				connection.on('data', function (data) {
					dataReceivedFunction(data);
				});
			});
		});
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
				dataReceivedFunction(data);
			});
		});
	}

	function dataReceivedFunction(data) {
		window.console.log('Received', data);
		if (data == "closeCall") {
			$("#stopCall").hide();
			$("#connect").show();
		} else if (data.type && data.type == "problem") {
			alert("problem!");
		}
	}

	function call(id) {
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
			conn.send("closeCall");
			$("#stopCall").hide();
			$("#connect").show();
		});


	}

	function onReceiveStream(stream) {
			var audio = document.getElementById('contact-audio');
			audio.src = window.URL.createObjectURL(stream);
			audio.onloadedmetadata = function () {
				$("#startCall").hide();
				$("#stopCall").show();
			};

		}
		/* ---------------- WEB RTC AUDIO CALL ---------------- */

}