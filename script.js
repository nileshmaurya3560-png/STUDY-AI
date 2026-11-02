
var topic = document.getElementById("topic");
var result = document.getElementById("result");

// API KEY is created by using google gemini-2.5-flash model. You can create your own API key from Google Cloud Console and enable Gemini API for your project.
var apiKey = localStorage.getItem("geminiKey");

if (apiKey == null) {
    apiKey = prompt("Enter Gemini API Key");

    if (apiKey != null && apiKey != "") {
        localStorage.setItem("geminiKey", apiKey);
    }
}

// AI GENERATOR
function generateAI(type) {

    var notes = topic.value;

    if (notes == "") {
        alert("Please enter your notes!");
        return;
    }

    if (apiKey == null || apiKey == "") {
        alert("API Key is required!");
        return;
    }

    var question = "";

    if (type == "summary") {
        question = "Make simple study notes from: ";
    }
    else if (type == "quiz") {
        question = "Create 5 MCQ questions from: ";
    }
    else if (type == "flashcards") {
        question = "Create 5 flashcards from: ";
    }
    else if (type == "explain") {
        question = "Explain this topic in 3 simple ways: ";
    }
    else if (type == "exam") {
        question = "Create a practice exam paper from: ";
    }
    else if (type == "mindmap") {
        question = "Create a simple text mind map from: ";
    }

    result.innerHTML = "Please wait...";

    fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: question + notes
                    }]
                }]
            })
        }
    )

    .then(function(response) {
        return response.json();
    })

    .then(function(data) {

        if (data.candidates) {

            var answer = data.candidates[0].content.parts[0].text;

            result.innerHTML = answer;

            localStorage.setItem("lastNotes", answer);

            saveHistory(type, answer);

        }
        else {
            result.innerHTML = "Something went wrong!";
        }

    })

    .catch(function() {
        result.innerHTML = "Check your internet or API key!";
    });
}

// COPY NOTES
function copyResult() {

    var text = result.innerText;

    navigator.clipboard.writeText(text);

    alert("Notes copied!");
}

// DOWNLOAD NOTES
function downloadResult() {

    var text = result.innerText;

    var file = new Blob([text], {
        type: "text/plain"
    });

    var link = document.createElement("a");

    link.href = URL.createObjectURL(file);
    link.download = "StudySpark-Notes.txt";
    link.click();

    URL.revokeObjectURL(link.href);
}

// BOOKMARK
function bookmarkResult() {

    var text = result.innerText;

    localStorage.setItem("bookmark", text);

    alert("Bookmark saved!");
}

// HISTORY
function saveHistory(type, text) {

    var history = JSON.parse(
        localStorage.getItem("history") || "[]"
    );

    history.push(type + ": " + text);

    localStorage.setItem(
        "history",
        JSON.stringify(history)
    );

    showHistory();
}

function showHistory() {

    var history = JSON.parse(
        localStorage.getItem("history") || "[]"
    );

    var list = document.getElementById("historyList");

    list.innerHTML = "";

    for (var i = 0; i < history.length; i++) {

        var p = document.createElement("p");

        p.textContent = history[i];

        list.appendChild(p);
    }
}

function clearHistory() {

    localStorage.removeItem("history");

    showHistory();
}

// MISTAKE NOTEBOOK
function saveMistake() {

    var mistake = document.getElementById("mistakeInput").value;

    if (mistake == "") {
        alert("Enter your mistake!");
        return;
    }

    var mistakes = JSON.parse(
        localStorage.getItem("mistakes") || "[]"
    );

    mistakes.push(mistake);

    localStorage.setItem("mistakes", JSON.stringify(mistakes));

    showMistakes();
}

function showMistakes() {

    var mistakes = JSON.parse(
        localStorage.getItem("mistakes") || "[]"
    );

    var list = document.getElementById("mistakeList");

    list.innerHTML = "";

    for (var i = 0; i < mistakes.length; i++) {

        var p = document.createElement("p");

        p.textContent = mistakes[i];

        list.appendChild(p);
    }
}

// STUDY GOAL
function saveGoal() {

    var goal = document.getElementById("goalInput").value;

    if (goal <= 0) {
        alert("Enter a valid goal!");
        return;
    }

    localStorage.setItem("goal", goal);

    document.getElementById("goalDisplay").innerText =
        "Daily goal: " + goal + " minutes";
}

function updateProgress() {

    var goal = localStorage.getItem("goal");

    var done = document.getElementById("completedInput").value;

    if (goal == null) {
        alert("Set your goal first!");
        return;
    }

    var percent = (done / goal) * 100;

    if (percent > 100) {
        percent = 100;
    }

    if (percent < 0) {
        percent = 0;
    }

    document.getElementById("progressFill").style.width =
        percent + "%";

    document.getElementById("progressText").innerText =
        Math.round(percent) + "% completed";
}

// VOICE NOTES
function startVoice() {

    var voice = new webkitSpeechRecognition();

    voice.lang = "en-IN";

    voice.onresult = function(event) {

        var text = event.results[0][0].transcript;

        topic.value = topic.value + " " + text;
    };

    voice.start();
}

// TEXT FILE IMPORT
function readFile() {

    var file = document.getElementById("fileInput").files[0];

    if (!file) {
        alert("Select a file first!");
        return;
    }

    var reader = new FileReader();

    reader.onload = function() {
        topic.value = reader.result;
    };

    if (file.type == "text/plain") {
        reader.readAsText(file);
    }
    else {
        alert("Currently only TXT files are supported.");
    }
}

// DARK MODE
function changeTheme() {

    document.body.classList.toggle("dark");
}

// LOAD SAVED DATA
function loadData() {

    showHistory();
    showMistakes();

    var goal = localStorage.getItem("goal");

    if (goal != null) {
        document.getElementById("goalDisplay").innerText =
            "Daily goal: " + goal + " minutes";
    }
}

loadData();
