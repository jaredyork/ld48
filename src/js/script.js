class Player extends Phaser.GameObjects.Sprite {
	constructor(world, x, y, key) {
		super(world.scene, x, y, key);

		this.setDepth( 16 );

		this.world = world;
		this.world.scene.add.existing(this);
		this.world.scene.physics.world.enableBody(this, 0);
		this.body.collideWorldBounds = true;

		this.accel = 2;
		this.jumpVelocityX = 0;
		this.body.setBounceX(0.5);

		this.cellX = ( Math.floor( x / world.tileSize ) * world.tileSize ) / world.tileSize;
		this.cellY = ( ( Math.floor( y / world.tileSize ) * world.tileSize ) / world.tileSize ) + 1;
		this.lastFallHeight = this.cellY;

		this.isDead = false;
		this.lastOnGround = false;
		this.onGround = false;
	}

	damage( amount ) {
		this.world.scene.events.emit( 'subtractHp', amount );

		if ( this.world.scene.sceneUI.hp <= 0 ) {
			this.isDead = true;
			this.body.setImmovable(true);
			this.setVisible(false);

			this.scene.time.addEvent({
				delay: 1000,
				callback: function() {
					let sceneUI = this.world.scene.scene.get( 'SceneUI' );
					this.world.scene.scene.setVisible( false, 'SceneUI' );

					this.world.scene.scene.start( 'SceneGameOver', {
						tileSize: this.scene.world.tileSize,
						zoom: this.scene.world.zoom,
						screenWidthInTiles: this.scene.world.screenWidthInTiles,
						screenHeightInTiles: this.scene.world.screenHeightInTiles
					} );
				},
				callbackScope: this,
				loop: false
			});
		}
	}
}




class Projectile extends Phaser.GameObjects.Sprite {
	constructor( args ) {
		super(args.world.scene, args.x, args.y, args.imageKey);
		this.projectileDictionaryEntry = args.projectileDictionaryEntry;
		this.initImageKey = args.imageKey;
		this.particleKey = args.projectileDictionaryEntry.particleKey;

		this.world = args.world;

		this.world.scene.add.existing(this);
		this.world.scene.physics.world.enableBody(this, 0);

		this.cellX = ( Math.floor( this.x / this.world.tileSize ) * this.world.tileSize ) / this.world.tileSize;
		this.cellY = ( ( Math.floor( this.y / this.world.tileSize ) * this.world.tileSize ) / this.world.tileSize ) + 1;

		this.doesExplode = args.projectileDictionaryEntry.doesExplode;
		this.explodeDelay = args.projectileDictionaryEntry.explodeDelay;
		this.explodeTick = 0;

		this.setOrigin(0);
		if ( this.projectileDictionaryEntry.isAnimated !== undefined && this.projectileDictionaryEntry.isAnimated !== null ) {
			if ( this.projectileDictionaryEntry.isAnimated ) {
				this.play( args.imageKey );
			}
		}
	}

	update() {
		this.cellX = ( Math.floor( this.x / this.world.tileSize ) * this.world.tileSize ) / this.world.tileSize;
		this.cellY = ( Math.floor( this.y / this.world.tileSize ) * this.world.tileSize ) / this.world.tileSize;
	}
}

class ProjectileDictionary {
	constructor() {
		this.entries = {};
	}

	addProjectile( type, entry ) {
		entry.type = type;
		entry.projectileDictionary = this;
		this.entries[type] = entry;
	}

	getProjectile( type ) {
		return this.entries[type];
	}
}

class ProjectileDictionaryEntry {
	constructor( args ) {
		for ( const prop in args ) {
			if ( args.hasOwnProperty( prop ) ) {
				this[prop] = args[prop];
			}
		}
	}
}




class TileDictionary {
	constructor() {
		this.entries = {};
	}

	addTile( type, entry ) {
		entry.type = type;
		entry.tileDictionary = this;
		this.entries[type] = entry;
	}

	getTile( type ) {
		return this.entries[type];
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
	constructor( args ) {
		super(args.world.scene, args.pixelX, args.pixelY, args.imageKey);
		this.tileDictionaryEntry = args.tileDictionaryEntry;
		this.initImageKey = args.imageKey;
		this.particleKey = args.tileDictionaryEntry.particleKey;

		this.world = args.world;
		this.pixelX = args.pixelX;
		this.pixelY = args.pixelY;
		this.worldX = args.worldX;
		this.worldY = args.worldY;

		this.world.scene.add.existing(this);
		this.world.scene.physics.world.enableBody(this, 0);

		this.isImmovable = args.isImmovable || true;
		this.isFragile = args.isFragile || false;

		this.setOrigin(0);
		if ( this.tileDictionaryEntry.isAnimated !== undefined && this.tileDictionaryEntry.isAnimated !== null ) {
			if ( this.tileDictionaryEntry.isAnimated ) {
				this.play( args.imageKey );
			}
		}
		this.body.allowGravity = false;
		this.body.setImmovable(true);
	}

	remove() {
		this.destroy();
	}
}

class DynamicTile extends Tile {
	constructor( args ) {
		super( args );

		this.isImmovable = args.isImmovable || true;
		this.isFragile = args.tileDictionaryEntry.isFragile || false;

		this.body.setImmovable( args.isImmovable );
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
		this.dynamicTiles = this.scene.add.group();
		this.lighting = [];
		this.lightSources = [];

		this.projectiles = this.scene.add.group();


		this.bottomRowsGenerated = [];

		this.tileSize = 8;
		this.isLightingEnabled = true;

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

	addProjectile( x, y, key, args ) {
		let imageKey = '';

		if ( Array.isArray( this.scene.projectileDict.getProjectile(key).key ) ) {
			imageKey = this.scene.projectileDict.getProjectile(key).key[Phaser.Math.Between(0, this.scene.projectileDict.getProjectile(key).key.length - 1)];
		}
		else {
			imageKey = this.scene.projectileDict.getProjectile(key).key;
		}

		let projectile = new Projectile({
			world: this,
			x: x,
			y: y,
			projectileDictionaryEntry: this.scene.projectileDict.getProjectile(key),
			imageKey: imageKey
		});

		projectile.setDepth( 10 );

		if ( args.velocity !== undefined && args.velocity !== null ) {
			projectile.body.velocity.x = args.velocity.x;
			projectile.body.velocity.y = args.velocity.y;
		}

		this.projectiles.add(projectile);

		return projectile;
	}

	/**
	 * Background tiles
	 */
	 addBgTile( x, y, key, args = {} ) {
		if ( args.mock ) {
			return key;
		}
		else {
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
				tileDictionaryEntry: this.scene.bgTileDict.getTile(key),
				imageKey: imageKey
			});

			tile.setDepth( 10 );

			this.bgTiles.add(tile);

			return tile;
		}
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
	addTile( x, y, key, args = {} ) {
		if ( args.mock ) {
			return key;
		}
		else {
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

			tile.setDepth( 15 );

			this.tiles.add(tile);

			return tile;
		}
	}

