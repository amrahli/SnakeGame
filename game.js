(function(){
    this.SnakeGame = function(){        
        let preferences = {};
        let bestScore = localStorage.getItem("bestScore")!==null ? localStorage.getItem("bestScore"):0;
        let turnedInCell = false;
        let moving = false;
        let dictionary = {};
        let history = {
            moments:[],
            preferences:{}
        };

        let game = {
            points: 0,
            snake: [],
            currentFeed: {
                x: 0,
                y: 0
            },
            currentState: 0, //ended(-1), ready (0), playing(1), or paused(2)
            direction: 0,
            moving:false
        };

        
        this.dictionary = {
            press_to_start:{
                az:"Başlamaq üçün Boşluq düyməsinə basın",
                en:"Press Space to Start"
            },
            press_to_continue:{
                az:"Davam etmək üçün Boşluq düyməsinə basın",
                en:"Press Space to Continue"
            },
            game_over:{
                az:"Oyun bitdi",
                en:"Game Over"
            },
            score:{
                az:"Xal",
                en:"Score"
            },
            best_score:{
                az:"Rekord",
                en:"Best Score"
            }
        }

        this.Init = function(options){
            let defaults = {
                selector:"#game-field",
                grid: 20,
                startLength:3,
                border: true,
                shade: false,
                level: 3,
                mission:false,
                lang:"en"
            };

            
            preferences = Object.assign(defaults, options); 
            history.preferences = preferences; 
            Object.keys(this.dictionary).forEach(w=>{               
                dictionary[w] = this.dictionary[w][preferences.lang]
            });
            
            createArena();
            createSnake();
            createFeed();

            document.addEventListener("keydown", function (ev) {
                commands(ev);
            });
        }; 

        function createArena() {
            let gridSize = preferences.grid;
            let container = document.querySelector(preferences.selector);
            //create info-bar
            let infoBar = document.createElement("div");
            infoBar.setAttribute("id", "info-bar");
            infoBar.innerHTML = dictionary.score+": <span id='point'>0</span><span id='announcement'></span>";

            let bestScoreBar = document.createElement("div");
            bestScoreBar.setAttribute("id", "best-score-bar");
            bestScoreBar.innerHTML = dictionary.best_score+": <span id='best-score'>"+bestScore+"</span>";
    
            //create grid
            let table = document.createElement("table");
            table.setAttribute("id", "snake-grid");
    
            for (let i = 0; i < gridSize; i++) {
                let row = document.createElement("tr");
                row.setAttribute("data-id", gridSize - i);
                for (let c = 0; c < gridSize; c++) {
                    let cell = document.createElement("td");
                    cell.setAttribute("data-id", c + 1);
                    row.appendChild(cell);
                }
                table.appendChild(row);
            }
            container.appendChild(infoBar);
            container.appendChild(table);
            container.appendChild(bestScoreBar);
            let tableWidth = table.clientWidth;

            infoBar.style.width = tableWidth + "px";
            bestScoreBar.style.width = tableWidth + "px";

            //draw border
            if (preferences.border) {
                let table = document.getElementById("snake-grid");
                table.classList.add("bordered");
            } else {
    
            }
            //shade
            if (preferences.shade) {
                let table = document.getElementById("snake-grid");
                table.classList.add("shaded");
            }
            announce(dictionary.press_to_start);
        }

        function createSnake() {
            for (let i = 0; i < preferences.startLength; i++) {
                let bit, 
                    cell,
                    x = Math.floor(preferences.grid / 2) - i,
                    y = Math.floor(preferences.grid / 2);
                //visuals
                bit = document.createElement("span");
                bit.classList.add("bit");
                bit.classList.add("bit_" + i);
                cell = document.querySelector(`table#snake-grid tr[data-id="${y}"] td[data-id="${x}"]`);
                cell.appendChild(bit);
                game.snake.push({ x: x, y: y })
            }
        }

        function createFeed() {
            let lastFeed = document.querySelector(".feed");
            if (lastFeed != null) lastFeed.remove();
            let gridSize = preferences.grid;
            let x = 1, y = 1;
    
            do {
                x = Math.ceil(Math.random() * gridSize);
                y = Math.ceil(Math.random() * gridSize);
            }
            while (game.snake.filter(g => g.x == x && g.y == y).length != 0)
    
            let cell = document.querySelector(`table#snake-grid tr[data-id="${y}"] td[data-id="${x}"]`);
    
            let feed = document.createElement("span");
            feed.classList.add("feed");
    
            cell.appendChild(feed);
            game.currentFeed.x = x;
            game.currentFeed.y = y;
        } 

        function resumeGame() {
            announce("");
            game.currentState = 1;
            moving = setInterval(function () { move(game.direction) }, (10/preferences.level)*60);
        }
    
        function startGame() {
            announce("");
            game.direction = 6;
            game.currentState = 1;
            moving = setInterval(function () { move(game.direction) }, (10/preferences.level)*60);
        }
    
        function pauseGame() {
            game.currentState = 2;
            clearInterval(moving);
            moving = false;
            announce(dictionary.press_to_continue);
        } 

        function endGame() {
            removeFeed();
            announce(dictionary.game_over);
            game.currentState = -1;
            clearInterval(moving);
            moving = false;
            blinkSnake(); 
            updateBestScore();
            setTimeout(function () {
                reset();
                createSnake();
                createFeed();
                announce(dictionary.press_to_start);
                //startGame();
            }, 3000);
        }

        function replay(){
            console.log("replay");
	    //for future
        }
    
        function reset() {
            game.currentState = 0;
            game.points = 0;
            updatePoints();
            game.snake = [];
            let bits = document.querySelectorAll("span.bit");
            bits.forEach(g => g.remove());
        }
    
        function blinkSnake() {
            let bits = document.querySelectorAll("span.bit");
            bits.forEach(a => a.classList.add("blinking"));
        }

        var commands = function (event) {
            if (game.currentState === 1) {
                if (event.code === "Space") {
                    pauseGame();
                } else {
                    changeDirection(event.code)
                }
    
            } else if (game.currentState === 2) {
                switch (event.code) {
                    case "Space": {
                        changeDirection(event.code);
                        resumeGame();
                        break;
                    };
                    default: break;
                }
            } else if (game.currentState === 0) {
                switch (event.code) {
                    case "Space": {
                        startGame();
                        break;
                    };
                    default: break;
                }
            }
        }
    
        var changeDirection = function (keyCode) {
            let direction = game.direction;
            if (!turnedInCell) {
                switch (keyCode) {
                    case "ArrowRight": {
                        if (direction === 4) return false;
                        game.direction = 6;
                        break;
                    }
                    case "ArrowDown": {
                        if (direction === 8) return false;
                        game.direction = 2;
                        break;
                    }
                    case "ArrowLeft": {
                        if (direction === 6) return false;
                        game.direction = 4;
                        break;
                    }
                    case "ArrowUp": {
                        if (direction === 2) return false;
                        game.direction = 8;
                        break;
                    }
                    default: break;
                }
            }
            turnedInCell = true;
        }

        var move = function (direction) {

            let snake = game.snake;
    
            let x = snake[0].x;
            let y = snake[0].y;
    
            switch (direction) {
                case 6: {
                    game.snake.unshift({ x: x + 1, y: y });
                    break;
                }
                case 2: {
                    game.snake.unshift({ x: x, y: y - 1 });
                    break;
                }
                case 4: {
                    game.snake.unshift({ x: x - 1, y: y });
                    break;
                }
                case 8: {
                    game.snake.unshift({ x: x, y: y + 1 });
                    break;
                }
                default: break;
            }
    
            x = snake[0].x;
            y = snake[0].y;
    
            let ateFeed = (x === game.currentFeed.x && y === game.currentFeed.y);
            let touchedEdge = (x > preferences.grid || y > preferences.grid || y < 1 || x < 1);
            let touchedSelf = snake.slice(1).flatMap(s => s.x == x && s.y == y).some(z => z === true);
    
            if (touchedEdge) {
                endGame();
                return false;
            }
    
            if (touchedSelf) {
                endGame();
                return false;
            }
            if (ateFeed) {
                game.points += 10 * preferences.level;
                updatePoints();
                createFeed();
            } else {
                removeLastBit();
            }
    
            turnedInCell = false;
            converter();

            return true;
        }
    
        function removeLastBit() {
            game.snake.pop();
        }
        
        function updatePoints(){
            let pointElement = document.getElementById("point");
            pointElement.innerText = game.points;

        };

        function updateBestScore(){
            if(game.points > bestScore){
                localStorage.setItem("bestScore",game.points);
                bestScore = game.points;
            }
            let bestScoreElement = document.getElementById("best-score");
            bestScoreElement.innerText = bestScore;

        };

        function removeFeed(){
            document.querySelector("span.feed").remove();
        }

        function announce(text) {
            let announcement = document.getElementById("announcement");
            announcement.innerText = text;
        }

        function converter() {
            var bits = document.querySelectorAll("td .bit");
            bits.forEach(z => z.remove());
            for (let i = 0; i < game.snake.length; i++) {
                let bit, cell,
                    x = game.snake[i].x,
                    y = game.snake[i].y;
                bit = document.createElement("span");
                bit.classList.add("bit");
                bit.classList.add("bit_" + i);
                cell = document.querySelector(`table#snake-grid tr[data-id="${y}"] td[data-id="${x}"]`);
                cell.appendChild(bit);
            }

            history.moments.push(JSON.parse(JSON.stringify(game)));
            console.log(history);
        }


    };
})();