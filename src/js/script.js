class Player extends Phaser.Scene.Sprite {
	constructor(scene, x, y, key) {
		super(scene, x, y, key);

		this.scene = scene;
		this.scene.add.existing(this);
		this.scene.physics.world.enableBody(this, 0);
	}
}

class TileDictionary {
	constructor(scene) {
		
	}
}

class TileDictionaryEntry {
	constructor(scene, x, y, key) {
		super(scene, x, y, key);

		this.scene = scene;
		this.scene.add.existing(this);
		this.scene.physics.world.enableBody(this, 0);
	}
}

document.addEventListener( 'DOMContentLoaded', function() {
	let gameConfig = {
		width: 640,
		height: 480,
		scale: {
			mode: Phaser.Scale.FIT,
			autoCenter: Phaser.Scale.CENTER_BOTH
		},
		autoRound: false
	};

	let game = new Phaser.Game( gameConfig );

	console.log('It works!', Phaser);
} );
