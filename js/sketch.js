var WORLDWIDTH = 4; // number of tiles (cells) 
var WORLDHEIGHT = 8;

var SPRITEWIDTH = WORLDWIDTH*2+2; // include two border outlines
var SPRITEHEIGHT = WORLDHEIGHT+2;

const WIDTH = Math.min(window.innerWidth/1.2, window.innerHeight/1.2); // width of app in pixels
const HEIGHT = Math.min(window.innerWidth/1.2, window.innerHeight/1.2); // height of app in pixels

var GRIDSIZE = HEIGHT/WORLDHEIGHT;


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
  'Wrap_Edges':false
};

// 3x3 moore
var moore_simple_neighborhood = [
  [1,1,1],
  [1,0,1],
  [1,1,1]
];
var neighborhood = moore_simple_neighborhood;

var alive_color_code = "#2E8B9F"

// Implements a cellular automata system
class Cellular_Automata
{
    // specify x,y position, initial state
    constructor(config, neighborhood)
    {
        this.config = config;
        this.neighborhood = neighborhood;

        // a 2D array that cells that can be dead or alive
        this.cells = [];

        // an array of cells that are only alive. We render this this so that we don't waste time looping through empty array elements during render.
        this.cells_alive = [];

        // records cells over time: dimension. i-th element contains the i-th frame of cells
        this.system = [];
        this.system_alive = [];
    }

