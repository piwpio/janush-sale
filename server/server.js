let express = require("express");
let app = express();
let server = require("http").Server(app);

server.listen(3600);

//INIT
//temporary, if needed create tables dynamically. In further iterations maybe lol xD
let TABLE_1_CONTROLLER = new TableController(1);
let STATIC_DATA_CONTROLLER = new StaticDataController();
let USERS_CONTROLLER = new UsersController();
let CHAT_CONTROLLER = new ChatContainer();

var io = require('socket.io')(server,{});
io.sockets.on('connection', function(socket) {
    USERS_CONTROLLER.createNewUserFromSocket(socket);
});
console.log("SOCKETS LISTENING");

//region USERS
let USERS_LAST_USER_ID = 0;
function UsersController()
{
    let _users = [];

    //METHODS
    let _createNewUserFromSocket = function(socket)
    {
        let newId = USERS_LAST_USER_ID++;
        let newUser = new UserController(newId);
        newUser.initSocketForUser(socket);
        _users[newId] = newUser;

        socket.on('disconnect', function() {
            newUser.removeSocket();
            newUser.disconnectFromTable();
            delete _users[newId];
        });
        socket.emit('connected', {
            static_data: STATIC_DATA_CONTROLLER.get(),
            user: {
                id: newUser.getId(),
                name: newUser.getName()
            }
        });
    };

    let _getAll = function()
    {
        return _users;
    };

    let _getUser = function(userId)
    {
        return _users[userId] !== undefined ? _users[userId] : null;
    };

    let _canChangeNameTo = function(name)
    {
        name = name.toLowerCase();
        for (let userId in _users) {
            let userName = _users[userId].getName().toLowerCase();
            if (name === userName) {
                return false;
            }
        }
        return true;
    };

    let _getUserMiniData = function(userId)
    {
        let user = _getUser(userId);
        return {
            id: user.getId(),
            name: user.getName()
        }
    };

    return {
        createNewUserFromSocket: _createNewUserFromSocket,
        getUser: _getUser,
        getAll: _getAll,
        canChangeNameTo: _canChangeNameTo,
        getUserMiniData: _getUserMiniData
    }
}
//endregion USERS

//region USER
function UserController(userId)
{
    let _id = userId;
    let _name = 'guest_' + userId;
    let _socket = null;
    let _nameChanged = false;

    //SETTERS/GETTERS
    let _getId = function() { return _id; };
    let _getName = function() { return _name; };
    let _setName = function(name) { _name = name; };
    let _getSocket = function() { return _socket; };
    let _setSocket = function(socket) { return _socket = socket; };
    let _isNameChanged = function() { return _nameChanged; };
    let _setNameChanged = function(bool) { _nameChanged = bool; };

    //METHODS
    let _initSocket = function(socket) {
        if (_getSocket() !== null) {
            return;
        }
        _setSocket(socket);
        _getSocket().userId = _getId();
        _initRouting();
    };

    let _removeSocket = function() {
        _setSocket(null);
    };

    //NOTE routing
    let _initRouting = function()
    {
        let socket = _getSocket();
        if (socket === null) {
            return;
        }

        socket.on('set_name', function(d) {
            let user = USERS_CONTROLLER.getUser(socket.userId);
            if (user === null) {
                emitError(socket, {
                    message: "error on sitting, no user data"
                });
                return;
            }
            if (d === undefined || d.name === undefined || d.name === "") {
                emitError(socket, {
                    message: "error on user change name, no name data"
                });
                return;
            }
            if (_isNameChanged()) {
                emitError(socket, {
                    message: "You changed name."
                });
                return;
            }
            if (USERS_CONTROLLER.canChangeNameTo(d.name)) {
                let oldName = _getName();
                _setName(d.name);
                _setNameChanged(true);
                emitAll('set_name_success', {
                    user_id: _getId(),
                    old_name: oldName,
                    new_name: d.name
                });
                emitMessageAll(
                    d.name + " joined table"
                );
            } else {
                emitError(socket, {
                    message: "This name exists."
                });
            }
        });

        socket.on('sit_down_on_position', function(d) {
            let user = USERS_CONTROLLER.getUser(socket.userId);
            if (user === null) {
                emitError(socket, {
                    message: "error on sitting, no user data"
                });
                return;
            }
            if (d === undefined || d.position === undefined || (d.position !== 1 && d.position !== 2)) {
                emitError(socket, {
                    message: "error on sitting, no player position data"
                });
                return;
            }
            if (TABLE_1_CONTROLLER.canPlayerSitOnPosition(d.position)) {
                TABLE_1_CONTROLLER.setUserSitOnPosition(_getId(), d.position);
            } else {
                emitError(socket, {
                    message: "error on sitting, place is occupied"
                });
            }
        });

        socket.on('stand_up', function() {
            let user = USERS_CONTROLLER.getUser(socket.userId);
            if (user === null) {
                // return;
            }
            TABLE_1_CONTROLLER.removePlayerFromPosition(_getId());
        });

        socket.on('start_game', function() {
            let user = USERS_CONTROLLER.getUser(socket.userId);
            if (user === null) {
                // return;
            }
            _startGame();
        });

        socket.on('chat_message', function(d) {
            if (d.message !== undefined) {
                CHAT_CONTROLLER.addMessage(socket.userId, d.message);
            } else {
                // emitError(socket, CHAT_MESSAGE_ADD_ERROR)
            }
        });
    };

    let _disconnectFromTable = function()
    {
        TABLE_1_CONTROLLER.removePlayerFromPosition(_getId());
    };

    let _startGame = function(userId)
    {
        TABLE_1_CONTROLLER.userStartGame(userId);
    };

    return {
        getId: _getId,
        getName: _getName,
        getSocket: _getSocket,
        initSocketForUser: _initSocket,
        removeSocket: _removeSocket,
        disconnectFromTable: _disconnectFromTable,
    }
}
//endregion USERS

