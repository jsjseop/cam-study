const socket = io("/");
const chatInputBox = document.getElementById("chat_message");
const all_messages = document.getElementById("all_messages");
const main__chat__window = document.getElementById("main__chat__window");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const screenShare = document.getElementById("share");
document.addEventListener('contextmenu', function() {
    event.preventDefault();
});
myVideo.muted = true;

var peer = new Peer(undefined, {
    path: "/peer",
    host: "/",
    port: "443"
  });

let myVideoStream;
let shareId;
let currentUserId;
let currentUserEmail;
let currentUserNickname;
let leaveFlag = false;
let pendingMsg = 0;
let peers = {};
let peerList = [];
var getUserMedia = navigator.getUserMedia ||
                    navigator.webkitGetUserMedia ||
                    navigator.mozGetUserMedia;
navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
}).then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream, "me");

    peer.on("call", (call) => {
        call.answer(stream);
        const video = document.createElement("video");

        call.on("stream", (userVideoStream) => {
            addVideoStream(video, userVideoStream);
        });

        call.on("close", () => {
            video.remove();
        });

        peerList.push(call.peer);
        peers[call.peer] = call;
    });

    $("#shareScreen").on("click", () => {
        var peer = new Peer(undefined, {
            path: "/peer",
            host: "/",
            port: "443"
        });
        var shareVideo = document.createElement("video");
        var call = [];
        try {
          navigator.mediaDevices.getDisplayMedia({
              video: true,
              audio: true
          }).then((captureStream) => {
            addVideoStream(shareVideo, captureStream, "share");
            
            peerList.forEach(function(value, i){
                call[i] = peer.call(value, captureStream);
                
            });
            
            $('#share').on('suspend', ()=>{
                $('#share').remove();
                for(var i=0; i<call.length; i++){
                    socket.emit("share-disconnect",call[i].peer);
                    call[i].close();
                }
            });
          });
        } catch (err) {
          console.error("Error: " + err);
        }    
    })

    socket.on("user-connected", (userId) => {
        
        setTimeout(() => {
            connectToNewUser(userId, stream, currentUserNickname)
          },1000)
    });

    socket.on("user-disconnected", (userId) => {
        if(peers[userId]) peers[userId].close();
    });

    socket.on("share-disconnected", (shareId) => {
        peers[peerList[peerList.length-1]].close();
    });

    document.addEventListener("keydown", (e) => {
        if(e.which == 13 && chatInputBox.value != "") {
            socket.emit("message", {
                msg: chatInputBox.value,
                user: currentUserNickname,
            });
            chatInputBox.value = "";
        }
    });

    document.getElementById("sendMsg").addEventListener("click", (e) => {
        if(chatInputBox.value != "") {
            socket.emit("message", {
                msg: chatInputBox.value,
                user: currentUserNickname,
            });
            chatInputBox.value = "";
        }
    });

    socket.on("createMessage", (message) => {
        console.log(message);
        let li = document.createElement("li");
        if (message.user != currentUserNickname) {
            li.classList.add("otherUser");
            li.innerHTML = `<div><b>User (<small>${message.user}</small>): </b>${message.msg}</div>`;
        } else {
            li.innerHTML = `<div><b>나 : </b>${message.msg}</div>`;
        }

        all_messages.append(li);
        main__chat__window.scrollTop = main__chat__window.scrollHeight;
    });
});

$(function(){
    console.log(email);

    fetch("http://127.0.0.1:5050/cam/json/getUser/"+email)
        .then(res => res.json())
        .then(json => {
            console.log(json);
            currentUserEmail = json.email;
            currentUserNickname = json.nickname;
        });
});

peer.on("open", (id) => {
    currentUserId = id;
    socket.emit("join-room", studyNo, id);
});

socket.on("disconnect", () => {
    socket.emit("leave-room", studyNo, currentUserId);
});

const connectToNewUser = (userId, stream, currentUserNickname) => {
    var call = peer.call(userId, stream);
    var video = document.createElement("video");

    console.log("닉네임 : " + currentUserNickname);

    call.on("stream", (userVideoStream) => {
      addVideoStream(video, userVideoStream, userId);
    });

    call.on("close", () => {
        video.remove();
    });
    peerList.push(userId);
    peers[userId] = call;
};

const addVideoStream = (videoEl, stream, uId) => {
    
    videoEl.srcObject = stream;
    videoEl.id = uId;
    videoEl.addEventListener("loadedmetadata", () => {
        videoEl.play();        
    });

    videoGrid.append(videoEl);
    let totalUsers = document.getElementsByTagName("video").length;
    if (totalUsers > 1) {
      for (let index = 0; index < totalUsers; index++) {
        document.getElementsByTagName("video")[index].style.width =
          100 / totalUsers + "%";
      }
    }

    $('video').on('mousedown', (e) => {
        if(e.which === 3){
            swal("화면삭제","화면을 삭제하시겠습니까?",{
                buttons:{
                    remove: {
                        text: "삭제",
                        value: "remove",
                    },
                    cancel: "취소"
                },
            })
            .then((value)=>{
                switch(value){
                    case "remove":
                        e.target.remove();
                        break;
                }
            })
        }
    })

    var flag = false;
    $('video').on("dblclick", function(){
        if(flag == false){
            $(this).css('transform','scale(3)');
            flag = true;
        } else {
            $(this).css('transform','scale(1)');
            flag = false;
        }
        
    })
};

