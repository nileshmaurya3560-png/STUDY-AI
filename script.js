
/* =====================================
   STUDYSPARK AI
===================================== */


/* =====================================
   API KEY
===================================== */

var apiKey = localStorage.getItem("geminiKey");

function getApiKey() {

    if (!apiKey) {

        apiKey = prompt("Enter your Gemini API Key:");

        if (apiKey && apiKey.trim() !== "") {

            apiKey = apiKey.trim();

            localStorage.setItem("geminiKey", apiKey);

        } else {

            apiKey = "";

        }

    }

    return apiKey;

}


/* =====================================
   REQUEST CONTROL
===================================== */

var isGenerating = false;

var lastRequestTime = 0;

var requestCooldown = 20000;


/* =====================================
   GENERATE AI CONTENT
===================================== */

async function generateAI(type) {

    var topic = document.getElementById("topic").value;

    var language = document.getElementById("language").value;

    var difficulty = document.getElementById("difficulty").value;

    var result = document.getElementById("result");


    /* PREVENT MULTIPLE REQUESTS */

    if (isGenerating) {

        alert("Your previous request is still processing. Please wait.");

        return;

    }


    /* CHECK COOLDOWN */

    var currentTime = Date.now();

    var timePassed = currentTime - lastRequestTime;

    if (timePassed < requestCooldown) {

        var remaining = Math.ceil(
            (requestCooldown - timePassed) / 1000
        );

        alert("Please wait " + remaining + " seconds before trying again.");

        return;

    }


    /* CHECK TOPIC */

    if (topic.trim() === "") {

        alert("Please enter your topic first!");

        return;

    }


    /* CHECK API KEY */

    var key = getApiKey();

    if (!key) {

        alert("Please enter your Gemini API key!");

        return;

    }


    /* CREATE PROMPT */

    var promptText = "";

    if (type === "summary") {

        promptText =
            "Create clear study notes with headings and important points about: " + topic;

    }

    else if (type === "quiz") {

        promptText =
            "Create 5 multiple choice questions about: " + topic +
            ". Give 4 options for each question. Include correct answers and explanations.";

    }

    else if (type === "flashcards") {

        promptText =
            "Create 5 question and answer flashcards about: " + topic;

    }

    else if (type === "explain") {

        promptText =
            "Explain this topic in very simple words with examples: " + topic;

    }


    promptText += "\nUse " + language + " language.";

    promptText += "\nDifficulty level: " + difficulty + ".";

    promptText += "\nMake the answer easy to understand and well organised.";


    /* START REQUEST */

    isGenerating = true;

    lastRequestTime = Date.now();

    result.innerText = "Generating your study material. Please wait...";


    try {

        /* GEMINI INTERACTIONS API */

        var response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/interactions",
            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json",

                    "x-goog-api-key": key

                },

                body: JSON.stringify({

                    model: "gemini-3.8-flash",

                    input: promptText

                })

            }
        );


        var data = await response.json();


        /* CHECK API ERROR */

        if (!response.ok) {

            throw new Error(
                data.error?.message || "Gemini API request failed."
            );

        }


        /* EXTRACT RESPONSE */

        var answer = "";

        if (data.outputs && Array.isArray(data.outputs)) {

            answer = data.outputs

                .filter(function (item) {

                    return item.type === "text";

                })

                .map(function (item) {

                    return item.text || "";

                })

                .join("\n");

        }

        else if (data.output_text) {

            answer = data.output_text;

        }


        if (!answer) {

            throw new Error("No AI response received. Please try again.");

        }


        /* DISPLAY RESULT */

        result.innerText = answer;

        saveHistory(topic, answer);

    }


    catch (error) {

        console.log("Gemini API Error:", error);


        var errorMessage = error.message.toLowerCase();


        if (
            errorMessage.includes("rate limit") ||
            errorMessage.includes("quota") ||
            errorMessage.includes("429")
        ) {

            result.innerText =
                "You have reached Gemini's request limit.\n\n" +
                "Please wait before trying again.";

        }

        else if (
            errorMessage.includes("high demand") ||
            errorMessage.includes("overloaded") ||
            errorMessage.includes("503") ||
            errorMessage.includes("temporarily unavailable")
        ) {

            result.innerText =
                "Gemini is currently experiencing high demand.\n\n" +
                "This is a temporary server issue. Please wait a little and try again.";

        }

        else {

            result.innerText =
                "Something went wrong!\n\n" +
                error.message +
                "\n\nPlease check your API key and try again.";

        }

    }


    finally {

        /* ALWAYS UNLOCK GENERATE REQUEST */

        isGenerating = false;

    }

}


