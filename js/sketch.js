var WORLDWIDTH = 4; // number of tiles (cells) 
var WORLDHEIGHT = 8;

var SPRITEWIDTH = WORLDWIDTH*2+2; // include two border outlines
var SPRITEHEIGHT = WORLDHEIGHT+2;

const WIDTH = Math.min(window.innerWidth/1.2, window.innerHeight/1.2); // width of app in pixels
const HEIGHT = Math.min(window.innerWidth/1.2, window.innerHeight/1.2); // height of app in pixels

var GRIDSIZE = HEIGHT/WORLDHEIGHT;

var wrap_edges = false;

var cells = [] // a 2D array that cells that can be dead or alive
var cells_alive = [] // an array of cells that are only alive. We render this this so that we don't waste time looping through empty array elements during render.
var system = []; // records cells over time: dimension. i-th element contains the i-th frame of cells
var system_alive = [];

var sprite = [] // a 2D array containing the complete sprite (including )

var max_iteration = 2; // stop after 3 iterations
var finished = false;
var time = 0;

var config = {
  'Name':"Conway's Game of Life",
  'Type':moore_simple_neighborhood,
  'Birth_Rule':[0,1],
  'Alive_Rule':[2,3],
  'Max_State':1,
  'Width':WORLDWIDTH,
  'Height':WORLDHEIGHT,
};

// 3x3 moore
var moore_simple_neighborhood = [
  [1,1,1],
  [1,0,1],
  [1,1,1]
];
var neighborhood = moore_simple_neighborhood;

var alive_color_code = "#2E8B9F"


// A cell object is simply a square on a grid with a state
class Cell
{
    // specify x,y position, initial state
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

class Square
{
  // square contains rgb values and its type - "body" or "outline"
  constructor(r, g, b, type) 
  {
      this.r = r;
      this.g = g;
      this.b = b;
      this.type = type;
  }

}
class Sprite
{
  // final_system is a 2D array used to generate the final sprite
  // initial_system is the seed 2D array that, when iterated through using the appropriate rule, will yield the final_system
  // config is the ruleset used to generate the final_system (e.g. Conway's Game of Life or Brian's Brain)
  // symmetry refers to the axis of symmetry requested when we flip. Valid values: "none", "vertical", "horizontal", "left diagonal", "right diagonal"
  constructor(final_system, initial_system, config, symmetry)
  {
      this.final_system = final_system;
      this.initial_system = initial_system;
      this.config = config;
      this.symmetry_type = symmetry;
      this.graphics = [] // create an empty graphics array to fill with squares
      
  }
  // completes the sprite
  generate_sprite()
  {
    for (var x = 0; x < this.config['Width']; x++)
    {
      this.graphics[x] = [];
      for (var y = 0; y < this.config['Height']; y++)
      {
        if (this.final_system[x][y].state > 0)
        {
          // fill in square at that location
          this.graphics[x][y] = new Square(40,40,40, "body")

          // apply symmetry
          if (this.symmetry == "vertical")
          {

          }
          else if (this.symmetry == "horizontal")
          {

          }
          else if (this.symmetry == "l_diagonal")
          {

          }
          else if (this.symmetry == "r_diagonal")
          {

          }
        }
        // square is empty, so check neighbours to fill edge
        else if (count_neighbours(x, y, this.final_system) > 0)
        {
          this.graphics[x][y] = new Square(0,0,0, "outline")
        }
      }
    }
  }
}

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
}

var init = function (use_random_probability = null)
{
    // array data
    cells = [] 
    cells_alive = []
    system_alive = []
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
                  cells_alive.push(cells[x][y])
                }
            }
        }
    }
}

// Update system by one time step
var iterate = function(myCells)
{
    // create a copy of the system
    // this is necessary because looping through and updating the system will cause 
    // later cells to be updated based on the *new* cells, which is not what we want
    const cells_read_only = JSON.parse(JSON.stringify(myCells))
    // const cells_read_only = Object.assign({}, myCells)
    var cells_updated = myCells;
    cells_alive = [];
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
                cells_alive.push(cells_updated[x][y])

            }

            // Else check alive cells
            // Keep cell alive if cell contains this many neighbours
            else if (config['Alive_Rule'].includes(n_neighbours) && cells_read_only[x][y].state === config['Max_State'])
            {
                cells_updated[x][y].state = config[ 'Max_State'];
                cells_alive.push(cells_updated[x][y])
            }
            // Else, cell loses 1 state (state--) or is dead (state=0)
            else
            {
                cells_updated[x][y].state = Math.max(0, cells_read_only[x][y].state-1)
                if (cells_updated[x][y].state > 0)
                {
                  cells_alive.push(cells_updated[x][y])
                }

            }
        }
    }
    // update cells
    return cells_updated;
}




function setup() {
  createCanvas(WIDTH, HEIGHT);
  frameRate(10);
  init(Math.random());

}

function draw() {
  background(220);
  stroke(0)
    // loop through only alive cells to speedup rendering
    for (var z = 0; z < cells_alive.length; ++z)
    {
        var squareColor = color(alive_color_code);
        squareColor.setAlpha(cells_alive[z].state/config['Max_State']*255);
        fill(squareColor);

        rect(cells_alive[z].x*GRIDSIZE, cells_alive[z].y*GRIDSIZE,GRIDSIZE,GRIDSIZE)
        if (finished)
        {
          rect((WORLDWIDTH*2 - cells_alive[z].x - 1)*GRIDSIZE, cells_alive[z].y*GRIDSIZE,GRIDSIZE,GRIDSIZE)
        }
    }

  // limit iterations
  if (time < max_iteration)
  {
    cells = iterate(cells);
    time += 1;
  }
  else if (time >= max_iteration && !finished)
  {
    finished = true;
  }

}