function getWinner(board) {
    for (let i = 0; i < 3; i++) {
        if (board[i][0] === board[i][1] &&
            board[i][1] === board[i][2] && board[i][0]) {
            return board[i][0];
        }
        if (board[0][i] === board[1][i] &&
            board[1][i] === board[2][i] && board[0][i]) {
            return board[0][i];
        }
    }

    if (board[0][0] === board[1][1] &&
        board[1][1] === board[2][2] && board[0][0]) {
        return board[0][0];
    }

    if (board[0][2] === board[1][1] &&
        board[1][1] === board[2][0] && board[0][2]) {
        return board[0][2];
    }

    return null;
}

class StateError extends Error {
}

class State {
    constructor(board, turn) {
        if (!board) {
            board = [
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
            ];
        }
        this.board = board;
        this.turn = turn ? turn : 'X';
        this.winner = getWinner(board);
        this.tied = this.board.every(row => row.every(cell => cell));
        this.ended = !!this.winner || this.tied;
    }

    play(i, j) {
        if (this.winner || this.tied) {
            throw new StateError('game already ended');
        }

        if (this.board[i][j]) {
            throw new StateError('position already taken');
        }

        const nextBoard = [
            [...this.board[0]],
            [...this.board[1]],
            [...this.board[2]],
        ];
        nextBoard[i][j] = this.turn;

        const nextTurn = this.turn === 'X' ? 'O' : 'X';

        return new State(nextBoard, nextTurn);
    }

    expand() {
        if (this.winner) {
            return [];
        }

        const r = [];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.board[i][j]) {
                    continue;
                }
                r.push({
                    playArgs: [i, j],
                    state: this.play(i, j),
                });
            }
        }
        return r;
    }
}

export { State, StateError };