/* =====================================
   STUDY HISTORY
===================================== */

function saveHistory(topic, answer) {

    var history = JSON.parse(localStorage.getItem("history")) || [];

    history.unshift({

        topic: topic,

        answer: answer,

        date: new Date().toLocaleString()

    });

    localStorage.setItem("history", JSON.stringify(history));

    showHistory();

}


function showHistory() {

    var history = JSON.parse(localStorage.getItem("history")) || [];

    var historyList = document.getElementById("historyList");

    document.getElementById("sessionCount").innerText = history.length;

    historyList.innerHTML = "";


    if (history.length === 0) {

        historyList.innerText = "No study sessions yet.";

        return;

    }


    for (var i = 0; i < history.length; i++) {

        var item = document.createElement("div");

        item.className = "history-item";


        var heading = document.createElement("h4");

        heading.innerText = history[i].topic;


        var date = document.createElement("p");

        date.innerText = history[i].date;


        var viewButton = document.createElement("button");

        viewButton.className = "small-button";

        viewButton.innerText = "VIEW NOTES";


        viewButton.onclick = function (answer) {

            return function () {

                document.getElementById("result").innerText = answer;

                document.getElementById("workspace").scrollIntoView();

            };

        }(history[i].answer);


        item.appendChild(heading);

        item.appendChild(date);

        item.appendChild(viewButton);

        historyList.appendChild(item);

    }

}


function clearHistory() {

    if (confirm("Do you want to clear your study history?")) {

        localStorage.removeItem("history");

        showHistory();

        updateStatistics();

    }

}


/* =====================================
   COPY RESULT
===================================== */

function copyResult() {

    var text = document.getElementById("result").innerText;

    if (!text || text === "Your AI-generated study material will appear here.") {

        alert("Nothing to copy!");

        return;

    }


    navigator.clipboard.writeText(text)

        .then(function () {

            alert("Study material copied!");

        })

        .catch(function () {

            alert("Copy failed. Try again.");

        });

}


/* =====================================
   DOWNLOAD RESULT
===================================== */

function downloadResult() {

    var text = document.getElementById("result").innerText;

    if (!text || text === "Your AI-generated study material will appear here.") {

        alert("Nothing to download!");

        return;

    }


    var file = new Blob([text], { type: "text/plain" });

    var link = document.createElement("a");

    link.href = URL.createObjectURL(file);

    link.download = "STUDYSPARK-Study-Notes.txt";

    link.click();

    URL.revokeObjectURL(link.href);

}


/* =====================================
   BOOKMARKS
===================================== */

function bookmarkResult() {

    var answer = document.getElementById("result").innerText;

    var topic = document.getElementById("topic").value;


    if (!answer || answer === "Your AI-generated study material will appear here.") {

        alert("Generate study material first!");

        return;

    }


    var bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];

    bookmarks.push({

        topic: topic,

        answer: answer

    });


    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));

    showBookmarks();

    updateStatistics();

    alert("Study material bookmarked!");

}


function showBookmarks() {

    var bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];

    var list = document.getElementById("bookmarkList");

    list.innerHTML = "";


    for (var i = 0; i < bookmarks.length; i++) {

        var item = document.createElement("div");

        item.className = "bookmark-item";


        var heading = document.createElement("h4");

        heading.innerText = bookmarks[i].topic;


        var viewButton = document.createElement("button");

        viewButton.className = "small-button";

        viewButton.innerText = "VIEW";


        viewButton.onclick = function (answer) {

            return function () {

                document.getElementById("result").innerText = answer;

                document.getElementById("workspace").scrollIntoView();

            };

        }(bookmarks[i].answer);


        var deleteButton = document.createElement("button");

        deleteButton.className = "small-button";

        deleteButton.innerText = "DELETE";


        deleteButton.onclick = function (index) {

            return function () {

                deleteBookmark(index);

            };

        }(i);


        item.appendChild(heading);

        item.appendChild(viewButton);

        item.appendChild(deleteButton);

        list.appendChild(item);

    }


    if (bookmarks.length === 0) {

        list.innerText = "No bookmarks yet.";

    }


    document.getElementById("bookmarkStat").innerText = bookmarks.length;

}


function deleteBookmark(index) {

    var bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];

    bookmarks.splice(index, 1);

    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));

    showBookmarks();

    updateStatistics();

}


/* =====================================
   QUICK NOTES
===================================== */

