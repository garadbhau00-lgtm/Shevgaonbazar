
import { EventEmitter } from 'events';

// It's important to use a single instance of the emitter throughout the app.
export const errorEmitter = new EventEmitter();
