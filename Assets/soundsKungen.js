import System.Collections.Generic;
#pragma strict

var kommentar : AudioClip;
var kommentar2 : AudioClip;
var island : AudioClip;
var naturligt : AudioClip;
var tack : AudioClip;
var trevligt : AudioClip;
var upphetsad : AudioClip;
var audioList : List.<AudioClip> = new List.<AudioClip>();
private var value : int ;


function Awake(){
	//audioList;
	audioList.Add(naturligt);
	audioList.Add(island);
	audioList.Add(tack);
	audioList.Add(trevligt);
	audioList.Add(upphetsad);
	audioList.Add(kommentar);
	audioList.Add(kommentar2);
}

function FixedUpdate(){

	PlaySound();


}

function PlaySound()
{
	//Debug.Log(audio.clip);
	value = Random.Range(0,600);

	if(value==50 && !audio.isPlaying){
		audio.clip = audioList[Random.Range(0,7)];
		audio.Play();
		yield WaitForSeconds (audio.clip.length);

	}
	

}