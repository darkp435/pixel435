#include <iostream>
#include <sstream>
#include <string>
#include <fstream>

using namespace std;

// Helper function to process CSS properties from the markup
string parseProperty(const string& property) {
    // Find the position of the hyphen in the property string (e.g., size-15)
    size_t pos = property.find('-');
    if (pos != string::npos) {
        // Extract the property name and value
        string propName = property.substr(0, pos);  // e.g., 'size' or 'background-color'
        string propValue = property.substr(pos + 1);  // e.g., '15' or 'blue'

        // Check property and convert to CSS rule
        if (propName == "size") {
            return "font-size: " + propValue + "px;";  // Convert 'size-15' to 'font-size: 15px'
        }
        else if (propName == "background-color") {
            return "background-color: " + propValue + ";";  // Convert 'background-color-blue' to 'background-color: blue'
        }
    }
    return "";
}

// Function to generate HTML output based on the parsed input
string generateHTML(const string& element, const string& property, const string& content) {
    string html;  // String to store the generated HTML
    string style = parseProperty(property);  // Get CSS property as a style string

    // Depending on the element type, wrap content in the appropriate HTML tag
    if (element == "paragraph") {
        html += "<p style=\"" + style + "\">" + content + "</p>\n";  // Generate <p> tag with style
    }
    else if (element == "heading") {
        html += "<h1 style=\"" + style + "\">" + content + "</h1>\n";  // Generate <h1> tag with style
    }
    else if (element == "div") {
        html += "<div style=\"" + style + "\">" + content + "</div>\n";  // Generate <div> tag with style
    }

    return html;  // Return the generated HTML string
}

// Main function to parse the input markup and generate HTML
void parseMarkup(const string& markup, const string& outputFile) {
    stringstream ss(markup);  // Convert input string to a stringstream for line-by-line processing
    string line;  // Variable to store each line of input

    // Open the output file once before starting to process
    ofstream outFile(outputFile, ios::app); // Use append mode to avoid overwriting the file

    if (!outFile.is_open()) {
        cerr << "Error: could not open output file." << endl;
        return;
    }

    // Process each line in the input markup
    while (getline(ss, line)) {
        // Trim leading and trailing whitespaces from the line
        size_t start = line.find_first_not_of(" \t");
        size_t end = line.find_last_not_of(" \t");
        if (start == string::npos || end == string::npos) {
            continue;  // Skip empty lines
        }
        line = line.substr(start, end - start + 1);  // Extract the trimmed line

        // Find the position of the opening parentheses
        size_t openParenPos = line.find('(');
        size_t closeParenPos = line.find(')');
        
        if (openParenPos == string::npos || closeParenPos == string::npos) {
            continue;  // Skip lines that don't have parentheses
        }

        // Extract the element (before the parentheses)
        string element = line.substr(0, openParenPos);

        // Extract the property inside the parentheses
        string property = line.substr(openParenPos + 1, closeParenPos - openParenPos - 1);

        // Extract the content after the colon
        size_t colonPos = line.find(':');
        if (colonPos != string::npos && colonPos + 1 < line.size()) {
            string content = line.substr(colonPos + 1);  // Content after the colon
            content.erase(0, content.find_first_not_of(" \t"));  // Trim leading spaces from content

            // Generate the corresponding HTML and print it to the output file
            string html = generateHTML(element, property, content);
            outFile << html;
        }
    }

    outFile.close();  // Close the file after all lines are processed
}


// Main entry point of the program
int main(int argc, char* argv[]) {
    if (argc != 3) {
        cout << "Usage: " << argv[0] << " <input_file> <output_file>";
        return 1;
    }

    string input = argv[1];
    string outputFile = argv[2];

    ifstream inputFile(input, ios::in);

    if (!inputFile.is_open()) {
        cerr << "Error: could not open file." << endl;
        return 1;
    }

    ostringstream buffer;
    buffer << inputFile.rdbuf();
    inputFile.close();
    string markup = buffer.str();
    /*
    Example

    paragraph (size-15): Welcome to my website!
    heading (size-30): Welcome to the future!
    div (background-color-blue): Content goes here
    */

    // Call the parsing function to process the markup and generate HTML
    parseMarkup(markup, outputFile);
    return 0;
}
