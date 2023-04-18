// script

$(function (){

	// Planner event------------------------------------------------------------
	 // div 요소에 datepicker 설정
	  $("#datepickerDiv").click(function() {
		// Datepicker가 표시되어 있는지 체크
		if ($(".ui-datepicker").is(":visible")) {
		  // 표시되어 있다면 숨김
		  $("#datepickerDiv").text("달력 보기");
		  $("#datepickerUI").hide();
		} else {
		  // 표시되어 있지 않다면 표시
		  $("#datepickerDiv").text("달력 숨기기");
		  $("#datepickerUI").show();
		}

		$("#datepickerUI").datepicker({
			onSelect: function(dateText, inst) {
			  // 선택한 날짜를 input 요소에 설정
			  $("#selected-date-input").val(dateText);
			},
			dateFormat: "yy-mm-dd" // 날짜 형식 설정
		});
	  });

		// "할일 추가" 버튼 클릭 시, 모달 창 보이기
		$('#addTaskBtn').click(function() {
			$('#addTaskModal').css('display', 'flex');
		});

		// "닫기" 버튼 클릭 시, 모달 창 숨기기
		$('#closeModalBtn').click(function() {
			$('#addTaskModal').css('display', 'none');
		});

		// 할일 추가 폼 제출 시, 모달 창 숨기기
		$('#addTaskForm').submit(function(event) {
			event.preventDefault();
			$('#addTaskModal').css('display', 'none');
			// 추가할일 처리 로직 작성
		});

		$(".planner_inputArea > div > ul > li").click(function (){
			let id = $(this).attr("class");
			id = id.substr(8,id.length-1);

			let title = $(this).text();

			$("#listModal").css('display','flex');
			$("#listModal h2").text(title);
		});

		$("#listModal .confirmBtn button").click( () => {
			$("#listModal").css('display','none');
		});

		$("#listModal .editBtn").click( () => {
			$("#listModal").css('display','none');
			$("#editModal").css('display','flex');
		});

		$("#addTaskModal .editBtn").click( () => {
			$("#addTaskModal").css('display','none');
			$("#editModal").css('display','flex');
		});
		$("#addTaskModal .confirmBtn button").click(()=>{
			$("#addTaskModal").css('display','none');
		});

		$(".alarmChkBtn").click( () => {
			$("#editModal").css("display","none");
		});

		// 알람기능 -----------------------------------------------------------------
		var alarmSound = document.getElementById("alarm-sound");
	    var alarmInterval;
	    var isAlarmSet = false;

	    $("#alarm-time-display").on("click", function() {
	        if (isAlarmSet) return;

	        var alarmTime = prompt("알람 시간을 설정해주세요 (HH:mm)", "00 : 00");

	        if (alarmTime !== null && alarmTime !== "") {
	            $("#alarm-time-display").text(alarmTime);

	            if (alarmTime === "00:00" || alarmTime === "00 : 00" ) {
		            alert("알람 시간을 설정해주세요.");
		            return;
		        }

		        $("#set-alarm").prop("disabled", true);
		        $("#stop-alarm").prop("disabled", false);
		        isAlarmSet = true;

		        alarmInterval = setInterval(function() {
		            var currentTime = new Date();
		            var currentHour = currentTime.getHours();
		            var currentMinute = currentTime.getMinutes();
		            var alarmHour = parseInt(alarmTime.split(":")[0]);
		            var alarmMinute = parseInt(alarmTime.split(":")[1]);

		            if (currentHour === alarmHour && currentMinute === alarmMinute) {
		                alarmSound.play();
		                clearInterval(alarmInterval);
		                $("#set-alarm").prop("disabled", false);
		                $("#stop-alarm").prop("disabled", true);
		                isAlarmSet = false;
		            }
		        }, 1000);
	        }
	    });

		// 알람기능 -----------------------------------------------------------------
		// Planner event------------------------------------------------------------

		// Planner Write------------------------------------------------------------
		// 파일 선택 시
		$("#thumbnail").click(function() {
            $("#uploadInput").trigger("click");
        });
        $("#uploadInput").change(function() {

            var reader = new FileReader();
            reader.onload = function(e) {
                // 선택한 파일의 데이터 URL을 가져와서 이미지의 src로 설정
                $("#thumbnail").attr("src", e.target.result);
            }
            reader.readAsDataURL(this.files[0]);
        });
        // Planner Write------------------------------------------------------------


        // subFooter

        $(window).on('resize', updateSubFooterPosition);

		function updateSubFooterPosition() {
		    var subFooter = $('#subFooter');
		    if ($(window).scrollTop() + $(window).height() >= $(document).height()) {
		    	console.log($(window).height());
		    	console.log($(document.body).height());
		        // 스크롤이 없는 경우
		        subFooter.css('position', 'fixed');
		    } else {
		        // 스크롤이 있는 경우
		        console.log(123);
		        subFooter.css('position', 'sticky');
		    }
		}
		updateSubFooterPosition();

		// subFooter
});