	removeTile( x, y, args = {} ) {
		args.naturalBreak = args.naturalBreak || true;
		args.spawnExtraDebris = args.spawnExtraDebris || false;
		args.rewardPlayer = args.rewardPlayer || false;

		let dynamicTile = this.getDynamicTile( x, y - 1 );
		if ( dynamicTile !== null ) {
			if ( dynamicTile.isFragile ) {
				this.removeDynamicTile( x, y - 1 );
			}
		}

		let tile = this.getTile( x, y );

		if ( args.naturalBreak ) {
			if ( tile !== null ) {
				if ( tile.particleKey !== undefined && tile.particleKey !== null ) {
					let particleKeySelected = tile.particleKey[Phaser.Math.Between(0, tile.particleKey.length - 1)];

					let particles = this.scene.add.particles( particleKeySelected ).setDepth(17).createEmitter({
						x: tile.pixelX + (this.tileSize * 0.5),
						y: tile.pixelY + (this.tileSize * 0.5),
						speed: { min: -40, max: 40 },
						angle: { min: 0, max: 360 },
						scale: { start: this.zoom, end: 0 },
						lifespan: 300,
						gravityY: 400,
					});

					particles.explode( 10, tile.pixelX, tile.pixelY );
				}
			}
		}

		if ( args.spawnExtraDebris ) {
			if ( tile !== null ) {
				if ( tile.particleKey !== undefined && tile.particleKey !== null ) {
					let particleKeySelected = tile.particleKey[Phaser.Math.Between(0, tile.particleKey.length - 1)];

					let particles = this.scene.add.particles( particleKeySelected ).setDepth(17).createEmitter({
						x: tile.pixelX + (this.tileSize),
						y: tile.pixelY + (this.tileSize),
						speed: { min: -120, max: 120 },
						angle: { min: 0, max: 360 },
						scale: { start: this.zoom * 2, end: 0 },
						lifespan: 300,
						gravityY: 400,
					});

					particles.explode( Phaser.Math.Between( 20, 30 ), tile.pixelX, tile.pixelY );
				}
			}
		}

		if ( tile !== null ) {
			if ( args.rewardPlayer ) {
				if ( this.player !== undefined && this.player !== null ) {
					if ( tile.tileDictionaryEntry.type === 'ENERGY_CRYSTAL' ) {
						this.scene.events.emit('addEnergyCrystal');

						let sceneUI = this.scene.get( 'SceneUI' );
						if ( sceneUI.energyCrystals >= 1 ) {
							this.time.addEvent({
								delay: 500,
								callback: function() {
									this.scene.start( 'SceneWin' );
								},
								callbackScope: this,
								loop: false
							});
						}
					}
					else if ( tile.tileDictionaryEntry.type === 'GOLD' ) {
						this.scene.events.emit('addGold');
					}
				}
			}

			tile.destroy();
		}
	}

	updateLighting() {
		for ( let i = 0; i < this.lighting.length; i++ ) {
			let lightingCell = this.lighting[i];


			let bgTile = this.getBgTile( lightingCell.x, lightingCell.y );

			if ( bgTile !== null ) {
				bgTile.setTint( 0x000000 );
			}



			let tile = this.getTile( lightingCell.x, lightingCell.y );

			if ( tile !== null ) {
				tile.setTexture( 'spr_dark' );
			}



			let dynamicTile = this.getDynamicTile( lightingCell.x, lightingCell.y );
			if ( dynamicTile !== null ) {
				dynamicTile.setTexture( 'spr_dark' );
			}



			for ( let i = 0; i < this.projectiles.getChildren().length; i++ ) {
				let proj = this.projectiles.getChildren()[i];

				if ( proj.cellX === lightingCell.x && proj.cellY === lightingCell.y ) {
					proj.setVisible( false );
				}
			}

			
			if ( lightingCell.y < this.topRowGenerated ) {
				this.lighting.splice( i, 1 );
				i--;
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
							bgTile.setTint( 0xffffff );
						}

						let dynamicTile = this.getDynamicTile( x, y );
						if ( dynamicTile !== null ) {
							dynamicTile.setTexture( dynamicTile.initImageKey );
						}

						for ( let i = 0; i < this.projectiles.getChildren().length; i++ ) {
							let proj = this.projectiles.getChildren()[i];
			
							if ( proj.cellX === x && proj.cellY === y ) {
								proj.setVisible( true );
							}
						}
					}
				}
			}

