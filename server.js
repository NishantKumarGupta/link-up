const express =require('express');
const app= express();

const server = require('http').Server(app);
const io = require('socket.io')(server);
const {ExpressPeerServer} = require('peer');
const peerServer = ExpressPeerServer(server,{
    debug:true
});
const User = require("./User.js");
const {v4:uuidV4}= require('uuid');

let USER_LIST = {};

app.use('/peerjs', peerServer);

app.set('view engine','ejs');
app.use(express.static('public'));


app.get('/', (req,res) => {
    res.redirect(`/${uuidV4()}`);
})

app.get('/:room', (req,res) => {
    res.render('room', { roomId:req.params.room })
})

const sendToAllRoom = (room, emit, message) => {
    for (let i in USER_LIST) {
        if (USER_LIST[i].room == room) {
            USER_LIST[i].socket.emit(emit, message);
        }
    }
}

io.on('connection', socket => {
    socket.on('join-room', (roomId,userId) => {
        socket.id= userId;
        socket.room = roomId;
        socket.join(roomId);

        sendToAllRoom(roomId, 'user-connected', userId);
        console.log(`joined ${roomId}`);

        USER_LIST[socket.id] = new User({ name: `User_${USER_LIST.length}`, socket: socket });
    })
    socket.on('message', (message) => {
        console.log(message, USER_LIST[socket.id].room);
        //send message to the same room
        sendToAllRoom(USER_LIST[socket.id].room, "createMessage", message);
    });

    socket.on('disconnect', () => {
        sendToAllRoom(USER_LIST[socket.id].room, "user-disconnected", socket.id);
        delete USER_LIST[socket.id];
    })
})




server.listen(process.env.PORT||3030,()=>{
    console.log("App up");
});