import { useState } from "react";
// Create api key on https://rapidapi.com/judge0-official/api/judge0-extra-ce/
import keyList from "../.env";

const CodeArea = () => {
    const [userInput, setUserInput] = useState({
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
    });

    const [output, setOutput] = useState("");
    const [key, setKey] = useState(keyList[0]);

    const handleChange = (e) => {
        const target = e.target;
        target.name === 'stdin'
            ? setUserInput({ ...userInput, stdin: target.value })
            : setUserInput({ ...userInput, source: target.value });
    }

    const handleKeydown = (e) => {
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
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        setOutput("Submitting...\n");

        const request1 = await fetch(
            "https://judge0-ce.p.rapidapi.com/submissions",
            {
                method: "POST",
                headers: {
                    "x-rapidapi-key": key,
                    "x-rapidapi-host": "judge0-extra-ce.p.rapidapi.com",
                    "content-type": "application/json",
                    "useQueryString": true
                },
                body: JSON.stringify({
                    source_code: userInput.source,
                    stdin: userInput.stdin,
                    // refers to Java
                    language_id: 4
                })
            }
        );

        setOutput("Submitted...\n");

        const response = await request1.json();

        if(response.message?.includes("Upgrade your plan")){
            const i = keyList.indexOf(key);
            if(i < keyList.length - 1){
                setOutput("Try again, if it doesn't work just give up.");
                setKey(keyList[i + 1]);
                return;
            }

            setOutput("Didn't spend any money on the API so it's now out of service, pls try tomorrow.");
            return;
        }

        const { token } = response;

        const request2 = await fetch(
            "https://judge0-ce.p.rapidapi.com/submissions/" + token,
            {
                method: "GET",
                headers: {
                    "x-rapidapi-key": key,
                    "x-rapidapi-host": "judge0-extra-ce.p.rapidapi.com",
                    "content-type": "application/json",
                    "useQueryString": true
                }
            }
        );

        const res = await request2.json();
        if (res.error) {
            setOutput(res.error.message());
            throw new Error(res.error);
        }

        if(res.status.description !== "Accepted"){
            setOutput(res.status.description);
        }else{
            let result = "";
            if (res.stdout)
                result += `Stdout:\n${res.stdout}\n`;
            if (res.stderr)
                result += `Stderr:\n${res.stderr}\n`;
            result += `Time spent: ${res.time}s`;

            setOutput(result);
        }
    }

    return (
        <div id='CodeArea'>
            <div className='row'>
                <div className='col'>
                    <textarea id='source' name='source' value={ userInput.source} onChange={ handleChange } onKeyDown={ handleKeydown }/>
                    <button type='submit' onClick={ handleSubmit }>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                            <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z"/>
                        </svg>
                    </button>
                </div>
                <div className='col'>
                    <div className='row'>
                        <textarea id='stdin' name='stdin' value={ userInput.stdin } onChange={ handleChange }/>
                    </div>
                    <div className='row'>
                        <textarea id='stdout' name='stdout' value={ output } readOnly={true}/>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CodeArea;