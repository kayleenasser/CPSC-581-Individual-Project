var video, img, user_intro, user_directions, animal, animal_subtext, canvas, context, imageData, detector, posit, distanceFromCamera;
var markerSize = 83; //this should be the real life size in millimetres of your marker
var head_marker = 45; // Id of the head marker
var foot_marker = 90; // Id of the foot marker
let fixed_height = 0;
let gotAnimal = false;

function onLoad() {
    img = document.getElementById("animal-image");
    video = document.getElementById("video");
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");
    animal = document.getElementById("animal");
    user_intro = document.getElementById("intro");
    user_directions = document.getElementById("directions");
    animal_subtext = document.getElementById("subtext");

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
    if (gotAnimal || !detected) {
        return;
    }
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

        var headMarker, footMarker; 

        for (var i = 0; i < markers.length; i++) {
            if (markers[i].id === head_marker) {
                headMarker = markers[i];
            } else if (markers[i].id === foot_marker) {
                footMarker = markers[i];
            }
        }

        if (!headMarker && footMarker || !footMarker && headMarker) {
            user_intro.innerHTML = "Please step back to show both markers";
            return;
        }

        if (headMarker && footMarker) {
            user_intro.innerHTML = "Perfect! Processing, please stand still...";
            var headCorners = headMarker.corners;
            var footCorners = footMarker.corners;

            // Center the corners on the canvas
            for (var i = 0; i < headCorners.length; ++i) {
                headCorners[i].x -= (canvas.width / 2);
                headCorners[i].y = (canvas.height / 2) - headCorners[i].y;
            }

            for (var i = 0; i < footCorners.length; ++i) {
                footCorners[i].x -= (canvas.width / 2);
                footCorners[i].y = (canvas.height / 2) - footCorners[i].y;
            }

            // Get the estimated 3d position of the markers
            var headPose = posit.pose(headCorners);
            var footPose = posit.pose(footCorners);

            // Calculate the vertical distance between the head and foot markers
            var verticalDistance = Math.abs(headPose.bestTranslation[1] - footPose.bestTranslation[1]); // in mm
            verticalDistance = verticalDistance / 10; // Convert mm to cm
            var verticalDistanceInInches = verticalDistance / 2.54; // Convert cm to inches
            var verticalFeet = Math.floor(verticalDistanceInInches / 12);
            var verticalInches = Math.round(verticalDistanceInInches % 12);
            verticalDistance = verticalDistance.toFixed(0);
            verticalFeet = verticalFeet.toFixed(0);
            verticalInches = verticalInches.toFixed(0);
            if (fixed_height === 0) {
                fixed_height = verticalDistance;
                setTimeout(() => {
                    if (fixed_height === verticalDistance) {
                        user_intro.innerHTML = "Getting results....";
                        user_directions.style.fontSize = "10vw";
                        user_directions.innerHTML = "Come Close!";
                        user_directions.style.visibility = "visible";
                        let checkInterval = setInterval(() => {
                            if (distanceFromCamera < 390) {
                                clearInterval(checkInterval);
                            }
                        }, 10000);
                        setTimeout(() => {
                            user_directions.style.visibility = "hidden";
                            user_directions.style.fontSize = "15vw";
                            user_directions.innerHTML = "OK!";
                            animal.innerHTML = GetAnimalHeight(verticalDistance);
                            img.src = GetAnimalImage(animal.innerHTML);
                            ChangeCameraAngle(true);
                            img.style.visibility = "visible";
                            animal_subtext.innerHTML = "Height: " + verticalDistance + " cm ";
                            animal.style.visibility = "visible";
                            animal_subtext.style.visibility = "visible";
                            gotAnimal = true;
                            user_intro.innerHTML = "Wow! You're the perfect size!";
                            setTimeout(() => {user_intro.innerHTML = "Press any key to restart."}, 4000);
                        }, 2000);
                    } else {
                        console.log("Height changed");
                        fixed_height = 0; 
                    }
                }, 3000);
            } 
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

        context.strokeText("ID: "+ markers[i].id, x, y - 10) // move it up a little so we don't cover the position
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

        if (markers[i].id === head_marker) {
            distanceFromCamera = Math.trunc(positionInSpace[2]);
        }
    }
}

function GetAnimalHeight(height_CM) {
    var heightString = String(height_CM);

    var animal = data[heightString + " cm"];
    if (heightString < 2) {
        animal = data["1 cm"];
    }
    if (heightString > 212) {
        animal = data["212 cm"];
    }
    if (animal) {
        return animal;
    } else {
        return "Unknown animal";
    }
}

document.addEventListener('keydown', function(event) {
    gotAnimal = false;
    fixed_height = 0;
    detected = false;
    user_directions.innerHTML = "OK!";
    user_intro.innerHTML = "Wave to Begin!";
    animal.style.visibility = "hidden";
    animal_subtext.style.visibility = "hidden";
    img.src = "";
    img.style.visibility = "hidden";
    ChangeCameraAngle(false);
});

function GetAnimalImage(animalname) {
    return "assets/" + animalname.replace(/\s+/g, '').toLowerCase() + ".png";
}

function ChangeCameraAngle(toggle){
    if (toggle) {
        // Set the video and canvas to a circle in the bottom left of the container
        video.style.position = 'absolute';
        video.style.borderRadius = '50%';
        video.style.width = '220px';
        video.style.height = '220px';
        video.style.bottom = '50px';
        video.style.left = '380px';
        video.style.objectFit = 'cover';

        canvas.style.position = 'absolute';
        canvas.style.borderRadius = '50%';
        canvas.style.width = '220px';
        canvas.style.height = '220px';
        canvas.style.bottom = '50px';
        canvas.style.left = '380px';
        canvas.style.objectFit = 'cover';
    } else {
        // Reset the video and canvas to their original positions
        video.style.position = 'relative';
        video.style.borderRadius = '10px';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.bottom = '0px';
        video.style.left = '0px';
        video.style.objectFit = 'cover';

        canvas.style.position = 'relative';
        canvas.style.borderRadius = '10px';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.bottom = '0px';
        canvas.style.left = '0px';
        canvas.style.objectFit = 'cover';
    }
}

window.onload = onLoad;