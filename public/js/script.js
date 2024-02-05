var socket = io();
var videoChatForm = document.getElementById('video-chat-form');
var videoChatRooms = document.getElementById('video-chat-rooms');
var joinBtn = document.getElementById('join');
var roomInput = document.getElementById('roomName');
var userVideo = document.getElementById('user-video');
var peerVideo = document.getElementById('peer-video');

var divBtnGroup = document.getElementById('btn-group');
var muteButton = document.getElementById('muteButton');
var cameraBtn = document.getElementById('cameraBtn');
var leaveBtn = document.getElementById('leaveBtn');
var recordBtn = document.getElementById('recordBtn');
var downloadBtn = document.getElementById('downloadBtn');
var screenBtn = document.getElementById('screenBtn');

var muteFlag = false;
var hideCameraFlag = false;

var roomName = roomInput.value;
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

var creator = false;
var rtcPeerConnection;
var userStream;
let isScreenSharing = false;
var iceServers = {

  iceServers: [
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:stun.l.google.com:19302' }
  ]
}

function initializeRTC() {
  rtcPeerConnection = new RTCPeerConnection();
}

initializeRTC();

joinBtn.addEventListener('click', function () {
  if(roomInput.value == '') {
    alert('Please enter room name');
  } else {
    socket.emit('join', roomName );
  }
});

muteButton.addEventListener("click", function () {
  muteFlag = !muteFlag;
  if(muteFlag){
    userStream.getTracks()[0].enabled = false;
    muteButton.textContent = "Unmute";
  }else{
    userStream.getTracks()[0].enabled = true;
    muteButton.textContent = "Mute";
  }
});



recordBtn.addEventListener('click', () => {
  if (recordBtn.textContent === 'Start Recording') {
    startRecording();
  } else {
    stopRecording();
    recordBtn.textContent = 'Start Recording';
    downloadBtn.disabled = false;
  }
});

downloadBtn.addEventListener('click', () => {
  const blob = new Blob(recordedBlobs, {type: 'video/webm'});
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'webrtc_recorded/webm'
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);

});

cameraBtn.addEventListener('click', function () {
  hideCameraFlag = !hideCameraFlag;
  if(hideCameraFlag){
    userStream.getTracks()[1].enabled = false;
    cameraBtn.textContent = "Show Camera";
  }else{
    userStream.getTracks()[1].enabled = true;
    cameraBtn.textContent = "Hide Camera";
  }
});


screenBtn.addEventListener('click', async () => {
  try {
    if (!isScreenSharing) {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
          width: 600,
          height: 400
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      const originalAudioTrack = userStream.getTracks()[0];
      const originalVideoTrack = userStream.getTracks()[1];

      userStream.removeTrack(originalVideoTrack);
      userStream.addTrack(stream.getTracks()[0]);

      // userStream.removeTrack(originalAudioTrack);
      // userStream.addTrack(stream.getTracks()[1]);

      stream.getTracks()[0].onended = function () {
        userStream.removeTrack(stream.getTracks()[0]);
        userStream.addTrack(originalVideoTrack);
        // userStream.removeTrack(stream.getTracks()[1]);
        // userStream.addTrack(originalAudioTrack);
        isScreenSharing = false;
        screenBtn.textContent = 'Share Screen'; // Update the button text here
      };

      isScreenSharing = true;
      screenBtn.textContent = 'Stop Sharing'; // Update the button text here
    } else {
      const userVideoStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 600, height: 400 },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      const screenSharingVideoTrack = userStream.getTracks()[0];
      // const screenSharingAudioTrack = userStream.getTracks()[1];

      userStream.removeTrack(screenSharingVideoTrack);
      userStream.removeTrack(screenSharingAudioTrack);

      userStream.addTrack(userVideoStream.getTracks()[0]);
      // userStream.addTrack(userVideoStream.getTracks()[1]);

      isScreenSharing = false;
      screenBtn.textContent = 'Share Screen'; // Update the button text here
    }
  } catch (error) {
    console.error('Error starting/stopping screen sharing:', error);
  }
});


function handleDataAvailable(event) {
  if(event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function startRecording() {
  recordedBlobs = [];
  const mimeTypeOptions = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    ''
  ];

  let options = {
    mimeType: 'video/webm;codecs=vp9,opus',
  };

  for (const mimeType of mimeTypeOptions) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      options = { mimeType };
      break;
    } else {
      console.error(`MimeType ${mimeType} is not supported`);
    }
  }

  try {
    mediaRecorder = new MediaRecorder(userStream, options);
  } catch (error) {
    console.error("Media recorder error: ", error);
  }

  mediaRecorder.start();
  recordBtn.textContent = 'Stop';
  downloadBtn.disabled = true;
  mediaRecorder.ondataavailable = function (event) {
    if (event.data && event.data.size > 0) {
      recordedBlobs.push(event.data);
    }
    socket.emit('videoStream', {
      roomName: roomName,
      videoStream: event.data,
    });
  };
}


