$(function()
{
    let GAME_TIME = 60;

    let KEY_A = 65;
    let KEY_D = 68;
    let KEY_S = 83;
    let KEY_LEFT = 37;
    let KEY_RIGHT = 39;
    let KEY_DOWN = 40;

    window.$body = $('#main-container');
    //PREPARE BOARD
    let _startLeft = 538;
    let _startTop = 115;

    let _cellWidth = 85;
    let _cellHeight = 85;
    let _sideSize = 9;
    let _cellSpace = 0;
    let _playersPositionArr = [];
    let _productsPositionArr = [];

    //PRODUCTS
    let _productsArr = shuffle([
        'apple',
        'banana',
        'orange',
        'tv',
        'microwave',
        'radio',
        'lamp',
        'hat',
        'tshirt',
        'shoes',
        'umbrella',
        'soap',
        'toothbrush',
        'comb',
        'hammer',
        'saw',
        'cd',
        'bag',
        'watch',
        'ring',
        'chair',
        'table',
        'picture',
        'phone',
        'bread',
        'milk',
        'ham',
        'cheese',
        'bulb',
        'beer',
        'flower',
        'vodka',
        'kubota',
        'cigaretes',
        'eggs',
        'panties'
    ]);

    for (let i = 0; i < _sideSize ; i++) {
        //players positions
        _playersPositionArr[i] =       [_startLeft, _startTop + (_cellHeight * i) + (_cellSpace * i)];
        _playersPositionArr[i+_sideSize] =     [_startLeft + (_cellWidth * i) + (_cellSpace * i), _startTop + (_cellHeight * _sideSize) + (_cellSpace * _sideSize)];
        _playersPositionArr[i+(_sideSize*2)] =    [_startLeft + (_cellWidth * _sideSize) + (_cellSpace * _sideSize), _startTop + (_cellHeight * (_sideSize - i)) + (_cellSpace * (_sideSize - i))];
        _playersPositionArr[i+(_sideSize*3)] =    [_startLeft + (_cellWidth * (_sideSize - i)) + (_cellSpace * (_sideSize - i)), _startTop];
        //product positions
        _productsPositionArr[i] =               [_playersPositionArr[i][0] - (_cellWidth + _cellSpace), _playersPositionArr[i][1]];
        _productsPositionArr[i+_sideSize] =     [_playersPositionArr[i+_sideSize][0], _playersPositionArr[_sideSize][1] + (_cellHeight + _cellSpace)];
        _productsPositionArr[i+(_sideSize*2)] = [_playersPositionArr[i+(_sideSize*2)][0] + (_cellWidth + _cellSpace), _playersPositionArr[i+(_sideSize*2)][1]];
        _productsPositionArr[i+(_sideSize*3)] = [_playersPositionArr[i+(_sideSize*3)][0], _playersPositionArr[i+(_sideSize*3)][1] - (_cellHeight + _cellSpace)];
    }

    for (let i = 0; i < _productsPositionArr.length; i++) {
        let $a = $("<div id='product" + i + "' style='width:85px; height:85px; position: absolute; background: gray;'> " + _productsArr[i] +  " </div>");
        $a.append('<img src="graphic/' + _productsArr[i] + '.png" style="width:60px; height:60px;"/>');
        setPlayerPosition($a, _productsPositionArr[i][0], _productsPositionArr[i][1]);
        $body.append($a);
    }

    //MUSIC
    let x =document.getElementById("music_spped_demon");
    x.play();

    //GAME
    let $player1 = $('#player1');
    let $player2 = $('#player2');

    //SET PLAYERS POSITION;
    let $_players = [null, $player1, $player2];
    let _playersIndexes = [null, 0, 16];
    let _playersClicked = [null, false, false];
    setPlayerPosition($_players[1], _playersPositionArr[_playersIndexes[1]][0], _playersPositionArr[_playersIndexes[1]][1]);
    setPlayerRotation($_players[1], _playersIndexes[1]);
    setPlayerPosition($_players[2], _playersPositionArr[_playersIndexes[2]][0], _playersPositionArr[_playersIndexes[2]][1]);
    setPlayerRotation($_players[2], _playersIndexes[2]);
    let _playersProductsBought = [
        null,
        [],
        []
    ];

    setTimeout( function() {
        //NOTE KEY DOWN
        $('body').on('keydown', function(e) {
            let player = 0;
            let side = 0;//0 = no, 1 = left, 2 = right
            let k = e.keyCode;

            //NOTE set positions
            //NOTE player 1
            if (k === KEY_LEFT || k === KEY_RIGHT || k === KEY_A || k === KEY_D) {
                if (k === KEY_RIGHT || k === KEY_LEFT) {
                    player = 1;
                    if (_playersClicked[player]) {
                        player = 0;
                    }

                    if (k === KEY_RIGHT) { //right
                        side = 2;
                    } else {
                        side = 1;
                    }

                    //NOTE player 2
                } else {
                    player = 2;
                    if (_playersClicked[player]) {
                        player = 0;
                    }

                    if (k === KEY_D) { //right
                        side = 2;
                    } else {
                        side = 1;
                    }
                }

                if (!player) {
                    return true;
                }

                _playersClicked[player] = k;

                let index = _playersIndexes[player];
                if (side === 2) { //right
                    index = index === (_sideSize*4)-1 ? 0 : index + 1;
                    _playersIndexes[player] = index;
                } else { //left
                    index = index === 0 ? (_sideSize*4)-1 : index - 1;
                    _playersIndexes[player] = index;
                }

                setPlayerPosition($_players[player], _playersPositionArr[index][0], _playersPositionArr[index][1]);
                setPlayerRotation($_players[player], index);
                playRandomUghSound();

                //NOTE player buy
            } else if (k === KEY_S || k === KEY_DOWN) {
                if (k === KEY_DOWN) {
                    player = 1;
                } else {
                    player = 2;
                }


                let index = _playersIndexes[player];
                let isPromotion = _promotionsObj[index] !== undefined;
                //TODO
                if (isPromotion) {
                    _playersProductsBought[player].push(index);
                    playSound("audio/buy.wav");
                    renderBoughtProduct(player);
                    delete _promotionsObj[index];
                    $('#player1-to-find #product' + index).remove();
                    $('#player2-to-find #product' + index).remove();
                } else {
                    console.log("gowno")
                }

            }

            return true;
        });

        //NOTE KEY UP
        $('body').on('keyup', function(e) {
            let k = e.keyCode;
            if (k === KEY_RIGHT || k === KEY_LEFT) {
                if (_playersClicked[1] === k) {
                    _playersClicked[1] = false;
                }
            } else if (k === KEY_A || k === KEY_D) {
                if (_playersClicked[2] === k) {
                    _playersClicked[2] = false;
                }
            }
        });

        //MAIN GAME LOOP
        let _startGameTs = Date.now();
        let _endGameTs = _startGameTs + (GAME_TIME * 1000);
        let _nextPromoTs = null;
        let _promotionsObj = {};

        let hours = 1;
        let minutes = 1;
        let hourT = 0;
        let minuteT = 0;

        let countD = 0;

        let gameInterval = setInterval(function() {
            //animate clock
            countD += 100;
            if (countD >= 3000) {
                hourT += 100;
                if (hourT == 5000) {
                    var hdegree = hours * 30;
                    var hrotate = "rotate(" + hdegree + "deg)";

                    $("#pointer").css({"-moz-transform" : hrotate, "-webkit-transform" : hrotate});
                    hours++;
                    hourT = 0;
                }

                minuteT += 50;
                    var mdegree = minutes * 7;
                    var mrotate = "rotate(" + mdegree + "deg)";
                    $("#pointer2").css({"-moz-transform" : mrotate, "-webkit-transform" : mrotate});
                    minutes++;
            }



            let now = Date.now();

            //endgame
            if (now > _endGameTs) {
                endGameCallback();
                clearInterval(gameInterval);
                $('body').off();
                playSound("audio/timesup.wav")
            }

            if (!_nextPromoTs || _nextPromoTs && now >= _nextPromoTs) {
                //NOTE add promo
                //remove all promo
                _promotionsObj = {};
                //random next promo
                _promotionsObj[Math.floor(Math.random() * (_sideSize*4))] = 1;
                _promotionsObj[Math.floor(Math.random() * (_sideSize*4))] = 1;
                _promotionsObj[Math.floor(Math.random() * (_sideSize*4))] = 1;

                playSound("audio/ring.wav")
                console.log(_promotionsObj);

                //render promo images
                $('#player1-to-find').empty();
                $('#player2-to-find').empty();
                for (let key in _promotionsObj) {
                    let $a = $("<div id='product" + key + "' style='width:64px; height:64px; display:inline-block'></div>");
                    $a.append('<img src="graphic/' + _productsArr[key] + '.png" style="width:60px; height:60px;"/>');
                    let $b = $a.clone();
                    $('#player1-to-find').append($a);
                    $('#player2-to-find').append($b);
                }

                _nextPromoTs = now + 5000;
            }

        }, 100)
    }, 3000);

    //START COUNTDOWN
    let startIndex = 2;
    function startCooldown(s) {
        setTimeout(function() {
            $("#timeout-container h1").text("Start in " + s);
            console.log(s);
            if (s > 0) {
                startCooldown(s-1);
            } else {
                $("#timeout-container").css('display', 'none');
            }
        }, 1000);
    }
    startCooldown(startIndex);

    function renderBoughtProduct(playerId) {
        let text = '';
        for (let i = 0; i < _playersProductsBought[playerId].length; i++) {
            let name =  _productsArr[ _playersProductsBought[playerId][i] ];
            text += name + "<br>";
        }
        $("#player" + playerId + "-score").html(text);
    }

    function endGameCallback()
    {
        $("#timeout-container").html(
            "<h1>Player 1 points: " + _playersProductsBought[1].length + "</h1><br><h1>Player 2 points: " + _playersProductsBought[2].length + "</h1>"
        );
        $("#timeout-container").css('display', 'block');
        $("#timeout-container img").remove();
    }
});

function setPlayerPosition($player, x, y)
{
    $player.css('left', x);
    $player.css('top', y);
}

function setPlayerRotation($player, index) {
    if (index >=0 && index <= 8) {
        $player.css('transform', 'rotate(0deg)')
    } else if (index >=9 && index <= 17) {
        $player.css('transform', 'rotate(270deg)')
    } else if (index >=18 && index <= 26) {
        $player.css('transform', 'rotate(180deg)')
    } else {
        $player.css('transform', 'rotate(90deg)')
    }
}

function playRandomSound(sounds)
{
    var item = sounds[Math.floor(Math.random() * sounds.length)];
    playSound("audio/".concat(item).concat(".wav"));
}

function playSound(name)
{
    (new Audio(name)).play();
}

function playRandomUghSound()
{
    playRandomSound(["ugh_1", "ugh_2", "ugh_3", "ugh_4", "ugh_5", "ugh_6", "ugh_7", "ugh_8", "ugh_9"])
}

function playRadomPromotionSound()
{
    playRandomSound(["on_sale_1", "on_sale_2"])
}

function shuffle(array)
{
    var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function renderBoughtProduct() {

}
