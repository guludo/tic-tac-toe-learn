export default (state) => {
    const candidates = state.expand();
    return candidates[Math.floor(Math.random() * candidates.length)].playArgs;
};
