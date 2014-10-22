#pragma strict
var trekronor : deActivate;
var master : masterScript;
function Awake(){
	trekronor = GameObject.Find("Trekronor").GetComponent(deActivate);
	master = GameObject.Find("GameMaster").GetComponent(masterScript);
}

function OnTriggerEnter2D(other: Collider2D) {

	if(other.tag == "kungen"){
	   trekronor.deActivate();
	   master.decreaseSubs();
	   Destroy(gameObject);
		
	}
	else if(other.tag == "boat90"){
		
		master.decreaseSubs();
		Destroy(gameObject);
		
	}
	
}