var video, canvas, context, imageData, detector, posit;

var markerSize = 150.0; //this should be the real life size in millimetres of your marker

function onLoad() {
    video = document.getElementById("video");
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");

    canvas.width = parseInt(canvas.style.width);
    canvas.height = parseInt(canvas.style.height);

    navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            facingMode: 'environment' // This tries to get the back facing camera when using a phone
        }
    })
        .then(stream => video.srcObject = stream)
        .catch(console.error);

    detector = new AR.Detector();
    posit = new POS.Posit(markerSize, canvas.width);

    requestAnimationFrame(tick);
}

function tick() {
    requestAnimationFrame(tick);

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        snapshot();

        var markers = detector.detect(imageData);
        drawCorners(markers);
        drawId(markers);

        drawCornerPosition(markers);
        showDistance(markers);
    }
}

function snapshot() {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    imageData = context.getImageData(0, 0, canvas.width, canvas.height);
}

function calculateDistance(point1, point2) {
    const xDiff = point2[0] - point1[0];
    const yDiff = point2[1] - point1[1];
    const zDiff = point2[2] - point1[2];

    return Math.sqrt(xDiff * xDiff + yDiff * yDiff + zDiff * zDiff);
}

// Show the distance between the first two markers we can see
function showDistance(markers) {
    if (markers.length >= 2) {

        var corner, corners1, corners2;

        corners1 = markers[0].corners;
        corners2 = markers[1].corners;

        // Documentation says to center the corners on the canvas
        for (i = 0; i < corners1.length; ++i) {
            corner = corners1[i];

            corner.x = corner.x - (canvas.width / 2);
            corner.y = (canvas.height / 2) - corner.y;
        }

        // Get the estimated 3d position of the marker
        pose1 = posit.pose(corners1);

        // Documentation says to center the corners on the canvas
        for (i = 0; i < corners2.length; ++i) {
            corner = corners2[i];

            corner.x = corner.x - (canvas.width / 2);
            corner.y = (canvas.height / 2) - corner.y;
        }

        pose2 = posit.pose(corners2);

        var d = document.getElementById("distance");
        // pose.bestTranslation first 3 indexes are position
        var distance = calculateDistance(pose1.bestTranslation, pose2.bestTranslation);
        d.innerHTML = "Distance: " + distance;

        if (distance > markerSize * 2) {
            d.style.color = "red";
        } else {
            d.style.color = "blue";
        }

        updateProxemicButton(distance, 200, 400, 600);
    }
};

function updateProxemicButton(howClose, near, medium, far) {
    const button = document.getElementById("proxemicButton");
    if (button != null) {
        if (howClose <= near) {
            button.textContent = "Too close!";
        } else if (howClose > near && howClose <= medium) {
            button.textContent = "Just right.";
        } else if (howClose > medium && howClose <= far) {
            button.textContent = "A little closer";
        } else {
            button.textContent = "I'm lonely";
        }
    }
};

function drawCorners(markers) {
    var corners, corner, i, j;

    context.lineWidth = 3;

    for (i = 0; i !== markers.length; ++i) {
        corners = markers[i].corners;

        context.strokeStyle = "red";
        context.beginPath();

        for (j = 0; j !== corners.length; ++j) {
            corner = corners[j];
            context.moveTo(corner.x, corner.y);
            corner = corners[(j + 1) % corners.length];
            context.lineTo(corner.x, corner.y);
        }

        context.stroke();
        context.closePath();

        context.strokeStyle = "green";
        context.strokeRect(corners[0].x - 2, corners[0].y - 2, 4, 4);
    }
}

function drawId(markers) {
    var corners, corner, x, y, i, j;

    context.strokeStyle = "green";
    context.lineWidth = 1;

    for (i = 0; i !== markers.length; ++i) {
        corners = markers[i].corners;

        x = Infinity;
        y = Infinity;

        for (j = 0; j !== corners.length; ++j) {
            corner = corners[j];

            x = Math.min(x, corner.x);
            y = Math.min(y, corner.y);
        }

        context.strokeText(markers[i].id, x, y - 10) // move it up a little so we don't cover the position
    }
}

function drawCornerPosition(markers) {
    var corners, corner, x, y, i, j, k, pose;

    context.strokeStyle = "blue";
    context.lineWidth = 1;

    for (i = 0; i !== markers.length; ++i) {
        corners = markers[i].corners;

        x = Infinity;
        y = Infinity;

        for (j = 0; j !== corners.length; ++j) {
            corner = corners[j];

            x = Math.min(x, corner.x);
            y = Math.min(y, corner.y);
        }

        // Documentation says to center the corners on the canvas
        for (k = 0; k < corners.length; ++k) {
            corner = corners[k];

            corner.x = corner.x - (canvas.width / 2);
            corner.y = (canvas.height / 2) - corner.y;
        }

        // Get the estimated 3d position of the marker
        pose = posit.pose(corners);
        var positionInSpace = pose.bestTranslation;
        context.strokeText(Math.trunc(positionInSpace[0]) + "," +
            Math.trunc(positionInSpace[1]) + "," +
            Math.trunc(positionInSpace[2]), x, y)
    }
}
window.onload = onLoad;
