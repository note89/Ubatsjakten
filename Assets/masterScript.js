#pragma strict

public var russianSub : Rigidbody2D;
private var timeToSpawn : float;
public var putin : Transform;
private var pause : boolean = false;
private var menu  : boolean = false;
public var Kungen : GameObject;
public var subsLeft : int = 100000;
public var style : GUIStyle;
var putinWinsSound : AudioClip;

public var spawnTime: float;
public var timeMuliplyer: float;
private var Timer:float;

function Awake(){
	Timer = Time.time + spawnTime;
}


public class Button
	 {
		public var width  : float;
		public var height : float;
		
		public function Button()
		{
			height = Screen.height  * 0.15f;
			width = Screen.width * 0.4f;
		} 

	 }	
	// instance of the class
public var myButton : Button = new Button();


function decreaseSubs(){
	subsLeft = subsLeft -1;
}


function Start () {
	timeToSpawn = 0;
	style.richText =true;
	style.alignment =TextAnchor.UpperCenter;
}

function Update(){
//gets ingame menu inputs
	if(Input.GetKeyUp(KeyCode.Escape)) {
		pauseUnpause();
		startMenu();
    }

	if(pause) {
		Time.timeScale = 0.0;
		//pauseGUI.enabled = true;
	}
	else {
		Time.timeScale = 1.0;
		//pauseGUI.enabled = false;
		}
}
function pauseUnpause(){

    pause = !pause;
}
function startMenu(){
	menu =!menu;
}



function FixedUpdate () {
	if(Time.time>Timer){
	     spawnRussianSub();	
	     spawnTime = spawnTime*timeMuliplyer;
	     Timer = Time.time + spawnTime;
	  
	}
	


	
	
	
	
	if(!Kungen){
	  putinWins();      
      
      
	}


}


function spawnRussianSub () {
  Instantiate(russianSub, Vector2( transform.position.x,transform.position.y + Random.Range(-2.8, 2.8) ),transform.rotation);

}

function putinWins(){
	audio.clip = putinWinsSound;
	audio.Play();
 	Instantiate(putin, Vector2( transform.position.x-6,transform.position.y ),transform.rotation);
	pauseUnpause();
	menu = true; 
	
	
}


function OnGUI(){
	if(menu)
	{ 		

	    if(GUI.Button(new Rect((Screen.width - myButton.width) * 0.5f, Screen.height * 0.7f, myButton.width, myButton.height), "Restart Game"))
			{	
				menu =false;
				pause =false;
				Application.LoadLevel("main");
			}



		    
    }
    /// SUBS LEFT
  
    GUI.Label (Rect (Screen.width/2-50, 10, 100, 100),"<size=30>Ubåtar kvar: <color=yellow>"+ subsLeft + "</color></size>",style);

}