$(function() {
    window.$logsContainer = $("#logs-container");
    window.socket = io('localhost:3600');
    window.GAME = {
        _static_data: null,
        getStaticData: function() {
            return this._static_data;
        },
        _user: null,
        getUser: function() {
            return this._user;
        }
    };

    //NOTE sockets
    window.socket.on('connected', function(data) {
        window.GAME._static_data = data.static_data;
        window.GAME._user = data.user;
    });
    window.socket.on('game_error', function(data) {
        if (data === undefined || data.message === undefined) {
            return;
        }
        alert(data.message);
    });
    window.socket.on('message_to_all', function(data) {
        if (data === undefined || data.message === undefined) {
            return;
        }
        addLog(data.message);
    });

    window.socket.on('set_name_success', function(data) {
        if (data.user_id === window.GAME.getUser().id) {
            addLog("You have changed name from " + data.old_name + " to " + data.new_name);
            window.GAME.getUser().name = data.new_name;
        } else {
            addLog("User " + data.old_name + " changed name to " + data.new_name)
        }
    });
    window.socket.on('sit_down_on_position', function(data) {
        if (data === undefined || data.user === undefined || data.position === undefined) {
            return;
        }
        if (data.user.id === window.GAME.getUser().id) {
            addLog("You sit on " + data.position + " position ");
        } else {
            addLog(data.user.name + " sit on " + data.position + " position");
        }
    });

    //NOTE JS EVENTS
    //set name button
    $("#set-name-button").on("click", function(e) {
        e.preventDefault();
        let $this = $(this);
        let $input = $("#user-name-input");
        window.socket.emit('set_name', {name: $input.val()});
        return false;
    });

    $("#sit-on-position-1, #sit-on-position-2").on("click", function(e) {
        e.preventDefault();
        let $this = $(this);
        let position = $this.data('position');
        if (!position) {
            return false;
        }
        window.socket.emit('sit_down_on_position', {position: position});
        return false;
    });
});

function addLog(message, user) {
    let $message;
    if (user === undefined) {
        $message = '<div style="color:red">SERVER: ' + message + '</div>';
    } else {
        $message = '<div>' + user + ': ' + message + '</div>';
    }
    window.$logsContainer.append($message);
}