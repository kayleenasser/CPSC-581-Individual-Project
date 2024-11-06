const videoElement = document.getElementById('video');
let directions = document.getElementById('directions');

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
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    hands.onResults((results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            const isPalmOpen = checkIfPalmOpen(landmarks);
            if (isPalmOpen) {
                directions.style.visibility = "visible";
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
    // Simple heuristic to check if the palm is open
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    const palmOpen = (thumbTip.y < indexTip.y) && (thumbTip.y < middleTip.y) && 
                     (thumbTip.y < ringTip.y) && (thumbTip.y < pinkyTip.y);
    console.log("palmOpen", palmOpen);
    return palmOpen;
}

setupCamera().then(detectPalmOpen);
