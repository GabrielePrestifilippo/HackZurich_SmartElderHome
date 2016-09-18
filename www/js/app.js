/*jslint browser:true */
/*global $:false, cordova:false, ons:false, Peer:false, DecibelMeter, SpeechRecognition */

var audioSources;
var meter;
var recognizer;
var conn;
var peer;
var listening = 0;
var audio;
var myStream;

ons.ready(function () {
    var smartHome = new SmartHome();

});

//here we define all the functionalities
function SmartHome() {

    var recording = 0;

    setTimeout(function () {
        navigator.getUserMedia = ( navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia);

        navigator.getUserMedia({audio: true, video: false},
            function (stream) {
                myStream = stream;
                listenStream();
            },
            function (e) {
                console.error(e);
            });
    }, 1000);


    function listenStream() {
        var time=0;
        audio = AudioActivity(myStream, function (level) {
            // 'level' indicates the audio activity in percentage
            if (level > 0.08 || time>=500) {
                if (!recording) {
                    stopStream();
                    recording = 1;
                    try {
                        recordAudio();
                    } catch (e) {
                        console.log(e);
                        listenStream();
                    }
                }
                time=0;
            }else {
                time++;
            }
        });
    }

    function stopStream() {
        audio.destroy();
    }




    //Initialize Speech recognition


    var transcription;


    function resultCallback(result) {
        console.log(result);
        alert(result.results[0][0].transcript);
    }

    function errorCallback(error) {
        console.log(error);
    }

    setTimeout(function() {
        recognizer = new SpeechRecognition();
        recognizer.addEventListener('result', function (event) {
            transcription = '';
            for (var i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    transcription = event.results[i][0].transcript;
                    window.console.log(transcription);
                    $("#textAlert1").html(transcription);
                    sendContentToGoogle(transcription);
                }
            }
        });
    },1000);



    //Initialize CameraInterval

    recording = 0;


    setTimeout(function () {
        setInterval(function () {
            takeBGPicture();
        }, 300000);
    }, 10000);
    //Instantiate the click handlers
    $("#choose").click(function () {
        try {
            create();
            takeBGPicture();
        } catch (e) {
            alert(e);
        }

        $("#connect").show();
        $("#choose").hide();
    });


    $("#connect").click(function () {
        connect();
        $("#startCall").show();
        $("#connect").hide();
        listening = 1;
        listenStream();
    });


    $("#startCall").click(function () {
        var id = $('#client').find(":selected").val();

        if (id == "assisted") {
            id = "responsible";
        } else {
            id = "assisted";
        }
        call(id);
    });

    //Init google API
    gapi.load('client:auth2', initAuth);

    //Then all the functions


    /* ---------------- FILE UPLOAD ---------------- */
    function uploadWin(r) {
        console.log(JSON.stringify(r));

    }

    function uploadFail(error) {
        console.log(error);
    }

    function uploadFile(fileURL) {

        var uri = encodeURI("https://api.projectoxford.ai/vision/v1.0/analyze?visualFeatures=Categories&visualFeatures=Categories");

        var options = new FileUploadOptions();
        options.fileKey = "file";
        options.fileName = fileURL.substr(fileURL.lastIndexOf('/') + 1);

        var headers = {
            'Content-Type': 'application/octet-stream',
            'Ocp-Apim-Subscription-Key': '3485130e262d4df4a7cbfbe20a86063b'
        };

        options.headers = headers;

        var ft = new FileTransfer();

        ft.upload(fileURL, uri, uploadWin, uploadFail, options);
    }

    /* ---------------- FILE UPLOAD ---------------- */

    /* ---------------- GOOGLE API INIT  ---------------- */

    function initAuth() {
        var apiKey = 'AIzaSyAGoWENeFstmqV3o4ihA18jhf0sfp3X8Iw';
        var clientId = '665862262458-71rfcge7vatvju4ce0hkat8f0ovrn1g5.apps.googleusercontent.com';
        var scopes = 'https://www.googleapis.com/auth/prediction';
        window.console.log("initAuth");
        gapi.client.setApiKey(apiKey);

        gapi.auth2.init({
            client_id: clientId,
            scope: scopes,
            cookiepolicy: 'none'
        }).then(function () {
            window.console.log("init was done");
        });


        function auth() {
            gapi.auth2.getAuthInstance().signIn().then(function () {
                myCallGoogle();
            });
        }

        var signinButton = document.getElementById('signin-button')
        signinButton.addEventListener("click", auth);
        $("#signinButton").click();

    }

    function myCallGoogle() {
        function writeResponse(resp) {
            window.console.log("response", resp);
        }

        var input = {
            "input": {
                "csvInstance": [
                    "I'm so glad"
                ]
            }
        };
        var restRequest = gapi.client.request({
            'path': 'prediction/v1.6/projects/sentiment-zurich/trainedmodels/sentiment-zurich/predict',
            'params': {xxxkey: apiKey},
            'method': 'POST',
            'body': input
        });
        restRequest.execute(writeResponse);

    }

    /* ---------------- GOOGLE API INIT  ---------------- */

    /* ---------------- CAMERA PICTURE ---------------- */
    function takeBGPicture() {

        var options = {
            name: "Image1",
            dirName: "CameraPictureBackground",
            orientation: "portrait",
            type: "back"
        };

        try {
            window.plugins.CameraPictureBackground.takePicture(successCamera, errorCamera, options);
        } catch (e) {
            console.log(e);
        }
        function successCamera(imgurl) {
            uploadFile(imgurl);
        }

        function errorCamera(imgurl) {
            console.log("Imgurl = " + imgurl);
        }

    }

    /* ---------------- CAMERA PICTURE ---------------- */


    /* ---------------- SPEECH RECOGNITION ---------------- */

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
            stopStream();
            conn.send({
                type: "problem",
                message: "help"
            });
        }

    }

    /* ---------------- SPEECH ANALYSIS ---------------- */


    /* ---------------- WEB RTC AUDIO CALL ---------------- */
    function create() {
        var id = $('#client').find(":selected").val();

        // var peer = new Peer(id, {　host:'peerjshackzurich.herokuapp.com', port:9000, key:'peerjs'});


        peer = new Peer(id, {
            key: 'eff3gmdpo4t8d7vi'
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

    function connect() {
        var id = $('#client').find(":selected").val();
        if (id == "assisted") {
            id = "responsible";
        } else {
            id = "assisted";
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
            $("textAlert").html(data.message);

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