//region STATIC DATA
let STATIC_DATA_PRODUCTS_NAMES = [
    { name: 'APPLE',        graphic_offset: [0,0] },
    { name: 'BANANA',       graphic_offset: [0,0] },
    { name: 'ORANGE',       graphic_offset: [0,0] },
    { name: 'TV',           graphic_offset: [0,0] },
    { name: 'MICROWAVE',    graphic_offset: [0,0] },
    { name: 'RADIO',        graphic_offset: [0,0] },
    { name: 'LAMP',         graphic_offset: [0,0] },
    { name: 'HAT',          graphic_offset: [0,0] },
    { name: 'T-SHIR',       graphic_offset: [0,0] },
    { name: 'SHOES',        graphic_offset: [0,0] },
    { name: 'UMBRELLA',     graphic_offset: [0,0] },
    { name: 'SOAP',         graphic_offset: [0,0] },
    { name: 'TOOTHBRUSH',   graphic_offset: [0,0] },
    { name: 'COMB',         graphic_offset: [0,0] },
    { name: 'HAMMER',       graphic_offset: [0,0] },
    { name: 'SAW',          graphic_offset: [0,0] },
    { name: 'CD',           graphic_offset: [0,0] },
    { name: 'BAG',          graphic_offset: [0,0] },
    { name: 'WATCH',        graphic_offset: [0,0] },
    { name: 'RING',         graphic_offset: [0,0] },
    { name: 'CHAIR',        graphic_offset: [0,0] },
    { name: 'TABLE',        graphic_offset: [0,0] },
    { name: 'PICTURE',      graphic_offset: [0,0] },
    { name: 'PHONE',        graphic_offset: [0,0] },
    { name: 'BREAD',        graphic_offset: [0,0] },
    { name: 'MILK',         graphic_offset: [0,0] },
    { name: 'HAM',          graphic_offset: [0,0] },
    { name: 'CHEESE',       graphic_offset: [0,0] },
    { name: 'BULB',         graphic_offset: [0,0] },
    { name: 'BEER',         graphic_offset: [0,0] },
    { name: 'FLOWER',       graphic_offset: [0,0] },
    { name: 'VODKA',        graphic_offset: [0,0] },
    { name: 'KUBOTA',       graphic_offset: [0,0] },
    { name: 'CIGARETTES',   graphic_offset: [0,0] },
    { name: 'EGGS',         graphic_offset: [0,0] },
    { name: 'PANTIES',      graphic_offset: [0,0] },
];

function StaticDataController()
{
    let _get = function()
    {
        return {
            products: STATIC_DATA_PRODUCTS_NAMES
        }
    };
    return {
        get: _get
    };
}
//endregion STATIC DATA

