#pragma strict

var nej : AudioClip;
var nej2 : AudioClip;

function playSound(){
	if(Random.Range(0,2) == 1){
		audio.clip = nej;		
	}
	else{
	   audio.clip = nej2;
	}
	audio.Play();
	yield WaitForSeconds (audio.clip.length);
}