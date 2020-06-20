


const WIDTH = Math.min(window.innerWidth/1.2, window.innerHeight/1.2); // width of app in pixels
const HEIGHT = Math.min(window.innerWidth/1.2, window.innerHeight/1.2); // height of app in pixels

var WORLDWIDTH = 64; // number of tiles (cells) 
var WORLDHEIGHT = 64;
var OFFSET = 0; // grid spacing in pixels (set to 0 for no spacing)
var STROKE = 0;
var ROUNDNESS = 0; // round corners of grid squares
var GRIDSIZE = WIDTH/WORLDWIDTH-OFFSET;
var MAX_SYSTEM_LENGTH = 5000;
var MAX_STATE = 1;
// var alive_color_code = '#00f0cf';
// var alive_color_code = '#ffffff';
// var alive_color_code = "#007bff"
var alive_color_code = "#2E8B9F"

var myCanvas;
var dead_color_code = 0x0000ff;

var stopped = false;
var iterateOnce = false;
var change_canvas_size = false;
var wrap_edges = true; 
var fps_requested = 120; // 60 fps unless set otherwise


var fpsCap = false;

var cells = []
var cells_graphics = []
var system = []; // records cells over time: dimension. i-th element contains the i-th frame of cells
var system_graphics = [];

var cell_alive_count = [] // number of alive cells per iteration 

// setup interactive page elements
var fpsSlider = document.getElementById("fpsSlider");
var fpsValueDisplay = document.getElementById("fpsValue");

// 9x9 neighbourhood, much more than enough for Vonn Neumann / Moore
// 1 added at center for reference
// var neighborhood =  [[0,0,0,0,0,0,0,0,0],
//                      [0,0,0,0,0,0,0,0,0],
//                      [0,0,0,0,0,0,0,0,0],
//                      [0,0,0,0,0,0,0,0,0],
//                      [0,0,0,0,1,0,0,0,0],
//                      [0,0,0,0,0,0,0,0,0],
//                      [0,0,0,0,0,0,0,0,0],
//                      [0,0,0,0,0,0,0,0,0],
//                      [0,0,0,0,0,0,0,0,0]];
// use Moore as default
// neighborhood =     [[0,0,0,0,0,0,0,0,0],
//                     [0,0,0,0,0,0,0,0,0],
//                     [0,0,0,0,0,0,0,0,0],
//                     [0,0,0,1,1,1,0,0,0],
//                     [0,0,0,1,0,1,0,0,0],
//                     [0,0,0,1,1,1,0,0,0],
//                     [0,0,0,0,0,0,0,0,0],
//                     [0,0,0,0,0,0,0,0,0],
//                     [0,0,0,0,0,0,0,0,0]];

// 3x3 moore
var moore_simple_neighborhood = [
    [1,1,1],
    [1,0,1],
    [1,1,1]
];

// // 3x3 von neumann
var von_neumann_simple_neighborhood = [
    [0,1,0],
    [1,0,1],
    [0,1,0]
];

var neighborhood = moore_simple_neighborhood;

// Default config
var config = {
    'Name':"Conway's Game of Life",
    'Type':moore_simple_neighborhood,
    'Birth_Rule':[3],
    'Alive_Rule':[2,3],
    'Max_State':1
};
// read configs from configs.json and populate the rule preset dropdown list

let rules_dropdown = $("#rules_dropdown")

console.log(rules_dropdown.length)
rules_dropdown.empty()
var rule_configs;

class Cell
{
    // specify x,y position, initial state, and Pixi Graphics object (rect)
    constructor(xPos, yPos, state)
    {
        this.x = xPos;
        this.y = yPos;
        this.state = state;
        // this.rect = rect;
    }

    setState(number)
    {
        this.state = number;
    }
}

var reset_button = function()
{
    init();
    // iterate_once();
}
var seed_random = function()
{
    // clear_everything();

    var prob = document.getElementById("seed_probability").value
    document.getElementById("popPct").innerHTML = "("+Math.floor(parseFloat(prob)*100)+"%"+")"
    init(prob);
    // iterate_once();

}

