#pragma strict

public var speed : float ;
function Start () {
 	rigidbody2D.velocity = transform.right.normalized * speed;
 	Destroy (gameObject, 5);

}

function Update () {

}


function OnBecameInvisible () {
		enabled = false;
}