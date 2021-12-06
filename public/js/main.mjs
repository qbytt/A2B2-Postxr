const DEFAULT_SCALE = 0.5;
const MINIMUM_SCALE = 0.5;
const MAXIMUM_SCALE = 2;

let _glb, _root, _p0x, _p0y, _p1x, _p1y;

let _scaleBefore = 0;
let _scaleAfter = 0;
let _scaling = false;

window.addEventListener('touchstart', function (e) {
    _scaling = e.touches.length === 2;
    if(_scaling) {
        onTouchStart(e);
    }
});

window.addEventListener('touchmove', function (e) {
    if(_scaling) {
        onTouchMove(e);
    }
});

window.addEventListener('touchend', function (e) {
    if(_scaling) {
        onTouchEnd(e);
    }
});

window.addEventListener("wheel", event => {
    const delta = Math.sign(event.deltaY);
    mouseRescale(delta);
});

function onTouchStart(e) {
    if(_scaling) {
        updateTouch(e);
        _scaleBefore = touchDistance();
    }
}

function onTouchMove(e) {
    if(_scaling) {
        updateTouch(e);
        _scaleAfter = touchDistance();
        if(scaleIncreased()) {
            gestureRescale(-1);
        } else gestureRescale(1);
    }
}

function onTouchEnd(e) {
    clearTouch();
    _scaling = false;
}

function clearTouch(e) {
    _p0x = 
    _p0y = 
    _p1x = 
    _p1y = 0;
}

function updateTouch(e) {
    if(e == null) { return; }
    _p0x = e.touches[0].pageX;
    _p0y = e.touches[0].pageY;
    _p1x = e.touches[1].pageX;
    _p1y = e.touches[1].pageY;
}

function touchDistance() {
    return Math.hypot(
        _p0x - _p1x,
        _p0y - _p1y
    );
}

function scaleIncreased() {
    let scale = _scaleBefore - _scaleAfter;
    return scale > 0;
}

function gestureRescale(delta) {
    if(_glb == null) { return; }
    let sx = _glb.scale.x;
    let sy = _glb.scale.y;
    let sz = _glb.scale.z;
    if(delta > 0) {      
        let dim = 1.03;
        sx *= dim;
        sy *= dim;
        sz *= dim;
        sx = sx > MAXIMUM_SCALE ? MAXIMUM_SCALE : sx;
        sy = sy > MAXIMUM_SCALE ? MAXIMUM_SCALE : sy;
        sz = sz > MAXIMUM_SCALE ? MAXIMUM_SCALE : sz;
        _glb.scale.set(sx, sy, sz);
    }
    else {
        let dim = 0.96;
        sx *= dim;
        sy *= dim;
        sz *= dim;
        sx = sx < MINIMUM_SCALE ? MINIMUM_SCALE : sx;
        sy = sy < MINIMUM_SCALE ? MINIMUM_SCALE : sy;
        sz = sz < MINIMUM_SCALE ? MINIMUM_SCALE : sz;
        _glb.scale.set(sx, sy, sz);
    }
}

function mouseRescale(delta) {
    if(_glb == null) { return; }
    let sx = _glb.scale.x;
    let sy = _glb.scale.y;
    let sz = _glb.scale.z;
    if(delta > 0) {    
        let dim = 1.1;
        sx *= dim;
        sy *= dim;
        sz *= dim;
        sx = sx > MAXIMUM_SCALE ? MAXIMUM_SCALE : sx;
        sy = sy > MAXIMUM_SCALE ? MAXIMUM_SCALE : sy;
        sz = sz > MAXIMUM_SCALE ? MAXIMUM_SCALE : sz;
        _glb.scale.set(sx, sy, sz);
    }
    else {
        let dim = 0.9;
        sx *= dim;
        sy *= dim;
        sz *= dim;
        sx = sx < MINIMUM_SCALE ? MINIMUM_SCALE : sx;
        sy = sy < MINIMUM_SCALE ? MINIMUM_SCALE : sy;
        sz = sz < MINIMUM_SCALE ? MINIMUM_SCALE : sz;
        _glb.scale.set(sx, sy, sz);
    }
}