// gets window settings from user form and resets system
var set_size = function()
{
    clear_everything();
    WORLDWIDTH = document.getElementById("gridwidth").value
    WORLDHEIGHT = document.getElementById("gridheight").value
    GRIDSIZE = WIDTH/WORLDWIDTH-OFFSET;


    var prob = document.getElementById("seed_probability").value

    
    change_canvas_size = true;
    wrap_edges = document.getElementById("wrap_around").checked
    init(prob);
    // iterate_once();
}

function set_tile_graphics()
{

    clear_everything();
    ROUNDNESS = document.getElementById("tileroundness").value
    OFFSET = document.getElementById("tilespacing").value
    
    init();
    // iterate_once();
    

}

// reads selected preset, fills in values and resets system
var set_rule_preset = function(alive, birth, max_state)
{
    // console.log(rule_configs)

    // fill in birth and alive values
    var alive_input = document.getElementById("alive_rule")
    var birth_input = document.getElementById("birth_rule")
    var nStates_input = document.getElementById("nStates")

    alive_input.value = alive
    birth_input.value = birth
    nStates_input.value = max_state+1

    config['Alive_Rule'] = alive
    config['Birth_Rule'] = birth
    config['Max_State'] = max_state
    var prob = document.getElementById("seed_probability").value


    clear_everything();
    init(prob)
    // iterate_once();

}

// gets rules from user form and resets system
var set_rules = function()
{
    config['Alive_Rule'] = parse_input(document.getElementById("alive_rule").value)
    config['Birth_Rule'] = parse_input(document.getElementById("birth_rule").value)
    config['Max_State'] = document.getElementById("nStates").value-1
    
    var prob = document.getElementById("seed_probability").value

    clear_everything();
    init(prob)
    // iterate_once();

}


function keyboard(value) {
    let key = {};
    key.value = value;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    //The `downHandler`
    key.downHandler = event => {
      if (event.key === key.value) {
        if (key.isUp && key.press) key.press();
        key.isDown = true;
        key.isUp = false;
        event.preventDefault();
      }
    };
  
    //The `upHandler`
    key.upHandler = event => {
      if (event.key === key.value) {
        if (key.isDown && key.release) key.release();
        key.isDown = false;
        key.isUp = true;
        event.preventDefault();
      }
    };
  
    //Attach event listeners
    const downListener = key.downHandler.bind(key);
    const upListener = key.upHandler.bind(key);
    
    window.addEventListener(
      "keydown", downListener, false
    );
    window.addEventListener(
      "keyup", upListener, false
    );
    
    // Detach event listeners
    key.unsubscribe = () => {
      window.removeEventListener("keydown", downListener);
      window.removeEventListener("keyup", upListener);
    };
    
    return key;
  }


// playback functions
var toggle_play = function()
{
    // var pause_play_button = document.getElementById("pause_play_button")
    if (stopped)
    {
        // replace pause button with play button
        // pause_play_button.src = "../icons/play_arrow-white-24dp.svg"
    }
    else
    {
        // replace play button with pause button
        // pause_play_button.src = "../icons/pause-white-24dp.svg"
    }
    stopped = !stopped;
    
}

var iterate_once = function()
{
    stopped = true;
    iterateOnce = !iterateOnce;
}





  var parse_input = function(myInput)
  {
      var unique_count = [];
      var items_list = myInput.split(",")
      for (let item of items_list)
      {
          if (item.includes("-"))
          {
              var splitRange = item.split('-').map(Number);
              for (let i = splitRange[0]; i <= splitRange[1]; i++)
              {
                  unique_count.push(i);
              }
          }
          else
          {
              unique_count.push(parseInt(item))
          }
      }
      // return unique
    //   console.log(unique_count)
      return Array.from(new Set(unique_count))
  
  }

