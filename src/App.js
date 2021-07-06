import React from "react";

import ToolBar from "./components/ToolBar";
import CodeArea from "./components/CodeArea";

import './App.css';

class App extends React.Component{
    constructor(props) {
        super(props);

        this.state = { dayMode: true };
    }

    displayModeChange = () => {
        document.body.setAttribute("color", "black");

        this.setState({ dayMode: !this.state.dayMode });
    }

    render(){
        return (
            <div className={ "App" + (this.state.dayMode ? "" : " night") }>
                <ToolBar displayModeChange = { this.displayModeChange }/>
                <CodeArea/>
            </div>
        );
    }
}

export default App;
