const videoElement = document.getElementById('video');
let directions = document.getElementById('directions');
let intro = document.getElementById('intro');
let detected = false;

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
    return new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
            resolve(videoElement);
        };
    });
}

async function detectPalmOpen() {
    const hands = new Hands({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }});
    
    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.8,
        minTrackingConfidence: 0.8
    });

    hands.onResults((results) => {
        if (detected) {
            return;
        }
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            const isPalmOpen = checkIfPalmOpen(landmarks);
            if (isPalmOpen) {
                detected = true;
                intro.innerText = "Starting...";
                directions.style.visibility = "visible";
                setTimeout(() => {
                  directions.style.visibility = "hidden";
                  intro.innerText = "Please stand back!";
                  intro.style.visibility = "visible";
                }, 2000);
            } 
        }
    });

    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({image: videoElement});
        },
        width: 640,
        height: 480
    });
    camera.start();
}

function checkIfPalmOpen(landmarks) {
    // Simple heuristic to check if the front of the palm is facing the camera
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    const wrist = landmarks[0];

    const palmOpen = (thumbTip.z < wrist.z) && (indexTip.z < wrist.z) && 
             (middleTip.z < wrist.z) && (ringTip.z < wrist.z) && 
             (pinkyTip.z < wrist.z);
    return palmOpen;
}

setupCamera().then(detectPalmOpen);
