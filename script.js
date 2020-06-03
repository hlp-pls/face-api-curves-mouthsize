var isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
    },
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};

let is_model_loaded = false;
let webcam;

var landmark_points;
var offset;

let cam_width;
let cam_height;
let scr_scale;

let instruction_DOM = document.getElementById("instructions");
let count_DOM = document.getElementById("countdown");
let record_DOM = document.getElementById("record");
let sound_DOM = document.getElementById("sound");

let predictRate = (isMobile.any())? 10 : 2;
let predict_count = 0;

let osc;
let is_playing = false;

let curves = [];
let curves_num = 68;
let curve_detail = (isMobile.any())? 10 : 20;
let impact = 0;

function setup(){
	createCanvas(windowWidth,windowHeight);
	noFill();
	strokeWeight(3);
	strokeJoin(ROUND);
	strokeCap(ROUND);
	Promise.all([
	faceapi.nets.tinyFaceDetector.loadFromUri('models/'),
	faceapi.nets.faceLandmark68TinyNet.loadFromUri('models/'),
	]).then(modelLoaded);
	webcam = createCapture(VIDEO);
	webcam.hide();

	osc = new p5.Oscillator('triangle');

	for(let i=0; i<curves_num; i++){
		curves.push(new Curves(0.3,curve_detail));
	}
}

sound_DOM.addEventListener("click",initSound,false);
sound_DOM.addEventListener("touchstart",initSound,false);

function initSound(){
	if(!is_playing){
		osc.start(0.1);
		is_playing = true;
		sound_DOM.innerText = "Sound OFF."
	}else{
		osc.stop(0.1);
		is_playing = false;
		sound_DOM.innerText = "Sound ON."
	}
}

function windowResized(){
	resizeCanvas(windowWidth,windowHeight);
}

function modelLoaded(){
	console.log("model loaded");
	is_model_loaded = true;
	instruction_DOM.innerText = "Model loaded!";
}

function draw(){

	background(255);

	translate(width/2,height/2);
	scale(-1,1);
	
	//카메라와 윈도우 화면비율에 따라 크기 조정하기 위한 코드. 여기서부터 <--
	if(width>height){
		cam_width = height * webcam.width/webcam.height;
		cam_height = height;

	}else{
		cam_width = width;
		cam_height = width * webcam.height/webcam.width;

	}

	if(width>cam_width){
		scr_scale = width/cam_width;
		cam_width *= scr_scale;
		cam_height *= scr_scale;
	}else if(height>cam_height){
		scr_scale = height/cam_height;
		cam_width *= scr_scale;
		cam_height *= scr_scale;
	}
	// --> 여기까지.

	if(is_model_loaded){

		//카메라 피드와 기하형태 위치 확인
		/*image(	webcam,
			-cam_width/2,
			-cam_height/2,
			cam_width,cam_height);*/

		predict_count++;

		if(predict_count>predictRate){
			predict();
			predict_count = 0;
		}
		

		if(landmark_points){
			
			drawFace();
			singSong();

			for(let i=0; i<landmark_points.length; i++){
				let tx = -cam_width/2+landmark_points[i]._x;
				let ty = -cam_height/2+landmark_points[i]._y;
				curves[i].update(createVector(tx,ty),impact);
				curves[i].display();
			}
			
		}

	}
	//console.log(landmark_points);
}

function singSong(){

	let mouth_size = 0;
	/*
	let mouth_width = dist(
		landmark_points[48]._x,landmark_points[48]._y,
		landmark_points[54]._x,landmark_points[54]._y
		);
	let mouth_height = dist(
		landmark_points[51]._x,landmark_points[51]._y,
		landmark_points[57]._x,landmark_points[57]._y
		);
	*/

	//입주변을 한바퀴 돌고 시작점과 한개의 점을 사이에 둔 점까지 그려짐. --> tx2,ty2는 바로 직전 점까지 값을 얻는다.
	//stroke(255,0,0);
	//beginShape();

	//첫번째 점(시작점)은 이후의 모든 삼각형들의 꼭지점이 된다.
	let px = -cam_width/2+landmark_points[48]._x;
	let py = -cam_height/2+landmark_points[48]._y;
	//vertex(px,py);
	for(let i=49; i<59; i++){
		//let x = -cam_width/2+landmark_points[i]._x;
		//let y = -cam_height/2+landmark_points[i]._y;
		//vertex(x,y);

		//시작점의 위치 바로 전전까지 (60-2) 다음 점을 참조하여 삼각형의 선분으로 이용한다.
		let tx1 = -cam_width/2+landmark_points[i]._x;
		let ty1 = -cam_height/2+landmark_points[i]._y;

		let tx2 = -cam_width/2+landmark_points[i+1]._x;
		let ty2 = -cam_height/2+landmark_points[i+1]._y;

		//(tx1,ty1),(tx2,ty2)를 지나는 선분의 길이를 구한다.
		let tl = dist(tx1,ty1,tx2,ty2);

		//(tx1,ty1),(tx2,ty2)를 지나는 직선과 (px,py)의 거리를 구한다.
		let nv = createVector(ty2-ty1,tx1-tx2);
		let t1_p = createVector(tx1-px,ty1-py);
		let th = p5.Vector.dot(t1_p, nv) / nv.mag();
	
		//삼각형의 면적
		let tsz = tl * th * 0.5;

		mouth_size += tsz;
	}
	//endShape();

	//console.log(mouth_size);

	
	if(is_playing){
		
		let freq = 600 * mouth_size / (width*height*0.02) + 100;
		
		let amp = 0.9 * (2 * mouth_size) / (width*height*0.02) + 0.1;
		
		osc.freq(freq, 0.1);
		osc.amp(amp, 0.1);
	}


	impact = mouth_size / (width*height*0.02);
	

}

