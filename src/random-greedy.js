const player = {
    play(state) {
        let candidates = state.expand();
        const filtered = candidates.filter(({state}) => state.winner);
        if (filtered.length) {
            candidates = filtered;
        }
        return candidates[Math.floor(Math.random() * candidates.length)].playArgs;
    }
};

export default player;