(async function() {
    
    const MODEL_PATH = "/3d/model.glb";

    let scene, camera, light, renderer;

    let arToolkitSource, arToolkitContext;

    let blocker = document.getElementById('app-blocker');
    
    let ui = document.getElementById('ui');

    let initialized = false;

    let loaded = false;

    let started = false;

    let found = false;

    let objects = new Map();

    let names = [
        "axis0",
        "axis1",
        "poster_0",
        "poster_1",
        "poster_2",
        "poster_3"
    ]

    let index = 0;

    //video fire texture
    const videoFire = document.getElementById('video-fire');
    const videoProm = document.getElementById('video-prom');

    // click event handler
    let onClick = function() {
        if(!found) {
            return;
        }

        if(started) {
            index += 1;
            index = index < names.length ? index : 0;

            names.map(name => {
                if(objects.has(name)) {
                    objects.get(name).visible = false;
                }
            });

            objects.get(names[index]).visible = true;
        }
    }

    let createVideoPlane = function(video) {
        let texture = new THREE.VideoTexture(video);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBFormat;
        texture.crossOrigin = 'anonymous';

        let geometry = new THREE.PlaneGeometry(1,1);
        let material = new THREE.MeshBasicMaterial({ map: texture});

        let videoPlane = new THREE.Mesh(geometry, material);
        return videoPlane;
    } 

    let setAxis0 = function(o) {
        objects.set(o.name, o);
        if(videoFire != undefined && videoFire != null) {
            
            let fire = createVideoPlane(videoFire);  

            fire.scale.set(3,3,1);
            fire.lookAt(o.position.x, o.position.y, o.position.z);
            o.add( fire );
        }
    }

    let setAxis1 = function(o) {
        objects.set(o.name, o);
        if(videoProm != undefined && videoProm != null) {

            let prom = createVideoPlane(videoProm);
            
            prom.scale.set(3,3,1);
            prom.lookAt(o.position.x, o.position.y, o.position.z);
            o.add( prom );
        }
        o.visible = false;
    }

    let setPoster = function(o) {
        objects.set(o.name, o);
        o.visible = false;
    }

    const directives = new Map([
        ['axis0', setAxis0 ],
        ['axis1', setAxis1 ],
        ['poster_0', setPoster ],
        ['poster_1', setPoster ],
        ['poster_2', setPoster ],
        ['poster_3', setPoster ],
    ]);

    let startApplication = async function() {      
        started = true;

        if(videoFire) {
            videoFire.play();
        }

        if(videoProm) {
            videoProm.play();
        }

        document.getElementById('start').removeEventListener('click', startApplication);
        document.getElementById('prompt').remove();

        await init();
        await load();
        await begin();
    }

    document.getElementById('start').addEventListener('click', startApplication);

    async function init() {

        // NProgress
        NProgress.start();

        //////////////
        // three.js //
        //////////////

        // init scene
        scene = new THREE.Scene();
    
        // scene will only be visible when pattern is tracked
        scene.visible = false;
    
        // init camera
        camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );

        scene.add(camera);

        // init root object
        _root = new THREE.Object3D();
        scene.add(_root);

        // ambient light
        light = new THREE.AmbientLight( 0xffffff, 1 ); 

        scene.add( light );
    
        renderer = new THREE.WebGLRenderer({
            antialias : true,
            alpha: true,
            precision: 'highp',
        });

        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(new THREE.Color('lightgrey'), 0)
        renderer.setSize( 1280, 960 );
        renderer.domElement.style.position = 'absolute'
        renderer.domElement.style.top = '0px'
        renderer.domElement.style.left = '0px'
        document.body.appendChild( renderer.domElement );
    
        /////////////////////
        // artoolkitsource //
        /////////////////////
    
        // create artoolkitsource instance
        arToolkitSource = new THREEx.ArToolkitSource({
            sourceType : 'webcam',
        });
    
        // resize event handler for artoolkitsource
        function onResize() {
            arToolkitSource.onResizeElement();
            arToolkitSource.copyElementSizeTo(renderer.domElement);
            if ( arToolkitContext.arController !== null ) {
                arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
            }	
        }
    
        // hook into window resize event
        window.addEventListener('resize', function() {
            onResize();
        });
        
        //////////////////////
        // artoolkitcontext //
        //////////////////////	
    
        // create artoolkitcontext instance
        arToolkitContext = new THREEx.ArToolkitContext({
            cameraParametersUrl: '/data/camera/camera_para.dat',
            detectionMode: 'mono',
            patternRatio: 0.9
        });
        
        // init artoolkitcontext
        arToolkitContext.init( function onCompleted() {
            // copy projection matrix to camera when initialization complete
            camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
       
            // artoolkit context must be intiialized before the following code can run safely :
            arToolkitSource.init(function onReady() {
                onResize();
        
                // https://github.com/jeromeetienne/AR.js/issues/146
                // artoolkit sets near and far too distant, creating z-fighting issues
                let m = arToolkitContext.getProjectionMatrix();
                let far = 1000;
                let near = 0.1;
            
                m.elements[10] = -(far + near) / (far - near);
                m.elements[14] = -(2 * far * near) / (far - near);
            
                camera.projectionMatrix.copy(m);
        
                setTimeout(function() {
                    onResize();
                    initialized = true;
                }, 1000);
            });
        });
    
        //////////////////////
        // armarkercontrols //
        //////////////////////
    
        // init controls for camera
        let markerControls = new THREEx.ArMarkerControls(arToolkitContext, _root, {
            type: 'pattern', patternUrl: "/data/patterns/qr.patt",
        })

        markerControls.addEventListener('markerFound', function(event) {
            found = true;
        });
    }

    async function load() {
        
        if(_root) {
        
            // used to load model
            const threeGLTFLoader = new THREE.GLTFLoader();               
            // used to display progress to user
            const status = document.getElementById("status-data");

            threeGLTFLoader.load(     
                // resource URL
                MODEL_PATH,

                // called when the resource is loaded
                function ( gltf ) {

                    gltf.scene.traverse((child) => {
                        let name = child.name.toLowerCase();
                        console.log(name);
                        if(directives.has(name)) {
                            let dir = directives.get(name);
                            dir(child);
                        }
                    });

                    _glb = gltf.scene;
                    _glb.scale.set( 
                        DEFAULT_SCALE, 
                        DEFAULT_SCALE, 
                        DEFAULT_SCALE );
                    
                    window.addEventListener('click', () => {
                        onClick();
                    })

                    // dont set visible until ready
                    _glb.visible = false;

                    _root.add( _glb );

                    loaded = true;
                },

                // called while loading is progressing
                function ( xhr ) {
                    let loaded = xhr.loaded / xhr.total * 100;
                    let progress = loaded < 100 ? `[LOADING] %${loaded}` : "[INITIALIZING]";
                    if(status != undefined) {
                        status.innerHTML = progress;
                    }
                },

                // called when loading has errors
                function ( error ) {
                    if(status != undefined) {
                        status.innerHTML = "[XHR ERROR: Refresh Page]"
                    }
                    console.log( 'Error loading glTF resource' );
                    console.log( error );
                }
            );

            // set animation & render loop
            if(renderer) {
                renderer.setAnimationLoop( run );
            }
        }
    }

    async function begin() {
        function wait() {
            setTimeout(function() {
                if(initialized && loaded) {
                    begin();
                } else wait();
            }, 2000);
        }
        wait();
        function begin() {
            if(blocker) {
                blocker.style.display = 'none';
            }
            if(NProgress) {
                NProgress.done();
            }
            if(ui) {
                ui.classList.remove("hide");
            }
            if(_glb) {
                _glb.visible = true;
            }
        }
    }

    function run(time) {
        update();
        render();     
    }
    
    function update() {
        if ( arToolkitSource.ready !== false ) {
            arToolkitContext.update( arToolkitSource.domElement );
        }
        scene.visible = camera.visible;
    }
    
    function render() {
        renderer.render( scene, camera );
    }
})();