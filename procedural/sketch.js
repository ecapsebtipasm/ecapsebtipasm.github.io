// From: http://10print.org/

//map save all the possible combinations

var x = 0;
var y = 0;
var times = 0 ;

//variables for array

var grid=20;
var a=20;
var b=20;
var shape=[];



function setup() {
  createCanvas(400, 400);
  background(255);
      //set up the grid--nearest integral 
  a=floor(width/grid);
  b=floor(height/grid);
  //let a =int (width/grid)
  //let b = int (height/grid)
  
  //array of grid 
     for(var i=0;i<a;i++){
       shape[i]=[];
       for(var r=0;r<b;r++){
         shape[i][r]=[-1,-1];
       }
     
    }
}


//drawing for the first time
function draw() {
  
  

  noStroke();
  
  //background color two colors
//   if(random(4)>=3){
//     fill(0,0,255,10);
//     rect(x,y,20,20);
    
//   }else if (random (4)>=2){
//     fill(255,0,0,10);
//     rect(x,y,20,20);
//   }else{
    //fill(255/2,255/2,0,20);
    //rect(x,y,20,20);
 // }

  
  noFill()
  stroke(0);
  strokeWeight(1);
  
  if (random(6) > 5) {
    //square
     rect(x,y,20,20);
  } 
  else if (random(6) > 4){
    //circle
     ellipse(x+10, y+10, 20, 20);
  
  }
   else if (random(6) > 3){
     //horizontal line
    line(x, y+10, x+20, y+10);
  }
   else if (random(6) > 2){
     //veritcle line
    line(x+10, y, x+10, y+20);
  }
   else if (random(6) > 1){
     //leaf 2
     arc(x+20, y+20, 40,40,  PI, PI + HALF_PI);
    arc(x, y, 40, 40,TWO_PI,HALF_PI);
    
  }
   else if(random(6) > 0){
     //leaf 1
    arc(x, y+20, 40, 40,TWO_PI-HALF_PI,TWO_PI);
    arc(x+20,y,40,40,HALF_PI,PI);
    
  }
  
//store the past shapes

  
  
  //loop
  x += 20;
    if (x >= width) {
    x = 0;
    y += 20;
     }
    
    // if(y>height&&y<height*2){
    //   x=0;
    //   y=0
    // }
  
 //seconnod time
  if(y>=height){
    times++;
    if (times >=2){
      noLoop
    }else {
      x=0;
      y=0
    }
  }


//   if (y > height+height) { 
//    noLoop();
//   }
//   else if(y> height){
//        x = 0;
//      y = 0;
//   }
  
    
  
}