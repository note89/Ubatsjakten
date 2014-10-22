#pragma strict

public var speed : float;


function Start () {
 	rigidbody2D.velocity = -transform.right.normalized * (speed+Random.Range(-1.3,2.4));
    Destroy (gameObject, 14);
}

