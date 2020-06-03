class Curves{

	constructor(_speed, _curve_length){
		this.position = [];
		this.target = createVector();
		this.speed = _speed;
		this.curve_length = _curve_length;

		for(let i=0; i<this.curve_length; i++){
			let x = random(0,width)-width/2;
			let y = random(0,height)-height/2;
			this.position[i] = createVector(x,y);
		}
	}

	update(_target, _impact){

		this.target = _target;
		this.position[0].x += (this.target.x-this.position[0].x) * this.speed;
		this.position[0].y += (this.target.y-this.position[0].y) * this.speed;
		for(let i=1; i<this.curve_length; i++){
			let imp_r = _impact * 0.1;
			let imp_x = (this.position[i].x - 0) * imp_r;
			let imp_y = (this.position[i].y - 0) * imp_r;

			this.position[i].x += (this.position[i-1].x-this.position[i].x) * this.speed + imp_x;
			this.position[i].y += (this.position[i-1].y-this.position[i].y) * this.speed + imp_y;
		}
	}

	display(){
		noFill();
		beginShape();
		vertex(this.target.x,this.target.y);
		for(let i=0; i<this.curve_length; i++){
			vertex(this.position[i].x,this.position[i].y);
		}
		endShape();
	}

}