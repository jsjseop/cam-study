var time = 0;
var starFlag = true;
var timer;
var learningTime;
$(document).ready(function(){
  buttonEvt();
});

function init(){
  document.getElementById("time").innerHTML = "00:00:00";
}

function stopButton(){
  if(time != 0){
    $(".btnBox .fa").css("color","#fff");
    $("#stopbtn").css("color", "#fff");
    clearInterval(timer);
    console.log(document.getElementById("time").innerHTML);
    learningTime = document.getElementById("time").innerHTML;

    starFlag = true;
    time = 0;
    init();

    return fetch("http://127.0.0.1:5050/cam/json/updateCamStudyMember/",{
      method: "post",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({email: currentUserEmail,
                            studyNo: studyNo,
                            learningTime: learningTime})
    }).catch(error => console.error("error : "+error));
  }
  
}

function buttonEvt(){
  var hour = 0;
  var min = 0;
  var sec = 0;

  // 시작 버튼
  $("#startbtn").click(function(){
    if(starFlag){
      $(".btnBox .fa").css("color","#FAED7D")
      this.style.color = "#4C4C4C";
      starFlag = false;

      if(time == 0){
        init();
      }

      timer = setInterval(function(){
        time++;

        min = Math.floor(time/60);
        hour = Math.floor(min/60);
        sec = time%60;
        min = min%60;

        var th = hour;
        var tm = min;
        var ts = sec;
        if(th<10){
        th = "0" + hour;
        }
        if(tm < 10){
        tm = "0" + min;
        }
        if(ts < 10){
        ts = "0" + sec;
        }

        document.getElementById("time").innerHTML = th + ":" + tm + ":" + ts;
      }, 1000);
    }
  });

  // 일지정지 버튼
  $("#pausebtn").click(function(){
    if(time != 0){
      $(".btnBox .fa").css("color","#FAED7D")
      this.style.color = "#4C4C4C";
      clearInterval(timer);
      starFlag = true;
    }
  });

  // 정지 버튼
  $("#stopbtn").click(function(){
    stopButton();
  });
}