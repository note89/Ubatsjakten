#pragma strict
private var i : int = 0;
public var Kungen : GameObject;
var sound : soundTrekronor;

function Awake(){
	sound = GetComponent(soundTrekronor);
}

function deActivate(){
		sound.playSound();
		transform.GetChild(i).gameObject.SetActive(false);
		i +=1;
		if(i == 3){
		//Debug.Log("kill the king");
		Destroy(Kungen);
		}
}