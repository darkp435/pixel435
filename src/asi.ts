import '../styles/styles.css';

function addSemicolons() {
    let times = 0
    const code = (document.getElementById("codeInput") as HTMLInputElement)?.value ?? "";
    const lines = code.split('\n');
    const processedCode = lines.map(line => {
        if (line.length > 0 && !line.endsWith(';') && !line.endsWith('{') && !line.endsWith('}') && !line.endsWith('>')) {
            line += ';';
            times++
        }
        return line;
    }).join('\n');
    const output = document.getElementById('output')

    if (output) {
        output.innerHTML = processedCode
    }

    const count = document.getElementById('count')

    if (count) {
        count.innerHTML = "Semicolons added: " + times
    }
}

document.getElementById('add-semicolons')!.onclick = () => addSemicolons()