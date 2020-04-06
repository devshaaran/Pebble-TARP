(function () {
  // Set our main variables
  let scene,
  recorderstate = false,
  renderer,
  camera,
  shouldget = true,
  recordedframes = [], 
  rightarm,
  lefthand,
  model, // Our character
  neck, // Reference to the neck bone in the skeleton
  waist, // Reference to the waist bone in the skeleton
  possibleAnims, // Animations found in our file
  mixer, // THREE.js animations mixer
  idle, // Idle, the default state our character returns to
  clock = new THREE.Clock(), // Used for anims, which run to a clock instead of frame rate 
  currentlyAnimating = false, // Used to check whether characters neck is being used in another anim
  raycaster = new THREE.Raycaster(), // Used to detect the click on our character
  loaderAnim = document.getElementById('js-loader');

  
//   var config = {
//     apiKey: "AIzaSyDtA4LPermYoM_MC3gbf6I982WxrttsWs8",
//     authDomain: "toshiba-utility.firebaseapp.com",
//     databaseURL: "https://toshiba-utility.firebaseio.com/",
// };
//   firebase.initializeApp(config);
  init();
  


  function init() {


    const MODEL_PATH = 'https://threejs.org/examples/models/gltf/Soldier.glb';
    const canvas = document.querySelector('#c');
    const backgroundColor = 0xf1f1f1;


    // Init the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    scene.fog = new THREE.Fog(backgroundColor, 60, 100);

    // Init the renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // Add a camera
    camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000);

    camera.position.z = 30;
    camera.position.x = 0;
    camera.position.y = -3;

    let stacy_txt = new THREE.TextureLoader().load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/1376484/stacy.jpg');
    stacy_txt.flipY = false;

    const stacy_mtl = new THREE.MeshPhongMaterial({
      map: stacy_txt,
      color: 0xffffff,
      skinning: true });



    var loader = new THREE.GLTFLoader();

    loader.load(
    MODEL_PATH,
    function (gltf) {
      model = gltf.scene;
      let fileAnimations = gltf.animations;

      model.traverse(o => {

        console.log(o.name)

        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
          // o.material = stacy_mtl;
        }
        // Reference the neck and waist bones
        if (o.isBone && o.name === 'mixamorigNeck') {
          neck = o;
        }
        if (o.isBone && o.name === 'mixamorigSpine') {
          waist = o;
        }
        if (o.isBone && o.name === 'mixamorigLeftForeArm') {
          leftforearm = o;
        }
        if (o.isBone && o.name === 'mixamorigLeftArm') {
          leftarm = o;
        }
        if (o.isBone && o.name === 'mixamorigLeftShoulder') {
          leftshoulder = o;
        }
        if (o.isBone && o.name === 'mixamorigLeftHand') {
          lefthand = o;
        }
        if (o.isBone && o.name === 'mixamorigRightForeArm') {
          rightforearm = o;
        }
        if (o.isBone && o.name === 'mixamorigRightArm') {
          rightarm = o;
        }
        if (o.isBone && o.name === 'mixamorigRightShoulder') {
          rightshoulder = o;
        }
        if (o.isBone && o.name === 'mixamorigRightHand') {
          righthand = o;
        }

      });
      var axis = new THREE.Vector3(0, 7, 0).normalize();
      model.scale.set(7, 7, 7);
      model.position.y = -11;
      model.rotateOnAxis(axis, 3.1);

      scene.add(model);

      loaderAnim.remove();

      mixer = new THREE.AnimationMixer(model);

      let clips = fileAnimations.filter(val => val.name !== 'idle');
      possibleAnims = clips.map(val => {
        let clip = THREE.AnimationClip.findByName(clips, val.name);

        clip.tracks.splice(3, 3);
        clip.tracks.splice(9, 3);

        clip = mixer.clipAction(clip);
        return clip;
      });


      let idleAnim = THREE.AnimationClip.findByName(fileAnimations, 'idle');

      idleAnim.tracks.splice(3, 3);
      idleAnim.tracks.splice(9, 3);

      idle = mixer.clipAction(idleAnim);
      idle.play();

    },
    undefined, // We don't need this function
    function (error) {
      console.error(error);
    });


    // Add lights
    let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.61);
    hemiLight.position.set(0, 50, 0);
    // Add hemisphere light to scene
    scene.add(hemiLight);

    let d = 8.25;
    let dirLight = new THREE.DirectionalLight(0xffffff, 0.54);
    dirLight.position.set(-8, 12, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 1500;
    dirLight.shadow.camera.left = d * -1;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = d * -1;
    // Add directional Light to scene
    scene.add(dirLight);


    // Floor
    let floorGeometry = new THREE.PlaneGeometry(5000, 5000, 1, 1);
    let floorMaterial = new THREE.MeshPhongMaterial({
      color: 0xeeeeee,
      shininess: 0 });


    let floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -0.5 * Math.PI;
    floor.receiveShadow = true;
    floor.position.y = -11;
    scene.add(floor);

    let geometry = new THREE.SphereGeometry(8, 32, 32);
    let material = new THREE.MeshBasicMaterial({ color: 0xEB6736 }); // 0xf2ce2e 
    let sphere = new THREE.Mesh(geometry, material);

    sphere.position.z = -15;
    sphere.position.y = -2.5;
    sphere.position.x = -0.25;
    scene.add(sphere);
  }

  


  function update() {
    if (mixer) {
      mixer.update(clock.getDelta());
    }

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(update);
  }

  update();

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let canvasPixelWidth = canvas.width / window.devicePixelRatio;
    let canvasPixelHeight = canvas.height / window.devicePixelRatio;

    const needResize =
    canvasPixelWidth !== width || canvasPixelHeight !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  window.addEventListener('click', e => raycast(e));
  window.addEventListener('touchend', e => raycast(e, true));

  function raycast(e, touch = false) {
    var mouse = {};
    if (touch) {
      mouse.x = 2 * (e.changedTouches[0].clientX / window.innerWidth) - 1;
      mouse.y = 1 - 2 * (e.changedTouches[0].clientY / window.innerHeight);
    } else {
      mouse.x = 2 * (e.clientX / window.innerWidth) - 1;
      mouse.y = 1 - 2 * (e.clientY / window.innerHeight);
    }
    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // calculate objects intersecting the picking ray
    var intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects[0]) {
      var object = intersects[0].object;

      if (object.name === 'stacy') {

        if (!currentlyAnimating) {
          currentlyAnimating = true;
          playOnClick();
        }
      }
    }
  }

  // Get a random animation, and play it 
  function playOnClick() {
    let anim = Math.floor(Math.random() * possibleAnims.length) + 0;
    playModifierAnimation(idle, 0.25, possibleAnims[anim], 0.25);
  }


  const recordpressed = () => {
    recorderstate = !recorderstate;
    if (recorderstate) {
      document.getElementById("recordText").innerHTML = "Stop Recording";
      storeValue();
    }
    else{
      document.getElementById("recordText").innerHTML = "Record"
    }
    
  }


  


