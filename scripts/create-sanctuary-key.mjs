import {randomBytes} from 'node:crypto'
import {hashPin} from '../lib/sanctuary-security.js'
if(!process.stdin.isTTY){console.error('Run in an interactive terminal. The private key must not be passed as an argument.');process.exit(1)}
console.log('Choose a private key of at least 8 characters. Input is hidden. Enter to finish; Ctrl+C to cancel.')
process.stdin.setRawMode(true);process.stdin.resume();let pin=''
process.stdin.on('data',buffer=>{for(const char of buffer.toString()){if(char==='\u0003')process.exit(1);if(char==='\r'||char==='\n'){if(pin.length<8){console.error('Use at least 8 characters.');pin='';continue}const salt=randomBytes(32).toString('hex');console.log(`\nSANCTUARY_PIN_SALT=${salt}\nSANCTUARY_PIN_HASH=${hashPin(pin,salt)}\nSANCTUARY_SESSION_SECRET=${randomBytes(32).toString('base64')}`);pin='';process.stdin.setRawMode(false);process.exit(0)}if(char==='\u007f'||char==='\b')pin=pin.slice(0,-1);else if(pin.length<128)pin+=char}})
