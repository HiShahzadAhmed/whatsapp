const express = require('express');
const qrcode = require('qrcode');

require('dotenv').config()

const app = express();
const http = require('http');
const server = http.createServer(app);
const port = process.env.PORT || 8000;


const { Client, LocalAuth } = require('whatsapp-web.js');



const io = require('socket.io')(server, {
    cors: {
        origin: process.env.HOST,
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
});



app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index');
});




server.listen(port, () => {
    console.log('App running on http://localhost:' + port);
});


io.on('connection', (socket) => {
    socket.emit('message', 'Connecting...');
  

    const client = new Client({ 
      authStrategy: new LocalAuth({clientId: "abc"}), 
      puppeteer: {
        args: ['--no-sandbox'],
      }
    });


    client.on('qr', (qr) => {
    // use qrcode_terminal for rendering in terminal
    //   qrcode_terminal.generate(qr, {small: true});

      qrcode.toDataURL(qr, (err, url) => {
        socket.emit('qr', url);
        socket.emit('message', 'QR Code received, scan please!');
      });
    });
  
    client.on('ready', () => {
      console.log('ready')
      socket.emit('ready', 'Whatsapp is ready!');
      socket.emit('message', 'Attached current phone number session: ' + client.info.wid.user);
    });
  
    client.on('authenticated', () => {
      socket.emit('authenticated', 'Whatsapp is authenticated!');
      socket.emit('message', 'Whatsapp successfuly authenticated!');
    });
  
    client.on('auth_failure', function(session) {
      socket.emit('message', 'Auth failure, restarting...');
    });
  

    socket.on('sendMessageHook', (data) => {   
        
        var message = data.formdata[0].value
        var numbers = data.formdata[1].value
        var numbers_array = numbers.split(', ');
        

        numbers_array.forEach((number, index) => {
            setTimeout(function () {
                client.sendMessage(number+'@c.us', message);
            }, 10000*index); 
        });
        
        console.log('Server: Messages has been sent')

    });

    client.initialize();

    socket.on('disconnect', function () {
      console.log('Whatsapp is disconnected!');
      client.destroy();
    });
    
  });