function clear_everything(clear_system = true, clear_cells = true)
{
    cells_graphics = [];

    // Optionally: delete system (history) and cells. Done by default
    if (clear_system) {
        system = [];
        system_graphics = [];
    }
    if (clear_cells)
    {
        cells = [];
        cells_graphics = [];
    }
}

// set cell color
var set_color = function(requestedColor)
{
  alive_color_code = requestedColor

}


var set_fps = function()
{
  fps_requested = document.getElementById("fpsSlider").value
}

// called while the user is dragging the history slider
// continuously redraw the history

var set_history = function(manually_request_time = null, set_end = true, draw_interactivity = true)
{
    stopped = true;
    var historySlider = document.getElementById("historySlider")
    var time;
    // manually_request_time is set to null when we are using the slider
    if (manually_request_time === null)
    {
        time = historySlider.value
    }
    else
    {
        time = manually_request_time
    }

    if (time >= 0)
    {
 
        // revert back to frame
        time = Math.max(0,time)
        cells = system[time];
        cells_graphics = system_graphics[time];
        historySlider.value = time
    
        // system = system.slice(0,time);
        var iterationNum_text = document.getElementById("iterationNum");
        iterationNum_text.innerText = time
    
        if (manually_request_time !== null && set_end === true)
        {
            set_history_end()
        }
    }

}

// called when the user stops dragging the history slider
var set_history_end = function()
{
    var historySlider = document.getElementById("historySlider")

    if (system.length > 1)
    {
        system = system.slice(0,historySlider.value+1)
        system_graphics = system_graphics.slice(0,historySlider.value+1)
    }
    else
    {
      system = [system[0]]
      system_graphics = [system_graphics[0]]

    }
    
    historySlider.max = system.length-1

}

var set_history_back_one = function()
{
  var itnum = parseInt(document.getElementById("iterationNum").innerHTML)-1
  set_history(itnum, true, false)
}

// setup space key as stop frame
let spaceKey = keyboard(" ");
spaceKey.press = () => {
    toggle_play();
};

let qKey = keyboard("q");
qKey.press = () => {
    clear_everything();
    init()
    // iterate_once();
};

let leftKey = keyboard("ArrowLeft");
leftKey.press = () => {
  set_history_back_one();
};

let rightKey = keyboard("ArrowRight");
rightKey.press = () => {
  iterate_once();
};
let upKey = keyboard("ArrowUp");
upKey.press = () => {
  set_history(0,false,false);
};
let rKey = keyboard("r");
rKey.press = () => {
  var prob = document.getElementById("seed_probability").value
  init(prob)
};


// initialize grid
// Populate the world with cells (assume all are dead, aka state=0)
var init = function (use_random_probability = null)
{
    // array data
    cells = [] 
    cells_graphics = []
    system_graphics = []
    system = []
    for (let x = 0; x < WORLDWIDTH; ++x)
    {
        cells[x] = [];
        for (let y = 0; y < WORLDHEIGHT; ++y)
        {

            // create cell object at (x,y)
            cells[x][y] = [];
            // cells[x][y] = new Cell(xPos = x, yPos = y, state = config['Max_State'], rect = );
            if (use_random_probability === null)
            {
                cells[x][y] = new Cell(x, y, 0);
            }
            else
            {
                cells[x][y] = new Cell(x, y, Math.random() > use_random_probability ? 0 : config["Max_State"]);
                if (cells[x][y].state > 0)
                {
                  cells_graphics.push(cells[x][y])
                }
            }
        }
    }
    var iterationNum_text = document.getElementById("iterationNum");
    iterationNum_text.innerText = 0

    system.push(JSON.parse(JSON.stringify(cells)));
    system_graphics.push(JSON.parse(JSON.stringify(cells_graphics)));
    cell_alive_count.push(0)

}
// draw rectangle
// drawRoundedRect(x, y, width, height, cornerRadius)
// add button listeners

// document.getElementById("beginning").addEventListener("click", () => set_history(0))

// document.getElementById("back_one").addEventListener("click", () => set_history(Math.max(0,parseInt(document.getElementById("iterationNum").innerText)-1)))

