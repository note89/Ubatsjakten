#pragma strict
private var i : int = 0;
public var Kungen : GameObject;



function Update () {

}

function deActivate(){
		transform.GetChild(i).gameObject.SetActive(false);
		i +=1;
		if(i == 3){
		//Debug.Log("kill the king");
		Destroy(Kungen);
		}
}