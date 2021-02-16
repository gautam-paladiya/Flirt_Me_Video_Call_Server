const express = require("express");
const { createServer } = require("http");
const { Server: Socket } = require("socket.io");
const username = require("username-generator");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const ModelChat = require("./models/ModelChat");

const DEFAULT_PORT = 4000 | process.env.PORT;
const users = {};

const app = express();
const httpServer = createServer(app);
const io = new Socket(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(
  "mongodb+srv://gautam:gavtam@cluster0.emjg5.mongodb.net/flirtme?retryWrites=true&w=majority",
  { useFindAndModify: false },
  (err) => {
    if (err) {
      consolel.log(`mongoose connect error ${err}`);
    }
  }
);

httpServer.listen(DEFAULT_PORT, () => {
  console.log(`server running on ${DEFAULT_PORT}`);
});

app.get("/", (req, res) => {
  console.log(`${JSON.stringify(req.query)}`);
  res.send(req);
});

app.use("/auth", require("./routes/auth"));

io.on("connection", (socket) => {
  // var ip = socket.handshake.headers["x-real-ip"];
  // var clientIpAddress =
  //   socket.request.headers["x-forwarded-for"] ||
  //   socket.request.connection.remoteAddress;
  // var ips = socket.conn.remoteAddress;
  // console.log(`socket connectd ${socket.id} ip ${clientIpAddress} ips ${ips}`);

  const userid = username.generateUsername("-");
  // if (!users[socket.id]) {
  //   users[socket.id] = userid;
  // }
  console.log(`socket id ${socket.id}`);

  const ChatUser = new ModelChat({
    socketId: socket.id,
    userId: userid,
  });

  ModelChat.find({ socketId: socket.id }).then(
    (res) => {
      if (res.length <= 0) {
        ChatUser.save().then(
          (user) => {
            console.log(`save ${user}`);
            socket.emit("yourID", user.userId);
          },
          (reason) => {
            console.log(`save ${reason}`);
          }
        );
      } else {
        console.log(`allready connect else ${res.length}`);
      }
    },
    (reject) => {
      console.log(`allready connect ${reject}`);
    }
  );

  // io.emit("allUsers", users);

  socket.on("start", (res) => {
    console.log(`res ${res}`);
    ModelChat.findOneAndUpdate(
      { socketId: socket.id },
      { peerId: res.peerId },
      { new: true }
    ).then((res) => {
      if (res) {
        ModelChat.findOne({
          isConnected: false,
          isAvailable: true,
          socketId: { $ne: socket.id },
        }).then(
          (user) => {
            console.log(`users ${user}`);
            if (user) {
              io.to(user.socketId).emit("requestCall", { peerId: res.peerId });
            }
          },
          (err) => {
            console.log(`start error ${err}`);
          }
        );
      }
    });
  });

  socket.on("userConnected", (arg) => {
    ModelChat.findOneAndUpdate(
      { socketId: socket.id },
      { isConnected: true, isAvailable: false, connectedTo: arg.connectedTo },
      { new: true }
    ).then((res) => {
      console.log(`connected ${res}`);
    });
  });

  socket.on("disconnect", (reason) => {
    console.log("disconnecting");
    // if (users[socket.id]) {
    //   delete users[socket.id];
    // }
    ModelChat.deleteMany({ socketId: socket.id }, (err, res) => {
      if (err) {
        console.log(`disconnect erro ${err} `);
      } else {
        console.log(` disconnect response ${res}`);
      }
    });
    console.log(users);
  });

  socket.on("doCall", (arg) => {
    console.log(`arg ${arg}`);
    io.to(arg.to).emit("requestCall", arg);
  });
});
