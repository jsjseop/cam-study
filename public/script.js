const socket = io("/");
const chatInputBox = document.getElementById("chat_message");
const all_messages = document.getElementById("all_messages");
const main__chat__window = document.getElementById("main__chat__window");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = false;

var peer = new Peer(undefined, {
    path: "/peer",
    host: "/",
    port: "443"
  });

let myVideoStream;
let currentUserId;
let currentUserEmail;
let currentUserNickname;
let leaveFlag = false;
let pendingMsg = 0;
let peers = {};
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
            console.log(peers);
        });

    });

    socket.on("user-connected", (userId) => {
        setTimeout(() => {
            connectToNewUser(userId, stream)
          },1000)
    });

    socket.on("user-disconnected", (userId) => {
        if(peers[userId]) peers[userId].close();
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

const connectToNewUser = (userId, stream) => {
    var call = peer.call(userId, stream);
    console.log("call : " + call);
    var video = document.createElement("video");

    call.on("stream", (userVideoStream) => {
      console.log("stream : " + userVideoStream);
      addVideoStream(video, userVideoStream, userId);
    });

    call.on("close", () => {
        video.remove();
    });
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

    toastr.success("복사완료 : " + copyText.value);
}


const shareScreen = async ()=> {
    let captureStream= null;
    try {
      navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
      }),then(stream => {
          addVideoStream(cu)
      })
    } catch (err) {
      console.error("Error: " + err);
    }
    //connectToNewUser(currentUserId, captureStream);
    peer.call(currentUserId, captureStream);
};


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
            toastr.warning('공부명이 같습니다.');
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
        toastr.error("공부명은 8자까지 입력가능합니다.")
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

if(leaveFlag == false){
    $(window).on("beforeunload", (e) => {
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
    });
}


// const ShowChat = (e) => {
//     e.classList.toggle("active");
//     document.body.classList.toggle("showChat");
// };
