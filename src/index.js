const express = require("express");
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, getUser, getUsersInRoom, removeUser } = require('./utils/users');
const app = express();

const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicdirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicdirectoryPath));

app.get('/', (req, res, next) => {
    res.render('index');
});

let message = "Welcome";

io.on('connection', (socket) => {
    console.log("New Server");


    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options });
        if (error) {
            return callback(error)
        }
        socket.join(user.room);

        socket.emit('message', generateMessage('Admin', 'Welcome !'));
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`));
        io.to(user.room).emit('roomdata', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    });
    // Callback is for ACKNOWLEDGENT
    socket.on('sendmessage', (message, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback('Delievered')
    });
    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('locationmessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
        callback();
    });
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left !`));
            io.to(user.room).emit('roomdata', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    });
});



server.listen(port, () => {
    console.log("Server up")
});