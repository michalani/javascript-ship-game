/*
    Assingment by Michal Anisimow SID: 201362335
    In this assingment I've decided not to use classes as IE11 doesn't support them as described below:
    https://kangax.github.io/compat-table/es6/
*/ 
//Default variable names
gameBoardID = "gameBoard";
var userEntity = "Submarine";
var playerID = "U", enemyID = "K", obstacleID = "O", emptySpaceID = " ",pointID="5";
var stage = "setup";
var stage0 = "setup",stage1 = "play", stage2 = "end";

var playerX, playerY;
var enemies = new Array();
var obstacles = new Array();
var points = new Array();
var isObstacle = false;
var isEnemy = false;
var boardY = 10,
  boardX = 10;
var currentRound = 0;
var msg = "messageBox";
var msgEnd = "theEndMessageH1";
var tmpYX;
var board,table,distanceFromPointY,distanceFromPointX,movePlayer,tmpPlayerX
,tmpPlayerY,messageBox;

//variables used for statistics
var playersCount = 0,
  enemiesCount = 0,
  obstaclesCount = 0,
  userPointsCount = 0,
  enemyPointsCount = 0;
  var totalPoints = 0;
  var currentFuel = 10;
  var v = 1;


//structure the gameboard
game(boardY, boardX);

function game(boardY, boardX) {
  board = createBoardArray(boardY, boardX);
  table = document.getElementById(gameBoardID);
  init(table);
}

//create the board as array
function createBoardArray(cols, rows) {
  var arr = new Array(cols);
  for (var i = 0; i < arr.length; i++) {
    arr[i] = new Array(rows);
  }
  return arr;
}

//initialize the board array
function init(table) {
  for (var y = 0; y < board.length; y++) {
    var tr = document.createElement("tr");
    table.appendChild(tr);
    for (var x = 0; x < board[y].length; x++) {
      var td = document.createElement("td");
      var txt = document.createTextNode(emptySpaceID);
      td.appendChild(txt);
      td.addEventListener("click", play.bind(null, y, x), false);
      tr.appendChild(td);
    }
  }
}


function play(y, x, event) {
  //capture the keypresses
  document.onkeypress = function (e) {
    e || window.event;
    var pressed = String.fromCharCode(e.charCode).toUpperCase();
    setMessage("", msg);
    console.log(pressed + " =" + x + ":" + y);
    //if still in setup
    if (stage == stage0) {
      //if clicked on empty cell
      if (board[y][x] == undefined) {
        //if inputted player and player doesn't exist
        if (pressed == playerID && playersCount != 1) {
          playersCount = 1;
          drawImageInCell("player.png", y, x, null, null);
          board[y][x] = pressed;
          playerX = x;
          playerY = y;
          //else if player was already placed
        } else if (pressed == playerID && playersCount == 1) {
          setMessage(userEntity + " was already placed!", msg);
          //else if inputted enemy place it
        } else if (pressed == enemyID) {
          pushNewElement(enemyID,enemies,pressed,y,x);
          enemiesCount += 1;
         //else if inputted point place it
        } else if (pressed > 4 && pressed < 10) {
          pushNewElement(pressed,points,pressed,y,x);
          totalPoints += parseInt(board[y][x]);
          //else if inputted obstacle place it
        } else if (pressed == obstacleID) {
          pushNewElement(obstacleID,obstacles,pressed,y,x);
          obstaclesCount += 1;
          //else error the input
        } else {
          setMessage("Unrecognized character!", msg);
        }
        //else the cell is already occupied.
      } else {
        setMessage("That cell is already occupied!", msg);
      }
      //if "play" stage and one player is alive
    } else if (stage == stage1 && playersCount == 1) {
      userMove(pressed);
      showStatistics(true);
    }
  };
}

//end() was clicked by the user
function end(){
  if(stage==stage1){
    stage = stage2;
    totalPoints = userPointsCount+enemyPointsCount;
    pointsCheck();  
  } 
}

