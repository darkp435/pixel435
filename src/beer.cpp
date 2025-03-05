#include <iostream>
#include <fstream>
#include <string>
#include <cstdlib>

using namespace std;

void createSong(int bottles, string output) {
    ofstream outFile(output);
    if (outFile.is_open()) {
        while (bottles > 0) {
            if (bottles == 1) {
                outFile << "1 bottle of beer on the wall,\n";
                outFile << "1 bottle of beer!\n";
                --bottles;
                outFile << "Take one down, pass it around\n";
                outFile << "No bottles of beer on the wall.\n\n";
            } else {
                outFile << to_string(bottles) + " bottles of beer on the wall,\n";
                outFile << to_string(bottles) + " bottles of beer!\n";
                --bottles;
                outFile << "Take one down, pass it around\n";
                outFile << to_string(bottles) + " bottles of beer on the wall.\n\n";
            }
        }

        outFile << "No more bottles of beer on the wall, no more bottles of beer.\n";
        outFile << "Go to the store and buy some more, 100 bottles of beer on the wall.\n";
        
        outFile.close();
        cout << "Song written to " << output << endl;
        return;
    } else {
        cerr << "Unable to open file" << endl;
        return;
    }
}

int main() {
    string inputBottles;
    string output, song;
    int bottles;

    cout << "Bottles of beer on the wall (default: 100): " << endl;
    getline(cin, inputBottles);

    if (inputBottles == "\n") {
        bottles = 100;
    } else {
        bottles = stoi(inputBottles);
    }

    cout << "Output file: " << endl;
    cin >> output;
    // handle edge case in casef the user enters a negative number or 0 (edge case)
    if (bottles < 1) {
        cout << "Please enter a positive number that is bigger than 0." << endl;
        return 0;
    }

    createSong(bottles, output);
    return 0;
}
