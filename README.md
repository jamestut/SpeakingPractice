# Practice Speaking

This project utilises two parts: Azure's Speech Pronunciation Assessment for the assessment part, and macOS' built-in speech synthesizer for the "Learn Pronunciation" part.

## macOS Text To Speech Configurations

Environment variables:

- `AVS_WORK_DIR`
  **(Mandatory).** Where to store the temporary output file of the `say` command.
- `AVS_RATE`
  **(Optional).** The words-per-minute rate of the normal speech when speaking the entire passage. Defaults to 175 wpm.
- `AVS_RATE_SLOW`
  **(Optional).** The words-per-minute rate of the normal speech when speaking the entire passage. Defaults to 50 wpm.

## Azure Pronunciation Assessment Configurations

Environment variables:

- `AZURE_SUBS_KEY`  
  **(Mandatory).** The API key to your Azure Speech subscription.
- `AZURE_REGION`  
  **(Mandatory).** The region of the subscription.
- `AZURE_SPEECH_LANG`  
  **(Optional).** The language to assess your pronunciation on. Defaults to `en-US`.