//push new element used in user input of the elements
function pushNewElement(type,entity,pressed,y,x){
  entity.push([y, x]);
  board[y][x] = pressed;
  var pictureType;
  if (type == enemyID) {
    pictureType = "enemy.png";
  } else if (type == obstacleID) {
    pictureType = "obstacle.png";
  } else if ((type == "5" || type == "6" || type == "7" || type == "8" || type == "9")) {
    pictureType = "fuel"+type+".png";
  } 
  drawImageInCell(pictureType, y, x, null, null);

}

//check points to see if the game has finished
function pointsCheck(outcome){
  showStatistics(true);
  //if function was called by enemy than player has lost since he/she was killed
  if(outcome == true){
    setMessage(userEntity+" has lost!", msgEnd);
    stage = stage2;
  }
  //if user ran out of fuel
  if(currentFuel == 0){
    setMessage(userEntity+" has ran out of fuel!", msgEnd);
    stage = stage2;
  }

  //if all points were gained by user and enemy
  if(totalPoints == userPointsCount+enemyPointsCount ){
    stage = stage2;
    playersCount=-1;
    if(userPointsCount > enemyPointsCount){
      setMessage(userEntity+" has won!", msgEnd);
    } else if(enemyPointsCount > userPointsCount){
      setMessage(userEntity+" has lost!", msgEnd);
    } else if(enemyPointsCount == userPointsCount && enemies.length > 0) {
      setMessage("Game ended with a draw!", msgEnd);
    } else if(enemies.length == 0){
      setMessage(userEntity+" has won!", msgEnd);
    }
  }
}

//checks for all movable position for the entity (mostly used in enemy AI)
function isMovable(y, x) {
  var movablePositions = new Array();
  //check 8 positions (not including itself)
  for (var a = -1; a < 2; a++) {
    for (var b = -1; b < 2; b++) {
      if (!(a == 0 && b == 0)) {
        //if position still on game board
        if (
          x + a >= 0 &&
          a + x < boardX &&
          y + b >= 0 &&
          b + y < boardY &&
          !(board[y + b][x + a] == obstacleID || board[y + b][x + a] == enemyID)
        ) {
          //console.log((y+b)+":"+(x+a));
          movablePositions.push([y + b, x + a]);
        }
      }
    }
  }
  return movablePositions;
}

//check whether point is one tile away so that enemy can eat it
function isPointClose() {
  var oldPositionY, oldPositionX;
  var tmpMovablePos;
  //for each enemy and each point in check whether point is close by
  for (var en = 0; en < enemies.length; en++) {
      for (var p = 0; p < points.length; p++) {

        //set old positions at varaibles
      oldPositionY = enemies[en][0];
      oldPositionX = enemies[en][1];
      //calculate total idstance from the points
      distanceFromPointY = Math.abs(points[p][0] - oldPositionY);
      distanceFromPointX = Math.abs(points[p][1] - oldPositionX);
      //if distance x,y is max 1 each.
      if (distanceFromPointX != undefined &&distanceFromPointY != undefined &&distanceFromPointX < 2 &&distanceFromPointY < 2) {
        //debug info
        //console.log("Point Conumed");

        //set point spot to enemy
        document.getElementsByTagName("tr")[points[p][0]].getElementsByTagName("td")[points[p][1]].innerHTML = "<img src=\"img/enemy.png\" draggable=\"false\" height=\"52\" width=\"42\">";

        //set old position to empty.
        document.getElementsByTagName("tr")[oldPositionY].getElementsByTagName("td")[oldPositionX].innerText = emptySpaceID;
        //count enemy points += 1;
        enemyPointsCount = enemyPointsCount + parseInt(board[points[p][0]][points[p][1]]);

        board[oldPositionY][oldPositionX] = undefined;
        
        board[points[p][0]][points[p][1]] = enemyID;

        //set points position to enemys
        board[points[p][0]][points[p][1]] = enemyID;
        //change position of the enemy in array
        enemies[en] = points[p];
        //remove the point from array
        points.splice(p, 1);
        break;
        //else if last point and it isn't close move to random spot from possible positions
      } else if(points.length-1 == p){
        //generate movable positions array
         tmpMovablePos = isMovable(oldPositionY, oldPositionX);
         //if at least one position is movable
         if(tmpMovablePos.length >= 1){
             var distanceFromPlayer;
             var shortestDistance = boardX*boardY;
             var keepYX;
             for (var z = 0; z < tmpMovablePos.length; z++) {
                distanceFromPlayer = Math.abs(playerY - tmpMovablePos[z][0])+ Math.abs(playerX - tmpMovablePos[z][1]);
                if(shortestDistance > distanceFromPlayer){
                    shortestDistance = distanceFromPlayer;
                    keepYX = tmpMovablePos[z];
                }
             }
             tmpYX = keepYX;
          //tmpYX = tmpMovablePos[Math.floor(Math.random() * (tmpMovablePos.length))];
          drawImageInCell("enemy.png",tmpYX[0],tmpYX[1],oldPositionY,oldPositionX);
          //empty old position on the hidden board
          board[oldPositionY][oldPositionX] = undefined;
          //set new position on the hidden board
          board[tmpYX[0]][tmpYX[1]] = enemyID;
          //update enemies array with new position
          enemies[en][0] = tmpYX[0];
          enemies[en][1] = tmpYX[1];
         }

      }
    }
  }
  pointsCheck(false);
}

