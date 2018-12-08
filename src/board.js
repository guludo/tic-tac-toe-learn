import React from 'react';

const Board = (props) => <div className='Board'>
    {props.state.map((row, i) => <React.Fragment key={i}>{
        row.map((s, j) => <div key={j}
            className={`Board__cell Board__cell--${s}`}
            onClick={() => props.onCellClick(i, j)}
        >{s}</div>)
    }</React.Fragment>)}
</div>;

Board.defaultProps = {
    state: [
        ['', '', ''],
        ['', '', ''],
        ['', '', ''],
    ],
    onCellClick: (i, j) => {}
};

export default Board;
