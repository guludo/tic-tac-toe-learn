import React, { Component } from 'react';

import './app.css';

import Board from './board';
import { State, StateError } from './game';
import randomPlayer from './random-player';
import randomGreedyPlayer from './random-greedy';
import SimpleLearner from './simple-learner';

const players = {
    'Human': () => null,
    'Random Player': () => randomPlayer,
    'Random Greedy Player': () => randomGreedyPlayer,
    'Simple Learner': () => new SimpleLearner({}),
    'Simple Greedy Learner': () => new SimpleLearner({greedy: true}),
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
            stats: {
                'Player 1': {'wins': 0, 'losses': 0, 'draws': 0},
                'Player 2': {'wins': 0, 'losses': 0, 'draws': 0},
            },
            trainingMode: false,
        };

        this.players = {
            'Player 1': players[this.state['Player 1']](),
            'Player 2': players[this.state['Player 2']](),
        };

        this.trainer = {
            timeoutId: null,
            running: false,
            batchRunner() {
                for (let i = 0; i < 100; i++) {
                    let gameState = new State();
                    let p = i % 2;
                    while (!gameState.ended) {
                        const playArgs = this.players[p].play(gameState);
                        const oldGameState = gameState;

                        gameState = gameState.play(...playArgs);

                        p = (p + 1) % 2;

                        const op = this.players[p];
                        if (op && op.onOponentPlay) {
                            op.onOponentPlay(oldGameState, playArgs);
                        }
                    }
                    if (gameState.winner) {
                        p = i % 2;
                        if (gameState.winner !== 'X') {
                            p = (p + 1) % 2;
                        }
                        this.stats[p].wins += 1;
                        this.stats[(p + 1) % 2].losses += 1;
                    } else {
                        this.stats[0].draws += 1;
                        this.stats[1].draws += 1;
                    }
                }

                if (this.onBatchDone) {
                    this.onBatchDone();
                }

                if (this.enabled) {
                    setTimeout(this.batchRunner, 10);
                } else {
                    this.running = false;
                }
            },
            start(player1, player2) {
                if (this.running) {
                    return;
                }
                this.players = [player1, player2];
                this.stats = [
                    {'wins': 0, 'losses': 0, 'draws': 0},
                    {'wins': 0, 'losses': 0, 'draws': 0},
                ];
                this.running = true;
                this.enabled = true;
                this.batchRunner();
            },
            stop() {
                this.enabled = false;
            },
        };
        this.trainer.batchRunner = this.trainer.batchRunner.bind(this.trainer);

        this.trainer.onBatchDone = () => {
            this.setState(s => {
                const stats = {...s.stats};
                for (let [i, alias] of [[0, 'Player 1'], [1, 'Player 2']]) {
                    for (let k of ['wins', 'draws', 'losses']) {
                        stats[alias][k] += this.trainer.stats[i][k];
                    }
                }
                return {stats};
            });
        };
    }

    getCurrentPlayer(state) {
        return this.players[state[state.gameState.turn]];
    }

    getOponentPlayer(state) {
        return this.players[state[state.gameState.turn === 'X' ? 'Y' : 'X']];
    }

    firePlayerEvent(state, alias, eventName, ...args) {
        const player = this.players[alias];
        if (player && player[eventName]) {
            player[eventName].apply(player, args);
        }
    }

    handleCellClick = (i, j) => {
        this.setState((old) => {
            if (old.trainingMode) {
                return {};
            }
            if (this.getCurrentPlayer(old) || old.playerThinking) {
                return {};
            }
            return this.getPlayNextState(old, i, j);
        });
    }

    componentDidUpdate(prevProps, prevState) {
        const s = this.state;

        if (s.trainingMode) {
            if (!this.trainer.running) {
                this.trainer.start(this.players['Player 1'], this.players['Player 2']);
            }
            return;
        } else if (this.trainer.running) {
            this.trainer.stop();
            return;
        }

        /* This for statement needs to be run before calling getCurrentPlayer */
        for (let alias of ['Player 1', 'Player 2']) {
            if (s[alias] !== prevState[alias]) {
                this.players[alias] = players[s[alias]]();
            }
        }

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

            const stats = {...s.stats};
            if (s.gameState.winner) {
                stats[s[s.gameState.winner]].wins += 1;
                stats[s[s.gameState.winner === 'X' ? 'O' : 'X']].losses += 1;
            } else {
                stats['Player 1'].draws += 1;
                stats['Player 2'].draws += 1;
            }
            this.setState({stats});
        }

        if (s.gameState.ended && s.autoReset) {
            this.reset();
        }
    }

    getPlayNextState(old, i, j) {
        try {
            const op = this.getOponentPlayer(old);
            if (op && op.onOponentPlay) {
                op.onOponentPlay(old.gameState, [i, j]);
            }
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

    getResetStateUpdate(old) {
        return {
            gameState: new State(),
            X: old.X === 'Player 1' ? 'Player 2' : 'Player 1',
            O: old.O === 'Player 1' ? 'Player 2' : 'Player 1',
        };
    }

    reset = () => {
        this.setState(this.getResetStateUpdate);
    }

    resetStats = () => {
        this.setState({stats: {
            'Player 1': {'wins': 0, 'losses': 0, 'draws': 0},
            'Player 2': {'wins': 0, 'losses': 0, 'draws': 0},
        }});
    }

    handlePlayerChange = (alias, e) => {
        this.setState({[alias]: e.target.value});
    }

    handleAutoResetChange = (e) => {
        this.setState({autoReset: e.target.checked});
    }

    handleTrainingModeChange = (e) => {
        const trainingMode = e.target.checked;
        this.setState(old => {
            if (!this.players['Player 1'] || !this.players['Player 2']) {
                return {};
            }
            const r = {trainingMode};
            if (r.trainingMode) {
                Object.assign(r, this.getResetStateUpdate(old))
            }
            return r;
        });
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
            <div>
                <label><input
                    type='checkbox'
                    checked={s.trainingMode}
                    onChange={this.handleTrainingModeChange}
                /> Training mode</label>
            </div>
            <div>
                Stats:
                <table>
                    <thead>
                        <tr>
                            <th></th><th>Wins</th><th>Draws</th><th>Losses</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th>Player 1</th>
                            <td>{s.stats['Player 1'].wins}</td>
                            <td>{s.stats['Player 1'].draws}</td>
                            <td>{s.stats['Player 1'].losses}</td>
                        </tr>
                        <tr>
                            <th>Player 2</th>
                            <td>{s.stats['Player 2'].wins}</td>
                            <td>{s.stats['Player 2'].draws}</td>
                            <td>{s.stats['Player 2'].losses}</td>
                        </tr>
                    </tbody>
                </table>
                <button onClick={this.resetStats}>Reset Stats</button>
            </div>
            {s.errorMessage && <div>{s.errorMessage}</div>}
        </div>;
    }
}

export default App;
