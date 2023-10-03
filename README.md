# About

This is my personal project for me to practice spoken English. This project have two parts:

1. Pronunciation assessment, powered by [Microsoft Azure's Speech Studio](https://speech.microsoft.com).
2. Read aloud the given reference text and individual words, powered by macOS' built-in `say` command.

This project is derived from [Microsoft's Azure Cognitive Service Speech examples](https://github.com/Azure-Samples/Cognitive-Speech-TTS).

# Running This Project

This project requires a standard Python 3.7 or newer. macOS 13 or newer is required for the read aloud part. To install the Python dependencies, run `pip3 install -r requirements.txt`.

Some environment variables have to be set up. Refer to the section below for the required environment variables. Following is an example on how to run the backend of this app (run from inside the `src` directory):

```
export AVS_WORK_DIR=/tmp/avs
export AZURE_SUBS_KEY=xxxxyyyyy
export AZURE_REGION=australiaeast
python3 -m flask run
```

# Usage

1. Once the backend is running, open the frontend in a web browser.
2. Enter a reference word, sentence, or paragraph in the text area. You can press the **Speak** button to read aloud the entered reference text.
3. Press the **Record** button, and then read aloud the reference text from the previous step.
4. There is no automatic silence or end-of-speech detection. Press **Stop** button to stop the recording and upload the recorded voice to Azure Cognitive Speech service. After a while, your speaking scores will be shown on the bottom of the screen.
5. Once the speaking scores are shown, you can click on the individual words at the top of the scoring table to hear them.

Use macOS' settings to configure the voice used for text to speech.

# Environment Variables

## macOS Text To Speech Configurations

- `AVS_WORK_DIR`  
  **(Mandatory).** Where to store the temporary output file of the `say` command. The directory must be created first.
- `AVS_RATE`  
  **(Optional).** The words-per-minute rate of the normal speech when speaking the entire passage. Defaults to 175 wpm.
- `AVS_RATE_SLOW`  
  **(Optional).** The words-per-minute rate of the normal speech when speaking the entire passage. Defaults to 50 wpm.

## Azure Pronunciation Assessment Configurations

- `AZURE_SUBS_KEY`  
  **(Mandatory).** The API key to your Azure Speech subscription.
- `AZURE_REGION`  
  **(Mandatory).** The region of the subscription.
- `AZURE_SPEECH_LANG`  
  **(Optional).** The language to assess your pronunciation on. Defaults to `en-US`.