//check whether player is one tile away so that enemy can eat it
function isPlayerClose() {
  //check whether play is close on every enemy
  var distanceFromPointY, distanceFromPointX;
  for (var e = 0; e < enemies.length; e++) {
    if (enemies[e][0] - playerY < 2 && enemies[e][1] - playerX < 2) {
      var enemyY = enemies[e][0];
      var enemyX = enemies[e][1];

      var distanceFromPlayerY = Math.abs(playerY - enemyY);
      var distanceFromPlayerX = Math.abs(playerX - enemyX);
      //if player 1 tile away eat him.
      if (distanceFromPlayerX < 2 && distanceFromPlayerY < 2) {
        pointsCheck(true);
        stage = stage2;
        drawImageInCell("enemy.png", playerY, playerX, enemyY, enemyX);
        board[enemyY][enemyX] = undefined;
        board[playerY][playerX] = enemyID;
        return 1;
        //break;
      }
      //console.log(distanceFromPlayerY+":"+distanceFromPlayerX);
    }
  }
  return 0;
}


//check whether user made correct move, consumed point, crashed with enemy or an obstacle
function userMove(pressed) {
  movePlayer = playerMovementControls(pressed);
  if (!(movePlayer[0] == 0 && movePlayer[1] == 0)) {
    if (isBorder(movePlayer[0] + playerY, movePlayer[1] + playerX) == 1) {
      tmpPlayerX = movePlayer[1] + playerX;
      tmpPlayerY = movePlayer[0] + playerY;
      
      //if user has moved into point add point and fuel
      for (var p = 0; p < points.length; p++) {
        if (points[p][0] == tmpPlayerY && points[p][1] == tmpPlayerX) {
            userPointsCount += parseInt(board[points[p][0]][points[p][1]]);
            currentFuel += parseInt(board[points[p][0]][points[p][1]]);
          points.splice(p, 1);
          //changing to a +1 system rather than fuel value.
          //userPointsCount += 1;
          //currentFuel += 1;
          break;
        }
      }

      //if user has moved into obstacle
      for (var o = 0; o < obstacles.length; o++) {
        if (obstacles[o][0] == tmpPlayerY && obstacles[o][1] == tmpPlayerX) {
          //setMessage(entityObstacle+" is blocking the way! ["+positionX+","+positionY+"]",msgBoxID);
          isObstacle = true;
          break;
        }
      }

      //if user has moved into enemy
      for (var e = 0; e < enemies.length; e++) {
        if (enemies[e][0] == tmpPlayerY && enemies[e][1] == tmpPlayerX) {
          stage = stage2;
          playersCount -= 1;
          
          //pointsCheck(true);
          isEnemy = true;
          break;
        }
      }
      
      //if user has not moved into obstacle or enemy
      if (isObstacle == false && isEnemy == false) {
        //move user to a new cell
        document.getElementsByTagName("tr")[playerY].getElementsByTagName("td")[
          playerX
        ].innerText = emptySpaceID;
        board[playerY][playerX] = undefined;


        board[playerY][playerX] = playerID;
        drawImageInCell("player.png", tmpPlayerY, tmpPlayerX, playerY, playerX);

        playerX = tmpPlayerX;
        playerY = tmpPlayerY;

        //change round and take away a point
        currentFuel = currentFuel - v;
        currentRound+=1;
        //If player has not been eat use enemies to eat a point
        if (isPlayerClose() != 1) {
          isPointClose();
        }
        //if obstacle was hit show as message
      } else if (isObstacle == true) {
        setMessage("You hit an obstacle!", msg);
        isObstacle = false;
        //else if hit enemy remove player and replace with killer and end game.
      } else if (isEnemy == true) {
        drawImageInCell("enemy.png", tmpPlayerY, tmpPlayerX, playerY, playerX);
        board[playerY][playerX] = undefined;
        pointsCheck(true);
      }
      showStatistics(true);
    } else {
      setMessage("That cell is beyond the border!", msg);
    }
  } else {
    setMessage("Unrecognized character, try again!", msg);
  }
}
function drawImageInCell(imageName, y, x, oldY, oldX) {
    document.getElementsByTagName("tr")[y].getElementsByTagName("td")[x].innerHTML =
    '<img src="img/' + imageName +'" draggable="false" height="52" width="42">';
    if (oldY != null && oldX != null) {
      document.getElementsByTagName("tr")[oldY].getElementsByTagName("td")[oldX].innerText = emptySpaceID;
    }
  }

