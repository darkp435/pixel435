function addSemicolons() {
    let times = 0
    let code = document.getElementById("codeInput").value;
    let lines = code.split('\n');
    let processedCode = lines.map(line => {
        if (line.length > 0 && !line.endsWith(';') && !line.endsWith('{') && !line.endsWith('}') && !line.endsWith('>')) {
            line += ';';
            times++
        }
        return line;
    }).join('\n');
    document.getElementById("output").innerHTML = processedCode;
    document.getElementById("count").innerHTML = 'Semicolons added: ' + times
}
