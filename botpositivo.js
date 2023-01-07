const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const https = require('https');
const fs = require('fs');
const { phoneNumberFormatter } = require('./helpers/formatter');
const axios = require('axios');
const port = process.env.PORT || 8000;

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const options = {
  key: fs.readFileSync("/etc/pki/tls/private/localhost.key"),
  cert: fs.readFileSync("/etc/pki/tls/certs/localhost.crt")
};

let listaEnvio = [];
let listaFinalizado = [];
let sended = "0";
let finalized = "0";
let horario = "0";

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

app.get('/', (req, res) => {
  res.sendFile('index-multiple-account.html', {
    root: __dirname
  });
});

const sessions = [];
const SESSIONS_FILE = './whatsapp-sessions.json';

const createSessionsFileIfNotExists = function() {
  if (!fs.existsSync(SESSIONS_FILE)) {
    try {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify([]));
      console.log('Sessions file created successfully.');
    } catch(err) {
      console.log('Failed to create sessions file: ', err);
    }
  }
}

createSessionsFileIfNotExists();

const setSessionsFile = function(sessions) {
  fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions), function(err) {
    if (err) {
      console.log(err);
    }
  });
}

const getSessionsFile = function() {
  return JSON.parse(fs.readFileSync(SESSIONS_FILE));
}