//check whether the coardinate is within previously defined borders
function isBorder(y, x) {
  if (y >= 0 && x >= 0 && x < boardX && y < boardY) {
    return 1;
  } else {
    return 0;
  }
}

//show statistics (left header side of the game.html)
function showStatistics(show) {
  if (show == true) {
    setMessage(
      "Round: " +
        currentRound +
        "<br>User Score: " +
        userPointsCount +
        "/" +
        totalPoints +
        "<br>Enemy Score:" +
        enemyPointsCount +
        "/" +
        totalPoints +
        "<br>Fuel: " +
        currentFuel +
        "<br>Enemies: " +
        enemiesCount +
        "<br>" +
        "Obstacles: " +
        obstaclesCount,
      "liveStatistics"
    );
  } else {
    setMessage("", "liveStatistics");
  }
}

//move players cordinates based on user input
function playerMovementControls(move) {
  switch (move) {
    case "W":
      return [-1, 0];
    case "A":
      return [0, -1];
    case "X":
      return [1, 0];
    case "D":
      return [0, 1];
      //else player cannot move
    default:
      return [0, 0];
  }
}

//set stage as playable upon button click by the user if 1 player was placed
function setStagePlay() {
  if (playersCount == 1 && stage == stage0) {
    pointsCheck();
    stage = stage1;
  } else if (playersCount != 1 && stage == stage0) {
    setMessage(userEntity + " was not placed!", msg);
  } else if (stage != stage0 ) {
    setMessage("Game can only be started in " + stage0 + " stage.", msg);
  }
}

/*
    First argument message, second argument is the element id used in html
    show message:
    setMessage("Example", msg);
    clear message:
    setMessage("", msg);
*/
function setMessage(message, messegeElementID) {
  messageBox = document.getElementById(messegeElementID);
  messageBox.innerHTML = message;
  messageBox.style.display = "block";
}