//region TABLE
let TABLE_ROUND_SECONDS_DEFAULT = 5;
let TABLE_ROUND_MILISECONDS_DEFAULT = TABLE_ROUND_SECONDS_DEFAULT * 1000;
let TABLE_GAME_ROUNDS_DEFAULT = 20;
let TABLE_COUNTDOWN_SECONDS_DEFAULT = 3;
let TABLE_PLAYER_READY_SECONDS_DEFAULT = 15;
let TABLE_PLAYER_READY_MILISECONDS_DEFAULT = TABLE_PLAYER_READY_SECONDS_DEFAULT * 1000;
function TableController(tableId)
{
    let _tableId = tableId;
    let _player1 = new PlayerController(1);
    let _player2 = new PlayerController(2);
    let _gameQueue = [];
    let _allUsersSockets = [];
    let _startTimestamp = 0;
    let _lastProductRandomizeTimestamp = 0;
    let _playerReadyInterval = -1;
    let _countDownIntervalId = -1;
    let _mainGameInterval = -1;
    let _boardShuffleMap = [];
    let _gameOn = false;


    //SETTERS/GETTERS
    let _getPlayer1 = function() { return _player1; };
    let _getPlayer2 = function() { return _player2; };
    let _getStartTimestamp = function() { return _startTimestamp; };
    let _setStartTimestamp = function(startTimestamp) { _startTimestamp = startTimestamp; };
    let _getLastProductRandomizeTimestamp = function() { return _lastProductRandomizeTimestamp; };
    let _setLastProductRandomizeTimestamp = function(randomizeTimestamp) { _lastProductRandomizeTimestamp = randomizeTimestamp; };
    let _getGameQueue = function() { return _gameQueue; };
    let _getAllUserSockets = function() { return _allUsersSockets; };
    let _getPlayerReadyInterval = function() { return _playerReadyInterval; };
    let _setPlayerReadyInterval = function(intervalId) { _playerReadyInterval = intervalId; };
    let _getCountDownInterval = function() { return _countDownIntervalId; };
    let _setCountDownInterval = function(intervalId) { _countDownIntervalId = intervalId; };
    let _getMainGameLoopInterval = function() { return _mainGameInterval; };
    let _setMainGameLoopInterval = function(intervalId) { _mainGameInterval = intervalId; };
    let _getBoardShuffleMap = function() { return _boardShuffleMap; };
    let _setBoardShuffleMap = function(boardShuffleMap) { _boardShuffleMap = boardShuffleMap; };
    let _isGameOn = function() { return _gameOn; };
    let _setGameOn = function(gameOn) { _gameOn = gameOn; };


    //METHODS
    let _startNewGame = function()
    {
        _initPlayersBeforeGame();
        _prepareShuffleBoardMap();
        _setGameOn(true);
        _countDownBeforeStart();
    };

    let _countDownPlayerReady = function()
    {
        let countDownPlayerReady = TABLE_PLAYER_READY_SECONDS_DEFAULT;
        let intervalId = setInterval(function() {
            // emitAll();
            --countDownPlayerReady;
            if (countDownPlayerReady === 0) {
                let positionNotReady = _getPlayerNotReadyPosition();
                _removePlayerFromTable(positionNotReady);
                _clearPlayerReadyInterval();
            }
        }, 1000);
        _setPlayerReadyInterval(intervalId);
    };

    let _countDownBeforeStart = function()
    {
        _clearPlayerReadyInterval();
        let countDown = TABLE_COUNTDOWN_SECONDS_DEFAULT;
        let intervalId = setInterval(function() {
            // emitAll();
            --countDown;
            if (countDown === 0) {
                _clearCountDownInterval();
                _startMainGameLoop();
            }
        }, 1000);
        _setCountDownInterval(intervalId);
    };

    let _startMainGameLoop = function()
    {
        _setStartTimestamp(Date.now());
        _setLastProductRandomizeTimestamp(_getStartTimestamp());
        let intervalId = setInterval(function() {
            _checkAndRandomizeProducts();
        }, 1000);
        _setMainGameLoopInterval(intervalId);
    };

    let _checkAndRandomizeProducts = function()
    {
        let nextRandomizeTs = _getLastProductRandomizeTimestamp() + TABLE_ROUND_MILISECONDS_DEFAULT;
        if (nextRandomizeTs < Date.now()) {
            _setLastProductRandomizeTimestamp(nextRandomizeTs);
            _randomizeProducts();
            _resetPlayersAfterRound();
            // emitAll();
        }
    };

    let _randomizeProducts = function()
    {

    };

    let _stopGame = function()
    {
        _setGameOn(false);
        _clearCountDownInterval();
        _clearMainGameLoopInterval();
        emitMessageAll("Game stopped");
    };

    let _clearCountDownInterval = function()
    {
        let intervalId = _getCountDownInterval();
        if (intervalId !== -1) {
            clearInterval(intervalId);
            _setCountDownInterval(-1);
        }
    };

    let _clearMainGameLoopInterval = function()
    {
        let intervalId = _getMainGameLoopInterval();
        if (intervalId !== -1) {
            clearInterval(intervalId);
            _setMainGameLoopInterval(-1);
        }
    };

    let _clearPlayerReadyInterval = function()
    {
        let intervalId = _getPlayerReadyInterval();
        if (intervalId !== -1) {
            clearInterval(intervalId);
            _setPlayerReadyInterval(-1);
        }
    };

    let _initPlayersBeforeGame = function()
    {
        _getPlayer1().initBeforeGame();
        _getPlayer2().initBeforeGame();
    };

    let _resetPlayersAfterRound = function()
    {
        _getPlayer1().resetAfterRound();
        _getPlayer2().resetAfterRound();
    };

    let _prepareShuffleBoardMap = function()
    {
        let boardShuffleMap = [];
        for (let i = 0; i < STATIC_DATA_PRODUCTS_NAMES.length; i++) {
            boardShuffleMap.push(i);
        }
        boardShuffleMap = __shuffleArray(boardShuffleMap);
        _setBoardShuffleMap(boardShuffleMap);
    };


    let _getUserTablePosition = function(userId)
    {
        if (_getPlayer1().getUserId() === userId) {
            return 1;
        } else if (_getPlayer2().getUserId() === userId) {
            return 2;
        } else {
            return 0
        }
    };

    let _getPlayerOnPosition = function(playerPosition)
    {
        if (playerPosition === 1) {
            return _getPlayer1();
        } else if (playerPosition === 2) {
            return _getPlayer2();
        } else {
            return null;
        }
    };

    //queue
    let _addUserToQueue = function(userId)
    {
        let queue = _getGameQueue();
        let index = queue.indexOf(userId);
        if (index === -1) {
            _gameQueue.push(userId)
            // _broadcastToAllUsers();
        }
    };

    let _removeUserFromQueue = function(userId)
    {
        let index = _gameQueue.indexOf(userId);
        if (index > -1) {
            _gameQueue.splice(index, 1);
            // emitAll();
        }
    };

    let _removePlayerFromPosition = function(userId)
    {
        //check if user is actually playing on table
        if (_checkIfUserIsPlayer(userId)) {
            //stop game if on
            if (_isGameOn()) {
                _stopGame();
            }
            let removedPlayerPosition = _getUserTablePosition(userId);
            let removedPlayer = _getPlayerOnPosition(removedPlayerPosition);
            let otherPosition = _getOtherPlayerPosition(removedPlayerPosition);
            if (removedPlayer.isAdmin()) {
                _getPlayerOnPosition(otherPosition).setAdmin(true);
            }
            emitMessageAll("Player " + userId + " removed from position");
            removedPlayer.cleanPlayer();
        }
        // emitAll();
    };

    let _getOtherPlayerPosition = function(position)
    {
        return position === 1 ? 2 : 1;
    };

    let _setUserSitOnPosition = function(userId, playerPosition)
    {
        _getPlayerOnPosition(playerPosition).setUserId(userId);
        emitAll('sit_down_on_position', {
            user: USERS_CONTROLLER.getUserMiniData(userId),
            position: playerPosition
        });
        _setPlayerAsAdmin(playerPosition);
    };

    let _setPlayerAsAdmin = function(position)
    {
        if (_getAdminPlayerPosition() === 0) {
            let player = _getPlayerOnPosition(position);
            player.setAdmin(true);
            emitMessageAll("User " + USERS_CONTROLLER.getUser(player.getUserId()).getName() + " became admin on table");
        }
    };

    let _getAdminPlayerPosition = function()
    {
        if (_getPlayer1().isAdmin() !== false) {
            return 1;
        } else if (_getPlayer2().isAdmin() !== false) {
            return 2;
        } else {
            return 0;
        }
    };

    let _checkIfUserIsPlayer = function(userId)
    {
        return _getPlayer1().getUserId() === userId || _getPlayer2().getUserId() === userId;
    };

    let _canPlayerSitOnPosition = function(position)
    {
        return _getPlayerOnPosition(position).getUserId() === 0;
    };

    let _userStartGame = function(userId)
    {
        if (_checkIfUserIsPlayer(userId)) {
            if (_checkBothPlayersReady()) {
                _clearPlayerReadyInterval();
                _countDownBeforeStart();
            } else {
                _countDownPlayerReady();
            }
        }
    };

    let _getPlayerNotReadyPosition = function()
    {
        if (_getPlayer1().isReady() === false) {
            return 1;
        } else if (_getPlayer2().isReady() === false) {
            return 2;
        } else {
            return 0;
        }
    };

    let _checkBothPlayersReady = function()
    {
        return _getPlayer1().isReady() === true && _getPlayer2().isReady() === true;
    };

    return {
        startNewGame: _startNewGame,
        stopGame: _stopGame,
        addUserToQueue: _addUserToQueue,
        removeUserFromQueue: _removeUserFromQueue,
        setUserSitOnPosition: _setUserSitOnPosition,
        canPlayerSitOnPosition: _canPlayerSitOnPosition,
        getPlayerOnPosition: _getPlayerOnPosition,
        removePlayerFromPosition: _removePlayerFromPosition,
        checkIfUserIsPlayer: _checkIfUserIsPlayer,
        isGameOn: _isGameOn,
        userStartGame: _userStartGame
    }
}