  // count a single cell's neighbours
  count_neighbours(xPos, yPos, cell_snapshot)
  {
      var n_neighbours = 0;
      for (let a = 0; a < this.neighborhood.length; a++)

      {
          for (let b = 0; b < this.neighborhood[0].length; b++)
          {
              // check if neighborhood item is true, else skip
              if (this.neighborhood[a][b] === 1)
              {
                  // get distance from center of neighborhood to current cell to check in neighborhood
                  var xDist = b - Math.floor(this.neighborhood.length/2);
                  var yDist = a - Math.floor(this.neighborhood[0].length/2);

                  // access cell xDist,yDist away from the center of the cell with global coordinates xPos, yPos
                  // check if within bounds
                  if (!this.config['Wrap_Edges'])
                  {
                      if (xPos+xDist >= 0 && xPos+xDist < this.config['Width'] && yPos+yDist >= 0 && yPos+yDist < this.config['Height'])
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
                          wrap_x = this.config['Width']-1
                      }
                      else if (wrap_x > this.config['Width']-1)
                      {
                          wrap_x = 0
                      }
                      if (wrap_y === -1)
                      {
                          wrap_y = this.config['Height'] - 1
                      }
                      else if (wrap_y > this.config['Height']-1)
                      {
                          wrap_y = 0
                      }
                      // console.log(wrap_y, wrap_x)
                      if (cell_snapshot[wrap_x][wrap_y].state === this.config['Max_State'])
                      {
                          n_neighbours = n_neighbours + 1
                      }
                  }

              }

          }
      }
      return n_neighbours;
  }

  init(use_random_probability = null)
  {
      // array data
      this.cells = [] 
      this.cells_alive = []
      this.system_alive = []
      this.system = []
      for (let x = 0; x < this.config['Width']; ++x)
      {
          this.cells[x] = [];
          for (let y = 0; y < this.config['Height']; ++y)
          {
              // create cell object at (x,y)
              this.cells[x][y] = [];
              // cells[x][y] = new Cell(xPos = x, yPos = y, state = config['Max_State'], rect = );
              if (use_random_probability === null)
              {
                  this.cells[x][y] = new Cell(x, y, 0);
              }
              else
              {
                  this.cells[x][y] = new Cell(x, y, Math.random() > use_random_probability ? 0 : this.config["Max_State"]);
                  if (this.cells[x][y].state > 0)
                  {
                    this.cells_alive.push(this.cells[x][y])
                  }
              }
          }
      }
  }

  // Update system n times (default 1)
  iterate(n=1)
  {
    for (var z = 0; z < n; z++)
    {
        var myCells = this.cells
        // create a copy of the system
        // this is necessary because looping through and updating the system will cause 
        // later cells to be updated based on the *new* cells, which is not what we want
        const cells_read_only = JSON.parse(JSON.stringify(myCells))
        // const cells_read_only = Object.assign({}, myCells)
        var cells_updated = myCells;
        this.cells_alive = [];
        for (let x = 0; x < WORLDWIDTH; ++x)
        {
            for (let y = 0; y < WORLDHEIGHT; ++y)
            {
                // Count neighbours
                // pass in a snapshot of the cell system
                var n_neighbours = this.count_neighbours(x,y, cells_read_only);
                // For dead  (empty) cells
                // Create a new cell at this location if it is dead and contains n_neighbours in rule

                if (this.config['Birth_Rule'].includes(n_neighbours) && cells_read_only[x][y].state === 0)
                {
                    cells_updated[x][y].state = this.config['Max_State'];
                    this.cells_alive.push(cells_updated[x][y])
                }

                // Else check alive cells
                // Keep cell alive if cell contains this many neighbours
                else if (this.config['Alive_Rule'].includes(n_neighbours) && cells_read_only[x][y].state === this.config['Max_State'])
                {
                    cells_updated[x][y].state = this.config[ 'Max_State'];
                    this.cells_alive.push(cells_updated[x][y])
                }
                // Else, cell loses 1 state (state--) or is dead (state=0)
                else
                {
                    cells_updated[x][y].state = Math.max(0, cells_read_only[x][y].state-1)
                    if (cells_updated[x][y].state > 0)
                    {
                      this.cells_alive.push(cells_updated[x][y])
                    }
                }
            }
        }
        // update cells
        this.cells = cells_updated;
        this.system.push(cells_updated);
        this.system_alive.push(this.cells_alive);
    }

  }

}

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
  // square contains color values and its type - "body" or "outline"
  // color is a hex string
  constructor(color, type) 
  {
      this.color = color;
      this.type = type;
  }

}
class Sprite
{
  // pass in a Cellular_Automata object to the sprite which we use to generate the full sprite
  // symmetry refers to the axis of symmetry requested when we flip. Valid values: "none", "vertical", "horizontal", "left diagonal", "right diagonal"
  constructor(cellular_automata, symmetry)
  {
      this.cellular_automata = cellular_automata;
      this.symmetry = symmetry;

      if (symmetry === "vertical")
      {
        this.SpriteWidth = this.cellular_automata.config['Width'] + 2 ;
        this.SpriteHeight = this.cellular_automata.config['Height'] * 2 + 2;
      }
      else if (symmetry === "horizontal")
      {
        this.SpriteWidth = this.cellular_automata.config['Width'] * 2 + 2;
        this.SpriteHeight = this.cellular_automata.config['Height'] + 2;
      }
      else if (symmetry === "center")
      {
        this.SpriteWidth = this.cellular_automata.config['Width'] * 2 + 2;
        this.SpriteHeight = this.cellular_automata.config['Height'] * 2 + 2;
      }
      else
      {
        this.SpriteWidth = this.cellular_automata.config['Width'] + 2;
        this.SpriteHeight = this.cellular_automata.config['Height'] + 2;
      }
      this.graphics = Array(this.SpriteWidth).fill( new Square("ffffff", "empty") )
      .map(x => Array(this.SpriteHeight).fill( new Square("ffffff", "empty") )); // create an empty graphics array to fill with Square objects

  }

