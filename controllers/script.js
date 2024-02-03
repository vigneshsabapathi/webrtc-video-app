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

var roomName = roomInput.value;
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
var creator = false;
var rtcPeerConnection;
var iceServers = {
    iceServers: [
        { urls: 'stun:stun.services.mozilla.com' },
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

joinBtn.addEventListener('click', function () {
    if(roomInput.value == '') {
        alert('Please enter room name');
    } else {
        socket.emit('join', roomName);
    }
});



socket.on('created', function () {
    creator = true;
    navigator.getUserMedia(
      {
        video: {width: 600, height: 400},
        audio: true
      },
      function(stream){
        userStream = stream;
        videoChatForm.style = "display: none";
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
          video: {width: 600, height: 400},
          audio: true
        },
        function(stream){
          userStream = stream;
          videoChatForm.style = "display: none";
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
  
function OnIceCandidateFunction(event){
    if(event.candidate){
      socket.emit('candidate', event.candidate, roomName);
    }
}

function OnTrackFunction(event){
    peerVideo.srcObject = event.streams[0];
    peerVideo.onloadedmetadata = function(e) {
      peerVideo.play();
    }
}    
  
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
  