function saveQuickNote() {

    var note = document.getElementById("quickNoteInput").value;


    if (note.trim() === "") {

        alert("Please write something first!");

        return;

    }


    var notes = JSON.parse(localStorage.getItem("quickNotes")) || [];

    notes.push(note);

    localStorage.setItem("quickNotes", JSON.stringify(notes));

    document.getElementById("quickNoteInput").value = "";

    showQuickNotes();

    updateStatistics();

}


function showQuickNotes() {

    var notes = JSON.parse(localStorage.getItem("quickNotes")) || [];

    var list = document.getElementById("quickNoteList");

    list.innerHTML = "";


    for (var i = 0; i < notes.length; i++) {

        var item = document.createElement("div");

        item.className = "quick-note-item";


        var noteText = document.createElement("p");

        noteText.innerText = notes[i];


        var deleteButton = document.createElement("button");

        deleteButton.className = "small-button";

        deleteButton.innerText = "DELETE";


        deleteButton.onclick = function (index) {

            return function () {

                deleteQuickNote(index);

            };

        }(i);


        item.appendChild(noteText);

        item.appendChild(deleteButton);

        list.appendChild(item);

    }


    document.getElementById("quickNoteStat").innerText = notes.length;

}


function deleteQuickNote(index) {

    var notes = JSON.parse(localStorage.getItem("quickNotes")) || [];

    notes.splice(index, 1);

    localStorage.setItem("quickNotes", JSON.stringify(notes));

    showQuickNotes();

    updateStatistics();

}


/* =====================================
   DAILY GOAL
===================================== */

function saveGoal() {

    var goal = Number(document.getElementById("goalInput").value);


    if (!Number.isInteger(goal) || goal <= 0) {

        alert("Enter a valid whole number!");

        return;

    }


    localStorage.setItem("dailyGoal", goal);

    localStorage.setItem("completedSessions", 0);

    updateGoal();

}


function completeSession() {

    var goal = Number(localStorage.getItem("dailyGoal"));


    if (!goal) {

        alert("Please set your daily goal first!");

        return;

    }


    var completed = Number(localStorage.getItem("completedSessions")) || 0;


    if (completed < goal) {

        completed++;

        localStorage.setItem("completedSessions", completed);

    }


    updateGoal();

}


function updateGoal() {

    var goal = Number(localStorage.getItem("dailyGoal")) || 0;

    var completed = Number(localStorage.getItem("completedSessions")) || 0;

    var text = document.getElementById("goalText");

    var progress = document.getElementById("goalProgress");


    if (goal === 0) {

        text.innerText = "No goal set yet.";

        progress.style.width = "0%";

        return;

    }


    var percentage = Math.min((completed / goal) * 100, 100);

    text.innerText = completed + " out of " + goal + " sessions completed.";

    progress.style.width = percentage + "%";

}


/* =====================================
   DAILY MOTIVATION
===================================== */

var quotes = [

    "Small steps every day lead to big results.",

    "Your future is created by what you do today.",

    "Every expert was once a beginner.",

    "Consistency is more important than perfection.",

    "Believe in your ability to learn and grow.",

    "One page at a time, one goal at a time.",

    "Great things take time. Keep learning."

];


function newQuote() {

    var number = Math.floor(Math.random() * quotes.length);

    document.getElementById("motivationText").innerText = quotes[number];

}


/* =====================================
   STATISTICS
===================================== */

function updateStatistics() {

    var history = JSON.parse(localStorage.getItem("history")) || [];

    var bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];

    var notes = JSON.parse(localStorage.getItem("quickNotes")) || [];


    document.getElementById("sessionStat").innerText = history.length;

    document.getElementById("bookmarkStat").innerText = bookmarks.length;

    document.getElementById("quickNoteStat").innerText = notes.length;

}


/* =====================================
   DARK MODE
===================================== */

function changeTheme() {

    document.body.classList.toggle("dark-mode");

    var button = document.getElementById("themeButton");


    if (document.body.classList.contains("dark-mode")) {

        localStorage.setItem("theme", "dark");

        button.innerText = "LIGHT MODE";

    }

    else {

        localStorage.setItem("theme", "light");

        button.innerText = "DARK MODE";

    }

}


/* =====================================
   LOAD WEBSITE
===================================== */

window.addEventListener("load", function () {

    if (localStorage.getItem("theme") === "dark") {

        document.body.classList.add("dark-mode");

        document.getElementById("themeButton").innerText = "LIGHT MODE";

    }


    showHistory();

    showBookmarks();

    showQuickNotes();

    updateGoal();

    updateStatistics();

});






