  // count surroundings at x,y (left,right,bottom,top,topright,topleft,bottomleft,bottomright)
  // needed to fill outline
  count_neighbours(xPos,yPos)
  {
    var n_neighbours = 0;

    var moore_simple_neighborhood = [
      [1,1,1],
      [1,0,1],
      [1,1,1]
    ];
    var cell_snapshot = this.cellular_automata.cells;

    for (let a = 0; a < moore_simple_neighborhood.length; a++)
    {
        for (let b = 0; b < moore_simple_neighborhood[0].length; b++)
        {
            // check if neighborhood item is true, else skip
            if (moore_simple_neighborhood[a][b] === 1)
            {
                // get distance from center of neighborhood to current cell to check in neighborhood
                var xDist = b - Math.floor(moore_simple_neighborhood.length/2);
                var yDist = a - Math.floor(moore_simple_neighborhood.length/2);

                // access cell xDist,yDist away from the center of the cell with global coordinates xPos, yPos
                // check if within bounds
                if (xPos+xDist >= 1 && xPos+xDist < this.cellular_automata.config['Width'] && yPos+yDist >= 1 && yPos+yDist < this.cellular_automata.config['Height'])
                {
                    // if this cell is alive, update neighbour count
                    if (cell_snapshot[xPos+xDist][yPos+yDist].state === config['Max_State'])
                    {
                        n_neighbours = n_neighbours + 1
                    }
                }
            }
        }
      }
      return n_neighbours;
  }
  // complete the sprite
  generate_sprite()
  {
    // sprite has width+2 and height+2 to account for borders
    // [\ \ \ \]
    // [\ _ _ \]
    // [\ _ _ \]
    // [\ \ \ \]

    // loop through cells
  

    if (this.symmetry == "vertical")
    {
      var limX = Math.ceil(this.SpriteWidth/2);
      var limY = this.SpriteHeight;
    }
    else if (this.symmetry == "horizontal")
    {
      var limX = this.SpriteWidth;
      var limY = Math.ceil(this.SpriteHeight/2);

    }
    else if (this.symmetry == "center")
    {
      var limX = Math.ceil(this.SpriteWidth/2);
      var limY = Math.ceil(this.SpriteHeight/2);

    }

    for (var x = 0; x < limX; x++)
    {
      this.graphics[x] = [];
      for (var y = 0; y < limY; y++)
      {
        this.graphics[x][y] = new Square("#ffffff", "empty")

        var isSquare = false;
        var isEdge = false;
        // check if we are inside the border
        if (x + 1 < this.cellular_automata['Width'] && y + 1 < this.cellular_automata.config['Height'] 
        && this.cellular_automata.cells[x + 1][y + 1].state !== undefined && this.cellular_automata.cells[x + 1][y + 1].state > 0)
        {
          // fill in square at that location
          this.graphics[x][y] = new Square("#0000ff", "body")
          isSquare = true;
        }
        // check if we can fill edge if cell is empty
        else if (this.count_neighbours(x,y) > 0)
        {
          this.graphics[x][y] = new Square("#00ff00", "edge")
          isEdge = true;
        }
        
        // check surroundings 
        // apply symmetry if requested

        // flip on vertical axis of symmetry
        if (this.symmetry == "vertical")
        {
          if (isSquare)
          {
            this.graphics[this.SpriteWidth-x-1][y] = new Square("#0000ff", "body")
          }
          else if (isEdge)
          {
            this.graphics[this.SpriteWidth-x-1][y] = new Square("#00ff00", "edge")
          }
        }
        else if (this.symmetry == "horizontal")
        {
          if (isSquare)
          {
            this.graphics[x-1][y-1] = new Square("#000000", "body")
          }
          else if (isEdge)
          {
            this.graphics[x-1][y-1] = new Square("#000000", "edge")
          }
        }
        else if (this.symmetry == "center")
        {
          if (isSquare)
          {
            this.graphics[x-1][y-1] = new Square("#000000", "body")
          }
          else if (isEdge)
          {
            this.graphics[x-1][y-1] = new Square("#000000", "edge")
          }
        }

      }
    }
  }
}

var System = new Cellular_Automata(config, neighborhood);
function setup() {
  createCanvas(WIDTH, HEIGHT);
  frameRate(10);
  System.init(0.5);
  System.iterate(3);
  mySprite = new Sprite(System, "vertical")
  mySprite.generate_sprite();
}

function draw() {
  background(220);
  noStroke()
    // loop through only alive cells to speedup rendering
    for (var x = 0; x < mySprite.SpriteWidth; x++)
    {
      for (var y = 0; y < mySprite.SpriteHeight; y++)
      {
        var squareColor = mySprite.graphics[x][y].color;
        fill(squareColor);

        rect(x*GRIDSIZE, y*GRIDSIZE,GRIDSIZE,GRIDSIZE)

      }
    }


}