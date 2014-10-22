#pragma strict

public var up : KeyCode;
public var down : KeyCode;
public var fire : KeyCode;
public var upDownRate : float ;
public var boat90 : Rigidbody2D;
public var ibra : Rigidbody2D;
public var boatSpeed : float;
public var xOffset : float;
public var yOffset : float;
public var shootSpeed : int;
private var timer :int = 0;
private var ibraTimer : int = 0;
private var ibraReady : boolean = false;
public var master : GameObject;


function Start () {

}

function Update () {

	if(Input.GetKey(up)){
		gameObject.transform.position.y += upDownRate;
	}
	else if(Input.GetKey(down)){
		gameObject.transform.position.y -= upDownRate;
	}
	if(Input.GetKeyDown(fire)){
		if(timer>shootSpeed){
				fireBoat();
				timer =0;
		}
	}
	if(ibraTimer>shootSpeed*20){
		master.transform.GetChild(0).gameObject.SetActive(true);
		if(Input.GetKeyDown("z")){					
					fireIbra();
					ibraTimer =0;		
		}
	}
	timer +=1;
	ibraTimer +=1;

}

function fireBoat () {
    var rocketClone : Rigidbody2D = Instantiate(boat90, Vector2( transform.position.x+xOffset,transform.position.y+yOffset) ,transform.rotation);

}

function fireIbra() {
    Instantiate(ibra, Vector2( transform.position.x+xOffset,transform.position.y+yOffset) ,transform.rotation);
	master.transform.GetChild(0).gameObject.SetActive(false);

}

function OnGUI(){
	if(ibraReady){
		 GUI.Label (Rect (Screen.width/2-50, 50, 100, 100),"<size=30>Ubåtar kvar: <color=yellow></color></size>");
	}

}

