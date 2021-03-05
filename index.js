require("dotenv").config();
const axios = require("axios");
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

console.log(
  "process.env.SOCKET_CORS_PATH ",
  process.env.NODE_ENV == "production"
    ? process.env.SOCKET_CORS_PATH_PROD
    : process.env.SOCKET_CORS_PATH_DEV
);
const app = express();
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  next();
});
const httpServer = createServer(app);
const io = new Socket(httpServer, {
  cors: {
    origin: "*",
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

app.get("/getCountry", (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  var ips = ip.substring(0, ip.indexOf(",")).trim();
  axios.get(`http://www.geoplugin.net/json.gp?ip=${ips}`).then(({ data }) => {
    console.log(`country ${JSON.stringify(data)}`);
    if (data.geoplugin_status == 200) {
      res.send(data);
    } else {
      res.send({ msg: "No Country matching" });
    }
  });
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
  console.log(`socket id ${socket.request.connection.remoteAddress}`);
  console.log(
    `socket name ${JSON.stringify(socket.request.connection._peername)}`
  );
  const address = socket.handshake.headers["x-forwarded-for"];
  console.log(address);

  const ChatUser = new ModelChat({
    socketId: socket.id,
    userId: userid,
    isAvailable: false,
    isConnected: false,
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

  socket.on("start", async (res, callback) => {
    console.log(`res ${JSON.stringify(res)}`);
    await ModelChat.findOneAndUpdate(
      { socketId: socket.id },
      { isAvailable: true }
    );
    ModelChat.findOneAndUpdate(
      {
        isConnected: false,
        isAvailable: true,
        socketId: { $ne: socket.id },
      },
      { isConnected: true, isAvailable: false },
      { new: true }
    ).then(
      (user) => {
        console.log(`users ${user}`);
        if (user && user.socketId !== socket.id) {
          io.to(user.socketId).emit("requestCall", {
            peerId: res.peerId,
            socketId: socket.id,
          });
        } else {
          callback({ userFound: false, message: "No user found", error: "" });
        }
      },
      (err) => {
        console.log(`start error ${err}`);
        callback({
          userFound: false,
          message: "Something wrong try again later",
          error: err,
        });
      }
    );
  });

  socket.on("setCountry", (arg) => {
    console.log(`arg ${JSON.stringify(arg)}`);
    ModelChat.findOneAndUpdate(
      { socketId: socket.id },
      { country: arg.country },
      { new: true }
    ).then((res) => {
      console.log(`setCountry ${res}`);
    });
  });

  socket.on("setGender", (arg) => {
    console.log(`arg ${JSON.stringify(arg)}`);
    ModelChat.findOneAndUpdate(
      { socketId: socket.id },
      { gender: arg.gender },
      { new: true }
    ).then((res) => {
      console.log(`setGender ${res}`);
    });
  });

  socket.on("userConnected", (arg) => {
    ModelChat.findOneAndUpdate(
      { socketId: socket.id },
      { isConnected: true, isAvailable: false, connectedTo: arg.connectedTo },
      { new: true }
    ).then((res) => {
      console.log(`connected ${res}`);
      io.to(res.socketId).emit("afterConnect", res);
    });

    ModelChat.findOneAndUpdate(
      { socketId: arg.connectedTo },
      { isConnected: true, isAvailable: false, connectedTo: socket.id },
      { new: true }
    ).then((res) => {
      console.log(`connected ${res}`);
      io.to(res.socketId).emit("afterConnect", res);
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

  socket.on("disconnected", (arg, callback) => {
    console.log(`disconnected ${arg.isAvailable}`);
    ModelChat.findOneAndUpdate(
      { socketId: socket.id },
      { isConnected: false, isAvailable: arg.isAvailable, connectedTo: " " },
      { new: true }
    ).then((res) => {
      console.log(`disconnected ${res}`);
      if (res) {
        callback();
      }
    });
  });

  socket.on("online", () => {
    ModelChat.findOneAndUpdate(
      { socketId: socket.id },
      { isAvailable: true },
      { new: true }
    ).then((res) => {
      console.log(`connected ${res}`);
    });
  });

  socket.on("offline", () => {
    ModelChat.findOneAndUpdate(
      { socketId: socket.id },
      { isAvailable: false },
      { new: true }
    ).then((res) => {
      console.log(`dis connected ${res}`);
    });
  });

  socket.on("doCall", (arg) => {
    console.log(`arg ${arg}`);
    io.to(arg.to).emit("requestCall", arg);
  });
});