// var database = firebase.database();

// async function writeUserData() {
//   try{
//   while (true){
//     let m =  firebase.database().ref('setFanSpeed/').get({});
//     console.log(m)
//     await new Promise(r => setTimeout(r, 300));
//   }
//   }
//   catch(error){
//     console.log(error)
//   }
// }

// writeUserData();

// firebase.initializeApp(config);
  async function storeValue() {
    try{
      recordedframes = []
      while (recorderstate){
        // console.log('Using the Recorder ');
        // console.log(rightarm.rotation.x);
        recordedframes.push([rightarm.rotation.x,rightarm.rotation.z,rightforearm.rotation.x,rightforearm.rotation.y,waist.rotation.x,waist.rotation.y,neck.rotation.x,neck.rotation.y]);
        await new Promise(r => setTimeout(r, 10));
        
      }
      console.log(recordedframes)
    }
    catch(error){
      console.log(error);
    }
  }

  document.getElementById("recordButt").addEventListener("click", recordpressed);

  function playModifierAnimation(from, fSpeed, to, tSpeed) {
    to.setLoop(THREE.LoopOnce);
    to.reset();
    to.play();
    from.crossFadeTo(to, fSpeed, true);
    setTimeout(function () {
      from.enabled = true;
      to.crossFadeTo(from, tSpeed, true);
      currentlyAnimating = false;
    }, to._clip.duration * 1000 - (tSpeed + fSpeed) * 1000);
  }

  // contains waist code
  // async function moveIt() {
  //   try {
  //     await new Promise(r => setTimeout(r, 5000));
  //     while (true) {
  //       if (neck && waist && leftarm) {
  //         let ordi = {x:500,y:500}
  //         // Make a request for a user with a given ID
  //         await new Promise(r => setTimeout(r, 5));
  //         axios.get('http://127.0.0.1:5000/', {
  //         headers: {
  //           // remove headers
  //         }
  //         })
  //         .then(function (response) {
  //           console.log(response.data.Yaw);
  //           ordi = {x: response.data.Yaw, y: response.data.Pitch};
  //           moveJoint(ordi, neck, 50);
  //           moveJoint(ordi, waist, 30);
  //           console.log(ordi)
            
  //         })
  //         .catch(function (error) {
  //           console.log(error);
  //         })
  //         .finally(function () {
           
  //           // always executed
  //         });  
  //       // movejoint(mousecoords, leftarm);
  //       // console.log('Iam moving');
          
          
  //       }
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }


  // this part contains left hand ka code

  // async function moveIt() {
  //   try {
  //     await new Promise(r => setTimeout(r, 5000));
  //     while (true) {
  //       if (neck && waist && leftarm) {
  //         let ordi = {x:500,y:500}
  //         // Make a request for a user with a given ID
  //         await new Promise(r => setTimeout(r, 5));
  //         axios.get('http://127.0.0.1:5000/', {
  //         headers: {
  //           // remove headers
  //         }
  //         })
  //         .then(function (response) {
  //           console.log(response.data.Yaw);
  //           ordi = {x: response.data.Yaw, y: response.data.Pitch};
  //           rightarm.rotation.z = ordi.x;
  //           rightarm.rotation.x = ordi.y;
  //           console.log(ordi)
            
  //         })
  //         .catch(function (error) {
  //           console.log(error);
  //         })
  //         .finally(function () {
  //           // always executed
  //         });  
  //       // movejoint(mousecoords, leftarm);
  //       // console.log('Iam moving');
          
          
  //       }
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }


  async function moveIt() {
    try {
      await new Promise(r => setTimeout(r, 5000));
      while (true) {
        
        if(shouldget){
        if (neck && waist && rightforearm) {
          let ordi = {x:500,y:500}
          // Make a request for a user with a given ID
          await new Promise(r => setTimeout(r, 3));
          axios.get('http://127.0.0.1:5000/', {
          headers: {
            // remove headers
          }
          })
          .then(function (response) {
            // console.log(response.data.Yaw);
            ordi = {x: response.data.Yaw1, y: response.data.Pitch1,a: response.data.Yaw2, b: response.data.Pitch2, c: response.data.Yaw3, d: response.data.Pitch3 };
            // ordi = {x: response.data.Yaw1, y: response.data.Pitch1}
            // rightarm.rotation.z = ordi.x;
            moveJoint(ordi, neck, 50);
            // moveJoint(ordi, waist, 30);
            rightarm.rotation.z = ordi.a;
            rightarm.rotation.x = ordi.b;
            rightforearm.rotation.x = ordi.c;
            rightforearm.rotation.y = ordi.d;

            // rightforearm.rotation.x = ordi.x;
            // rightforearm.rotation.y = ordi.y;

            // console.log(ordi)
            
          })
          .catch(function (error) {
            console.log(error);
          })
          .finally(function () {
            // always executed
            console.log(shouldget)
          });  
        // movejoint(mousecoords, leftarm);
        // console.log('Iam moving');
          
          
        }
      }
      else{
        await new Promise(r => setTimeout(r, 5));
      }
      }
    } catch (error) {
      console.error(error);
    }
  }


  // document.addEventListener('mousemove', function (e) {
  //   var mousecoords = getMousePos(e);
  //   if (neck && waist && leftarm) {
  //     let ordi = {x:500,y:500}
  //     // Make a request for a user with a given ID
  //     axios.get('http://127.0.0.1:5000/', {
  //     headers: {
  //       // remove headers
  //     }
  //     })
  //     .then(function (response) {
  //       console.log(response.data.Yaw);
  //       ordi = {x: response.data.Yaw, y: response.data.Pitch};
  //       moveJoint(ordi, neck, 50);
  //       moveJoint(ordi, waist, 30);
  //       console.log(ordi)
  //     })
  //     .catch(function (error) {
  //       console.log(error);
  //     })
  //     .finally(function () {
  //       // always executed
  //     });  
  //   // movejoint(mousecoords, leftarm);
  //   // console.log('Iam moving');
      
      
  //   }
    
  // });

  const playrecorded = () => {
    
    if (shouldget) {
      document.getElementById("playText").innerHTML = "Playing Now";
      shouldget = !shouldget;
      animatechar();
    }
    else{
      document.getElementById("playText").innerHTML = "Play Recorded"
      shouldget = !shouldget;
    }
    
    
  }

  function animatechar(){
    let i = 0;
    for(i;i<recordedframes.length;i++){
      rightarm.rotation.x = recordedframes[i][0];
      rightarm.rotation.z = recordedframes[i][1];
      rightforearm.rotation.x = recordedframes[i][2];
      rightforearm.rotation.y = recordedframes[i][3];
      waist.rotation.x = recordedframes[i][4];
      waist.rotation.y = recordedframes[i][5];
      neck.rotation.x = recordedframes[i][6];
      neck.rotation.y = recordedframes[i][7];

    }
  }

  document.getElementById("playButt").addEventListener("click", playrecorded);

  function getMousePos(e) {
    let output_coordinates = String(e.clientX) + " X Axis : Y axis " + String(e.clientY);
    console.log(output_coordinates)
    return { x: e.clientX, y: e.clientY };
  }

  const movejoint = () => {
    // joint.position.x = 30;
    leftforearm.position.x = 30;
    lefthand.position.x = 30;
    leftarm.position.x = 30;
  }

  function moveJoint(mouse, joint, degreeLimit) {
    let degrees = getMouseDegrees(mouse.x, mouse.y, degreeLimit);
    joint.rotation.y = THREE.Math.degToRad(degrees.x);
    joint.rotation.x = THREE.Math.degToRad(degrees.y);
    // console.log(joint.rotation.x);
  }


  const moveit = () => {
    setTimeout(() => {
      movejoint();
      while (true){
        console.log('Iam moving');
      }
    }, 10000);
    
  }
  
  moveIt();

  function getMouseDegrees(x, y, degreeLimit) {
    let dx = 0,
    dy = 0,
    xdiff,
    xPercentage,
    ydiff,
    yPercentage;

    let w = { x: window.innerWidth, y: window.innerHeight };

    // Left (Rotates neck left between 0 and -degreeLimit)
    // 1. If cursor is in the left half of screen
    if (x <= w.x / 2) {
      // 2. Get the difference between middle of screen and cursor position
      xdiff = w.x / 2 - x;
      // 3. Find the percentage of that difference (percentage toward edge of screen)
      xPercentage = xdiff / (w.x / 2) * 100;
      // 4. Convert that to a percentage of the maximum rotation we allow for the neck
      dx = degreeLimit * xPercentage / 100 * -1;
    }

    // Right (Rotates neck right between 0 and degreeLimit)
    if (x >= w.x / 2) {
      xdiff = x - w.x / 2;
      xPercentage = xdiff / (w.x / 2) * 100;
      dx = degreeLimit * xPercentage / 100;
    }
    // Up (Rotates neck up between 0 and -degreeLimit)
    if (y <= w.y / 2) {
      ydiff = w.y / 2 - y;
      yPercentage = ydiff / (w.y / 2) * 100;
      // Note that I cut degreeLimit in half when she looks up
      dy = degreeLimit * 0.5 * yPercentage / 100 * -1;
    }
    // Down (Rotates neck down between 0 and degreeLimit)
    if (y >= w.y / 2) {
      ydiff = y - w.y / 2;
      yPercentage = ydiff / (w.y / 2) * 100;
      dy = degreeLimit * yPercentage / 100;
    }
    return { x: dx, y: dy };
  }

})();