const playStop = () => {
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    if(enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setPlayVideo();
    }else{
        setStopVideo();
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
};

const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
      myVideoStream.getAudioTracks()[0].enabled = false;
      setUnmuteButton();
    } else {
      setMuteButton();
      myVideoStream.getAudioTracks()[0].enabled = true;
    }
};

const setPlayVideo = () => {
    const html = `<i class="unmute fa fa-pause-circle"></i>
    <span class="unmute">해제</span>`;
    document.getElementById("playPauseVideo").innerHTML = html;
};
  
const setStopVideo = () => {
    const html = `<i class=" fa fa-video-camera"></i>
    <span class="">정지</span>`;
    document.getElementById("playPauseVideo").innerHTML = html;
};
  
const setUnmuteButton = () => {
    const html = `<i class="unmute fa fa-microphone-slash"></i>
    <span class="unmute">해제</span>`;
    document.getElementById("muteButton").innerHTML = html;
};
const setMuteButton = () => {
    const html = `<i class="fa fa-microphone"></i>
    <span>음소거</span>`;
    document.getElementById("muteButton").innerHTML = html;
};

const copyRoomLink = () => {
    document.getElementById("roomLink").value = window.location.href;
};

const copyToClipboard = () => {
    var copyText = document.getElementById("roomLink");

    copyText.select();
    copyText.setSelectionRange(0, 99999);

    document.execCommand("copy");

    swal("","복사완료 : " + copyText.value,"success");
}





var list = [];

$("#memberList").on("click", () => {
    
    fetch("http://127.0.0.1:5050/cam/json/getCamStudyMemberList/"+studyNo,{
        method: "get"
    }).then(res => res.json())
    .then(json => {
        $('#tableBody').empty();
        json.forEach((el) => {
            var memberList = '<tr>'
                                +'<td>'+el.nickname+'</td>'
                                +'<td>'+el.entranceTime+'</td>'
                                +'<td>'+el.learningType+'</td>'
                                +'<td>'+el.learningTime+'</td>'
                                +'<td>'+el.totalLearningTime+'</td>'
                            +'</tr>';
            $('#tableBody').append(memberList);
        });
    });
});


$("#changeBtn").on("click", function(){
    var typeName = $("#typeName").html().trim();
    var inputType = $("#inputType").val();
    var learningtime = document.getElementById("time").innerHTML;

    if(inputType.length >= 1 && inputType.length <= 8){
        if(typeName == inputType){
            swal('공부명이 같습니다.','...','warning');
        }else{
            function updateTime(){
                return new Promise((resolve) => {
                    fetch("http://127.0.0.1:5050/cam/json/addLearningHistory/",{
                        method: "post",
                        headers: {
                        'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({email: currentUserEmail,
                                            studyNo: studyNo,
                                            learningType: typeName})
                    }).then(() => {
                        fetch("http://127.0.0.1:5050/cam/json/updateCamStudyMemberZero/",{
                            method: "post",
                            headers: {
                            'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({email: currentUserEmail,
                                                studyNo: studyNo,
                                                learningType: inputType})
                        }).catch(error => console.error("error : "+error));
                        $("#typeName").html(inputType);
                    });
                    resolve("200");
                })
            }
    
            async function changeType(){
                await stopButton();
                await updateTime();
            }
            console.log(learningtime);
            if(learningtime != '00:00:00'){
                changeType();
            }else{
                fetch("http://127.0.0.1:5050/cam/json/updateCamStudyMemberZero/",{
                    method: "post",
                    headers: {
                    'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({email: currentUserEmail,
                                        studyNo: studyNo,
                                        learningType: inputType})
                }).catch(error => console.error("error : "+error));
                $("#typeName").html(inputType);
            }
    
        }
    }else{
        swal("공부명은 8자까지 입력가능합니다.","","error");
    }

    
});

$("#leave_study").on("click", () => {
    var typeName = $("#typeName").html().trim();
    function leaveStudy(){
        return new Promise(function(resolve, reject){
            $('#stopbtn').click();
            leaveFlag = true;
            resolve();
        })
    }
    leaveStudy().then(() => {
        fetch("http://127.0.0.1:5050/selfStudy/leaveStudy/",{
            method: "post",
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({email: currentUserEmail,
                                studyNo: studyNo,
                                learningType: typeName})
        }).then(() => {
            window.close();
        });
    })
    
});

$(window).on("beforeunload", (e) => {
    if(leaveFlag == false){
        var typeName = $("#typeName").html().trim();
        function leaveStudy(){
            return new Promise(function(resolve, reject){
                $('#stopbtn').click();
                resolve();
            })
        }
        leaveStudy().then(() => {
            fetch("http://127.0.0.1:5050/selfStudy/leaveStudy/",{
                method: "post",
                headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify({email: currentUserEmail,
                                    studyNo: studyNo,
                                    learningType: typeName})
            });
        });
    }
});

$('#ogongButton').on('click', ()=>{
    fetch("http://127.0.0.1:5050/cam/json/getStudy/"+studyNo)
        .then(res => res.json())
        .then(json => {
            console.log(json);
            $('#studyName').val(json.studyName);
            $('#studyInterest').val(json.studyInterest);
            $('#maxMember').val(json.maxMember+"명");
            $('#selfStudyRule').val(json.selfStudyRule);
            $('#studyDate').val(json.studyStartDate+" ~ "+json.studyEndDate);
        });
})