			if ( lightSource.y < this.topRowGenerated ) {
				this.lightSources.splice( i, 1 );
				i--;
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


	/**
	 * Dynamic Tiles
	 */
	 addDynamicTile( x, y, key, args = {} ) {
		if ( args.mock ) {
			return key;
		}
		else {
			let imageKey = '';

			if ( Array.isArray( this.scene.dynamicTileDict.getTile(key).key ) ) {
				imageKey = this.scene.dynamicTileDict.getTile(key).key[Phaser.Math.Between(0, this.scene.dynamicTileDict.getTile(key).key.length - 1)];
			}
			else {
				imageKey = this.scene.dynamicTileDict.getTile(key).key;
			}

			let tile = new DynamicTile({
				world: this,
				worldX: x,
				worldY: y,
				pixelX: x * this.tileSize,
				pixelY: y * this.tileSize,
				tileDictionaryEntry: this.scene.dynamicTileDict.getTile(key),
				imageKey: imageKey
			});
			
			tile.setDepth( 20 );

			this.dynamicTiles.add(tile);

			return tile;
		}
	}

	removeDynamicTile( x, y, args = {} ) {
		args.rewardPlayer = args.rewardPlayer || false;

		let tile = this.getDynamicTile( x, y );
		if ( tile !== null ) {
			if ( args.rewardPlayer ) {
				if ( tile.tileDictionaryEntry.type === 'POT' ) {
					if ( this.player !== undefined && this.player !== null ) {
						let reward = '';
						let amount = 1;

						if ( Phaser.Math.Between( 0, 100 ) > 60 ) {
							if ( Phaser.Math.Between( 0, 100) > 75 ) {
								reward = 'addBomb';
								amount = Phaser.Math.Between( 1, 3 );
							}
							else if ( Phaser.Math.Between( 0, 100 ) > 25 ) {
								reward = 'addGold';
								amount = Phaser.Math.Between( 1, 5 );
							}
						}

						reward = 'addBomb';

						if ( reward !== '' ) {
							this.scene.events.emit(reward);
						}
					}
				}
			}

			tile.destroy();
		}
	}

	getDynamicTile( x, y ) {
		for ( let i = 0; i < this.dynamicTiles.getChildren().length; i++ ) {
			let tile = this.dynamicTiles.getChildren()[i];
			
			if ( tile.worldX === x && tile.worldY === y ) {
				return tile;
			}
		}

		return null;
	}

	baseUpdate() {
		if ( this.player !== undefined && this.player !== null ) {
			let isSpaceAbove = false;
			if ( this.getTile( this.player.cellX, this.player.cellY - 1 ) === null ) {
				isSpaceAbove = true;
			}
			
			if ( this.scene.moveV === -1 && this.player.onGround && isSpaceAbove ) {
				this.player.body.velocity.y = -40 * 1.15;
				this.player.jumpVelocityX = this.player.body.velocity.x;
			}

			if ( this.scene.isOnLadder ) {
				this.player.body.velocity.y = -40 * 1.15;
			}

			let hspeed = 40;

			if ( ! this.player.onGround && ! this.player.isOnLadder ) {
				hspeed = Math.abs( this.player.jumpVelocityX );
			}

			if ( this.scene.isDrillingDown ) {
				let canPlayDrillingAnimation = false;

				if ( this.player.anims.currentAnim !== null ) {
					if ( this.player.anims.currentAnim.key !== 'spr_player_drill_down' ) {
						canPlayDrillingAnimation = true;
					}
				}
				else {
					canPlayDrillingAnimation = true;
				}

				if ( canPlayDrillingAnimation ) {
					this.player.body.offset.x = 1;
					this.player.body.offset.y = 0;
					this.player.body.width = 6;
					this.player.body.height = 8;

					this.player.play( 'spr_player_drill_down' );
				}
			}
			else {
				this.player.body.offset.x = 1;
				this.player.body.offset.y = 0;
				this.player.body.width = 6;
				this.player.body.height = 16;
				
				if ( this.scene.moveH === 0 ) {
					this.player.play( 'spr_player_walk' );

					this.player.setFrame( 0 );
				}
				else {
					let canPlayWalkingAnimation = false;

					if ( this.player.anims.currentAnim !== null ) {
						if ( this.player.anims.currentAnim.key !== 'spr_player_walk' ) {
							canPlayWalkingAnimation = true;
						}
					}
					else {
						canPlayWalkingAnimation = true;
					}

					if ( canPlayWalkingAnimation ) {
						console.log('playing walking animation');
						this.player.play( 'spr_player_walk' );
					}
				}
			}

			if ( this.scene.moveH === -1 ) {
				this.player.flipX = true;

				if ( this.player.body.velocity.x > -hspeed ) {
					this.player.body.velocity.x -= this.player.accel;
				}
			}
			else if ( this.scene.moveH === 1 ) {
				this.player.flipX = false;

				if ( this.player.body.velocity.x < hspeed ) {
					this.player.body.velocity.x += this.player.accel;
				}
			}
			else if ( this.scene.moveH === 0 ) {
				this.player.body.velocity.x = 0;
			}

			this.player.cellX = ( Math.floor( this.player.x / this.tileSize ) * this.tileSize ) / this.tileSize;
			this.player.cellY = ( Math.floor( this.player.y / this.tileSize ) * this.tileSize ) / this.tileSize;

			this.player.lightSource.x = ( Math.floor( this.player.x / this.tileSize ) * this.tileSize) / this.tileSize;
			this.player.lightSource.y = ( Math.floor( this.player.y / this.tileSize ) * this.tileSize) / this.tileSize;
		}
	}
}

class MainWorld extends World {
	constructor(scene, args = {}) {
		super(scene);

		this.terrainDivisor = Phaser.Math.Between(10, 200);
		this.terrainAmplifier = Phaser.Math.Between(50, 500);

		this.seed = args.seed || Phaser.Math.Between(1000, 9999) + Phaser.Math.Between(1000, 9999) + Phaser.Math.Between(1000, 9999) + Phaser.Math.Between(1000, 9999);
		//this.seed = 1234567890123456;
		this.seedString = String( this.seed );
		this.stoneSeed = Number( this.seedString.substr( 0, 4 ) );
		this.energyCrystalSeed = Number( this.seedString.substr( 1, 4 + 1 ) );
		this.goldSeed = Number( this.seedString.substr( 2, 4 + 2 ) );

		this.cameraScrollRate = 0;
		this.cameraScrollMaxRate = 20;
		this.cameraScrollAccel = 0.01;
		this.cameraSprite = this.scene.physics.add.sprite( (this.scene.scale.width / this.zoom) * 0.5, (this.scene.scale.height / this.zoom) * 0.5, 'spr_1x1_invisible' );
		this.cameraSprite.setVisible( false );
		this.cameraSprite.body.allowGravity = false;
		this.cameraSprite.body.setImmovable( true );
		this.cameraSprite.body.velocity.y = 0;
		this.scene.physics.world.setBounds(this.scene.cameras.main.worldView.x, this.scene.cameras.main.worldView.y, this.scene.cameras.main.worldView.width, this.scene.cameras.main.worldView.height + (this.tileSize * 100), this.scene.cameraSprite);

		this.initBottomRowGenerated = 0;
		this.lastBottomRowGenerated = 0;
		this.bottomRowGenerated = 0;

		this.player = null;
	}