//endregion TABLE

//region PLAYER
let PLAYER_MONEY_DEFAULT = 3;
let PLAYER_1_BOARD_POSITION_DEFAULT = 0;
let PLAYER_2_BOARD_POSITION_DEFAULT = 15;
function PlayerController(playerNo)
{
    let _playerNo = playerNo;
    let _userId = 0;
    let _boardPosition = 0;
    let _money = 0;
    let _ready = false;
    let _admin = false;

    //SETTERS/GETTERS
    let _getUserId = function() { return _userId; };
    let _setUserId = function(userId) { _userId = userId; };
    let _getBoardPosition = function() { return _boardPosition; };
    let _setBoardPosition = function(position) { _boardPosition = position; };
    let _getMoney = function() { return _money; };
    let _setMoney = function(chances) { _money = chances; };
    let _isReady = function() { return _ready; };
    let _setReady = function(ready) { _ready = ready; };
    let _isAdmin = function() { return _admin; };
    let _setAdmin = function(bool) { _admin = bool; };

    //METHODS
    let _initBeforeGame = function()
    {
        _setBoardPosition(_playerNo === 1 ? PLAYER_1_BOARD_POSITION_DEFAULT : PLAYER_2_BOARD_POSITION_DEFAULT);
        _setMoney(PLAYER_MONEY_DEFAULT);
    };

    let _resetAfterRound = function()
    {
        _setMoney(PLAYER_MONEY_DEFAULT);
    };

    let _cleanPlayer = function()
    {
        _setUserId(0);
        _setMoney(PLAYER_MONEY_DEFAULT);
        _setBoardPosition(_playerNo === 1 ? PLAYER_1_BOARD_POSITION_DEFAULT : PLAYER_2_BOARD_POSITION_DEFAULT);
        _setAdmin(false);
    };

    return {
        getUserId: _getUserId,
        setUserId: _setUserId,
        initBeforeGame: _initBeforeGame,
        resetAfterRound: _resetAfterRound,
        cleanPlayer: _cleanPlayer,
        isReady: _isReady,
        setAdmin: _setAdmin,
        isAdmin: _isAdmin,
    }
}
//endregion PLAYER