function drawFace(){
	//face outline
	stroke(0);
	noFill();
	beginShape();
	for(let i=0; i<17; i++){
		let x = -cam_width/2+landmark_points[i]._x;
		let y = -cam_height/2+landmark_points[i]._y;
		vertex(x,y);
	}
	endShape();

	//right eyebrow
	beginShape();
	for(let i=17; i<22; i++){
		let x = -cam_width/2+landmark_points[i]._x;
		let y = -cam_height/2+landmark_points[i]._y;
		vertex(x,y);
	}
	endShape();

	//left eyebrow
	beginShape();
	for(let i=22; i<27; i++){
		let x = -cam_width/2+landmark_points[i]._x;
		let y = -cam_height/2+landmark_points[i]._y;
		vertex(x,y);
	}
	endShape();

	//nose
	beginShape();
	for(let i=27; i<36; i++){
		let x = -cam_width/2+landmark_points[i]._x;
		let y = -cam_height/2+landmark_points[i]._y;
		vertex(x,y);
	}
	endShape();

	//eye1
	beginShape();
	for(let i=36; i<42; i++){
		let x = -cam_width/2+landmark_points[i]._x;
		let y = -cam_height/2+landmark_points[i]._y;
		vertex(x,y);
	}
	endShape(CLOSE);

	//eye2
	beginShape();
	for(let i=42; i<48; i++){
		let x = -cam_width/2+landmark_points[i]._x;
		let y = -cam_height/2+landmark_points[i]._y;
		vertex(x,y);
	}
	endShape(CLOSE);

	//fill(255,0,0);
	//mouth upperlip
	beginShape();
	for(let i=48; i<55; i++){
		let x = -cam_width/2+landmark_points[i]._x;
		let y = -cam_height/2+landmark_points[i]._y;
		vertex(x,y);
	}

	for(let i=64; i>=60; i--){
		let x = -cam_width/2+landmark_points[i]._x;
		let y = -cam_height/2+landmark_points[i]._y;
		vertex(x,y);
	}
	endShape(CLOSE);

	//mouth lowerlip
	beginShape();
	{
		let x = -cam_width/2+landmark_points[64]._x;
		let y = -cam_height/2+landmark_points[64]._y;
		vertex(x,y);
	}

	for(let i=54; i<60; i++){
		let x = -cam_width/2+landmark_points[i]._x;
		let y = -cam_height/2+landmark_points[i]._y;
		vertex(x,y);
	}

	{
		let x = -cam_width/2+landmark_points[48]._x;
		let y = -cam_height/2+landmark_points[48]._y;
		vertex(x,y);
	}

	{
		let x = -cam_width/2+landmark_points[60]._x;
		let y = -cam_height/2+landmark_points[60]._y;
		vertex(x,y);
	}

	for(let i=landmark_points.length-1; i>=64; i--){
		let x = -cam_width/2+landmark_points[i]._x;
		let y = -cam_height/2+landmark_points[i]._y;
		vertex(x,y);
	}
	endShape(CLOSE);
}

async function predict(){
	let input_size = 160;
	if(isMobile.any()) input_size = 96;
	const options = new faceapi.TinyFaceDetectorOptions({ inputSize: input_size })
	const video = document.getElementsByTagName('video')[0];
	const displaySize = { width: cam_width, height: cam_height };
	const detections = await faceapi.detectAllFaces(
			video,
			new faceapi.TinyFaceDetectorOptions(options)
		).withFaceLandmarks(true)
		//console.log(detections)
		//console.log(detections[0].landmarks)
		const resizedDetections = faceapi.resizeResults(detections,displaySize);
	if(resizedDetections&&resizedDetections[0]){
		landmark_points = resizedDetections[0].landmarks._positions;
		offset = resizedDetections[0].landmarks._shift;
			//console.log(resizedDetections[0].landmarks._shift);
	}
} 
