import { desktopCapturer } from 'electron';
import { RecordRTCPromisesHandler } from 'recordrtc';

export async function initRecorder() {
  const inputSources = await desktopCapturer.getSources({
    types: ['window']
  });
  const cySyncSource = inputSources.find(src => src.name === 'cySync');
  // A safety check to ensure we are reporting if we cySync window source is not visible or not accessible.
  if (!cySyncSource) throw new Error('Cannot find Cysync source');
  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: cySyncSource.id
      }
    }
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints as any);
  const recorder = new RecordRTCPromisesHandler(stream, {
    type: 'video',
    mimeType: 'video/webm;codecs=vp9'
  });
  recorder.startRecording();
  return recorder;
}

export async function stopRecorder(recorder: RecordRTCPromisesHandler) {
  await recorder.stopRecording();
  const blob = await recorder.getBlob();
  const buffer = Buffer.from(await blob.arrayBuffer());
  return buffer;
}
