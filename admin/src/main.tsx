/* @refresh reload */
import { render } from 'solid-js/web'

import './index.css'
// import App from './App'
import App from './App.simple'

const root = document.getElementById('root')

render(() => <App />, root!)