#pragma strict
var kommentar : AudioClip;
var kommentar2 : AudioClip;
private var value : int ;


function FixedUpdate(){

	PlaySound();


}

function PlaySound()
{
	//Debug.Log(audio.clip);
	value = Random.Range(0,1200);

	if(value==50 && !audio.isPlaying){
		audio.clip = kommentar;
		audio.Play();
		yield WaitForSeconds (audio.clip.length);

	}
	else if(value==60 && !audio.isPlaying){
		audio.clip = kommentar2;
		audio.Play();
		yield WaitForSeconds (audio.clip.length);
	}		


}