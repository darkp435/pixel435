function addSemicolons() {
    let times = 0
    let code = (document.getElementById("codeInput") as HTMLInputElement)?.value ?? "";
    let lines = code.split('\n');
    let processedCode = lines.map(line => {
        if (line.length > 0 && !line.endsWith(';') && !line.endsWith('{') && !line.endsWith('}') && !line.endsWith('>')) {
            line += ';';
            times++
        }
        return line;
    }).join('\n');
    let output = document.getElementById('output')

    if (output) {
        output.innerHTML = processedCode
    }

    let count = document.getElementById('count')

    if (count) {
        count.innerHTML = "Semicolons added: " + times
    }
}