//region CHAT
function ChatContainer()
{
    let _messages = [];

    //METHODS
    let _addMessage = function(userId, message)
    {
        let messageObject = {
            user_id: userId,
            user_name: UsersController.getUser(userId).getName(),
            m: message
        };
        _messages.push(messageObject);
        if (_messages.length > 20) {
            _messages.shift();
        }
        _broadcastMessage(messageObject);
    };

    let _broadcastMessage = function(messageObject)
    {
        // emitAll();
    };

    let _broadcastMessages = function()
    {
        // emitAll();
    };

    return {
        addMessage: _addMessage,
        broadcastMessages: _broadcastMessages
    }
}
//endregion CHAT

//region UTILS
function emitError(socket, block)
{
    socket.emit('game_error', block);
}

function emitSuccess(socket, block)
{
    socket.emit('game_success', block);
}

function emitAll(emitKey, toEmit)
{
    for (let userId in USERS_CONTROLLER.getAll()) {
        USERS_CONTROLLER.getUser(userId).getSocket().emit(emitKey, toEmit);
    }
}

function emitMessageAll(message)
{
    emitAll("message_to_all", {message: message});
}

function __shuffleArray(array)
{
    let currentIndex = array.length, temporaryValue, randomIndex;
    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}
//endregion UTILS