class Player extends Phaser.GameObjects.Sprite {
	constructor(world, x, y, key) {
		super(world.scene, x, y, key);

		this.world = world;
		this.world.scene.add.existing(this);
		this.world.scene.physics.world.enableBody(this, 0);

		this.accel = 2;
		this.jumpVelocityX = 0;
		this.body.setBounceX(0.5);

		this.cellX = Math.floor( x / world.tileSize ) * world.tileSize;
		this.cellY = Math.floor( y / world.tileSize ) * world.tileSize;

		this.onGround = false;
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
		super(args.world.scene, args.pixelX, args.pixelY, args.imageKey);
		this.initImageKey = args.imageKey;

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

	remove() {
		this.destroy();
	}
}

class LightSource {
	constructor( args ) {
		for ( const prop in args ) {
			if ( args.hasOwnProperty( prop ) ) {
				this[prop] = args[prop];
			}
		}
	}
}

class World {
	constructor(scene) {
		this.scene = scene;

		this.bgTiles = this.scene.add.group();
		this.tiles = this.scene.add.group();
		this.lighting = [];
		this.lightSources = [];

		this.bottomRowsGenerated = [];

		this.tileSize = 8;

		this.zoom = 2;
		this.screenWidthInTiles = ( this.scene.scale.width / ( this.tileSize * this.zoom ) );
		this.screenHeightInTiles = ( this.scene.scale.height / ( this.tileSize * this.zoom ) );
		console.log(this.screenWidthInTiles, this.screenHeightInTiles);

		this.lightSources.push( {
			x: this.screenWidthInTiles * 0.5,
			y: 0,
			radius: 22
		} );

		this.scene.cameras.main.setZoom(this.zoom);
	}

	generateWorld() {
		console.log('Attempted to generate world.');
	}

	/**
	 * Background tiles
	 */
	 addBgTile( x, y, key ) {
		let imageKey = '';

		if ( Array.isArray( this.scene.bgTileDict.getTile(key).key ) ) {
			imageKey = this.scene.bgTileDict.getTile(key).key[Phaser.Math.Between(0, this.scene.bgTileDict.getTile(key).key.length - 1)];
		}
		else {
			imageKey = this.scene.bgTileDict.getTile(key).key;
		}

		let tile = new Tile({
			world: this,
			worldX: x,
			worldY: y,
			pixelX: x * this.tileSize,
			pixelY: y * this.tileSize,
			brightness: 0,
			tileDictionaryEntry: this.scene.bgTileDict.getTile(key),
			imageKey: imageKey
		});

		tile.setDepth(-10);

		this.bgTiles.add(tile);
	}

	removeBgTile( x, y ) {
		let tile = this.getBgTile( x, y );
		if ( tile !== null ) {
			tile.destroy();
		}
	}

	getBgTile( x, y ) {
		for ( let i = 0; i < this.bgTiles.getChildren().length; i++ ) {
			let tile = this.bgTiles.getChildren()[i];
			
			if ( tile.worldX === x && tile.worldY === y ) {
				return tile;
			}
		}

		return null;
	}


	/**
	 * Tiles
	 */
	addTile( x, y, key ) {
		let imageKey = '';

		if ( Array.isArray( this.scene.tileDict.getTile(key).key ) ) {
			imageKey = this.scene.tileDict.getTile(key).key[Phaser.Math.Between(0, this.scene.tileDict.getTile(key).key.length - 1)];
		}
		else {
			imageKey = this.scene.tileDict.getTile(key).key;
		}

		let tile = new Tile({
			world: this,
			worldX: x,
			worldY: y,
			pixelX: x * this.tileSize,
			pixelY: y * this.tileSize,
			tileDictionaryEntry: this.scene.tileDict.getTile(key),
			imageKey: imageKey
		});

		this.tiles.add(tile);

		this.lighting.push({
			x: x,
			y: y,
			value: 1
		});
	}

	removeTile( x, y ) {
		let tile = this.getTile( x, y );
		if ( tile !== null ) {
			tile.destroy();
		}

		this.updateLighting();
	}

	updateTileLighting( x, y ) {

	}

