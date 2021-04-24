class Player extends Phaser.GameObjects.Sprite {
	constructor(world, x, y, key) {
		super(world.scene, x, y, key);

		this.world = world;
		this.world.scene.add.existing(this);
		this.world.scene.physics.world.enableBody(this, 0);
	}

	moveLeft() {
		this.body.velocity.x = -30;
	}

	moveRight() {
		this.body.velocity.x = 30;
	}

	jump() {
		this.body.velocity.y = -30;
	}
}

class TileDictionary {
	constructor() {
		this.entries = {};
	}

	addTile( key, entry ) {
		entry.tileDictionary = this;
		this.entries[key] = entry;
	}

	getTile( key ) {
		return this.entries[key];
	}
}

class TileDictionaryEntry {
	constructor( args ) {
		for ( const prop in args ) {
			if ( args.hasOwnProperty( prop ) ) {
				this[prop] = args[prop];
			}
		}
	}
}

class Tile extends Phaser.GameObjects.Sprite {
	constructor(args) {
		super(args.world.scene, args.pixelX, args.pixelY, args.tileDictionaryEntry.key);

		this.world = args.world;
		this.pixelX = args.pixelX;
		this.pixelY = args.pixelY;
		this.worldX = args.worldX;
		this.worldY = args.worldY;

		this.world.scene.add.existing(this);
		this.world.scene.physics.world.enableBody(this, 0);

		this.setOrigin(0);
		this.body.allowGravity = false;
		this.body.setImmovable(true);
	}
}

class World {
	constructor(scene) {
		this.scene = scene;

		this.tiles = this.scene.add.group();

		this.tileSize = 8;

		this.zoom = 2;
		this.screenWidthInTiles = (this.scene.scale.width / this.tileSize) / this.zoom;
		this.screenHeightInTiles = (this.scene.scale.height / this.tileSize) / this.zoom;
		console.log(this.screenWidthInTiles, this.screenHeightInTiles);

		this.scene.cameras.main.setOrigin(0);
		this.scene.cameras.main.setZoom(this.zoom);

		this.moveH = 0;
		this.moveV = 0;
	}

	generateWorld() {
		console.log('Attempted to generate world.');
	}

	addTile( x, y, key ) {
		let tile = new Tile({
			world: this,
			worldX: x,
			worldY: y,
			pixelX: x * this.tileSize,
			pixelY: y * this.tileSize,
			tileDictionaryEntry: this.scene.tileDict.getTile(key)
		});
		this.tiles.add(tile);
	}

	sendInput( action ) {
		if ( action === 'MOVE_LEFT' ) {
			this.moveH--;
		}
		
		if ( action === 'MOVE_RIGHT' ) {
			this.moveH++;
		}

		if ( action === 'JUMP' ) {
			this.moveV--;
		}
	}

	baseUpdate() {
		console.log(this.moveH, this.moveV);

		if ( this.player !== undefined && this.player !== null ) {
			if ( this.moveH === -1 ) {
				this.player.moveLeft();
			}

			if ( this.moveH === 1 ) {
				this.player.moveRight();
			}

			if ( this.moveV === -1 ) {
				this.player.jump();
			}
		}

		this.moveH = 0;
		this.moveV = 0;
	}
}

class MainWorld extends World {
	constructor(scene) {
		super(scene);

		this.terrainDivisor = Phaser.Math.Between(10, 200);
		this.terrainAmplifier = Phaser.Math.Between(50, 500);

		this.player = null;
	}

	generateWorld() {
		for ( let x = 0; x < this.screenWidthInTiles; x++) {
			let perlin = Math.floor((this.screenHeightInTiles * 0.25) + Math.pow(noise.perlin2(x/this.terrainDivisor, 0), 2) * this.terrainAmplifier);

			let dirtHeightVariation = Phaser.Math.Between( 5, 10 );

			for ( let y = 0; y < this.screenHeightInTiles; y++ ) {
				if ( y === perlin ) {
					this.addTile( x, y, 'GRASS' );
				}
				
				if ( y > perlin && y < perlin + dirtHeightVariation ) {
					this.addTile( x, y, 'DIRT' );
				}

				if ( y > perlin + dirtHeightVariation - 1 ) {
					this.addTile( x, y, 'STONE' );
				}
			}
		}

		this.player = new Player( this, (this.scene.scale.width / this.zoom) * 0.5, this.tileSize * 4, 'spr_player' );

		this.scene.physics.add.collider(this.player, this.tiles);
	}

	update() {


		this.baseUpdate();
	}
}

class SceneBoot extends Phaser.Scene {
	constructor() {
		super({ key: 'SceneBoot' });
	}

	preload() {
		let ir = 'images/';

		this.load.image( 'spr_player', ir + 'spr_player.png' );
		this.load.image( 'spr_grass', ir + 'spr_grass.png' );
		this.load.image( 'spr_dirt', ir + 'spr_dirt.png' );
		this.load.image( 'spr_stone', ir + 'spr_stone.png' );
	}

	create() {
		noise.seed(Phaser.Math.Between(0, 10000));

		this.scene.start( 'SceneMain' );
	}
}

class SceneMain extends Phaser.Scene {
	constructor() {
		super({ key: 'SceneMain' });
	}

	create() {
		this.tileDict = new TileDictionary();

		this.tileDict.addTile( 'GRASS', {
			key: 'spr_grass'
		} );

		this.tileDict.addTile( 'DIRT', {
			key: 'spr_dirt'
		} );

		this.tileDict.addTile( 'STONE', {
			key: 'spr_stone'
		} );

		this.world = new MainWorld(this);
		this.world.generateWorld();

		this.keyMappings = {
			LEFT: Phaser.Input.Keyboard.KeyCodes.A,
			RIGHT: Phaser.Input.Keyboard.KeyCodes.D,
			JUMP: Phaser.Input.Keyboard.KeyCodes.SPACE
		};

		this.keyLeft = this.input.keyboard.addKey(this.keyMappings.MOVE_LEFT);
		this.keyRight = this.input.keyboard.addKey(this.keyMappings.MOVE_RIGHT);
		this.keyJump = this.input.keyboard.addKey(this.keyMappings.JUMP);
	}

	update() {
		if ( this.keyLeft.isDown ) {
			this.world.sendInput( 'MOVE_LEFT' );
			console.log('l');
		}
		
		if ( this.keyRight.isDown ) {
			this.world.sendInput( 'MOVE_RIGHT' );
			console.log('r');
		}
		
		if ( this.keyJump.isDown ) {
			this.world.sendInput( 'JUMP' );
			console.log('u');
		}

		this.world.update();
	}
}

class SceneUI extends Phaser.Scene {
	constructor() {
		super({
			key: 'SceneUI',
			active: true
		});
	}

	create() {
		this.score = 0;

		var info = this.add.text(10, 10, 'Score: 0', { font: '48px monospace', fill: '#ffffff' });
	}
}

let game = null;

document.addEventListener( 'DOMContentLoaded', function() {
	let gameConfig = {
		type: Phaser.AUTO,
		width: 512,
		height: 480,
		backgroundColor: '#6185f8',
		scale: {
			mode: Phaser.Scale.FIT,
			autoCenter: Phaser.Scale.CENTER_BOTH
		},
		autoRound: false,
		pixelArt: true,
		roundPixels: true,
		physics: {
			default: 'arcade',
			arcade: {
				gravity: {
					x: 0,
					y: 100
				}
			}
		},
		scene: [ SceneBoot, SceneMain, SceneUI ]
	};

	game = new Phaser.Game( gameConfig );

	console.log('It works!', Phaser);
} );