function stopRecording() {
  mediaRecorder.stop();
}

socket.on('created', function () {
  creator = true;
  navigator.getUserMedia(
    {
      video: {width: 500 , height: 500},
      audio: true
    },
    function(stream){
      userStream = stream;
      videoChatForm.style = "display: none";
      divBtnGroup.style = "display: flex";
      userVideo.srcObject = stream;
      userVideo.onloadedmetadata = function(e) {
        userVideo.play();
      }
    },
    function(error){
      alert('Something went wrong');
    }
  );
});

socket.on('joined', function () {
    creator = false;
    navigator.getUserMedia(
      {
        video: {width: 500, height: 500},
        audio: true
      },
      function(stream){
        userStream = stream;
        videoChatForm.style = "display: none";
        divBtnGroup.style = "display: flex";
        userVideo.srcObject = stream;
        userVideo.onloadedmetadata = function(e) {
          userVideo.play();
        }

        socket.emit('ready', roomName);
      },
      function(error){
        alert('Something went wrong');
      }
  );
});



socket.on('full', function () {
  alert('Room is full!');
});

socket.on('ready', function (){
  if(creator){
    rtcPeerConnection = new RTCPeerConnection();
    rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
    rtcPeerConnection.ontrack = OnTrackFunction;
    rtcPeerConnection.addTrack(userVideo.srcObject.getTracks()[0], userVideo.srcObject); // for audio track
    rtcPeerConnection.addTrack(userVideo.srcObject.getTracks()[1], userVideo.srcObject); // for video track
    rtcPeerConnection.createOffer( 
      function(offer){
        rtcPeerConnection.setLocalDescription(offer);
        socket.emit('offer', offer, roomName);
      },
      function(error){
        console.log(error);
      }
    );
  }
});



socket.on('candidate', function (candidate){
  var iceCandidate = new RTCIceCandidate(candidate);
  rtcPeerConnection.addIceCandidate(iceCandidate);
});

socket.on('offer', function (offer){
    if(!creator){
    rtcPeerConnection = new RTCPeerConnection();
    rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
    rtcPeerConnection.ontrack = OnTrackFunction;
    rtcPeerConnection.addTrack(userVideo.srcObject.getTracks()[0], userVideo.srcObject); // for audio track
    rtcPeerConnection.addTrack(userVideo.srcObject.getTracks()[1], userVideo.srcObject); // for video track
    rtcPeerConnection.setRemoteDescription(offer);
    rtcPeerConnection.createAnswer( 
      function(answer){
        rtcPeerConnection.setLocalDescription(answer);
        socket.emit('answer', answer, roomName);
      },
      function(error){
        console.log(error);
      }
    );
  }
});

socket.on('answer', function (answer){
  rtcPeerConnection.setRemoteDescription(answer);
});

function OnIceCandidateFunction(event){
  if(event.candidate){
    socket.emit('candidate', event.candidate, roomName);
  }
}

leaveBtn.addEventListener('click', function () {
  socket.emit('leave', roomName);
  videoChatForm.style = "display: block";
  videoChatRooms.style = "display: none";
  divBtnGroup.style = "display: none";

  if(userVideo.srcObject){
    userVideo.srcObject.getTracks()[0].stop();
    userVideo.srcObject.getTracks()[1].stop();
  }
  if(peerVideo.srcObject){
    peerVideo.srcObject.getTracks()[0].stop();
    peerVideo.srcObject.getTracks()[1].stop();
  }
  if(rtcPeerConnection){
    rtcPeerConnection.ontrack = null;
    rtcPeerConnection.onicecandidate = null;
    rtcPeerConnection.close();
  }
});  

socket.on('leave', function () {
  creator = true;
  
  if(peerVideo.srcObject){
    peerVideo.srcObject.getTracks()[0].stop();
    peerVideo.srcObject.getTracks()[1].stop();
  }
  if(rtcPeerConnection){
    rtcPeerConnection.ontrack = null;
    rtcPeerConnection.onicecandidate = null;
    rtcPeerConnection.close();
  }
});

function OnTrackFunction(event){
  peerVideo.srcObject = event.streams[0];
  peerVideo.onloadedmetadata = function(e) {
    peerVideo.play();
  }
}