#!/usr/bin/env node

/**
 * Module dependencies.
 */


// var app = require('../app.js');
// var debug = require('debug')('image-resizer:server');
// var http = require('http');
import app  from "../app.mjs";
import debugObject from "debug"
let debug = debugObject('image-resizer:server');
import http from "http"
import cluster from "cluster";
import os from "os"
import { number } from 'sharp/lib/is.js'
let numberCPUs = os.cpus().length;
console.log(numberCPUs);
/**
 * Get port from environment and store in Express.
 */


if (cluster.isMaster) {
  console.log("This is primary process.");
  // メインプロセスの場合フォークさせる.
  for(let index = 0; index < numberCPUs; index++) {
    let forkedCluster = cluster.fork()
    console.log(forkedCluster);
  }
} else {
  console.log("==============> This is process forked.");
  console.log(cluster.worker.process.pid);
  // フォークされたプロセスの場合
  let port = normalizePort(process.env.PORT || '3000');
  app.set('port', port);

  /**
   * Create HTTP server.
   */

  var server = http.createServer(app);

  /**
   * Listen on provided port, on all network interfaces.
   */

  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListening);
}

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
