/**
 * Rage IDE - Frustration-Proof Code Editor
 * Pure browser implementation using Web Audio API & Web Speech API
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const editor = document.getElementById('editor');
  const lineNumbers = document.getElementById('lineNumbers');
  const startAudioBtn = document.getElementById('startAudioBtn');
  const blackoutCountDisplay = document.getElementById('blackoutCount');
  const micStatusText = document.getElementById('micStatusText');
  const volumeMeterFill = document.getElementById('volumeMeterFill');
  const volumeValue = document.getElementById('volumeValue');
  const sensitivitySlider = document.getElementById('sensitivitySlider');
  const sensitivityValue = document.getElementById('sensitivityValue');

  // Overlay Elements
  const blackout = document.getElementById('blackout');
  const alertCard = document.getElementById('alertCard');
  const statusBadge = document.getElementById('statusBadge');
  const alertTitle = document.getElementById('alertTitle');
  const alertBody = document.getElementById('alertBody');
  const blackoutVolumeFill = document.getElementById('blackoutVolumeFill');
  const blackoutVolumeValue = document.getElementById('blackoutVolumeValue');

  // State Variables
  let blackoutCount = 0;
  let currentVolume = 0;
  let sensitivity = parseInt(sensitivitySlider.value, 10);
  let isBlackedOut = false;
  
  // Audio & Speech Contexts
  let audioCtx = null;
  let analyser = null;
  let speechRecognition = null;
  let isListeningSpeech = false;

  // Passive-Aggressive Hackathon Messages
  const PASSIVE_AGGRESSIVE_MESSAGES = [
    "YOUR RAGE IS UNACCEPTABLE! Screaming at code has never solved a syntax error in human history.",
    "COMPUTER SAYS NO. Take a deep breath, count to 10, and apologize nicely to your laptop.",
    "EXCESSIVE DECIBELS DETECTED! Violence against keyboards and monitors will not be tolerated.",
    "WHOA THERE, REFACTOR RAGE! Lower your tone before your code gets deleted permanently.",
    "ANGER ISSUES DETECTED. The JavaScript compiler is sensitive. Please say 'sorry' softly.",
    "DEVOPS SAYS CALM DOWN. Your frustration level has exceeded maximum hackathon safety limits.",
    "EMOTIONAL DAMAGE! Screaming won't fix your null pointer exception.",
    "KEEP IT DOWN! Stack Overflow didn't hurt you, your algorithm logic did.",
    "SERVERS ARE CRYING. Lower your voice and whisper your sincere apology to unlock."
  ];

  // Starter Sample Code in Editor
  editor.value = `// ------------------------------------------------------------
// HACKATHON RAGE IDE - DEMO SCRIPT
// ------------------------------------------------------------
// 1. Click "Start Mic Monitor" at the top right.
// 2. Try shouting, clapping, or yelling into your microphone.
// 3. Watch Blackout Mode lock the screen!
// 4. Softly whisper "sorry" (Volume <= 20) to recover control.

function debugFrustratingBug(attempts, coffeeCups) {
  if (attempts > 100 && coffeeCups === 0) {
    throw new Error("RAGE_QUIT_IMMOBILIZED");
  }
  
  console.log("Keep calm and keep coding!");
  return "Hackathon Project Complete";
}

debugFrustratingBug(101, 0);`;

  // Dynamic Line Numbers Updater
  function updateLineNumbers() {
    const lines = editor.value.split('\n').length;
    let lineNumbersHtml = '';
    for (let i = 1; i <= Math.max(lines, 1); i++) {
      lineNumbersHtml += i + '<br>';
    }
    lineNumbers.innerHTML = lineNumbersHtml;
  }

  // Synchronize Scroll & Line Numbers
  editor.addEventListener('input', updateLineNumbers);
  editor.addEventListener('scroll', () => {
    lineNumbers.scrollTop = editor.scrollTop;
  });
  updateLineNumbers();

  // Allow Tab Key Indentation
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
      editor.selectionStart = editor.selectionEnd = start + 2;
      updateLineNumbers();
    }
  });

  // Sensitivity Slider Listener
  sensitivitySlider.addEventListener('input', (e) => {
    sensitivity = parseInt(e.target.value, 10);
    sensitivityValue.textContent = sensitivity;
  });

  // 1. BACKGROUND MIC TRACKING (Web Audio API)
  startAudioBtn.addEventListener('click', initAudioStream);

  async function initAudioStream() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      micStatusText.textContent = 'Active 🎤';
      startAudioBtn.textContent = 'Mic Active';
      startAudioBtn.classList.add('active');
      startAudioBtn.disabled = true;

      // Start continuous audio level processing
      processAudio();

      // Initialize Speech Recognition Engine for Forgiveness
      initSpeechRecognition();
    } catch (err) {
      console.error('Microphone access denied or error:', err);
      micStatusText.textContent = 'Denied / Error';
      alert('Microphone access is required for Rage IDE to monitor frustration level!');
    }
  }

  function processAudio() {
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    // Scaled volume 0 to 100
    currentVolume = Math.min(100, Math.round((average / 100) * 100));

    // Update Status Bar Live Meter
    volumeMeterFill.style.width = currentVolume + '%';
    volumeValue.textContent = currentVolume;

    // Update Blackout Whisper Meter if active
    if (blackoutVolumeFill) {
      blackoutVolumeFill.style.width = currentVolume + '%';
      blackoutVolumeValue.textContent = currentVolume;
      blackoutVolumeFill.style.background = currentVolume > 20 ? '#ff4444' : '#00C851';
    }

    // Color feedback on status bar meter
    if (currentVolume > sensitivity) {
      volumeMeterFill.style.background = '#ff4444';
    } else if (currentVolume > 20) {
      volumeMeterFill.style.background = '#ffbb33';
    } else {
      volumeMeterFill.style.background = '#00C851';
    }

    // 2. BLACKOUT MECHANISM: Check Volume Spike
    if (!isBlackedOut && currentVolume > sensitivity) {
      triggerBlackout();
    }

    requestAnimationFrame(processAudio);
  }

  // Trigger Blackout Mode
  function triggerBlackout() {
    isBlackedOut = true;
    blackoutCount++;
    blackoutCountDisplay.textContent = blackoutCount;

    // Change blackout screen overlay style to flex
    blackout.style.display = 'flex';
    blackout.classList.add('active');

    // Disable editor area so user cannot type
    editor.disabled = true;
    editor.blur();

    // Pick random passive-aggressive message
    const randomMsg = PASSIVE_AGGRESSIVE_MESSAGES[
      Math.floor(Math.random() * PASSIVE_AGGRESSIVE_MESSAGES.length)
    ];

    statusBadge.textContent = "RAGE DETECTED";
    statusBadge.className = "status-badge";
    alertTitle.textContent = "BLACKOUT ENFORCED";
    alertBody.textContent = randomMsg;

    // Start speech recognition listening
    startSpeechRecognition();
  }

  // 3. FORGIVENESS ENGINE (Web Speech API)
  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Web Speech API not supported in this browser.");
      return;
    }

    speechRecognition = new SpeechRecognition();
    speechRecognition.continuous = true;
    speechRecognition.interimResults = true;
    speechRecognition.lang = 'en-US';

    speechRecognition.onresult = (event) => {
      if (!isBlackedOut) return;

      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      transcript = transcript.toLowerCase();
      console.log("Speech Transcript:", transcript, "Live Vol:", currentVolume);

      if (transcript.includes('sorry')) {
        evaluateApology();
      }
    };

    speechRecognition.onerror = (e) => {
      console.warn("Speech Recognition Error:", e.error);
    };

    speechRecognition.onend = () => {
      // Keep recognition continuously active while locked out
      if (isBlackedOut && isListeningSpeech) {
        try {
          speechRecognition.start();
        } catch (e) {
          // Already listening
        }
      }
    };
  }

  function startSpeechRecognition() {
    if (!speechRecognition) return;
    isListeningSpeech = true;
    try {
      speechRecognition.start();
    } catch (e) {
      // Recognition already running
    }
  }

  // 4. SINCERITY CHECK
  function evaluateApology() {
    if (currentVolume > 20) {
      // INSINCERE APOLOGY: Reject speech check!
      statusBadge.textContent = "INSINCERE APOLOGY";
      statusBadge.className = "status-badge rejected";
      alertTitle.textContent = "APOLOGY REJECTED: INSINCERE";
      alertBody.textContent = `APOLOGY REJECTED: INSINCERE. Whisper it gently. You said 'sorry', but your live mic volume (${currentVolume}) was too loud! (Must be ≤ 20).`;

      // Shake effect
      alertCard.classList.remove('shake');
      void alertCard.offsetWidth; // Force reflow
      alertCard.classList.add('shake');
    } else {
      // SINCERE APOLOGY: Remove blackout & restore editor
      statusBadge.textContent = "APOLOGY ACCEPTED";
      statusBadge.className = "status-badge accepted";
      alertTitle.textContent = "FORGIVEN!";
      alertBody.textContent = "Thank you. Your sincere, quiet apology has been accepted. Editor control restored!";

      setTimeout(() => {
        blackout.style.display = 'none';
        blackout.classList.remove('active');
        editor.disabled = false;
        editor.focus();
        isBlackedOut = false;
        isListeningSpeech = false;

        try {
          if (speechRecognition) speechRecognition.stop();
        } catch (e) {}
      }, 1400);
    }
  }

  // Helper shortcut for testing / demonstration without yelling out loud:
  window.addEventListener('keydown', (e) => {
    // Press Shift + Escape to manually test blackout mode trigger
    if (e.shiftKey && e.key === 'Escape') {
      if (!isBlackedOut) {
        triggerBlackout();
      } else {
        // Force unlock on Shift + Escape
        evaluateApology();
      }
    }
  });
});
