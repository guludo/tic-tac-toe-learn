import React, { Component } from 'react';

import './app.css';

import Board from './board';
import { State, StateError } from './game';

const players = {
    'Human': null,
};

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            'Player 1': 'Human',
            'Player 2': 'Human',
            gameState: new State(),
            errorMessage: '',
            X: 'Player 1',
            O: 'Player 2',
            starter: 'Player 1',
        };
    }

    getCurrentPlayer(state) {
        return players[state[state[state.gameState.turn]]];
    }

    handleCellClick = (i, j) => {
        this.setState((old) => {
            if (this.getCurrentPlayer(old)) {
                return {};
            }
            return this.getPlayNextState(old, i, j);
        });
    }

    componentDidUpdate(prevProps, prevState) {
        const s = this.state;
        if (prevState.gameState !== s.gameState &&
            !this.state.gameState.ended
        ) {
            const player = this.getCurrentPlayer(this.state);
            if (player) {
                const next = player(this.state.gameState);
                this.play(...next)
            }
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
                starter: old.starter === 'Player 1' ? 'Player 2' : 'Player 1',
            };
        });
    }

    render() {
        const s = this.state;
        return <div className="App">
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
            {s.errorMessage && <div>{s.errorMessage}</div>}
        </div>;
    }
}

export default App;