	updateLighting() {
		for ( let i = 0; i < this.lighting.length; i++ ) {
			let lightingCell = this.lighting[i];

			let tile = this.getTile( lightingCell.x, lightingCell.y );

			if ( tile !== null ) {
				tile.setTexture( 'spr_dark' );
			}

			let bgTile = this.getBgTile( lightingCell.x, lightingCell.y );

			if ( bgTile !== null ){
				bgTile.setTexture( 'spr_dark' );
			}
		}

		for ( let i = 0; i < this.lightSources.length; i++ ) {
			let lightSource = this.lightSources[i];

			let lightSourceRadiusSquared = lightSource.radius * lightSource.radius;

			for ( let x = lightSource.x - lightSource.radius; x < lightSource.x + lightSource.radius; x++ ) {
				for (let y = lightSource.y - lightSource.radius; y < lightSource.y + lightSource.radius; y++ ) {
					if ( ( ( lightSource.x - x ) * ( lightSource.x - x ) ) + ( (lightSource.y - y ) * ( lightSource.y - y ) ) < lightSourceRadiusSquared ) {
						let tile = this.getTile( x, y );
						if ( tile !== null ) {
							tile.setTexture( tile.initImageKey );
						}

						let bgTile = this.getBgTile( x, y );
						if ( bgTile !== null ) {
							bgTile.setTexture( bgTile.initImageKey );
						}
					}
				}
			}
		}
	}

	getTile( x, y ) {
		for ( let i = 0; i < this.tiles.getChildren().length; i++ ) {
			let tile = this.tiles.getChildren()[i];
			
			if ( tile.worldX === x && tile.worldY === y ) {
				return tile;
			}
		}

		return null;
	}

	baseUpdate() {
		if ( this.player !== undefined && this.player !== null ) {
			let lastOnGround = this.playerOnGround;

			let isSpaceAbove = false;
			if ( this.getTile( this.player.cellX, this.player.cellY - 1 ) === null ) {
				isSpaceAbove = true;
			}
			
			if ( this.scene.moveV === -1 && this.player.onGround && isSpaceAbove ) {
				this.player.body.velocity.y = -40 * 1.15;
				this.player.jumpVelocityX = this.player.body.velocity.x;
			}

			let hspeed = 40;

			if ( ! this.player.onGround ) {
				hspeed = Math.abs( this.player.jumpVelocityX );
			}

			if ( this.scene.moveH === -1 ) {
				if ( this.player.body.velocity.x > -hspeed ) {
					this.player.body.velocity.x -= this.player.accel;
				}
			}
			else if ( this.scene.moveH === 1 ) {
				if ( this.player.body.velocity.x < hspeed ) {
					this.player.body.velocity.x += this.player.accel;
				}
			}
			else if ( this.scene.moveH === 0 ) {
				this.player.body.velocity.x = 0;
			}

			this.player.lightSource.x = ( Math.floor( this.player.x / this.tileSize ) * this.tileSize) / this.tileSize;
			this.player.lightSource.y = ( Math.floor( this.player.y / this.tileSize ) * this.tileSize) / this.tileSize;
		}
	}
}

class MainWorld extends World {
	constructor(scene) {
		super(scene);

		this.terrainDivisor = Phaser.Math.Between(10, 200);
		this.terrainAmplifier = Phaser.Math.Between(50, 500);

		this.cameraScrollRate = 0;
		this.cameraScrollMaxRate = 1;
		this.cameraScrollAccel = 0.001;
		this.scene.cameras.main.useBounds = false;
		this.scene.cameras.main.removeBounds();

		this.initBottomRowGenerated = 0;
		this.lastBottomRowGenerated = 0;
		this.bottomRowGenerated = 0;

		this.player = null;
	}