	generateWorld() {
		this.player = new Player( this, (this.scene.scale.width / this.zoom) * 0.5, this.tileSize * 4, 'spr_player' );
		let playerCellX = ( Math.floor( this.player.x / this.tileSize ) * this.tileSize) / this.tileSize;
		let playerCellY = ( Math.floor( this.player.y / this.tileSize ) * this.tileSize) / this.tileSize;
		this.player.lightSource = new LightSource({
			x: playerCellX,
			y: playerCellY,
			radius: 7
		});
		this.lightSources.push( this.player.lightSource );

		this.scene.cameras.main.startFollow( this.cameraSprite, true, 0, 0.5 );

		this.scene.physics.add.collider(this.player, this.tiles, function(player, tile) {
		}, null, this);

		this.scene.physics.add.collider(this.projectiles, this.tiles, function(proj, tile) {
		}, null, this);
	}

	generateWorldAtPosition( x, y, args = { } ) {
		args.predict = args.predict || false;
		
		let tileKey = null;
		let tile = null;

		let bgTileKey = null;
		let bgTileFrame = null;
		let bgTileData = {};
		let bgTile = null;

		let dynamicTileKey = null;
		let dynamicTile = null;

		noise.seed( this.stoneSeed );
		let perlin = Math.floor((this.screenHeightInTiles * 0.25) + Math.pow(noise.perlin2(x/this.terrainDivisor, 0), 2) * this.terrainAmplifier);

		let dirtHeightVariation = args.dirtHeightVariation || Phaser.Math.Between( 5, 10 );

		let perlin2 = noise.perlin2( x / 10, y / 10 );

		noise.seed( this.energyCrystalSeed );
		let energyCrystalPerlin = noise.perlin2( x / 50, y / 50 );

		noise.seed( this.goldSeed );
		let goldPerlin = noise.perlin2( x / 10, y / 10 );

		if ( y === perlin ) {
			tileKey = 'GRASS';
		}
		
		if ( dirtHeightVariation !== undefined && dirtHeightVariation !== null ) {
			if ( y > perlin && y < perlin + dirtHeightVariation ) {
				bgTileKey = 'STONE';
				tileKey = 'DIRT';
			}
		}

		if ( y > perlin + dirtHeightVariation - 1 ) {
			bgTileKey = 'STONE';

			if ( perlin2 + goldPerlin / 3 > 0.4 && perlin2 + goldPerlin / 3 < 0.43 ) {
				bgTileKey = 'WATERFALL_OPENING';
				bgTileData.waterfallTilesLeft = Phaser.Math.Between( 4, 10 );
			}
			
			if ( perlin2 > 0 ) {
				let tileForStone = null;

				tileForStone = 'STONE';

				if ( goldPerlin >= 0.1 && goldPerlin <= 0.2 ) {
					tileForStone = 'GOLD';
				}
				
				if ( energyCrystalPerlin >= 0.01 && energyCrystalPerlin <= 0.013 ) {
					tileForStone = 'ENERGY_CRYSTAL';
				}

				tileKey = tileForStone;
			}

			if ( ! args.predict ) {
				if ( perlin2 + goldPerlin / 2 > 0.01 && perlin2 + goldPerlin / 2 < 0.03 ) {
					let isAir = this.generateWorldAtPosition( x, y, { predict: true } ).tile === null;
					let isSolidBelow = this.generateWorldAtPosition( x, y + 1, { predict: true } ).tile !== null;
					if ( isAir && isSolidBelow ) {
						dynamicTileKey = 'POT';
					}
				}

				let bgTileAbove = this.getBgTile( x, y - 1 );
				if ( bgTileAbove !== null ) {
					if ( bgTileAbove.tileDictionaryEntry.type === 'WATERFALL_OPENING' ||
						bgTileAbove.tileDictionaryEntry.type === 'WATERFALL' ) {
						
						if ( bgTileAbove.getData( 'waterfallTilesLeft' ) > 0 ) {
							bgTileKey = 'WATERFALL';

							bgTileData.waterfallTilesLeft = Number( bgTileAbove.getData( 'waterfallTilesLeft' ) ) - 1;
						}
					}
				}
			}
		}

		if ( bgTileKey !== null ) {
			bgTile = this.addBgTile( x, y, bgTileKey, { mock: args.predict } );

			if ( bgTileData !== null ) {
				if ( Object.keys( bgTileData ).length > 0 ) {
					for (const prop in bgTileData) {
						if ( bgTileData.hasOwnProperty(prop) ) {
							let filteredValue = bgTileData[prop];

							if ( Array.isArray( filteredValue ) ) {
								for ( let i = 0; i < filteredValue.length; i++ ) {
									if ( filteredValue[i] === '<THIS INSTANCE>' ) {
										filteredValue[i] = bgTile;
									}
								}
							}
							else {
								if ( filteredValue === '<THIS INSTANCE>' ) {
									filteredValue = bgTile;
								}
							}

							bgTile.setData( prop, filteredValue );
						}
					}
				}
			}
		}

		if ( dynamicTileKey !== null ) {
			dynamicTile = this.addDynamicTile( x, y, dynamicTileKey, { mock: args.predict } );
		}

		if ( tileKey !== null ) {
			tile = this.addTile( x, y, tileKey, { mock: args.predict } );
		}


		return {
			tile: tile,
			bgTile: bgTile,
			dynamicTile: dynamicTile
		};
	}