// document.getElementById("play_pause").addEventListener("click", () => toggle_play())
// document.getElementById("forward_one").addEventListener("click", () => iterate_once())
// // document.getElementById("end").addEventListener("click", set_history(system.length
// document.getElementById("reset_button").addEventListener("click", () => reset_button())
// document.getElementById("random_button").addEventListener("click", () => seed_random())

// document.getElementById("historySlider").onchange = set_history_end;
// document.getElementById("historySlider").addEventListener("input", () => set_history())

// document.getElementById("set_size").addEventListener("click", () => set_size())
// document.getElementById("rules_dropdown").onchange = set_rule_preset


// document.getElementById("set_rules").addEventListener("click", () => set_rules())

// document.getElementById("generate_model").addEventListener("click", () => generate_model())

// count a single cell's neighbours
var count_neighbours = function(xPos, yPos, cell_snapshot)
{
    var n_neighbours = 0;
    for (let a = 0; a < neighborhood.length; a++)
    {
        for (let b = 0; b < neighborhood[0].length; b++)
        {
            // check if neighborhood item is true, else skip
            if (neighborhood[a][b] === 1)
            {
                // get distance from center of neighborhood to current cell to check in neighborhood
                var xDist = b - Math.floor(neighborhood.length/2);
                var yDist = a - Math.floor(neighborhood[0].length/2);
                var finalX = xDist+xPos 
                var finalY = yDist+yPos

                // access cell xDist,yDist away from the center of the cell with global coordinates xPos, yPos
                // check if within bounds
                if (!wrap_edges)
                {
                    if (xPos+xDist >= 0 && xPos+xDist < WORLDWIDTH && yPos+yDist >= 0 && yPos+yDist < WORLDHEIGHT)
                    {
                        // if this cell is alive, update neighbour count
                        if (cell_snapshot[xPos+xDist][yPos+yDist].state === config['Max_State'])
                        {
                            n_neighbours = n_neighbours + 1
                        }
                    }
                
                }
                else
                {
                    var wrap_x = xPos+xDist;
                    var wrap_y = yPos+yDist;
                    if (wrap_x === -1)
                    {
                        wrap_x = WORLDWIDTH-1
                    }
                    else if (wrap_x > WORLDWIDTH-1)
                    {
                        wrap_x = 0
                    }
                    if (wrap_y === -1)
                    {
                        wrap_y = WORLDHEIGHT - 1
                    }
                    else if (wrap_y > WORLDHEIGHT-1)
                    {
                        wrap_y = 0
                    }
                    // console.log(wrap_y, wrap_x)
                    if (cell_snapshot[wrap_x][wrap_y].state === config['Max_State'])
                    {
                        // console.log("hi")
                        n_neighbours = n_neighbours + 1
                    }
                }

            }

        }
    }
    return n_neighbours;

    // return Math.max(0,n_neighbours);
}


// Update system by one time step
var iterate = function(myCells)
{
    // create a copy of the system
    // this is necessary because looping through and updating the system will cause 
    //      later cells to be updated based on the *new* cells, which is not what we want
    const cells_read_only = JSON.parse(JSON.stringify(myCells))
    // const cells_read_only = Object.assign({}, myCells)
    var cells_updated = myCells;
    cells_graphics = [];
    for (let x = 0; x < WORLDWIDTH; ++x)
    {
        for (let y = 0; y < WORLDHEIGHT; ++y)
        {
            // Count neighbours
            // pass in a snapshot of the cell system
            var n_neighbours = count_neighbours(x,y, cells_read_only);
            // console.log(x,y, n_neighbours)
            // For dead  (empty) cells
            // Create a new cell at this location if it is dead and contains n_neighbours in rule

            if (config['Birth_Rule'].includes(n_neighbours) && cells_read_only[x][y].state === 0)
            {
                cells_updated[x][y].state = config['Max_State'];
                cells_graphics.push(cells_updated[x][y])

            }

            // Else check alive cells
            // Keep cell alive if cell contains this many neighbours
            else if (config['Alive_Rule'].includes(n_neighbours) && cells_read_only[x][y].state === config['Max_State'])
            {
                cells_updated[x][y].state = config[ 'Max_State'];
                cells_graphics.push(cells_updated[x][y])
            }
            // Else, cell loses 1 state (state--) or is dead (state=0)
            else
            {
                cells_updated[x][y].state = Math.max(0, cells_read_only[x][y].state-1)
                if (cells_updated[x][y].state > 0)
                {
                  cells_graphics.push(cells_updated[x][y])
                }

            }
        }
    }
    // update cells
    return cells_updated;
}