const createSession = function(id, description) {
  console.log('Criando sessão: ' + id + ":" + description);
  const client = new Client({
    restartOnAuthFail: true,
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // <- this one doesn't works in Windows
        '--disable-gpu'
      ],
    },
    authStrategy: new LocalAuth({
      clientId: id
    })
  });

  client.initialize();

  client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      io.emit('qr', { id: id, src: url });
      io.emit('message', { id: id, text: 'QR Code recebido, aponte a camera!' });
    });
  });

  client.on('ready', () => {
    io.emit('ready', { id: id });
    io.emit('message', { id: id, text: 'Whatsapp executando!' });
    console.log(id + ":" + description + " -> Está em execução.");

    const savedSessions = getSessionsFile();
    const sessionIndex = savedSessions.findIndex(sess => sess.id == id);
    savedSessions[sessionIndex].ready = true;
    setSessionsFile(savedSessions);
  });

  client.on('authenticated', () => {
    io.emit('authenticated', { id: id });
    io.emit('message', { id: id, text: 'Whatsapp autenticado!' });
  });
  
  client.on('message_ack', (msg, ack) => {
    /*
        == ACK VALUES ==
        ACK_ERROR: -1
        ACK_PENDING: 0
        ACK_SERVER: 1
        ACK_DEVICE: 2
        ACK_READ: 3
        ACK_PLAYED: 4
    */
    if (ack != "-1") {
      for(i=0; i<listaEnvio.length ;i++){
       let item1 =  listaEnvio[i];

        if(item1.start == msg.to){
        return;
        }
      }
    listaEnvio.push({start : msg.to});
    };
  });
  
    function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  };

  function ValidarCPF(strCPF) {
    var Soma;
    var Resto;
    Soma = 0;
    if (strCPF == "00000000000") return false;

    for (i=1; i<=9; i++) Soma = Soma + parseInt(strCPF.substring(i-1, i)) * (11 - i);
    Resto = (Soma * 10) % 11;

    if ((Resto == 10) || (Resto == 11))  Resto = 0;
    if (Resto != parseInt(strCPF.substring(9, 10)) ) return false;

    Soma = 0;
    for (i = 1; i <= 10; i++) Soma = Soma + parseInt(strCPF.substring(i-1, i)) * (12 - i);
    Resto = (Soma * 10) % 11;

    if ((Resto == 10) || (Resto == 11))  Resto = 0;
    if (Resto != parseInt(strCPF.substring(10, 11) ) ) return false;
    return true;
  };

  client.on('message', async msg => {

    const nomeContato = msg._data.notifyName;
    const now = new Date();
    const hora = now.getHours();
    const minutos = now.getMinutes();

    if (msg.type != "chat") {
      return;
    }

    if (msg.from.includes("@g.us")) {
      console.log("Mensagem de grupo.");
      return;
    }

    for(i=0; i<listaEnvio.length ;i++){
      let item =  listaEnvio[i];
  
      if(item.start == msg.from){
        sended = "1";
        break;
      }
      sended = "0";
    };

    if (hora == 9 || hora == 10 || hora === 11 || hora == 13 || hora == 14 || hora == 15 || hora == 16 || hora == 17) {
      horario = "1";
    }
    else {
      horario = "0";
    }

    // horario = "-1";

    if (msg.type.toLowerCase() == "e2e_notification") return null;
    
    if (msg.body == "") return null;
  
    // RESPOSTA: DIGITO 1
    if (msg.body !== null && msg.body === "1") {
      client.sendMessage(msg.from, "▫ Deseja solicitar uma simulação ou acompanhar uma proposta em andamento?\r\n*Digite a opção referente ao seu convênio* ou aguarde para atendimento.\r\n\r\n*10* - INSS\r\n*11* - SIAPE (Federal)\r\n*12* - Estadual/Municipal\r\n*13* - Outros convenios");
    } else if (msg.body !== null && msg.body === "10" || null && msg.body === "11" || null && msg.body === "12" || null && msg.body === "13") {
      client.sendMessage(msg.from, "▫ " + nomeContato + " para maior agilidade no seu atendimento me informe o seu CPF, *apenas números*, sem traços, pontos ou espaços ou aguarde um momento que logo será atendido por um de nossos correspondentes!");
    }
    
    // RESPOSTA: DIGITO 2
    else if (msg.body !== null && msg.body === "2") {
      client.sendMessage(msg.from, "▫  Digite a opção referente ao cartão benefício/consignado: \r\n*14*- Solicitar. \r\n*15*- Acompanhar proposta. \r\n*16*- Outros assuntos.");
    } else if (msg.body !== null && msg.body === "14" || msg.body === "15" || msg.body === "16") {
      client.sendMessage(msg.from, "▫ Para agilizar o atendimento, me informe o seu CPF, *apenas números*, sem traços, pontos ou espaços. Enquanto isso estou te transferindo para um de nossos correspondentes....");
    }
  
    // RESPOSTA: DIGITO 3
    else if (msg.body !== null && msg.body === "3") {
      client.sendMessage(msg.from, "▫ " + nomeContato + " para prosseguir com o seu atendimento me informe o número do seu CPF, *apenas números*, sem traços, pontos ou espaços ou aguarde um momento que logo será atendido por um de nossos consultores financeiros para maiores informações!");
    }
  
    // RESPOSTA: DIGITO 4
    else if (msg.body !== null && msg.body === "4") {
      client.sendMessage(msg.from, "▫ Estou direcionando o seu atendimento para um de nossos correspondentes, para agilizar o seu atendimento *me informe qual a sua dúvida e como posso ajudar?*");
    }

    //verifica se é CPF, se for, solicita data de nascimento.
    else if (msg.body !== null && msg.body.length == 11 && isNumber(msg.body) && ValidarCPF(msg.body)) {
      msg.reply("▫ Ok, agora me informe a sua data de nascimento no formato *DD/MM/AAAA* onde DD = dia, com dois digitos, MM = mês, com dois digitos e AAAA = ano, com 4 digitos!");
    }

    //verifica se é data, se for direciona para atendente.
    else if (msg.body !== null && msg.body.length == 10 && msg.body.split("/").length == 3 || msg.body.split("\\").length == 3) {
      msg.reply("▫ Por favor, aguarde um momento enquanto verifico seus dados e direciono para um atendente disponível...");
    }
  
    // RESPOSTA: HORARIO DE ATENDIMENTO
    else if (msg.body !== null && sended === "0" && horario === "1" || msg.body !== null && msg.body === "0") {
      const saudacaoes = ['*🤖 BOT: POSITIVO CRED:*\r\nOlá ' + nomeContato + ', tudo bem? É um prazer lhe atender! 👏👏', '*🤖 BOT: POSITIVO CRED:*\r\nOi ' + nomeContato + ', como vai você? É um prazer lhe atender!', '*🤖 BOT: POSITIVO CRED:*\r\nOpa ' + nomeContato + ', tudo certo? É um prazer lhe atender!'];
      const saudacao = saudacaoes[Math.floor(Math.random() * saudacaoes.length)];
      client.sendMessage(msg.from, saudacao + " *Como posso te ajudar hoje?* \r\n\r\n*Digite o número referente a opção ou assunto que deseja tratar:* \r\n\r\n1️⃣ - *Empréstimo consignado.* \r\n2️⃣ - *Cartão benefício/consignado.* \r\n3️⃣ - *Saque FGTS/Auxilio Brasil.* \r\n4️⃣ - *Outros assuntos.*\r\n\r\n🔗 https://positivopromotora.com.br\r\n📧 contato@positivopromotora.com.br");
  
      setTimeout(function() {
          client.sendMessage('553484164210@c.us', "🤖 Mensagem recebida de " + msg.from + " " + nomeContato + ": " + msg.body);
        },1000 + Math.floor(Math.random() * 1000));
       listaEnvio.push({start : msg.from});
    }

    // RESPOSTA: FORA DO HORARIO DE ATENDIMENTO
    else if (msg.body !== null && msg.body !== "0" && sended === "0" && horario === "0") {
      const saudacaoes = ['*🤖 BOT: POSITIVO CRED:*\r\nOlá ' + nomeContato + ', tudo bem? É um prazer lhe atender! 👏👏', '*🤖 BOT: POSITIVO CRED:*\r\nOi ' + nomeContato + ', como vai você? É um prazer lhe atender!', '*🤖 BOT: POSITIVO CRED:*\r\nOpa ' + nomeContato + ', tudo certo? É um prazer lhe atender!'];
      const saudacao = saudacaoes[Math.floor(Math.random() * saudacaoes.length)];
      client.sendMessage(msg.from, saudacao + " No momento não estamos disponíveis." + "\r\n\r\n*O nosso horário de atendimento é:*\r\nDe segunda a sexta-feira das 09 as 18 horas.\r\nAos sábados das 09 até as 13 horas.\r\nIntervalo das 12 as 13 horas.\r\n\r\n*Deixe sua mensagem que assim que possivel retornaremos!*\r\n\r\nOu digite *0* para ir até o menu principal.");
  
      setTimeout(function() {
          client.sendMessage('553484164210@c.us', "🤖 Mensagem recebida fora do horário de " + msg.from + " " + nomeContato + ": " + msg.body);
        },1000 + Math.floor(Math.random() * 1000));
       listaEnvio.push({start : msg.from});
    }

    else if (msg.body !== null && msg.body !== "0" && sended === "0" && horario === "-1") {
      const saudacaoes = ['*🤖 BOT: POSITIVO CRED:*\r\nOlá ' + nomeContato + ', tudo bem? É um prazer lhe atender! 👏👏', '*🤖 BOT: POSITIVO CRED:*\r\nOi ' + nomeContato + ', como vai você? É um prazer lhe atender!', '*🤖 BOT: POSITIVO CRED:*\r\nOpa ' + nomeContato + ', tudo certo? É um prazer lhe atender!'];
      const saudacao = saudacaoes[Math.floor(Math.random() * saudacaoes.length)];
      client.sendMessage(msg.from, saudacao + " Desculpe, mais no momento não estamos disponíveis." + "\r\n\r\n*O nosso time comercial está passando por uma reestruturação!*\r\n\r\n*Deixe sua mensagem que assim que possivel retornaremos!*\r\n\r\n🔗 https://positivopromotora.com.br\r\n📧 contato@positivopromotora.com.br");
    }

 
    console.log(hora + ":" + minutos + " Mensagem recebida de " + msg.from + " " + nomeContato + ": " + msg.body);
    //console.log(msg.from);
    //console.log(msg.to);
    //console.log(contato);
  });


  client.on('auth_failure', function() {
    io.emit('message', { id: id, text: 'Auth failure, restarting...' });
  });

  client.on('disconnected', (reason) => {
    io.emit('message', { id: id, text: 'Whatsapp is disconnected!' });
    console.log(id + ":" + description + " -> Foi desconectado!");
    client.destroy();
    client.initialize();

    // Menghapus pada file sessions
    const savedSessions = getSessionsFile();
    const sessionIndex = savedSessions.findIndex(sess => sess.id == id);
    savedSessions.splice(sessionIndex, 1);
    setSessionsFile(savedSessions);

    io.emit('remove-session', id);
  });

  // Tambahkan client ke sessions
  sessions.push({
    id: id,
    description: description,
    client: client
  });

  // Menambahkan session ke file
  const savedSessions = getSessionsFile();
  const sessionIndex = savedSessions.findIndex(sess => sess.id == id);

  if (sessionIndex == -1) {
    savedSessions.push({
      id: id,
      description: description,
      ready: false,
    });
    setSessionsFile(savedSessions);
  }
}

