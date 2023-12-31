
var accuracyscore = document.getElementById('accuracyscore');
var fluencyscore = document.getElementById('fluencyscore');
var completenessscore = document.getElementById('completenessscore');
var pronscore = document.getElementById('pronscore');
var wordsomitted = document.getElementById('wordsomitted');
var wordsinserted = document.getElementById('wordsinserted');
var omittedwords = "";
var insertedwords = "";
wordsinserted.style.display = "none";
document.getElementById("wih").style.display = "none";

var wordrow = document.getElementById('wordrow');
var phonemerow = document.getElementById('phonemerow');
var scorerow = document.getElementById('scorerow');

var reftext = document.getElementById('reftext');
var formcontainer = document.getElementById('formcontainer');
var hbutton = document.getElementById('buttonhear');
var recordingsList = document.getElementById('recordingsList');
var ttsList = document.getElementById('ttsList');
var reftextAudio = document.getElementById('reftextAudio');
var wordAudio = document.createElement('audio');
var objectUrlMain;
var wordaudiourls = new Array;

var phthreshold1 = 80;
var phthreshold2 = 60;
var phthreshold3 = 40;
var phthreshold4 = 20;

var AudioContext = window.AudioContext || window.webkitAudioContext;;
var audioContent;
var start = false;
var permission = false;
var reftextvalPrevious;
var gumStream; 						//stream from getUserMedia()
var rec; 							//Recorder.js object
var audioStream; 					//MediaStreamAudioSourceNode we'll be recording
var blobpronun;
var tflag = true;
var wordlist;

var t0 = 0;
var t1;
var at;

window.onload = () => {
    if (tflag) {
        tflag = gettoken();
        tflag = false;
    }

};

function gettoken() {
    var request = new XMLHttpRequest();
    request.open('POST', '/gettoken', true);

    // Callback function for when request completes
    request.onload = () => {
        // Extract JSON data from request
        const data = JSON.parse(request.responseText);
        at = data.at;
    }

    //send request
    request.send();
    return false;
}

function playwordind(word) {
    var request = new XMLHttpRequest();
    request.open('POST', '/getttsforword', true);
    request.responseType = "blob";

    request.onload = () => {
        var blobpronun = request.response;
        var objectUrl = URL.createObjectURL(blobpronun);

        wordAudio.src = objectUrl;
        wordAudio.play();
    }

    const dat = new FormData();
    dat.append("word", word);

    request.send(dat);
}

function handleWordClick() {
    let word = this.querySelector("span.wordcontent").innerText;
    playwordind(word);
}

var soundAllowed = function (stream) {
    permission = true;
    audioContent = new AudioContext();
    gumStream = stream;
    audioStream = audioContent.createMediaStreamSource(stream);
    rec = new Recorder(audioStream, { numChannels: 1 })

    //start the recording process
    rec.record()
}

var soundNotAllowed = function (error) {
    h.innerHTML = "You must allow your microphone.";
    console.log(error);
}

//function for onclick of hear pronunciation button
hbutton.onclick = function () {
    let reftextvalCurrent = reftext.value.trim();
    if ((reftextvalPrevious == reftextvalCurrent) && objectUrlMain) {
        // audio already exists
        reftextAudio.currentTime = 0;
        reftextAudio.play();
        return;
    }

    document.getElementById("ttsloader").style.display = "block";

    var request = new XMLHttpRequest();
    request.open('POST', '/gettts', true);
    request.responseType = "blob";

    // Callback function for when request completes
    request.onload = () => {
        reftextvalPrevious = reftextvalCurrent;
        var blobpronun = request.response;
        objectUrlMain = URL.createObjectURL(blobpronun);
        reftextAudio.src = objectUrlMain;
        reftextAudio.play();
        document.getElementById("ttsloader").style.display = "none";
    }
    const dat = new FormData();
    dat.append("reftext", reftextvalCurrent);

    //send request
    objectUrlMain = undefined;
    request.send(dat);

    return false;
}

function getttsforword(word) {
    var request = new XMLHttpRequest();
    request.open('POST', '/getttsforword', true);
    request.responseType = "blob";

    // Callback function for when request completes
    request.onload = () => {
        var blobpronun = request.response;
        var objectUrl = URL.createObjectURL(blobpronun);
        wordaudiourls.push({ word, objectUrl });
    }
    const dat = new FormData();
    dat.append("word", word);

    //send request
    request.send(dat);
}

//function for handling main button clicks
document.getElementById('buttonmic').onclick = function () {

    if (reftext.value.length == 0) {
        alert("Reference Text cannot be empty!");
    }
    else {
        if (start) {
            start = false;
            rec.stop();

            // UI changes
            reftext.readonly = false;
            reftext.disabled = false;
            this.innerHTML = "Record";
            this.className = "green-button";

            //stop microphone access
            gumStream.getAudioTracks()[0].stop();

            //create the wav blob and pass it on to createDownloadLink
            rec.exportWAV(createDownloadLink);
        }
        else {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(soundAllowed)
                .catch(soundNotAllowed);

            start = true;

            document.getElementById("metrics").style.display = "block";

            // UI changes
            reftext.readonly = true;
            reftext.disabled = true;
            this.innerHTML = "Stop";
            this.className = "red-button";

            reftextval = reftext.value;
        }
    }
};


