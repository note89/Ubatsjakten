#pragma strict

var zlatan : AudioClip;
var zlatan2 : AudioClip;
var random : int;


function Start () {

 playSound();

}


function playSound(){

	if(Random.Range(0,2) == 1){
		audio.clip = zlatan;		
	}
	else{
	   audio.clip = zlatan2;
	}
	audio.Play();
	yield WaitForSeconds (audio.clip.length);
}