const init = function(socket) {
  const savedSessions = getSessionsFile();

  if (savedSessions.length > 0) {
    if (socket) {
      socket.emit('init', savedSessions);
    } else {
      savedSessions.forEach(sess => {
        createSession(sess.id, sess.description);
      });
    }
  }
}

init();

// REMOVER SESSÃO
io.on('connection', function(socket) {
  socket.on('remove-session', async function(data) {
    const client = sessions.find(sess => sess.id == data.id)?.client;

    if (!client) {
      console.log("Sessão não localizada.")
    } else if (client) {
      console.log("Desconectando sessão.")
      try {
        await client.logout()
        .then(async () => console.log("Conexão removida."))
      }
      catch(e){
        console.log("Erro de desconexão!")
        const savedSessions = getSessionsFile();
        const sessionIndex = savedSessions.findIndex(sess => sess.id == data.id);
        savedSessions.splice(sessionIndex, 1);
        setSessionsFile(savedSessions);
        io.emit('remove-session', data.id);
      }
    }
  });
});

//SOCKET IO
io.on('connection', function(socket) {
  init(socket);

  socket.on('create-session', function(data) {
    console.log('Create session: ' + data.id);
    createSession(data.id, data.description);
  });
});

//ENVIAR MENSAGEM VIA POST
app.post('/send-message', async (req, res) => {
  const sender = req.body.sender;
  const number = phoneNumberFormatter(req.body.number);
  const message = req.body.message;

  const client = sessions.find(sess => sess.id == sender)?.client;

  // Make sure the sender is exists & ready
  if (!client) {
    return res.status(422).json({
      status: false,
      message: `The sender: ${sender} is not found!`
    })
  }

  /**
   * Check if the number is already registered
   * Copied from app.js
   * 
   * Please check app.js for more validations example
   * You can add the same here!
   */
  const isRegisteredNumber = await client.isRegisteredUser(number);

  if (!isRegisteredNumber) {
    return res.status(422).json({
      status: false,
      message: 'The number is not registered'
    });
  }

  client.sendMessage(number, message).then(response => {
    res.status(200).json({
      status: true,
      response: response
    });
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  });
});

server.listen(port, function() {
  console.log('App running on *: ' + port);
});