function fillDetails(words) {
    function createWordSpan(word) {
        let ret = document.createElement('span');
        ret.className = 'wordcontent';
        ret.innerText = word;
        return ret;
    }

    for (let wi in words) {
        let w = words[wi];
        let countp = 0;

        if (w.ErrorType == "Omission") {
            omittedwords += w.Word;
            omittedwords += ', ';

            let tdda = document.createElement('td');
            tdda.innerText = '-';
            tdda.style.backgroundColor = "orange";
            phonemerow.appendChild(tdda);

            let tddb = document.createElement('td');
            tddb.innerText = '-';
            scorerow.appendChild(tddb);

            let tdw = document.createElement('td');
            tdw.appendChild(createWordSpan(w.Word));
            tdw.style.backgroundColor = "orange";
            tdw.style.cursor = "pointer";
            tdw.onclick = handleWordClick;
            wordrow.appendChild(tdw);
        }
        else if (w.ErrorType == "Insertion") {
            insertedwords += w.Word;
            insertedwords += ', ';
        }
        else if (w.ErrorType == "None" || w.ErrorType == "Mispronunciation") {
            for (let phonei in w.Phonemes) {
                var p = w.Phonemes[phonei]

                let tdp = document.createElement('td');
                tdp.innerText = p.Phoneme;
                if (p.AccuracyScore >= phthreshold1) {
                    tdp.style.backgroundColor = "green";
                }
                else if (p.AccuracyScore >= phthreshold2) {
                    tdp.style.backgroundColor = "lightgreen";
                }
                else if (p.AccuracyScore >= phthreshold3) {
                    tdp.style.backgroundColor = "yellow";
                }
                else {
                    tdp.style.backgroundColor = "red";
                }
                phonemerow.appendChild(tdp);

                let tds = document.createElement('td');
                tds.innerText = p.AccuracyScore;
                scorerow.appendChild(tds);
                countp = Number(phonei) + 1;
            }
            let tdw = document.createElement('td');
            tdw.appendChild(createWordSpan(w.Word));
            tdw.onclick = handleWordClick;
            let x = document.createElement("SUP");
            let t = document.createTextNode(w.AccuracyScore);
            x.appendChild(t);
            tdw.appendChild(x);
            tdw.colSpan = countp;
            if (w.ErrorType == "None") {
                tdw.style.backgroundColor = "lightgreen";
            }
            else {
                tdw.style.backgroundColor = "red";
            }
            tdw.style.cursor = "pointer";
            wordrow.appendChild(tdw);
        }

    }
}

function fillData(data) {

    document.getElementById("summarytable").style.display = "flex";
    accuracyscore.innerText = data.AccuracyScore;
    fluencyscore.innerText = data.FluencyScore;
    completenessscore.innerText = data.CompletenessScore;
    pronscore.innerText = parseInt(data.PronScore, 10);

    fillDetails(data.Words);
    wordsomitted.innerText = omittedwords;
    if (insertedwords != "") {
        document.getElementById("wih").style.display = "block";
        wordsinserted.style.display = "block";
        wordsinserted.innerText = insertedwords;
    }

    document.getElementById("footeralert").style.display = "block";
}

function createDownloadLink(blob) {

    document.getElementById("recordloader").style.display = "block";

    var url = URL.createObjectURL(blob);
    var au = document.createElement('audio');
    var li = document.createElement('p');
    var link = document.createElement('a');

    //name of .wav file to use during upload and download (without extendion)
    var filename = new Date().toISOString();

    //add controls to the <audio> element
    au.controls = true;
    au.src = url;

    //add the new audio element to li
    li.appendChild(au);

    //add the li element to the ol
    recordingsList.innerHTML = '';
    recordingsList.appendChild(li);

    var request = new XMLHttpRequest();
    request.open('POST', '/ackaud', true);

    // Callback function for when request completes
    request.onload = () => {
        // Extract JSON data from request

        const data = JSON.parse(request.responseText);

        if (data.RecognitionStatus == "Success") {
            wordrow.innerHTML = phonemerow.innerHTML = scorerow.innerHTML = '';
            omittedwords = insertedwords = '';
            wordsomitted.innerHTML = wordsinserted.innerHTML = '';
            fillData(data.NBest[0]);
            document.getElementById("recordloader").style.display = "none";
            document.getElementById("metrics").style.display = "block";
        }
        else {
            alert("Did not catch audio properly! Please try again.");
            console.log("Server returned: Error");
            console.log(data.RecognitionStatus);
        }
    }
    // Add data to send with request
    const data = new FormData();
    data.append("audio_data", blob, filename);
    data.append("reftext", reftextval);

    //send request
    request.send(data);

    return false;
}