	update() {
		if ( this.cameraSprite.body.velocity.y < this.cameraScrollMaxRate ) {
			this.cameraSprite.body.velocity.y += this.cameraScrollAccel;
		}
		this.scene.physics.world.setBounds(this.scene.cameras.main.worldView.x, this.scene.cameras.main.worldView.y, this.scene.cameras.main.worldView.width, this.scene.cameras.main.worldView.height + (this.tileSize * 100), this.scene.cameraSprite);

		if ( this.player !== undefined && this.player !== null ) {

			if ( this.player.y > this.scene.cameras.main.worldView.y + this.scene.cameras.main.worldView.height + 128 ) {
				this.player.damage( 10 );
			}

			this.player.lastOnGround = this.player.onGround;
			if ( this.player.body.velocity.y === 0 ) {

				this.player.onGround = true;

			}
			else {
				this.player.onGround = false;
			}

			console.log(this.player.lastOnGround, this.player.onGround);

			if ( this.player.lastOnGround && ! this.player.onGround ) {
				this.player.lastFallHeight = this.player.cellY;
				console.log('last fall height: ', this.player.lastFallHeight);
			}
			else if ( ! this.player.lastOnGround && this.player.onGround ) {
				console.log('fell from ' + ( this.player.cellY - this.player.lastFallHeight ) );

				if ( this.player.cellY - this.player.lastFallHeight > 10 ) {
					this.player.damage( 2 );
					this.player.lastFallHeight = this.player.cellY;
				}
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

		for ( let i = 0; i < this.dynamicTiles.getChildren().length; i++ ) {
			let tile = this.dynamicTiles.getChildren()[i];

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

		for ( let i = 0; i < this.projectiles.getChildren().length; i++ ) {
			let proj = this.projectiles.getChildren()[i];

			proj.update();

			if ( proj.doesExplode ) {
				if ( proj.explodeTick < proj.explodeDelay ) {
					proj.explodeTick++;
				}
				else {
					let explosion = this.scene.add.sprite( proj.x, proj.y, 'spr_part_explosion' );
					explosion.play( 'spr_part_explosion' );
					explosion.setDepth( 17 );
					this.scene.time.addEvent( {
						delay: 1000,
						callback: function() {
							explosion.destroy();
						},
						callbackScope: this,
						loop: false
					} );

					let explosionRadius = proj.projectileDictionaryEntry.explosionRadius;
					let explosionRadiusSquared = explosionRadius * explosionRadius;

					for ( let x = proj.cellX - explosionRadiusSquared; x < proj.cellX + explosionRadiusSquared; x++ ) {
						for (let y = proj.cellY - explosionRadiusSquared; y < proj.cellY + explosionRadiusSquared; y++ ) {
							if ( ( ( proj.cellX - x ) * ( proj.cellX - x ) ) + ( (proj.cellY - y ) * ( proj.cellY - y ) ) < explosionRadiusSquared ) {

								this.removeTile( x, y, {
									spawnExtraDebris: true
								} );
							}
						}
					}

					if ( Phaser.Math.Distance.Between(
						this.player.cellX,
						this.player.cellY,
						proj.cellX,
						proj.cellY
					) < 4 ) {
						this.player.damage( 3 );
					}

					proj.destroy();
					i--;
				}
			}

			if ( proj.x < 0 && proj.x > this.scene.scale.width &&
				proj.y < 0 && proj.y > this.scene.scale.height ) {
				
				proj.destroy();
				i--;
			}
		}


		let cBottom = this.scene.cameras.main.worldView.y + this.scene.cameras.main.worldView.height;
		if ( this.isLightingEnabled ) {
			this.updateLighting();
		}

		this.bottomRowGenerated = ( ( Math.floor( cBottom / this.tileSize ) * this.tileSize ) / this.tileSize ) + 2;

				//console.log(this.scene.cameras.main.worldView, 'setting bottom row generated: ', this.lastBottomRowGenerated, this.bottomRowGenerated );

		let missingRows = [];
		for ( let i = 0; i < this.bottomRowGenerated; i++ ) {
			if ( ! this.bottomRowsGenerated.includes( i ) ) {
				missingRows.push( i );
			}
		}

		if ( missingRows.length > 0 ) {
			for ( let i = 0; i < missingRows.length; i++ ) {
				let y = missingRows[i];

				for ( let x = 0; x < this.screenWidthInTiles; x++) {
					this.generateWorldAtPosition(x, y);

					this.lighting.push({
						x: x,
						y: y,
						value: 1
					});
				}

				this.bottomRowsGenerated.push(y);
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

		// misc
		this.load.image( 'spr_1x1_invisible', ir + 'spr_1x1_invisible.png' );

		// icons
		this.load.spritesheet( 'spr_icon_heart', ir + 'spr_icon_heart.png', {
			frameWidth: 16,
			frameHeight: 16
		} );
		this.load.image( 'spr_icon_energy_crystal', ir + 'spr_icon_energy_crystal.png' );
		this.load.image( 'spr_icon_gold_bar', ir + 'spr_icon_gold_bar.png' );
		this.load.image( 'spr_icon_bomb', ir + 'spr_icon_bomb.png' );

		// particles
		this.load.spritesheet( 'spr_part_explosion', ir + 'spr_part_explosion.png', {
			frameWidth: 40,
			frameHeight: 40
		} );
		this.load.image( 'spr_part_water_drop0', ir + 'spr_part_water_drop0.png' );
		this.load.image( 'spr_part_water_drop1', ir + 'spr_part_water_drop1.png' );
		this.load.image( 'spr_part_water_drop2', ir + 'spr_part_water_drop2.png' );


		// projectiles
		this.load.spritesheet( 'spr_proj_bomb', ir + 'spr_proj_bomb.png', {
			frameWidth: 8,
			frameHeight: 8
		} );


		this.load.image( 'spr_dark', ir + 'spr_dark.png' );

		// background tiles
		this.load.image( 'spr_bg_stone', ir + 'spr_bg_stone.png' );
		this.load.image( 'spr_bg_stone1', ir + 'spr_bg_stone1.png' );

		this.load.spritesheet( 'spr_bg_waterfall_opening', ir + 'spr_bg_waterfall_opening.png', {
			frameWidth: 8,
			frameHeight: 8
		} );

		this.load.spritesheet( 'spr_bg_waterfall', ir + 'spr_bg_waterfall.png', {
			frameWidth: 8,
			frameHeight: 8
		} );

		// tiles
		this.load.image( 'spr_player', ir + 'spr_player.png' );
		this.load.spritesheet( 'spr_player_walk', ir + 'spr_player_walk.png', {
			frameWidth: 8,
			frameHeight: 16
		} );

		this.load.spritesheet( 'spr_player_drill_down', ir + 'spr_player_drill_down.png', {
			frameWidth: 8,
			frameHeight: 8
		} );

		this.load.image( 'spr_grass', ir + 'spr_grass.png' );

		this.load.image( 'spr_dirt', ir + 'spr_dirt.png' );
		this.load.image( 'spr_part_dirt0', ir + 'spr_part_dirt0.png' );
		this.load.image( 'spr_part_dirt1', ir + 'spr_part_dirt1.png' );
		this.load.image( 'spr_part_dirt2', ir + 'spr_part_dirt2.png' );

		this.load.image( 'spr_stone', ir + 'spr_stone.png' );
		this.load.image( 'spr_stone1', ir + 'spr_stone1.png' );
		this.load.image( 'spr_stone2', ir + 'spr_stone2.png' );
		this.load.image( 'spr_part_stone0', ir + 'spr_part_stone0.png' );
		this.load.image( 'spr_part_stone1', ir + 'spr_part_stone1.png' );
		this.load.image( 'spr_part_stone2', ir + 'spr_part_stone2.png' );
		this.load.image( 'spr_part_stone3', ir + 'spr_part_stone3.png' );

		this.load.spritesheet( 'spr_energy_crystal', ir + 'spr_energy_crystal.png', {
			frameWidth: 8,
			frameHeight: 8
		} );
		this.load.image( 'spr_gold', ir + 'spr_gold.png' );

		// dynamic tiles
		this.load.image( 'spr_pot', ir + 'spr_pot.png' );
		this.load.image( 'spr_pot1', ir + 'spr_pot1.png' );
		this.load.image( 'spr_pot2', ir + 'spr_pot2.png' );
		this.load.image( 'spr_ladder', ir + 'spr_ladder.png' );
	}

	create() {
		this.anims.create({
			key: 'spr_bg_waterfall_opening',
			frames: this.anims.generateFrameNames( 'spr_bg_waterfall_opening' ),
			frameRate: 5,
			repeat: -1
		});

		this.anims.create({
			key: 'spr_bg_waterfall',
			frames: this.anims.generateFrameNames( 'spr_bg_waterfall' ),
			frameRate: 5,
			repeat: -1
		});

		this.anims.create({
			key: 'spr_energy_crystal',
			frames: this.anims.generateFrameNames( 'spr_energy_crystal' ),
			frameRate: 5,
			repeat: -1
		});

		this.anims.create({
			key: 'spr_player_walk',
			frames: this.anims.generateFrameNames( 'spr_player_walk' ),
			frameRate: 5,
			repeat: -1
		});

		this.anims.create({
			key: 'spr_player_drill_down',
			frames: this.anims.generateFrameNames( 'spr_player_drill_down' ),
			frameRate: 10,
			repeat: -1
		});

		this.anims.create({
			key: 'spr_part_explosion',
			frames: this.anims.generateFrameNames( 'spr_part_explosion' ),
			frameRate: 10,
			repeat: -1
		});

		this.anims.create({
			key: 'spr_proj_bomb',
			frames: this.anims.generateFrameNames( 'spr_proj_bomb' ),
			frameRate: 10,
			repeat: -1
		});


		noise.seed(Phaser.Math.Between(0, 10000));

		this.scene.start( 'SceneMainMenu' );
	}
}

class SceneMain extends Phaser.Scene {
	constructor() {
		super({ key: 'SceneMain' });
	}

	create() {

		// register projectiles
		this.projectileDict = new ProjectileDictionary();

		this.projectileDict.addProjectile( 'BOMB', {
			key: 'spr_proj_bomb',
			isAnimated: true,
			isThrowable: true,
			doesExplode: true,
			damagesTiles: true,
			explosionRadius: 5,
			explodeDelay: 60
		} );


		// register bg tiles
		this.bgTileDict = new TileDictionary();

		this.bgTileDict.addTile( 'STONE', {
			key: ['spr_bg_stone', 'spr_bg_stone1']
		} );

		this.bgTileDict.addTile( 'WATERFALL_OPENING', {
			key: 'spr_bg_waterfall_opening',
			isAnimated: true
		} );

		this.bgTileDict.addTile( 'WATERFALL', {
			key: 'spr_bg_waterfall',
			isAnimated: true
		} );

		
		// register dynamic tiles
		this.dynamicTileDict = new TileDictionary();

		this.dynamicTileDict.addTile( 'POT', {
			key: ['spr_pot', 'spr_pot1', 'spr_pot2'],
			isFragile: true
		} );

		this.dynamicTileDict.addTile( 'LADDER', {
			key: 'spr_ladder'
		} );


		// register tiles
		this.tileDict = new TileDictionary();

		this.tileDict.addTile( 'GRASS', {
			key: 'spr_grass',
			particleKey: ['spr_part_dirt0', 'spr_part_dirt1', 'spr_part_dirt2']
		} );

		this.tileDict.addTile( 'DIRT', {
			key: 'spr_dirt',
			particleKey: ['spr_part_dirt0', 'spr_part_dirt1', 'spr_part_dirt2']
		} );

		this.tileDict.addTile( 'STONE', {
			key: ['spr_stone', 'spr_stone1', 'spr_stone2'],
			particleKey: ['spr_part_stone0', 'spr_part_stone1', 'spr_part_stone2', 'spr_part_stone3']
		} );

		this.tileDict.addTile( 'ENERGY_CRYSTAL', {
			key: 'spr_energy_crystal',
			isAnimated: true,
			particleKey: ['spr_part_stone0', 'spr_part_stone1', 'spr_part_stone2', 'spr_part_stone3']
		} );

		this.tileDict.addTile( 'GOLD', {
			key: ['spr_gold'],
			particleKey: ['spr_part_stone0', 'spr_part_stone1', 'spr_part_stone2', 'spr_part_stone3']
		} );

		this.world = new MainWorld(this);
		this.world.generateWorld();

		this.keyMappings = {
			MOVE_LEFT: Phaser.Input.Keyboard.KeyCodes.A,
			MOVE_RIGHT: Phaser.Input.Keyboard.KeyCodes.D,
			MOVE_UP: Phaser.Input.Keyboard.KeyCodes.W,
			DRILL_DOWN: Phaser.Input.Keyboard.KeyCodes.S,
			JUMP: Phaser.Input.Keyboard.KeyCodes.SPACE,
			FIRE_PRIMARY: Phaser.Input.Keyboard.KeyCodes.SHIFT
		};

		this.keyLeft = this.input.keyboard.addKey(this.keyMappings.MOVE_LEFT);
		this.keyRight = this.input.keyboard.addKey(this.keyMappings.MOVE_RIGHT);
		this.keyUp = this.input.keyboard.addKey(this.keyMappings.MOVE_UP);
		this.keyDrillDown = this.input.keyboard.addKey(this.keyMappings.DRILL_DOWN);
		this.keyJump = this.input.keyboard.addKey(this.keyMappings.JUMP);
		this.keyFirePrimary = this.input.keyboard.addKey(this.keyMappings.FIRE_PRIMARY);

		this.moveH = 0;
		this.moveV = 0;
		this.isDrillingDown = false;
		this.isOnLadder = false;
		this.isFiringPrimary = false;
		this.firingPrimaryTick = 0;
		this.firingPrimaryDelay = 30;

		this.tick = 0;

		this.scene.launch( 'SceneUI' );
		this.sceneUI = this.scene.get( 'SceneUI' );
	}

	update() {
		if ( this.keyLeft.isDown ) {
			this.moveH--;
		}
		
		if ( this.keyRight.isDown ) {
			this.moveH++;
		}

		let dynamicTile = this.world.getDynamicTile( this.world.player.cellX, this.world.player.cellY );

		if ( dynamicTile === null ) {
			this.isOnLadder = false;
		}

		if ( this.keyUp.isDown ) {
			if ( dynamicTile === null ) {
				this.world.addDynamicTile( this.world.player.cellX, this.world.player.cellY, 'LADDER' );
			}
			else {
				if ( dynamicTile.tileDictionaryEntry.type === 'LADDER' ) {
					this.isOnLadder = true;
				}
			}
		}

		if ( this.keyDrillDown.isDown ) {
			this.isDrillingDown = true;

			let removeArgs = {
				spawnExtraDebris: true,
				rewardPlayer: true
			};

			let tile = this.world.getTile( this.world.player.cellX, this.world.player.cellY + 1 );
			if ( tile !== null ) {
				this.world.removeDynamicTile( this.world.player.cellX, this.world.player.cellY, removeArgs );
			}

			this.world.removeTile( this.world.player.cellX, this.world.player.cellY + 1, removeArgs );
			this.moveV++;
		}
		else {
			this.isDrillingDown = false;
		}
		
		if ( this.keyJump.isDown ) {
			this.moveV--;
		}

		if ( this.keyFirePrimary.isDown ) {
			this.isFiringPrimary = true;
		}
		else {
			this.firingPrimaryTick = 0;
			this.isFiringPrimary = false;
		}

		if ( this.isFiringPrimary ) {
			if ( this.firingPrimaryTick < this.firingPrimaryDelay ) {
				this.firingPrimaryTick++;
			}
			else {
				console.log('firing bomb', this.sceneUI.bombs );
				if ( this.sceneUI.bombs > 0 ) {
					this.world.addProjectile(this.world.player.x, this.world.player.y, 'BOMB', {
						velocity: {
							x: this.moveH * 30,
							y: -20
						}
					});

					this.events.emit('subtractBomb');
				}

				this.firingPrimaryTick = 0;
			}
		}

		this.world.update();
	
		this.moveH = 0;
		this.moveV = 0;
		this.tick++;
	}
}

class SceneMainMenu extends Phaser.Scene {
	constructor() {
		super({ key: 'SceneMainMenu' });
	}

	init( args ) {
		this.passedArgs = args;
	}

	create() {
		this.passingArgs = this.passingArgs !== undefined ? this.passingArgs : {};
		this.zoom = 2;
		this.cameras.main.setZoom( this.zoom );

		let screenWidth = (this.scale.width / this.zoom);
		let screenHeight = ( this.scale.height / this.zoom );
		this.cameras.main.centerOn( screenWidth * 0.5, screenHeight * 0.5 );

		let screenWidthInTiles = this.passingArgs.screenWidthInTiles || screenWidth / 8;
		let screenHeightInTiles = this.passingArgs.screenHeightInTiles || screenHeight / 8;
		let tileSize = this.passingArgs.tileSize || 8;
		console.log(screenWidthInTiles, screenHeightInTiles);

		this.bgTiles = this.add.group();
		
		let bgTileKeys = ['spr_bg_stone', 'spr_bg_stone1'];

		for ( let x = 0; x < screenWidthInTiles + 1; x++ ){
			for ( let y = 0; y < screenHeightInTiles + 1; y++ ) {
				let bgTileKey = bgTileKeys[Phaser.Math.Between(0, bgTileKeys.length - 1)];

				let bgTile = this.add.sprite( x * tileSize, y * tileSize, bgTileKey );

				this.bgTiles.add( bgTile );
			}
		}

		this.gameOverLabel = this.add.text(screenWidth * 0.5, screenHeight * 0.25, ['CRYSTAL', 'MASTER'], { fontSize: 30, fontFamily: 'Arcadepix', fill: '#ffffff', align: 'center' });
		this.gameOverLabel.setOrigin(0.5);

		this.gameOverNote = this.add.text(screenWidth * 0.5, this.gameOverLabel.y + this.gameOverLabel.displayHeight + 64, ['DEVELOPED BY JARED YORK', 'FOR LUDUM DARE 48'], { fontSize: 10, fontFamily: 'Arcadepix', fill: '#ffffff', align: 'center' });
		this.gameOverNote.setOrigin(0.5)

		this.gameOverInstructions = this.add.text(screenWidth * 0.5, screenHeight * 0.5, ['PRESS ANY KEY TO START'], { fontSize: 10, fontFamily: 'Arcadepix', fill: '#ffffff', align: 'center' });
		this.gameOverInstructions.setOrigin(0.5);

		this.time.addEvent({
			delay: 1000,
			callback: function() {
				this.gameOverInstructions.setVisible(!this.gameOverInstructions.visible);
			},
			callbackScope: this,
			loop: true
		});

		this.input.keyboard.on( 'keydown', function() {
			this.scene.start( 'SceneMain' );
		}.bind(this));

	}
}

class SceneWin extends Phaser.Scene {
	constructor() {
		super({ key: 'SceneWin' });
	}

	init( args ) {
		this.passedArgs = args;
	}

	create() {
		this.zoom = 2;
		this.cameras.main.setZoom( this.zoom );

		let screenWidth = (this.scale.width / this.zoom);
		let screenHeight = ( this.scale.height / this.zoom );
		this.cameras.main.centerOn( screenWidth * 0.5, screenHeight * 0.5 );

		this.bgTiles = this.add.group();
		
		let bgTileKeys = ['spr_bg_stone', 'spr_bg_stone1'];

		for ( let x = 0; x < this.passedArgs.screenWidthInTiles + 1; x++ ){
			for ( let y = 0; y < this.passedArgs.screenHeightInTiles + 1; y++ ) {
				let bgTileKey = bgTileKeys[Phaser.Math.Between(0, bgTileKeys.length - 1)];

				let bgTile = this.add.sprite( x * this.passedArgs.tileSize, y * this.passedArgs.tileSize, bgTileKey );

				this.bgTiles.add( bgTile );
			}
		}

		this.gameOverLabel = this.add.text(screenWidth * 0.5, screenHeight * 0.25, 'YOU DID IT!', { fontSize: 30, fontFamily: 'Arcadepix', fill: '#ffffff' });
		this.gameOverLabel.setOrigin(0.5);

		this.gameOverInstructions = this.add.text(screenWidth * 0.5, screenHeight * 0.5, ['PLEASE REFRESH', 'THIS PAGE TO RESTART'], { fontSize: 10, fontFamily: 'Arcadepix', fill: '#ffffff', align: 'center' });
		this.gameOverInstructions.setOrigin(0.5);

		this.time.addEvent({
			delay: 1000,
			callback: function() {
				this.gameOverInstructions.setVisible(!this.gameOverInstructions.visible);
			},
			callbackScope: this,
			loop: true
		});

	}
}

class SceneGameOver extends Phaser.Scene {
	constructor() {
		super({ key: 'SceneGameOver' });
	}

	init( args ) {
		this.passedArgs = args;
	}

	create() {
		this.zoom = 2;
		this.cameras.main.setZoom( this.zoom );

		let screenWidth = (this.scale.width / this.zoom);
		let screenHeight = ( this.scale.height / this.zoom );
		this.cameras.main.centerOn( screenWidth * 0.5, screenHeight * 0.5 );

		this.bgTiles = this.add.group();
		
		let bgTileKeys = ['spr_bg_stone', 'spr_bg_stone1'];

		for ( let x = 0; x < this.passedArgs.screenWidthInTiles + 1; x++ ){
			for ( let y = 0; y < this.passedArgs.screenHeightInTiles + 1; y++ ) {
				let bgTileKey = bgTileKeys[Phaser.Math.Between(0, bgTileKeys.length - 1)];

				let bgTile = this.add.sprite( x * this.passedArgs.tileSize, y * this.passedArgs.tileSize, bgTileKey );

				this.bgTiles.add( bgTile );
			}
		}

		this.gameOverLabel = this.add.text(screenWidth * 0.5, screenHeight * 0.25, 'GAMEOVER', { fontSize: 30, fontFamily: 'Arcadepix', fill: '#ffffff' });
		this.gameOverLabel.setOrigin(0.5);

		this.gameOverInstructions = this.add.text(screenWidth * 0.5, screenHeight * 0.5, ['PLEASE REFRESH', 'THIS PAGE TO RESTART'], { fontSize: 10, fontFamily: 'Arcadepix', fill: '#ffffff', align: 'center' });
		this.gameOverInstructions.setOrigin(0.5);

		this.time.addEvent({
			delay: 1000,
			callback: function() {
				this.gameOverInstructions.setVisible(!this.gameOverInstructions.visible);
			},
			callbackScope: this,
			loop: true
		});

	}
}

class SceneUI extends Phaser.Scene {
	constructor() {
		super({
			key: 'SceneUI'
		});
	}

	create() {
		let itemsOffsetY = 32 + 32;


		this.initHp = 3;
		this.hp = this.initHp;
		this.hpIcons = this.add.group();
		this.refreshHpIcons();


		this.iconEnergyCrystal = this.add.image( 32, itemsOffsetY + 32, 'spr_icon_energy_crystal' ).setScale(2);

		this.energyCrystals = 0;
		this.energyCrystalLabel = this.add.text(54, itemsOffsetY + 22, '0', { fontSize: 20, fontFamily: 'Arcadepix', fill: '#ffffff' });


		this.iconGoldBar = this.add.image( 32, itemsOffsetY + 64, 'spr_icon_gold_bar' ).setScale(2);

		this.gold = 0;
		this.goldLabel = this.add.text(54, itemsOffsetY + 54, '0', { fontSize: 20, fontFamily: 'Arcadepix', fill: '#ffffff' });


		this.iconBomb = this.add.image( 32, itemsOffsetY + 96, 'spr_icon_bomb' ).setScale(2);

		this.bombs = 0;
		this.bombsLabel = this.add.text(54, itemsOffsetY + 86, '0', { fontSize: 20, fontFamily: 'Arcadepix', fill: '#ffffff' });
		

		this.instructionsString = [
			['WELCOME TO CRYSTAL MASTERS'],
			['COLLECT 10 ENERGY CRYSTALS TO WIN']
		];
		this.instructions = this.add.text(this.scale.width * 0.5, this.scale.height * 0.15, this.instructionsString, { fontSize: 10, fontFamily: 'Arcadepix', fill: '#ffffff', align: 'center' });
		this.instructions.setOrigin(0.5);

		this.time.addEvent({
			delay: 3000,
			callback: function() {
				this.instructions.destroy();
			},
			callbackScope: this,
			loop: false
		});


		let sceneMain = this.scene.get( 'SceneMain' );

		sceneMain.events.on( 'subtractHp', function( amount ) {
			if ( this.hp - amount > 0 ) {
				this.hp -= amount;
			}
			else {
				this.hp = 0;
			}

			this.refreshHpIcons();
		}, this );

		sceneMain.events.on( 'addEnergyCrystal', function() {
			this.energyCrystals += 1;

			this.energyCrystalLabel.setText( this.energyCrystals );
		}, this );

		sceneMain.events.on( 'addGold', function() {
			this.gold += 1;

			this.goldLabel.setText( this.gold );
		}, this );

		sceneMain.events.on( 'addBomb', function() {
			this.bombs += 1;

			this.bombsLabel.setText( this.bombs );
		}, this );

		sceneMain.events.on( 'subtractBomb', function() {
			if ( this.bombs > 0 ) {
				this.bombs--;
			}

			this.bombsLabel.setText( this.bombs );
		}, this );
	}

	refreshHpIcons() {
		this.hpIcons.clear();

		for ( let i = 0; i < this.initHp; i++ ) {
			let hpIcon = this.add.image( 32 + (i * (32 + 2) ), 32, 'spr_icon_heart' ).setScale(2);

			if ( i < this.hp ) {
				hpIcon.setFrame( 1 );
			}
			else {
				hpIcon.setFrame( 0 );
			}

			this.hpIcons.add(hpIcon);
		}
	}

	killGameUI() {
		this.hpIcons.clear( true, true );
		this.iconEnergyCrystal.setVisible(false);
		this.energyCrystalLabel.setVisible(false);
		this.iconGoldBar.setVisible(false);
		this.goldLabel.setVisible(false);
		this.iconBomb.setVisible(false);
		this.bombsLabel.setVisible(false);
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
		scene: [ SceneBoot, SceneMainMenu, SceneMain, SceneWin, SceneGameOver, SceneUI ]
	};

	game = new Phaser.Game( gameConfig );
} );
