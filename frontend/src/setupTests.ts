import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// CRA's bundled Jest/jsdom predates these globals, but React Router v7 needs them.
Object.assign(global, { TextEncoder, TextDecoder });
