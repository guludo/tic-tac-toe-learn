import React, { Component } from 'react';

import './app.css';

import Board from './board';
import { State, StateError } from './game';
import randomPlayer from './random-player';

const players = {
    'Human': null,
    'Random Player': randomPlayer,
};

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            'Player 1': 'Human',
            'Player 2': 'Random Player',
            gameState: new State(),
            errorMessage: '',
            X: 'Player 1',
            O: 'Player 2',
            playerThinking: false,
            autoReset: false,
        };
    }

    getCurrentPlayer(state) {
        return players[state[state[state.gameState.turn]]];
    }

    firePlayerEvent(state, alias, eventName, ...args) {
        const player = players[state[alias]];
        if (player && player[eventName]) {
            player[eventName].apply(player, args);
        }
    }

    handleCellClick = (i, j) => {
        this.setState((old) => {
            if (this.getCurrentPlayer(old) || old.playerThinking) {
                return {};
            }
            return this.getPlayNextState(old, i, j);
        });
    }

    componentDidUpdate(prevProps, prevState) {
        const s = this.state;
        if (!s.gameState.ended && !s.playerThinking) {
            const player = this.getCurrentPlayer(this.state);
            if (player) {
                this.setState({playerThinking: true});
                setTimeout(() => {
                    const next = player.play(this.state.gameState);
                    this.play(...next);
                    this.setState({playerThinking: false});
                }, 100);
            }
        }

        if (s.gameState.ended && !prevState.gameState.ended) {
            this.firePlayerEvent(s, 'Player 1', 'onGameEnded', s.gameState);
            this.firePlayerEvent(s, 'Player 2', 'onGameEnded', s.gameState);
        }

        if (s.gameState.ended && s.autoReset) {
            this.reset();
        }
    }

    getPlayNextState(old, i, j) {
        try {
            return {
                gameState: old.gameState.play(i, j),
                errorMessage: '',
            };
        } catch (e) {
            if (e instanceof StateError) {
                return {errorMessage: e.message};
            }
        }
    }

    play = (i, j) => {
        this.setState(old => this.getPlayNextState(old, i, j));
    }

    reset = () => {
        this.setState((old) => {
            return {
                gameState: new State(),
                X: old.X === 'Player 1' ? 'Player 2' : 'Player 1',
                O: old.O === 'Player 1' ? 'Player 2' : 'Player 1',
            };
        });
    }

    handlePlayerChange = (alias, e) => {
        this.setState({[alias]: e.target.value});
    }

    handleAutoResetChange = (e) => {
        this.setState({autoReset: e.target.checked});
    }

    render() {
        const s = this.state;
        return <div className="App">
            <div>
                Player 1: <select
                    value={s['Player 1']}
                    onChange={this.handlePlayerChange.bind(this, 'Player 1')}
                >{
                    Object.keys(players).map(
                        k => <option key={k} value={k}>{k}</option>
                    )
                }</select>
                <br/>
                Player 2: <select
                    value={s['Player 2']}
                    onChange={this.handlePlayerChange.bind(this, 'Player 2')}
                >{
                    Object.keys(players).map(
                        k => <option key={k} value={k}>{k}</option>
                    )
                }</select>
            </div>
            <Board
                state={s.gameState.board}
                onCellClick={this.handleCellClick}
            />
            {!s.gameState.ended && <div>
                {s[s.gameState.turn]}'s turn ({s.gameState.turn})
            </div>}
            {s.gameState.ended && <React.Fragment>
                <div>
                    Winner: {
                        s.gameState.winner
                            ? `${s[s.gameState.winner]} (${s.gameState.winner})`
                            : 'NOBODY'
                    }
                </div>
                <div>
                    <button onClick={this.reset}>Reset</button>
                </div>
            </React.Fragment>}
            <div>
                <label><input
                    type='checkbox'
                    checked={s.autoReset}
                    onChange={this.handleAutoResetChange}
                /> Reset automatically</label>
            </div>
            {s.errorMessage && <div>{s.errorMessage}</div>}
        </div>;
    }
}

export default App;
