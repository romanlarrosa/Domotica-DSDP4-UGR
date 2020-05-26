//Requires necesarios
var http = require("http");
var url = require("url");
var fs = require("fs");
var path = require("path");
var socketio = require("socket.io");
var MongoClient = require('mongodb').MongoClient;
var MongoServer = require('mongodb').Server;
var mimeTypes = { "html": "text/html", "jpeg": "image/jpeg", "jpg": "image/jpeg", "png": "image/png", "js": "text/javascript", "css": "text/css", "swf": "application/x-shockwave-flash"};

//Sensores
/*
var persiana = 'arriba';
var aire = 'on';
var luces = 'on';
*/


//html que sirve el servidor
var httpServer = http.createServer(
    function(request, response) {
        var uri = url.parse(request.url).pathname;
        if (uri=="/") {
            uri = "server.html";
        }
        var fname = path.join(process.cwd(), uri);
        fs.exists(fname, function(exists){
            if(exists) {
                fs.readFile(fname, function(err, data){
                    if(!err) {
                        var extension = path.extname(fname).split(".")[1];
						var mimeType = mimeTypes[extension];
						response.writeHead(200, mimeType);
						response.write(data);
						response.end();
                    }
                    else {
                        response.writeHead(200, {"Content-Type": "text/plain"});
						response.write('Error de lectura en el fichero: '+uri);
						response.end();
                    }
                });
            }
            else{
                console.log("Peticion invalida: "+uri);
				response.writeHead(200, {"Content-Type": "text/plain"});
				response.write('404 Not Found\n');
				response.end();
            }
        });
    }
);

//Base de datos
MongoClient.connect("mongodb://localhost:27017/datos_sensores", function(err, db) {
    httpServer.listen(8080);
    var io = socketio.listen(httpServer);

    var dbo = db.db("domotica");

    dbo.createCollection("datos", function(err, collection) {
        io.sockets.on('connection', function(client) {
            //Cuando el cliente pone datos
            client.on('poner', function(data){
                collection.insert(data, {safe:true}, function(err, result) {});
                client.emit('obtener', data);
            });
            //Obtener los datos del histórico
            client.on('obtener', function(data)  {
                collection.find().toArray(function(err,results) {
                    client.emit('obtener', results);
                });
            });
            //El cliente cambia el valor de la luz
            client.on('boton_luz', function(data){
                console.log(data);
                collection.insert(data, {safe:true}, function(err, result) {});
                client.emit('obtener', data);
            });

            //El cliente cambia el valor de la temperatura
            client.on('boton_temperatura', function(data){
                collection.insert(data, {safe:true}, function(err, result) {});
                client.emit('obtener', data);
            });

            //El cliente cambia el estado de la persiana
            client.on('persiana', function(data){
                collection.insert(data, {safe:true}, function(err, result) {});
                client.emit('obtener', data);
            });

            //El cliente cambia el estado del aire
            client.on('aire', function(data){
                collection.insert(data, {safe:true}, function(err, result) {});
                client.emit('obtener', data);
            });
        });
    });
});

console.log("Servicio MongoDB iniciado");