// ///////// Three.js code for rendering stacked
var generate_model = function()
{
    var scene = new THREE.Scene();
    var myWidth = window.innerWidth*2/3
    var myHeight = window.innerHeight*2/3
    // var square = Math.min(window.innerWidth*2/3, window.innerHeight*2/3)
    var three_canvas = document.getElementById("three_canvas")
    var camera = new THREE.OrthographicCamera(myWidth  / -4, 
      myWidth  / 4   , myHeight / 4, myHeight / -4, -10000, 10000);
    var renderer = new THREE.WebGLRenderer( { canvas: three_canvas } );
    renderer.setSize(myWidth, myHeight);
    scene.background = new THREE.Color('white');

    var faces = [
        { // left
          dir: [ -1,  0,  0, ],
          corners: [
            [ 0, 1, 0 ],
            [ 0, 0, 0 ],
            [ 0, 1, 1 ],
            [ 0, 0, 1 ],
          ],
        },
        { // right
          dir: [  1,  0,  0, ],
          corners: [
            [ 1, 1, 1 ],
            [ 1, 0, 1 ],
            [ 1, 1, 0 ],
            [ 1, 0, 0 ],
          ],
        },
        { // bottom
          dir: [  0, -1,  0, ],
          corners: [
            [ 1, 0, 1 ],
            [ 0, 0, 1 ],
            [ 1, 0, 0 ],
            [ 0, 0, 0 ],
          ],
        },
        { // top
          dir: [  0,  1,  0, ],
          corners: [
            [ 0, 1, 1 ],
            [ 1, 1, 1 ],
            [ 0, 1, 0 ],
            [ 1, 1, 0 ],
          ],
        },
        { // back
          dir: [  0,  0, -1, ],
          corners: [
            [ 1, 0, 0 ],
            [ 0, 0, 0 ],
            [ 1, 1, 0 ],
            [ 0, 1, 0 ],
          ],
        },
        { // front
          dir: [  0,  0,  1, ],
          corners: [
            [ 0, 0, 1 ],
            [ 1, 0, 1 ],
            [ 0, 1, 1 ],
            [ 1, 1, 1 ],
          ],
        },
      ];


    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(WORLDWIDTH/2, WORLDHEIGHT/2, system.length/2);
    controls.enableKeys = true
    controls.autoRotate = true
    controls.autoRotateSpeed = 2
    camera.position.z = system.length/2;
    // controls.minAzimuthAngle = 2* Math.PI;
    // controls.maxAzimuthAngle = 0;
    // controls.enabled = false;
    camera.up = new THREE.Vector3( 0, 1, 0);
    camera.lookAt(WORLDWIDTH/2, WORLDHEIGHT/2, system.length/2);
    
    camera.fov = 30;
    camera.updateProjectionMatrix();
    
    controls.keys = {
        LEFT: 83, //left arrow
        UP: 87, // up arrow
        RIGHT: 68, // right arrow
        BOTTOM: 65 // down arrow
    }
    // controls.update();



    const positions = [];
    const normals = [];
    const indices = [];


    // generate the system
    for (let t = 0; t < system.length; t++)
    {
        for (let x = 0; x < WORLDWIDTH; x++)
        {
            for (let y = 0; y < WORLDHEIGHT; y++)
            {
                if (system[t][x][y].state !== 0)
                {
                    // check neighbouring voxels and remove faces if adjacent
                    // check all directions
                    for (const {dir, corners} of faces) {
                        
                        // if adjacent exists, cull faces
                        if (!((t+dir[2] >= 0 && t+dir[2] < system.length && x + dir[0] >= 0 && x + dir[0] < WORLDWIDTH && y + dir[1] >= 0 && y + dir[1] < WORLDHEIGHT) && system[t+dir[2]][x + dir[0]][y + dir[1]].state > 0))
                        {
                            const ndx = positions.length / 3;
                            for (const pos of corners) {
                              positions.push(pos[0] + x, pos[1] + y, pos[2] + t);
                              normals.push(...dir);
                            }
                            indices.push(
                              ndx, ndx + 1, ndx + 2,
                              ndx + 2, ndx + 1, ndx + 3,
                            );
                        }
                    }
    
                }
            }
        }
    }

    const geometry = new THREE.BufferGeometry();


    


    var colors = [0xFFFFFF, 0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0x00FFFF, 0xFF00FF, 0x3366CC, 0x33CC66, 0x3399CC, 0xFF6633, 0xFF9999, 0x00CCCC, 0x00FF99, 0xFFCC00, 0xFFCCCC]
	var light = new THREE.PointLight(0xffffff);
	light.position.set(0,0,0);
  scene.add(light);
  
    const positionNumComponents = 3;
    const normalNumComponents = 3;
    geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));
    geometry.setAttribute(
        'normal',
        new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents));
    geometry.setIndex(indices);
    geometry.computeBoundingBox();
    

    // var myboundingBox = geometry.boundingBox;
    // camera.zoom = Math.min(square / (myboundingBox.max.x - myboundingBox.min.x),
    // square / (myboundingBox.max.y - myboundingBox.min.y));

    var material = new THREE.ShaderMaterial({
        uniforms: {
          color1: {
            // value: new THREE.Color(colors[Math.floor(Math.random()*colors.length)])
            value: new THREE.Color(Math.random()*255*255*255)
          },
          color2: {
            value: new THREE.Color(Math.random()*255*255*255)
          },
          bboxMin: {
            value: geometry.boundingBox.min
          },
          bboxMax: {
            value: geometry.boundingBox.max
          }
        },
        vertexShader: `
          uniform vec3 bboxMin;
          uniform vec3 bboxMax;
        
          varying vec3 vUv;
      
          void main() {
            vUv.y = (position.y - bboxMin.y) / (bboxMax.y - bboxMin.y);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color1;
          uniform vec3 color2;
        
          varying vec3 vUv;
          
          void main() {
            
            gl_FragColor = vec4(mix(color1, color2, vUv.y), 1.0);
          }
        `,
      });    
      // sub vUv.y with vUv.z for varying effects
    material.needsUpdate = true;
    const mesh = new THREE.Mesh(geometry, material);
    
    scene.add(mesh);

    // camera.position.z = system.length/2;
    // camera.position.x = system.length/2;
    // camera.position.y = system.length/2;

    // setup dispose function when closed button
    var dispose_model = function()
    {
        console.log("disposed")
        // mesh.dispose();
        mesh.geometry.dispose();
        mesh.material.dispose();
        material.dispose();
        geometry.dispose();

        scene.remove(mesh);
        controls.dispose();
        scene.dispose();
    }

    var export_to_obj = function()
    {
        console.log("exporting")

        var exporter = new THREE.OBJExporter();
        var file_content = exporter.parse(mesh)

        var file = new Blob( [ file_content ], { type: 'text/plain' })
        saveAs.saveAs( file, config['Alive_Rule'] + "-" + config['Birth_Rule'] + "-" 
        + (config["Max_State"]+1)  + "-" + "generation" + (system.length-1) + '.obj' );

    }

    // cleanup when modal is hidden
    $("#model_modal").on("hidden.bs.modal", dispose_model); 
    
    document.getElementById("export_to_obj").addEventListener("click", () => export_to_obj(), {once : true})


    // setup export
    var animate_three = function () {
        requestAnimationFrame( animate_three );

        renderer.render( scene, camera );

        controls.update();
        // mesh.rotation.y += 0.01
        // mesh.rotation.z += 0.02
        // mesh.rotateX += 1
    };
    animate_three();
}

