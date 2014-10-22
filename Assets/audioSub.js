#pragma strict

var implode : AudioClip;


function playSound(){
	audio.PlayOneShot(implode);
	//audio.clip = implode;
	//audio.Play();
	//yield WaitForSeconds (audio.clip.length);
}