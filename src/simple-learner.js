const probs = {
    '!greedy,!mirrored': new Map(),
    'greedy,!mirrored': new Map(),
    'greedy,mirrored': new Map(),
    '!greedy,mirrored': new Map(),
};

class Player {
    pairs = [];
    oponentPairs = [];
    mySymbol = '';

    constructor({greedy, mirrored}) {
        this.greedy = greedy;
        this.mirrored = mirrored;
        this.probs = probs[
            (greedy ? 'greedy' : '!greedy') + ',' +
            (mirrored ? 'mirrored' : '!mirrored')
        ];
    }

    decide(state, candidates) {
        if (this.greedy) {
            const filtered = candidates.filter(({state}) => state.winner);
            if (filtered.length) {
                return filtered[Math.floor(Math.random() * filtered.length)];
            }
        }

        let t = 0;
        let pArray = [];
        for (let c of candidates) {
            const p = this.getProbs(state, c.playArgs);
            const score = .000000001 + p.win + p.draw;
            pArray.push(score);
            t += score;
        }
        pArray.forEach((s, i) => {pArray[i] = s / t;});

        const r = Math.random();
        let s = 0;
        let i = 0;
        while (i < candidates.length) {
            s += pArray[i];
            if (r < s) {
                break;
            }
            i++;
        }

        if (i === candidates.length) {
            i--;
        }

        return candidates[i];
    }

    learn(pairs, outcome) {
        for (let [state, playArgs] of pairs) {
            let h, m;

            h = state.hash();
            if (!this.probs.has(h)) {
                this.probs.set(h, new Map());
            }
            m = this.probs.get(h);

            h = playArgs.join(',');
            if (!m.has(h)) {
                m.set(h, {'draw': 0, 'win': 0, 'lose': 0});
            }
            m = m.get(h);

            m[outcome] += 1;
        }
    }

    getProbs(state, playArgs) {
        const m = this.probs.get(state.hash());

        let p = m;
        if (p) {
            p = p.get(playArgs.join(','));
        }

        if (!p) {
            p = {draw: 1/3, win: 1/3, lose: 1/3};
        } else {
            const s = p.draw + p.win + p.lose;
            p = {
                draw: p.draw / s,
                win: p.win / s,
                lose: p.lose / s,
            };
        }

        return p;
    }

    play(state) {
        this.mySymbol = state.turn;
        const candidates = state.expand();
        const c = this.decide(state, candidates, this.greedy);
        this.pairs.push([state, c.playArgs]);
        return c.playArgs;
    }

    onOponentPlay(state, playArgs) {
        if (this.mirrored) {
            this.oponentPairs.push([state, playArgs]);
        }
    }

    onGameEnded(state) {
        let outcome;

        outcome = state.winner
            ? (state.winner === this.mySymbol ? 'win' : 'lose')
            : 'draw'
        ;
        this.learn(this.pairs, outcome);
        this.pairs = [];

        if (this.mirrored) {
            outcome = state.winner
                ? (state.winner === this.mySymbol ? 'lose' : 'win')
                : 'draw'
            ;
            this.learn(this.oponentPairs, outcome)
            this.oponentPairs = [];
        }
    }
}

export default Player;