	generateWorld() {
		this.initBottomRowGenerated = this.screenHeightInTiles - 1;
		this.lastBottomRowGenerated = this.screenHeightInTiles - 1;
		this.bottomRowGenerated = this.screenHeightInTiles - 1;

		for ( let x = 0; x < this.screenWidthInTiles; x++) {
			let perlin = Math.floor((this.screenHeightInTiles * 0.25) + Math.pow(noise.perlin2(x/this.terrainDivisor, 0), 2) * this.terrainAmplifier);

			let dirtHeightVariation = Phaser.Math.Between( 5, 10 );

			for ( let y = 0; y < this.screenHeightInTiles; y++ ) {
				let perlin2 = noise.perlin2( x / 10, y / 10 );

				if ( y === perlin ) {
					this.addTile( x, y, 'GRASS' );
				}
				
				if ( y > perlin && y < perlin + dirtHeightVariation ) {
					this.addBgTile( x, y, 'STONE' );
					this.addTile( x, y, 'DIRT' );
				}

				if ( y > perlin + dirtHeightVariation - 1 ) {
					this.addBgTile( x, y, 'STONE' );

					if ( perlin2 > 0 ) {
						this.addTile( x, y, 'STONE' );
					}
				}
			}
		}

		this.updateLighting();

		this.player = new Player( this, (this.scene.scale.width / this.zoom) * 0.5, this.tileSize * 4, 'spr_player' );
		let playerCellX = ( Math.floor( this.player.x / this.tileSize ) * this.tileSize) / this.tileSize;
		let playerCellY = ( Math.floor( this.player.y / this.tileSize ) * this.tileSize) / this.tileSize;
		this.player.lightSource = new LightSource({
			x: playerCellX,
			y: playerCellY,
			radius: 7
		});
		this.lightSources.push( this.player.lightSource );

		this.scene.cameras.main.startFollow( this.player, true, 0, 0.5 );

		this.scene.physics.add.collider(this.player, this.tiles, function(player, tile) {
		}, null, this);
	}

	update() {

		if ( this.player !== undefined && this.player !== null ) {
			if ( this.player.body.velocity.y === 0 ) {
				this.player.onGround = true;
			}
			else {
				this.player.onGround = false;
			}
		}

		if ( this.scene.input.activePointer.isDown ) {
			let cellX = ( Math.floor( this.scene.input.activePointer.worldX / this.tileSize ) * this.tileSize) / this.tileSize;
			let cellY = ( Math.floor( this.scene.input.activePointer.worldY / this.tileSize ) * this.tileSize) / this.tileSize;

			this.removeTile( cellX, cellY );
		}



		let cTop = this.scene.cameras.main.worldView.y;
		this.topRowGenerated = ( ( Math.floor( cTop / this.tileSize ) * this.tileSize ) / this.tileSize ) - 2;

		for ( let i = 0; i < this.tiles.getChildren().length; i++ ) {
			let tile = this.tiles.getChildren()[i];

			if ( tile.worldY < this.topRowGenerated ) {
				tile.destroy();
				i--;
			}
		}

		for ( let i = 0; i < this.bgTiles.getChildren().length; i++ ) {
			let tile = this.bgTiles.getChildren()[i];

			if ( tile.worldY < this.topRowGenerated ) {
				tile.destroy();
				i--;
			}
		}



		let cBottom = this.scene.cameras.main.worldView.y + this.scene.cameras.main.worldView.height;
		this.updateLighting();

		this.bottomRowGenerated = ( ( Math.floor( cBottom / this.tileSize ) * this.tileSize ) / this.tileSize ) + 2;

		let isBottomRowAlreadyGenerated = false;
		for ( let i = 0; i < this.bottomRowsGenerated.length; i++ ) {
			if ( this.bottomRowsGenerated[i] === this.bottomRowGenerated ) {
				isBottomRowAlreadyGenerated = true;
			}
		}

		if ( this.bottomRowGenerated > this.initBottomRowGenerated ) {
			if ( this.scene.tick > 60 ) {
				if ( ! isBottomRowAlreadyGenerated ) {
					//console.log(this.scene.cameras.main.worldView, 'setting bottom row generated: ', this.lastBottomRowGenerated, this.bottomRowGenerated );

					for ( let x = 0; x < this.screenWidthInTiles; x++) {
						let y = this.bottomRowGenerated;

						let perlin = Math.floor((this.screenHeightInTiles * 0.25) + Math.pow(noise.perlin2(x/this.terrainDivisor, 0), 2) * this.terrainAmplifier);

						let dirtHeightVariation = Phaser.Math.Between( 5, 10 );
		
						let perlin2 = noise.perlin2( x / 10, y / 10 );
		
						if ( y === perlin ) {
							this.addTile( x, y, 'GRASS' );
						}
						
						if ( y > perlin && y < perlin + dirtHeightVariation ) {
							this.addBgTile( x, y, 'STONE' );
							this.addTile( x, y, 'DIRT' );
						}
		
						if ( y > perlin + dirtHeightVariation - 1 ) {
							this.addBgTile( x, y, 'STONE' );
							
							if ( perlin2 > 0 ) {
								this.addTile( x, y, 'STONE' );
							}
						}
					}

					this.bottomRowsGenerated.push(this.bottomRowGenerated);
				}
			}
		}


		this.baseUpdate();
	}
}

class SceneBoot extends Phaser.Scene {
	constructor() {
		super({ key: 'SceneBoot' });
	}

