const timerLabel = document.getElementById("app__timer-label")
const startBtn = document.getElementById("app__timer-start")

// @Sotiris Kiritsis from https://stackoverflow.com/questions/31559469/how-to-create-a-simple-javascript-timer
function startTimer(duration, display) {
    var timer = duration, minutes, seconds;
    setInterval(function () {
        minutes = parseInt(timer / 60, 10)
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            timer = 0;
            // timer = duration; // uncomment this line to reset timer automatically after reaching 0
        }
    }, 1000);
}

startBtn.addEventListener("click", (e) => {
    startTimer(25 * 60 - 1, timerLabel)
})