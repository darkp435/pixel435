#include <iostream>
#include <Windows.h>
#include <chrono>
#include <thread>

void autoClick(int interval_ms) {
    while (true) {
        // check if / key is pressed to stop the auto-clicker
        if (GetAsyncKeyState(VK_OEM_2) & 0x8000) {
            std::cout << "Stopping autoclicker...\n";
            exit(0);
        }

        mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
        mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
        std::this_thread::sleep_for(std::chrono::milliseconds(interval_ms));
    }
}

int main() {
    int interval_ms;
    std::cout << "How many milliseconds delay? " << std::endl;
    std::cin >> interval_ms;
    std::cout << "Autoclicker can be stopped with '/' key." << std::endl;
    std::cout << "Autoclicker started with " << interval_ms << " ms interval delay." << std::endl;
    autoClick(interval_ms);
    return 0;
}
