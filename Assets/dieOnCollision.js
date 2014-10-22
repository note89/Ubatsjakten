#pragma strict
private var trekronor : deActivate;
private var master : masterScript;
private var sound : audioSub;
function Awake(){
	trekronor = GameObject.Find("Trekronor").GetComponent(deActivate);
	master = GameObject.Find("GameMaster").GetComponent(masterScript);
	sound = GameObject.Find("GameMaster").GetComponent(audioSub);
}

function OnTriggerEnter2D(other: Collider2D) {
	



	if(other.tag == "kungen"){
	   trekronor.deActivate();
	   master.decreaseSubs();
	   Destroy(gameObject);
		
	}
	else if(other.tag == "boat90"){
		sound.playSound();
		master.decreaseSubs();
		Destroy(gameObject);		
		
	}
	
}