	preload() {
		let ir = 'images/';

		this.load.image( 'spr_dark', ir + 'spr_dark.png' );

		// background tiles
		this.load.image( 'spr_bg_stone', ir + 'spr_bg_stone.png' );
		this.load.image( 'spr_bg_stone1', ir + 'spr_bg_stone1.png' );

		// tiles
		this.load.image( 'spr_player', ir + 'spr_player.png' );
		this.load.image( 'spr_grass', ir + 'spr_grass.png' );
		this.load.image( 'spr_dirt', ir + 'spr_dirt.png' );
		this.load.image( 'spr_stone', ir + 'spr_stone.png' );
		this.load.image( 'spr_stone1', ir + 'spr_stone1.png' );
		this.load.image( 'spr_stone2', ir + 'spr_stone2.png' );
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

		// register bg tiles
		this.bgTileDict = new TileDictionary();

		this.bgTileDict.addTile( 'STONE', {
			key: ['spr_bg_stone', 'spr_bg_stone1']
		} );


		// register tiles
		this.tileDict = new TileDictionary();

		this.tileDict.addTile( 'GRASS', {
			key: 'spr_grass'
		} );

		this.tileDict.addTile( 'DIRT', {
			key: 'spr_dirt'
		} );

		this.tileDict.addTile( 'STONE', {
			key: ['spr_stone', 'spr_stone1', 'spr_stone2']
		} );

		this.tileDict.addTile( 'GOLD', {
			key: ['spr_gold']
		} );

		this.world = new MainWorld(this);
		this.world.generateWorld();

		this.keyMappings = {
			MOVE_LEFT: Phaser.Input.Keyboard.KeyCodes.A,
			MOVE_RIGHT: Phaser.Input.Keyboard.KeyCodes.D,
			JUMP: Phaser.Input.Keyboard.KeyCodes.SPACE
		};

		this.keyLeft = this.input.keyboard.addKey(this.keyMappings.MOVE_LEFT);
		this.keyRight = this.input.keyboard.addKey(this.keyMappings.MOVE_RIGHT);
		this.keyJump = this.input.keyboard.addKey(this.keyMappings.JUMP);

		this.moveH = 0;
		this.moveV = 0;

		this.tick = 0;
	}

	update() {
		if ( this.keyLeft.isDown ) {
			this.moveH--;
		}
		
		if ( this.keyRight.isDown ) {
			this.moveH++;
		}
		
		if ( this.keyJump.isDown ) {
			this.moveV--;
		}

		this.world.update();
	
		this.moveH = 0;
		this.moveV = 0;
		this.tick++;
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

		//var info = this.add.text(10, 10, 'Score: 0', { font: '48px monospace', fill: '#ffffff' });
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
				},/*
				debug: true,
				debugShowBody: true,
				debugShowStaticBody: true,
				debugShowVelocity: true,
				debugVelocityColor: 0xffff00,
				debugBodyColor: 0x0000ff,
				debugStaticBodyColor: 0xffffff*/
			}
		},
		scene: [ SceneBoot, SceneMain, SceneUI ]
	};

	game = new Phaser.Game( gameConfig );
} );
