// Our extension's custom redux middleware. Here we can intercept redux actions and respond to them.
var historyData = [];
exports.middleware = (store) => (next) => (action) => {
    if ('SESSION_ADD_DATA' === action.type) {

        // 'SESSION_ADD_DATA' actions hold the output text data in the `data` key.
        const { data } = action;
        if (detectHistoryvis(data)) {
            // Here, we are responding to 'wow' being input at the prompt. Since we don't 
            // want the "unknown command" output being displayed to the user, we don't thunk the next
            // middleware by calling `next(action)`. Instead, we dispatch a new action 'WOW_MODE_TOGGLE'.

            store.dispatch({
                type: 'HISTORY_VIS'
            });
        } else {
            next(action);
        }
    } else {
        next(action);
    }
};

function detectHistoryvis(data) {
    const patterns = [
        'historyv: command not found',
        'command not found: historyv',
        'Unknown command \'historyv\'',
        '\'historyv\' is not recognized.*'
    ];
    return new RegExp('(' + patterns.join(')|(') + ')').test(data)
}

// Our extension's custom ui state reducer. Here we can listen for our 'HISTORY_VIS' action 
// and modify the state accordingly.
exports.reduceUI = (state, action) => {
    switch (action.type) {
        case 'HISTORY_VIS':
            // Toggle historyv mode!
            return state.set('historyVON', !state.historyVON);
    }
    return state;
};

// Our extension's state property mapper. Here we can pass the ui's `historyVON` state
// into the terminal component's properties.
exports.mapTermsState = (state, map) => {
    return Object.assign(map, {
        historyVON: state.ui.historyVON
    });
};

// We'll need to handle reflecting the `historyVON` property down through possible nested
// parent/children terminal hierarchies. 
const passProps = (uid, parentProps, props) => {
    return Object.assign(props, {
        historyVON: parentProps.historyVON
    });
}

exports.getTermGroupProps = passProps;
exports.getTermProps = passProps;

// The `decorateTerm` hook allows our extension to return a higher order react component. 
// It supplies us with:
// - Term: The terminal component.
// - React: The enture React namespace.
// - notify: Helper function for displaying notifications in the operating system.
// 
// The portions of this code dealing with the particle simulation are heavily based on:
// - https://atom.io/packages/power-mode
// - https://github.com/itszero/rage-power/blob/master/index.jsx
exports.decorateTerm = (Term, { React, notify }) => {
    // Define and return our higher order component.
    return class extends React.Component {
        constructor(props, context) {
            super(props, context);
        }

        _onDecorated(term) {

        }

        // Called when the props change, here we'll check if wow mode has gone 
        // on -> off or off -> on and notify the user accordingly.
        componentWillReceiveProps(next) {
            if (next.historyVON && !this.props.historyVON) {
                notify('History Vis ON');
            } else if (!next.historyVON && this.props.historyVON) {
                notify('History Vis OFF');
            }
        }

        render() {
            // Return the default Term component with our custom onTerminal closure
            // setting up and managing the particle effects.
            console.log("render called")
            return React.createElement(Term, Object.assign({}, this.props, {
                customChildren: React.createElement('div', { className: 'hyper-history-vis-container', hidden: !this.props.historyVON },
                    React.createElement('h1', {}, "History")
                )
            }))
        }

        componentWillUnmount() {
            document.body.removeChild(this._canvas);
        }
    }
};

function getHistoryData() {

}

exports.decorateConfig = (config) => {
    return Object.assign({}, config, {
        css: `
            ${config.css || ''}
            .hyper-history-vis-container {
                position: fixed;
                top: 0px;
                bottom: 50px;
                right: 0px;
                width: 300px;
                overflow: scroll;
                border: 2px dotted white;
            }
        `
    });
};