function cellular_sketch (sketch) {
// const s = ( sketch ) => {
  var canvas;
  // var capturer;
  sketch.setup = () => {
    myCanvas = sketch.createCanvas(WIDTH, HEIGHT);
    init(0.2);
    canvas = myCanvas.canvas
    // add listeners
    // var recbutton = document.getElementById("recbutton")
    // document.getElementById("recbutton").addEventListener("click", () => start_record())
  };

  sketch.draw = () => {

    if (change_canvas_size)
    {
      change_canvas_size = false;
      var ratio = Math.min(WIDTH/WORLDWIDTH, HEIGHT/WORLDHEIGHT)
      console.log(ratio)
      sketch.resizeCanvas(ratio*WORLDWIDTH, ratio*WORLDHEIGHT)
      GRIDSIZE = ratio
    }

    var historySlider = document.getElementById("historySlider")
    historySlider.max = system.length-1

    wrap_edges = document.getElementById("wrap_around").checked
    
    // handle FPS
    fps_requested = parseInt(document.getElementById("fpsSlider").value)
    document.getElementById("checkFpsCap_text").innerHTML = fps_requested

    sketch.frameRate(fps_requested)

    if (iterateOnce)  
    {
        stopped = false;
    }

    // handle loop
    if (!stopped)
    {
        var iterationNum_text = document.getElementById("iterationNum");
    
        // historySlider.value += 1

        cells = iterate= iterate(cells);
        iterationNum_text.innerText = parseInt(iterationNum_text.innerText)+1

        historySlider.disabled = false;

        system.push(JSON.parse(JSON.stringify(cells)));
        system_graphics.push(JSON.parse(JSON.stringify(cells_graphics)));
        cell_alive_count.push(system_graphics.length)

        if (system.length > MAX_SYSTEM_LENGTH)
        {
          system.shift();
          system_graphics.shift();

        }

        // stopped = !stopped
    }
    else
    {

        historySlider.disabled = false;
    }

    // handle drawing
    // sketch.background(231,245,248);
    sketch.noStroke() 

    // loop through only alive cells to speedup rendering
    for (var z = 0; z < cells_graphics.length; ++z)
    {

        var squareColor = sketch.color(alive_color_code);
        squareColor.setAlpha(cells_graphics[z].state/config['Max_State']*255);
        sketch.fill(squareColor);
        // sketch.stroke(STROKE)
        sketch.rect(cells_graphics[z].x*GRIDSIZE, cells_graphics[z].y*GRIDSIZE,GRIDSIZE,GRIDSIZE)
  }

  if (iterateOnce)  
  {
      iterateOnce = false;
      stopped = true;
  }

}
    sketch.mouseDragged = () => {
      var x_cell = Math.trunc(sketch.mouseX / (GRIDSIZE+OFFSET))
      var y_cell = Math.trunc(sketch.mouseY / (GRIDSIZE+OFFSET))

      if (x_cell < WORLDWIDTH && x_cell >= 0 && y_cell < WORLDHEIGHT && y_cell >= 0)
      if (cells[x_cell][y_cell].state === 0)
      {
        cells[x_cell][y_cell].state = config['Max_State']
        cells_graphics.push(cells[x_cell][y_cell])
      }
    }
    sketch.mousePressed = () => {

      var x_cell = Math.trunc(sketch.mouseX / (GRIDSIZE+OFFSET))
      var y_cell = Math.trunc(sketch.mouseY / (GRIDSIZE+OFFSET))

      if (x_cell < WORLDWIDTH && x_cell >= 0 && y_cell < WORLDHEIGHT && y_cell >= 0)
      if (cells[x_cell][y_cell].state === 0)
      {
        cells[x_cell][y_cell].state = config['Max_State']
        cells_graphics.push(cells[x_cell][y_cell])
      }
    }
};
