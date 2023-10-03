import requests
import base64
import os
import subprocess
import json

from flask import Flask, jsonify, render_template, request, make_response

app = Flask(__name__)

language = os.environ.get('AZURE_SPEECH_LANG') or "en-US"
subscription_key = os.environ['AZURE_SUBS_KEY']
region = os.environ['AZURE_REGION']
avs_work_dir = os.environ['AVS_WORK_DIR']
avs_rate = int(os.environ.get('AVS_RATE', '175'))
avs_rate_slow = int(os.environ.get('AVS_RATE_SLOW', '50'))

# AVSpeech caching
# value: (slow mode, text data)
# key: hash of the value
avs_cache = {}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/gettoken", methods=["POST"])
def gettoken():
    fetch_token_url = 'https://%s.api.cognitive.microsoft.com/sts/v1.0/issueToken' %region
    headers = {
        'Ocp-Apim-Subscription-Key': subscription_key
    }
    response = requests.post(fetch_token_url, headers=headers)
    access_token = response.text
    return jsonify({"at":access_token})

@app.route("/ackaud", methods=["POST"])
def ackaud():
    f = request.files['audio_data']
    reftext = request.form.get("reftext")
    #    f.save(audio)
    #print('file uploaded successfully')

    # a generator which reads audio data chunk by chunk
    # the audio_source can be any audio input stream which provides read() method, e.g. audio file, microphone, memory stream, etc.
    def get_chunk(audio_source, chunk_size=1024):
        while True:
            #time.sleep(chunk_size / 32000) # to simulate human speaking rate
            chunk = audio_source.read(chunk_size)
            if not chunk:
                #global uploadFinishTime
                #uploadFinishTime = time.time()
                break
            yield chunk

    # build pronunciation assessment parameters
    referenceText = reftext
    pronAssessmentParamsJson = json.dumps(
        {
            "ReferenceText": referenceText,
            "GradingSystem": "HundredMark",
            "Dimension": "Comprehensive",
            "EnableMiscue": True
        }
    )
    pronAssessmentParamsBase64 = base64.b64encode(bytes(pronAssessmentParamsJson, 'utf-8'))
    pronAssessmentParams = str(pronAssessmentParamsBase64, "utf-8")

    # build request
    url = "https://%s.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=%s&usePipelineVersion=0" % (region, language)
    headers = { 'Accept': 'application/json;text/xml',
                'Connection': 'Keep-Alive',
                'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
                'Ocp-Apim-Subscription-Key': subscription_key,
                'Pronunciation-Assessment': pronAssessmentParams,
                'Transfer-Encoding': 'chunked',
                'Expect': '100-continue' }

    #audioFile = open('audio.wav', 'rb')
    audioFile = f
    # send request with chunked data
    response = requests.post(url=url, data=get_chunk(audioFile), headers=headers)
    #getResponseTime = time.time()
    audioFile.close()

    #latency = getResponseTime - uploadFinishTime
    #print("Latency = %sms" % int(latency * 1000))

    return response.json()

def _mac_tts(text, slow):
    '''
    Returns m4a audio file if successful, or None if failed
    '''
    rate = avs_rate_slow if slow else avs_rate
    cache_key = (slow, text)
    cache_key_hash = hash(cache_key)
    filename = str(cache_key_hash) if cache_key_hash >= 0 else f'm{cache_key_hash * -1}'
    filename = f'{filename}.m4a'
    filepath = os.path.join(avs_work_dir, filename)

    regen = cache_key_hash not in avs_cache or avs_cache[cache_key_hash] != cache_key
    if regen:
        avs_cache[cache_key_hash] = cache_key
        subprocess.run(['say', '-r', str(rate), '-o', filepath, text], check=True)

    with open(filepath, 'rb') as f:
        data = f.read()

    return data

def _get_tts(text, for_word):
    audio_data = _mac_tts(text, for_word)
    response = make_response(audio_data)
    response.headers['Content-Type'] = 'audio/mp4'
    response.headers['Content-Disposition'] = 'attachment; filename=audio.m4a'
    return response

@app.route("/gettts", methods=["POST"])
def gettts():
    reftext = request.form.get("reftext")
    return _get_tts(reftext, False)

@app.route("/getttsforword", methods=["POST"])
def getttsforword():
    word = request.form.get("word")
    return _get_tts(word, True)
