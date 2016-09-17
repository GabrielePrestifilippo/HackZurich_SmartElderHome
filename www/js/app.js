/*jslint browser:true */
/*global $:false, cordova:false, ons:false, Peer:false, getAudio: false */

ons.ready(function () {
	var myNavigator = document.querySelector("#myNavigator");
	myNavigator
		.pushPage("tab1.html");

	var smartHome = new SmartHome();

	$("#connect").click(function () {
		smartHome.connect();

	});

	$("#create").click(function () {
		smartHome.create();
	});
});

var conn;

var myId;
var peer;

SmartHome.prototype.create = function () {
	var id = $('#client').find(":selected").val();
	peer = new Peer(id, {
		key: 'eff3gmdpo4t8d7vi'
	});
	peer.on('open', function (id) {
		window.console.log('My peer ID is: ' + id);
		myId = id;
	});
	peer.on('call', this.onReceiveCall);
};



SmartHome.prototype.successCallback = function () {
	window.console.log("success");
};

SmartHome.prototype.errorCallback = function (e) {
	window.console.log("error" + e);
};

SmartHome.prototype.getAudio = function (successCallback, errorCallback) {
	navigator.webkitGetUserMedia({
		audio: true,
		video: false
	}, this.successCallback, this.errorCallback);
};

SmartHome.prototype.connect = function () {
	var id = $('#server').find(":selected").val();
	conn = peer.connect(id);

	conn.on('open', function () {
		conn.on('data', function (data) {
			window.console.log('Received', data);
		});
		this.call(id);
	});
};

SmartHome.prototype.call = function (id) {

	getAudio(
		function (MediaStream) {
			var call = peer.call(id, MediaStream);
			call.on('stream', this.onReceiveStream);
		},
		function (err) {
			window.alert("error");
		}
	);
	peer.on('call', this.onReceiveCall);
};



SmartHome.prototype.onReceiveCall = function (call) {
	window.alert("incoming call");
	getAudio(
		function (MediaStream) {
			call.answer(MediaStream);
		},
		function (err) {
			window.console.log(err);
		}
	);
	call.on('stream', this.onReceiveStream);
};

SmartHome.prototype.onReceiveStream = function (stream) {
	var audio = document.getElementById('contact-audio');
	audio.src = window.URL.createObjectURL(stream);
	audio.onloadedmetadata = function () {
		window.alert("call started");
	};

};

function SmartHome() {}