// @ts-check
import 'core-js/stable/index.js';
import 'regenerator-runtime/runtime.js';
import { io } from 'socket.io-client';
import '../assets/application.scss';
import { render } from 'react-dom';
import runApp from './init.js';

if (process.env.NODE_ENV !== 'production') {
  localStorage.debug = 'chat:*';
}

const socket = io();

runApp(socket).then((result) => {
  render(result, document.getElementById('chat'));
});
