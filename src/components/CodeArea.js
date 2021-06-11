import React from "react";
import MicRecorder from 'mic-recorder-to-mp3';

// Create api key on https://rapidapi.com/judge0-official/api/judge0-extra-ce/
import keyList from "../.env";

const Mp3Recorder = new MicRecorder({ bitRate: 128 });
const axios = require('axios');

class CodeArea extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            userInput: {
                source: "import java.util.Scanner;\n" +
                    "\n" +
                    "\n" +
                    "class Main{\n" +
                    "\tpublic static void main(String[] args){\n" +
                    "\t\tScanner sc = new Scanner(System.in);\n" +
                    "\t\tSystem.out.println(\"What's your name?\");\n" +
                    "\t\tif(sc.hasNextLine()){\n" +
                    "\t\t\tString input = sc.nextLine().trim();\n" +
                    "\t\t\tif(input.equals(\"Mozambique\")){\n" +
                    "\t\t\t\tSystem.out.println(\"Mozambique is here!\");\n" +
                    "\t\t\t}else{\n" +
                    "\t\t\t\tSystem.out.printf(\"Hello, %s.\\n\", input);\n" +
                    "\t\t\t}\n" +
                    "\t\t}else{\n" +
                    "\t\t\tSystem.out.println(\"Enter something\");\n" +
                    "\t\t}\n" +
                    "\t}\n" +
                    "}",
                stdin: "Mozambique"
            },
            output: "",
            key: keyList[0],
            permitted: false,
            recording: false,
            audioUrl: "#"
        }
    }

    componentDidMount() {
        navigator.getUserMedia({ audio: true },
            () => {
                this.setState({
                    permitted: true
                });
                console.log('Permission Granted');
            },
            () => {
                console.log('Permission Denied');
            },
        );
    }

    handleChange = (e) => {
        const target = e.target;
        target.name === 'stdin'
            ? this.setState({ userInput: {
                    ...this.state.userInput, stdin: target.value
            }})
            : this.setState({ userInput: {
                    ...this.state.userInput, source: target.value
                }});
    }

    handleKeyDown = (e) => {
        if(e.key === 'Tab'){
            e.preventDefault();

            const text = e.target;
            const start = text.selectionStart;

            text.value = text.value.substring(0, start) +
                "\t" + text.value.substring(text.selectionEnd);

            // put caret at right position again
            text.selectionStart =
                text.selectionEnd = start + 1;
        }

        if(e.key === '`'){
            e.preventDefault();
            if(this.state.recording){
                return;
            }

            if(!this.state.permitted){
                alert("Audio permission not guaranteed");

                navigator.getUserMedia({ audio: true },
                    () => {
                        this.setState({ permitted: true });
                        console.log('Permission Granted');
                    },
                    () => {
                        console.log('Permission Denied');
                    },
                );

                return;
            }

            this.start();
        }
    }

    handleKeyUp = async (e) => {
        if(e.key === '`'){
            e.preventDefault();
            await this.stop();
        }
    }

    start = () => {
        if(!this.state.permitted){
            console.log("Denied");
            return;
        }

        Mp3Recorder
            .start()
            .then(() => {
                this.setState({ recording: true });
            }).catch((e) => console.error(e));
    }

    stop = async () => {
        Mp3Recorder
            .stop()
            .getMp3()
            .then(async ([buffer, blob]) => {
                const file = new File(buffer, 'temp.mp3', {
                    type: blob.type,
                    lastModified: Date.now()
                });

                this.setState({
                    recording: false,
                    audioUrl: URL.createObjectURL(blob)
                });

                const formData = new FormData();
                formData.append('file', file);

                // TODO: upload file to backend, then get text
                const { data } = await axios.post('/api/uploadFile', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );

                console.log(data.results[0].alternatives[0].transcript);
            })
            .catch((e) => console.log(e));
    }


    handleSubmit = async (e) => {
        e.preventDefault();

        this.setState({ output: "Submitting...\n" });

        const request1 = await fetch(
            "https://judge0-ce.p.rapidapi.com/submissions",
            {
                method: "POST",
                headers: {
                    "x-rapidapi-key": this.state.key,
                    "x-rapidapi-host": "judge0-extra-ce.p.rapidapi.com",
                    "content-type": "application/json",
                    "useQueryString": true
                },
                body: JSON.stringify({
                    source_code: this.state.userInput.source,
                    stdin: this.state.userInput.stdin,
                    // refers to Java
                    language_id: 4
                })
            }
        );

        this.setState({ output: "Submitted...\n" });

        const response = await request1.json();

        if(response.message?.includes("Upgrade your plan")){
            const i = keyList.indexOf(this.state.key);
            if(i < keyList.length - 1){
                this.setState({ output: "Try again, if it doesn't work just give up." });
                this.setState({ key: keyList[i + 1] });
                return;
            }

            this.setState({ output:"Didn't spend any money on the API so it's now out of service, pls try tomorrow." });
            return;
        }

        const { token } = response;

        const request2 = await fetch(
            "https://judge0-ce.p.rapidapi.com/submissions/" + token,
            {
                method: "GET",
                headers: {
                    "x-rapidapi-key": this.state.key,
                    "x-rapidapi-host": "judge0-extra-ce.p.rapidapi.com",
                    "content-type": "application/json",
                    "useQueryString": true
                }
            }
        );

        const res = await request2.json();
        if (res.error) {
            this.setState({ output: res.error.message() });
            throw new Error(res.error);
        }

        if(res.status.description !== "Accepted"){
            this.setState({ output: res.status.description });
        }else{
            let result = "";
            if (res.stdout)
                result += `Stdout:\n${res.stdout}\n`;
            if (res.stderr)
                result += `Stderr:\n${res.stderr}\n`;
            result += `Time spent: ${res.time}s`;

            this.setState({ output: result });
        }
    }


    render() {
        return (
            <div id='CodeArea'>
                <div className='row'>
                    <div className='col'>
                        <textarea id='source' name='source' value={ this.state.userInput.source } onChange={ this.handleChange } onKeyDown={ this.handleKeyDown } onKeyUp={ this.handleKeyUp }/>
                        <button type='submit' onClick={ this.handleSubmit }>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                                <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z"/>
                            </svg>
                        </button>
                    </div>
                    <div className='col'>
                        <div className='row'>
                            <textarea id='stdin' name='stdin' value={ this.state.userInput.stdin } onChange={ this.handleChange }/>
                        </div>
                        <div className='row'>
                            <textarea id='stdout' name='stdout' value={ this.state.output } readOnly={true}/>
                        </div>
                    </div>
                    <audio src={this.state.audioUrl} controls="controls" />
                </div>
            </div>
        );
    }
}

export default CodeArea;